import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

const STEPS = [
  { icon: '📸', title: 'Upload ID Photo', desc: 'Take a clear photo of your passport or national ID.' },
  { icon: '🤳', title: 'Selfie Check', desc: 'Take a live selfie to match against your ID.' },
  { icon: '✅', title: 'Get Verified', desc: 'Review takes up to 24 hours. You\'ll get notified.' },
]

export default function VerificationScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Center</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.heroSection}>
          <Text style={styles.heroEmoji}>🛡️</Text>
          <Text style={styles.heroTitle}>Get Identity Verified</Text>
          <Text style={styles.heroSubtitle}>
            Verified travelers get 3× more matches and build instant trust with fellow explorers.
          </Text>
        </View>

        <View style={styles.benefitsCard}>
          <Text style={styles.benefitsTitle}>Why get verified?</Text>
          {[
            '✅  Verified badge on your profile',
            '📈  3× more trip matches',
            '🔓  Access to verified-only trips',
            '💬  Priority in group chats',
          ].map(b => (
            <Text key={b} style={styles.benefitRow}>{b}</Text>
          ))}
        </View>

        <Text style={styles.stepsTitle}>How it works</Text>
        {STEPS.map((step, i) => (
          <View key={i} style={styles.stepCard}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepIcon}>{step.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepDesc}>{step.desc}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.startBtn} activeOpacity={0.85}>
          <LinearGradient
            colors={['#1A6FFF', '#00B89C']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.startBtnGrad}
          >
            <Text style={styles.startBtnText}>Start Verification →</Text>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Your ID is encrypted and never stored after verification. We use bank-grade security.
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },
  scroll: { padding: 20, paddingBottom: 48 },
  heroSection: { alignItems: 'center', paddingVertical: 24, gap: 12 },
  heroEmoji: { fontSize: 64 },
  heroTitle: { color: '#fff', fontSize: 24, fontWeight: '800', textAlign: 'center' },
  heroSubtitle: { color: '#9ca3af', fontSize: 14, lineHeight: 22, textAlign: 'center' },
  benefitsCard: {
    backgroundColor: 'rgba(26,111,255,0.08)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.2)',
    padding: 16, marginBottom: 28, gap: 8,
  },
  benefitsTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  benefitRow: { color: '#d1d5db', fontSize: 14, lineHeight: 22 },
  stepsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 14 },
  stepCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14, marginBottom: 10,
  },
  stepNum: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: '#1A6FFF',
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  stepIcon: { fontSize: 22 },
  stepTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 2 },
  stepDesc: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
  startBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 24 },
  startBtnGrad: { paddingVertical: 16, alignItems: 'center' },
  startBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  disclaimer: { color: '#4b5563', fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 18 },
})
