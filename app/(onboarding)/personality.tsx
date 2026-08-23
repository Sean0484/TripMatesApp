import { useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'

const TYPES = [
  { key: 'early_bird',   label: 'Early Bird',   emoji: '🌅', desc: 'Up at dawn, first to explore' },
  { key: 'night_owl',    label: 'Night Owl',    emoji: '🦉', desc: 'Come alive after dark' },
  { key: 'planner',      label: 'Planner',      emoji: '📋', desc: 'Itinerary ready weeks ahead' },
  { key: 'spontaneous',  label: 'Spontaneous',  emoji: '⚡', desc: 'Book the night before, love surprises' },
]

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

export default function PersonalityScreen() {
  const router = useRouter()
  const { language } = useLanguage()
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleContinue = async () => {
    if (!selected) {
      Alert.alert('Select one', 'Choose the travel style that fits you best.')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('users').update({ personality_tags: selected }).eq('id', user.id)
    }
    setLoading(false)
    router.push('/(onboarding)/photo')
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.inner}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <StepBar step={2} />
        <Text style={styles.heading}>{t('yourTravelPersonality', language)}</Text>
        <Text style={styles.sub}>{t('chooseBestFit', language)}</Text>

        <View style={styles.cards}>
          {TYPES.map(t => {
            const on = selected === t.key
            return (
              <TouchableOpacity
                key={t.key}
                style={[styles.card, on && styles.cardOn]}
                onPress={() => setSelected(t.key)}
                activeOpacity={0.8}
              >
                <View style={[styles.emojiBox, on && styles.emojiBoxOn]}>
                  <Text style={styles.emoji}>{t.emoji}</Text>
                </View>
                <View style={styles.cardText}>
                  <Text style={[styles.cardLabel, on && styles.cardLabelOn]}>{t.label}</Text>
                  <Text style={styles.cardDesc}>{t.desc}</Text>
                </View>
                <View style={[styles.radio, on && styles.radioOn]}>
                  {on && <View style={styles.radioDot} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleContinue}
          disabled={loading}
          style={styles.btnWrap}
        >
          <LinearGradient colors={['#1A6FFF', '#0A4CC9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('continue', language)}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  inner: { flex: 1, paddingHorizontal: 24, paddingTop: 60 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  cards: { gap: 12 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16, padding: 18,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardOn: { backgroundColor: 'rgba(26,111,255,0.12)', borderColor: '#1A6FFF' },
  emojiBox: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  emojiBoxOn: { backgroundColor: 'rgba(26,111,255,0.2)' },
  emoji: { fontSize: 26 },
  cardText: { flex: 1 },
  cardLabel: { fontSize: 16, fontWeight: '700', color: '#9ca3af', marginBottom: 2 },
  cardLabelOn: { color: '#fff' },
  cardDesc: { fontSize: 13, color: '#4b5563', lineHeight: 18 },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioOn: { borderColor: '#1A6FFF' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#1A6FFF' },
  footer: { paddingHorizontal: 24, paddingBottom: 48, paddingTop: 12 },
  btnWrap: { borderRadius: 14, overflow: 'hidden', shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 },
  btn: { paddingVertical: 17, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
