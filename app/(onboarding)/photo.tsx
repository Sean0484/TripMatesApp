import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator, Alert, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'
import * as SecureStore from 'expo-secure-store'

const SCREEN_WIDTH = Dimensions.get('window').width
const SLOT_SIZE = Math.floor((SCREEN_WIDTH - 48 - 12) / 2)
const MAX_PHOTOS = 6
const MIN_PHOTOS = 2

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
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [attempted, setAttempted] = useState(false)

  const signInIfNeeded = async (): Promise<string | null> => {
    console.log('=== SIGN IN IF NEEDED ===')

    const { data: { session } } = await supabase.auth.getSession()
    console.log('Existing session:', session?.user?.id)
    if (session?.user?.id) return session.user.id

    const email = await SecureStore.getItemAsync('pending_email')
    const password = await SecureStore.getItemAsync('pending_password')
    console.log('Stored email:', email)
    console.log('Has password:', !!password)

    if (email && password) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      console.log('SignIn result:', data?.user?.id, error?.message)
      if (data?.user?.id) return data.user.id

      // If email not confirmed, look up user id directly from the users table
      if (error?.message?.includes('not confirmed')) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', email)
          .single()
        console.log('Fallback user lookup:', userData?.id)
        if (userData?.id) return userData.id
      }
    }

    console.log('ALL AUTH METHODS FAILED')
    return null
  }

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.')
      return false
    }
    return true
  }

  const pickPhoto = async (replaceIndex?: number) => {
    if (!(await requestPermission())) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !result.assets[0]) return
    const uri = result.assets[0].uri
    setPhotos(prev => {
      const next = [...prev]
      if (replaceIndex !== undefined && replaceIndex < next.length) {
        next[replaceIndex] = uri
      } else {
        next.push(uri)
      }
      return next
    })
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const handleSlotPress = (index: number) => {
    if (index < photos.length) {
      Alert.alert('Photo', undefined, [
        { text: 'Replace', onPress: () => pickPhoto(index) },
        { text: 'Remove', style: 'destructive', onPress: () => removePhoto(index) },
        { text: 'Cancel', style: 'cancel' },
      ])
    } else if (photos.length < MAX_PHOTOS) {
      pickPhoto()
    }
  }

  const handleContinue = async () => {
    setAttempted(true)
    if (photos.length < MIN_PHOTOS) {
      Alert.alert('Add more photos', `Please add at least ${MIN_PHOTOS} photos to continue.`)
      return
    }
    setLoading(true)
    try {
      const userId = await signInIfNeeded()
      if (!userId) {
        Alert.alert('Error', 'Could not authenticate. Please try logging in again.')
        setLoading(false)
        return
      }
      const urls: string[] = []
      for (let i = 0; i < photos.length; i++) {
        const response = await fetch(photos[i])
        const blob = await response.blob()
        const path = `${userId}/avatar_${i + 1}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: true })
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        urls.push(publicUrl)
      }
      await supabase.from('users').update({
        avatar_url: urls[0],
        avatar_urls: urls,
      }).eq('id', userId)
    } catch (e: any) {
      Alert.alert('Upload failed', e.message ?? 'Could not upload photos.')
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
        <Text style={styles.heading}>Add profile photos</Text>
        <Text style={styles.sub}>Add at least 2 · Up to 6 photos</Text>

        <View style={styles.grid}>
          {Array.from({ length: MAX_PHOTOS }).map((_, index) => {
            const hasPhoto = index < photos.length
            const isRequired = index < MIN_PHOTOS
            const showRequired = attempted && !hasPhoto && isRequired
            const isDisabled = !hasPhoto && index > photos.length
            return (
              <TouchableOpacity
                key={index}
                style={[styles.slot, showRequired ? styles.slotRequired : styles.slotEmpty]}
                onPress={() => handleSlotPress(index)}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                {hasPhoto ? (
                  <>
                    <Image source={{ uri: photos[index] }} style={styles.slotImage} />
                    <View style={styles.slotBadge}>
                      <Text style={styles.slotBadgeText}>{index + 1}</Text>
                    </View>
                    <View style={styles.slotRemoveHint}>
                      <Text style={styles.slotRemoveIcon}>✕</Text>
                    </View>
                  </>
                ) : (
                  <View style={[styles.slotPlaceholder, isDisabled && { opacity: 0.3 }]}>
                    <Text style={styles.slotPlusIcon}>+</Text>
                    {isRequired && (
                      <Text style={[styles.slotRequiredLabel, showRequired && { color: '#ef4444' }]}>
                        Required
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })}
        </View>

        <Text style={styles.hint}>
          {photos.length === 0
            ? 'Tap a slot to add a photo'
            : photos.length < MIN_PHOTOS
            ? `Add ${MIN_PHOTOS - photos.length} more photo${MIN_PHOTOS - photos.length !== 1 ? 's' : ''} to continue`
            : `${photos.length} photo${photos.length !== 1 ? 's' : ''} selected ✓`}
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={loading}
          style={styles.btnWrap}
        >
          <LinearGradient colors={['#1A6FFF', '#0A4CC9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Continue →</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60, alignItems: 'center' },
  backBtn: {
    alignSelf: 'flex-start', width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', width: '100%' },
  slot: { width: SLOT_SIZE, height: SLOT_SIZE, borderRadius: 16, overflow: 'hidden', borderWidth: 2 },
  slotEmpty: { borderColor: 'rgba(255,255,255,0.15)', borderStyle: 'dashed' },
  slotRequired: { borderColor: '#ef4444', borderStyle: 'dashed' },
  slotImage: { width: '100%', height: '100%' },
  slotPlaceholder: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  slotPlusIcon: { color: '#4b5563', fontSize: 28, lineHeight: 32 },
  slotRequiredLabel: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
  slotBadge: {
    position: 'absolute', top: 8, left: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: '#1A6FFF', alignItems: 'center', justifyContent: 'center',
  },
  slotBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  slotRemoveHint: {
    position: 'absolute', top: 8, right: 8,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  slotRemoveIcon: { color: '#fff', fontSize: 11, fontWeight: '700' },
  hint: { color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 20 },
  footer: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12 },
  btnWrap: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btn: { paddingVertical: 17, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
