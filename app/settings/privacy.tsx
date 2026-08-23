import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

type PrivacySettings = {
  show_profile_to_everyone: boolean
  allow_dm_from_strangers: boolean
  show_location: boolean
  show_online_status: boolean
}

const DEFAULTS: PrivacySettings = {
  show_profile_to_everyone: true,
  allow_dm_from_strangers: true,
  show_location: true,
  show_online_status: true,
}

export default function PrivacySettingsScreen() {
  const router = useRouter()
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('users')
        .select('show_profile_to_everyone, allow_dm_from_strangers, show_location, show_online_status')
        .eq('id', user.id)
        .single()
      if (data) {
        setSettings({
          show_profile_to_everyone: data.show_profile_to_everyone ?? true,
          allow_dm_from_strangers: data.allow_dm_from_strangers ?? true,
          show_location: data.show_location ?? true,
          show_online_status: data.show_online_status ?? true,
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const save = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const { error } = await supabase.from('users').update(settings).eq('id', user.id)
    setSaving(false)
    if (error) {
      Alert.alert('Error', 'Could not save settings. Please try again.')
    } else {
      Alert.alert('Saved', 'Your privacy settings have been updated.')
    }
  }

  const toggle = (key: keyof PrivacySettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const rows: { key: keyof PrivacySettings; label: string; sub: string }[] = [
    { key: 'show_profile_to_everyone', label: 'Show profile to everyone', sub: 'Your profile is visible to all users on Tripmates' },
    { key: 'allow_dm_from_strangers', label: 'Allow direct messages from strangers', sub: 'Anyone can send you a message, not just matches' },
    { key: 'show_location', label: 'Show my location', sub: 'Display your city on your profile card' },
    { key: 'show_online_status', label: 'Show my online status', sub: 'Let others see when you\'re active' },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Settings 🔒</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1A6FFF" />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            {rows.map((row, i) => (
              <View key={row.key} style={[styles.row, i < rows.length - 1 && styles.rowBorder]}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowLabel}>{row.label}</Text>
                  <Text style={styles.rowSub}>{row.sub}</Text>
                </View>
                <Switch
                  value={settings[row.key]}
                  onValueChange={() => toggle(row.key)}
                  trackColor={{ false: 'rgba(255,255,255,0.1)', true: '#1A6FFF' }}
                  thumbColor="#fff"
                  ios_backgroundColor="rgba(255,255,255,0.1)"
                />
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={save} disabled={saving} activeOpacity={0.85}>
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
    marginBottom: 24,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowContent: { flex: 1 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500', marginBottom: 3 },
  rowSub: { color: '#6b7280', fontSize: 12, lineHeight: 17 },

  saveBtn: {
    backgroundColor: '#1A6FFF', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
