import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'

function StepBar({ step }: { step: number }) {
  return (
    <View style={stepStyles.row}>
      {[1, 2, 3, 4].map(n => (
        <View key={n} style={[stepStyles.dot, n <= step && stepStyles.dotActive]} />
      ))}
    </View>
  )
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 32 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  dotActive: { backgroundColor: '#1A6FFF' },
})

export default function PhotoScreen() {
  const router = useRouter()
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleContinue = async () => {
    if (!imageUri) {
      router.push('/(onboarding)/bio')
      return
    }
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const response = await fetch(imageUri)
      const blob = await response.blob()
      const ext = imageUri.split('.').pop() ?? 'jpg'
      const path = `${user.id}/avatar.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, blob, { upsert: true, contentType: `image/${ext}` })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id)
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload photo.')
      setLoading(false)
      return
    }
    setLoading(false)
    router.push('/(onboarding)/bio')
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <StepBar step={3} />
        <Text style={styles.heading}>Add a profile photo</Text>
        <Text style={styles.sub}>Help other travellers recognise you</Text>

        <TouchableOpacity style={styles.photoArea} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.photo} />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderIcon}>📷</Text>
              <Text style={styles.placeholderText}>Tap to choose a photo</Text>
            </View>
          )}
        </TouchableOpacity>

        {imageUri && (
          <TouchableOpacity onPress={pickImage} style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>Choose different photo</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={loading}
          style={styles.btnWrap}
        >
          <LinearGradient colors={['#1A6FFF', '#0A4CC9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{imageUri ? 'Continue →' : 'Skip for now'}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
  backBtn: { alignSelf: 'flex-start', width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 40 },
  photoArea: {
    width: 200, height: 200, borderRadius: 100,
    overflow: 'hidden',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)',
    borderStyle: 'dashed',
  },
  photo: { width: '100%', height: '100%' },
  placeholder: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  placeholderIcon: { fontSize: 36 },
  placeholderText: { color: '#6b7280', fontSize: 13, textAlign: 'center', paddingHorizontal: 16 },
  changeBtn: { marginTop: 20 },
  changeBtnText: { color: '#1A6FFF', fontSize: 14, fontWeight: '600' },
  footer: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12 },
  btnWrap: { borderRadius: 14, overflow: 'hidden', shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  btn: { paddingVertical: 17, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
