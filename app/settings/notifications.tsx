import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Switch, ActivityIndicator, Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'

type NotifSettings = {
  notif_new_match: boolean
  notif_messages: boolean
  notif_trip_updates: boolean
  notif_promotional: boolean
}

const DEFAULTS: NotifSettings = {
  notif_new_match: true,
  notif_messages: true,
  notif_trip_updates: true,
  notif_promotional: false,
}

export default function NotificationSettingsScreen() {
  const router = useRouter()
  const [settings, setSettings] = useState<NotifSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('users')
        .select('notif_new_match, notif_messages, notif_trip_updates, notif_promotional')
        .eq('id', user.id)
        .single()
      if (data) {
        setSettings({
          notif_new_match: data.notif_new_match ?? true,
          notif_messages: data.notif_messages ?? true,
          notif_trip_updates: data.notif_trip_updates ?? true,
          notif_promotional: data.notif_promotional ?? false,
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
      Alert.alert('Saved', 'Your notification settings have been updated.')
    }
  }

  const toggle = (key: keyof NotifSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const rows: { key: keyof NotifSettings; label: string; sub: string }[] = [
    { key: 'notif_new_match', label: 'New match notifications', sub: 'Get notified when someone likes you back' },
    { key: 'notif_messages', label: 'Message notifications', sub: 'Alerts for new messages in chats and trips' },
    { key: 'notif_trip_updates', label: 'Trip update notifications', sub: 'Updates on trips you\'ve joined or created' },
    { key: 'notif_promotional', label: 'Promotional notifications', sub: 'Deals, features and Tripmates news' },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings 🔔</Text>
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
