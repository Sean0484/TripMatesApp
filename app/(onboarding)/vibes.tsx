import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'

const VIBES = [
  { label: 'Adventure',     emoji: '🏔️' },
  { label: 'Party',         emoji: '🎉' },
  { label: 'Culture',       emoji: '🏛️' },
  { label: 'Nature',        emoji: '🌿' },
  { label: 'Wellness',      emoji: '🧘' },
  { label: 'Budget',        emoji: '💰' },
  { label: 'Backpacking',   emoji: '🎒' },
  { label: 'Luxury',        emoji: '🥂' },
  { label: 'Ski',           emoji: '⛷️' },
  { label: 'Digital Nomad', emoji: '💻' },
  { label: 'Beach',         emoji: '🏖️' },
  { label: 'Foodie',        emoji: '🍜' },
]

const MIN_VIBES = 3

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
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 24 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  dotActive: { backgroundColor: '#1A6FFF' },
})

export default function VibesScreen() {
  const router = useRouter()
  const { language } = useLanguage()
  const [selected, setSelected] = useState<string[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const toggle = (label: string) => {
    setError('')
    setSelected(prev =>
      prev.includes(label) ? prev.filter(v => v !== label) : [...prev, label]
    )
  }

  const handleContinue = async () => {
    if (selected.length < MIN_VIBES) {
      setError(`Please select at least ${MIN_VIBES} vibes`)
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ travel_vibes: selected }).eq('id', user.id)
    }
    setLoading(false)
    router.push('/(onboarding)/personality')
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <StepBar step={1} />
        <Text style={styles.heading}>{t('travelVibes', language)}</Text>
        <Text style={styles.sub}>{t('selectAtLeast3', language)}</Text>

        <View style={styles.grid}>
          {VIBES.map(v => {
            const on = selected.includes(v.label)
            return (
              <TouchableOpacity
                key={v.label}
                style={[styles.chip, on && styles.chipOn]}
                onPress={() => toggle(v.label)}
                activeOpacity={0.75}
              >
                <Text style={styles.chipEmoji}>{v.emoji}</Text>
                <Text style={[styles.chipLabel, on && styles.chipLabelOn]}>{v.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.count}>
          {selected.length < MIN_VIBES
            ? `${selected.length} / ${MIN_VIBES} selected`
            : `${selected.length} selected ✓`}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={loading}
          style={styles.btnWrap}
        >
          <LinearGradient
            colors={selected.length >= MIN_VIBES ? ['#1A6FFF', '#0A4CC9'] : ['#1e3a5f', '#1e3a5f']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btn}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('continue', language)}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 24 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 28 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 12,
    borderRadius: 40, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  chipOn: { backgroundColor: 'rgba(26,111,255,0.2)', borderColor: '#1A6FFF' },
  chipEmoji: { fontSize: 18 },
  chipLabel: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  chipLabelOn: { color: '#fff' },
  error: { color: '#ef4444', fontSize: 13, textAlign: 'center', marginTop: 16, fontWeight: '500' },
  footer: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12, backgroundColor: '#0A1628' },
  count: { textAlign: 'center', color: '#6b7280', fontSize: 13, marginBottom: 10 },
  btnWrap: { borderRadius: 14, overflow: 'hidden', shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  btn: { paddingVertical: 17, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
