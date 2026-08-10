import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'

const PLANS = [
  {
    key: 'explorer_plus',
    name: 'Explorer Plus',
    price: '€4.99',
    period: '/month',
    icon: '🗺️',
    color: '#1A6FFF',
    gradColors: ['#1A3FFF', '#0A4CC9'] as [string, string],
    stripeUrl: 'https://buy.stripe.com/3cIeVd5yD9Wvg64cgu5AQ00',
    features: [
      'See who liked your trips',
      'See who visited your profile',
      'Unlimited trip requests',
      'Priority matching',
      'Explorer Plus badge',
    ],
  },
  {
    key: 'voyager',
    name: 'Voyager',
    price: '€9.99',
    period: '/month',
    icon: '✈️',
    color: '#00B89C',
    gradColors: ['#00B89C', '#009478'] as [string, string],
    stripeUrl: 'https://buy.stripe.com/fZubJ14uz2u3bPO1BQ5AQ01',
    features: [
      'Everything in Explorer Plus',
      'Create exclusive Duo trips',
      'Advanced matching filters',
      'AI-powered travel planning',
      'Voyager badge + priority support',
    ],
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '€19.99',
    period: '/month',
    icon: '👑',
    color: '#f59e0b',
    gradColors: ['#f59e0b', '#d97706'] as [string, string],
    stripeUrl: 'https://buy.stripe.com/28E28rd15b0z2feeoC5AQ02',
    features: [
      'Everything in Voyager',
      'Featured profile placement',
      'Concierge trip matching',
      'Unlimited AI safety reports',
      'Premium badge + VIP events',
    ],
  },
]

export default function SubscriptionScreen() {
  const router = useRouter()

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upgrade Plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>✨</Text>
          <Text style={styles.heroTitle}>Travel Further Together</Text>
          <Text style={styles.heroSubtitle}>Unlock premium features and find your perfect travel companion faster.</Text>
        </View>

        {PLANS.map(plan => (
          <View key={plan.key} style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planIcon}>{plan.icon}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.planName}>{plan.name}</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.planPrice, { color: plan.color }]}>{plan.price}</Text>
                  <Text style={styles.planPeriod}>{plan.period}</Text>
                </View>
              </View>
            </View>

            {plan.features.map(f => (
              <View key={f} style={styles.featureRow}>
                <Text style={[styles.featureCheck, { color: plan.color }]}>✓</Text>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={styles.planBtn}
              activeOpacity={0.85}
              onPress={() => Linking.openURL(plan.stripeUrl)}
            >
              <LinearGradient
                colors={plan.gradColors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.planBtnGrad}
              >
                <Text style={styles.planBtnText}>Get {plan.name} →</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          Plans billed monthly. Cancel anytime. Prices shown in EUR.
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
  hero: { alignItems: 'center', paddingVertical: 20, gap: 10, marginBottom: 8 },
  heroEmoji: { fontSize: 48 },
  heroTitle: { color: '#fff', fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroSubtitle: { color: '#9ca3af', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  planCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 18, marginBottom: 16,
  },
  planHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  planIcon: { fontSize: 32 },
  planName: { color: '#fff', fontSize: 18, fontWeight: '800' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 2 },
  planPrice: { fontSize: 20, fontWeight: '800' },
  planPeriod: { color: '#6b7280', fontSize: 13 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  featureCheck: { fontSize: 14, fontWeight: '800', marginTop: 1 },
  featureText: { color: '#d1d5db', fontSize: 14, flex: 1, lineHeight: 20 },
  planBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 14 },
  planBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  planBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  disclaimer: { color: '#4b5563', fontSize: 12, textAlign: 'center', marginTop: 8 },
})
