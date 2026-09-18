import { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, Alert, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import Constants from 'expo-constants'
import { PurchasesPackage } from 'react-native-purchases'
import { initIAP, getProducts, purchaseProduct, restorePurchases } from '../lib/iap'
import { supabase } from '../lib/supabase'

const isExpoGo = Constants.appOwnership === 'expo'
const iapAvailable = !isExpoGo && Platform.OS === 'ios'

// packageIdentifier must match the identifier set in RevenueCat dashboard
const PLAN_META = [
  {
    key: 'explorer_plus',
    packageIdentifier: 'explorer_plus',
    rcIdentifier: 'explorer_plus',
    name: 'Explorer Plus',
    fallbackPrice: '€4.99',
    icon: '🗺️',
    color: '#1A6FFF',
    gradColors: ['#1A3FFF', '#0A4CC9'] as [string, string],
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
    packageIdentifier: 'voyager',
    rcIdentifier: 'voyager',
    name: 'Voyager',
    fallbackPrice: '€9.99',
    icon: '✈️',
    color: '#00B89C',
    gradColors: ['#00B89C', '#009478'] as [string, string],
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
    packageIdentifier: 'premium',
    rcIdentifier: 'premium',
    name: 'Premium',
    fallbackPrice: '€19.99',
    icon: '👑',
    color: '#f59e0b',
    gradColors: ['#f59e0b', '#d97706'] as [string, string],
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
  const [packages, setPackages] = useState<PurchasesPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    let mounted = true
    const setup = async () => {
      try {
        if (iapAvailable) {
          await initIAP()
          const pkgs = await getProducts()
          if (mounted) setPackages(pkgs)
        }
      } catch (e) {
        // Products unavailable in simulator — fall back to static prices
      } finally {
        if (mounted) setLoading(false)
      }
    }
    setup()
    return () => { mounted = false }
  }, [])

  const getPackage = (identifier: string): PurchasesPackage | undefined =>
    packages.find(p => p.identifier === identifier)

  const getPrice = (identifier: string, fallback: string): string => {
    const pkg = getPackage(identifier)
    return pkg?.product?.priceString ?? fallback
  }

  const handlePurchase = async (plan: typeof PLAN_META[0]) => {
    if (!iapAvailable) {
      Alert.alert('Not available', 'In-app purchases require a native build.')
      return
    }
    const pkg = getPackage(plan.packageIdentifier)
    if (!pkg) {
      Alert.alert('Not available', 'This product could not be loaded from the App Store.')
      return
    }
    setPurchasing(plan.key)
    try {
      const customerInfo = await purchaseProduct(pkg)
      // Update subscription tier in Supabase
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('users').update({ subscription_tier: plan.rcIdentifier }).eq('id', user.id)
      }
      Alert.alert('Success!', `You are now on the ${plan.name} plan.`, [
        { text: 'OK', onPress: () => router.back() },
      ])
    } catch (e: any) {
      if (e?.userCancelled !== true) {
        Alert.alert('Purchase failed', e?.message ?? 'Could not complete purchase.')
      }
    } finally {
      setPurchasing(null)
    }
  }

  const handleRestore = async () => {
    if (!iapAvailable) {
      Alert.alert('Not available', 'In-app purchases require a native build.')
      return
    }
    setRestoring(true)
    try {
      await restorePurchases()
      Alert.alert('Restored', 'Your purchases have been restored.')
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message ?? 'Could not restore purchases.')
    } finally {
      setRestoring(false)
    }
  }

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
          <Text style={styles.heroSubtitle}>
            Unlock premium features and find your perfect travel companion faster.
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#1A6FFF" size="large" style={{ marginTop: 40 }} />
        ) : (
          PLAN_META.map(plan => (
            <View key={plan.key} style={styles.planCard}>
              <View style={styles.planHeader}>
                <Text style={styles.planIcon}>{plan.icon}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: plan.color }]}>
                      {getPrice(plan.packageIdentifier, plan.fallbackPrice)}
                    </Text>
                    <Text style={styles.planPeriod}>/month</Text>
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
                disabled={purchasing === plan.key}
                onPress={() => handlePurchase(plan)}
              >
                <LinearGradient
                  colors={plan.gradColors}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.planBtnGrad}
                >
                  {purchasing === plan.key
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.planBtnText}>Get {plan.name} →</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity
          style={styles.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
          activeOpacity={0.7}
        >
          {restoring
            ? <ActivityIndicator color="#6b7280" size="small" />
            : <Text style={styles.restoreBtnText}>Restore Purchases</Text>}
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Subscriptions auto-renew monthly. Cancel anytime in App Store settings.
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
  restoreBtn: { alignItems: 'center', paddingVertical: 14 },
  restoreBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  disclaimer: { color: '#4b5563', fontSize: 12, textAlign: 'center', marginTop: 4 },
})
