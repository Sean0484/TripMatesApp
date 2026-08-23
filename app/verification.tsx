import { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Linking, Alert, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

// ── eID providers grouped by country ─────────────────────────────────────────

const IDURA_BASE =
  'https://tripmates.test.idura.broker/oauth2/authorize' +
  '?client_id=urn:my:application:identifier:501423' +
  '&redirect_uri=https://tripmatess.com/auth/mitid/callback' +
  '&response_type=code&scope=openid&acr_values='

const EID_GROUPS = [
  {
    flag: '🇩🇰',
    country: 'Denmark',
    providers: [
      { label: 'MitID', acr: 'urn:grn:authn:dk:mitid:substantial' },
    ],
  },
  {
    flag: '🇸🇪',
    country: 'Sweden',
    providers: [
      { label: 'BankID', acr: 'urn:grn:authn:se:bankid:same-device' },
      { label: 'FrejaID', acr: null },
    ],
  },
  {
    flag: '🇳🇴',
    country: 'Norway',
    providers: [
      { label: 'BankID', acr: 'urn:grn:authn:no:bankid:substantial' },
      { label: 'Vipps MobilePay', acr: 'urn:grn:authn:no:vipps' },
    ],
  },
  {
    flag: '🇫🇮',
    country: 'Finland',
    providers: [
      { label: 'Finnish FTN', acr: 'urn:grn:authn:fi:all' },
    ],
  },
  {
    flag: '🇩🇪',
    country: 'Germany',
    providers: [
      { label: 'Personalausweis', acr: 'urn:grn:authn:de:personalausweis' },
    ],
  },
  {
    flag: '🇳🇱',
    country: 'Netherlands',
    providers: [
      { label: 'iDIN', acr: null },
    ],
  },
]

const COMPLETED = [
  { label: 'Email', icon: '📧' },
  { label: 'Phone', icon: '📱' },
  { label: 'Passport', icon: '🛂' },
]

const TRUST_FACTORS = [
  { label: 'Verified identity documents', pct: '40%' },
  { label: 'Completed trips & reviews', pct: '30%' },
  { label: 'Profile completeness', pct: '15%' },
  { label: 'Community reports (negative)', pct: '15%' },
]

export default function VerificationScreen() {
  const router = useRouter()
  const [isVerified, setIsVerified] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(true)
  const [showHow, setShowHow] = useState(false)

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoadingStatus(false); return }
      const { data } = await supabase
        .from('users')
        .select('verification_level')
        .eq('id', user.id)
        .single()
      setIsVerified(data?.verification_level === 'ID_verified')
      setLoadingStatus(false)
    }
    checkStatus()
  }, [])

  const handleEidVerify = (acr: string) => {
    const url = IDURA_BASE + encodeURIComponent(acr)
    Linking.openURL(url).catch(() => Alert.alert('Could not open link'))
  }

  const handleStripeVerify = () => {
    Alert.alert('Coming Soon', 'International ID verification will be available shortly.')
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.75}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification Center 🛡️</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Verified banner */}
        {!loadingStatus && isVerified && (
          <View style={styles.verifiedBanner}>
            <Text style={styles.verifiedBannerText}>✅ Identity Verified</Text>
            <Text style={styles.verifiedBannerSub}>Your identity has been successfully verified</Text>
          </View>
        )}

        {/* Status card */}
        <LinearGradient
          colors={['#4ECDC4', '#2E86AB']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.statusCard}
        >
          <View style={styles.statusHeader}>
            <Text style={styles.statusShield}>🛡️</Text>
            <Text style={styles.statusTitle}>Verification Status</Text>
          </View>
          {loadingStatus ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 12 }} />
          ) : (
            <>
              <Text style={styles.statusCount}>
                3<Text style={styles.statusCountSub}>/5</Text>
              </Text>
              <Text style={styles.statusSubtitle}>verifications complete</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: '60%' }]} />
              </View>
              <View style={styles.completedRow}>
                {COMPLETED.map(c => (
                  <View key={c.label} style={styles.completedChip}>
                    <Text style={styles.completedChipText}>{c.icon} {c.label} ✓</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </LinearGradient>

        {/* Subtitle below status */}
        <Text style={styles.pageSubtitle}>
          Verify your identity to build trust with other travellers
        </Text>

        {/* eID verification */}
        <View style={styles.sectionCard}>
          <View style={styles.eidHeader}>
            <Text style={styles.eidHeaderLabel}>VERIFY WITH GOVERNMENT eID</Text>
            <Text style={styles.eidHeaderSub}>
              Secure identity verification via{' '}
              <Text style={styles.iduraAccent}>Idura</Text>
              {' '}— trusted by banks and governments across Europe.
            </Text>
          </View>

          {EID_GROUPS.map((group) => (
            <View key={group.country}>
              <View style={styles.countryRow}>
                <Text style={styles.countryFlag}>{group.flag}</Text>
                <Text style={styles.countryName}>{group.country}</Text>
              </View>

              {group.providers.map((provider, pi) => (
                <View
                  key={provider.label}
                  style={[
                    styles.providerRow,
                    pi < group.providers.length - 1 && styles.providerRowBorder,
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.providerLabel, !provider.acr && styles.providerLabelDim]}>
                      {provider.label}
                    </Text>
                    {!provider.acr && (
                      <Text style={styles.comingSoonText}>Coming soon</Text>
                    )}
                  </View>
                  {provider.acr ? (
                    <TouchableOpacity
                      style={styles.verifyBtn}
                      onPress={() => handleEidVerify(provider.acr!)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.verifyBtnText}>↗ Verify</Text>
                    </TouchableOpacity>
                  ) : (
                    <Text style={styles.dashText}>—</Text>
                  )}
                </View>
              ))}
            </View>
          ))}

          <View style={styles.eidFooter}>
            <Text style={styles.eidFooterText}>
              🔒 Your data is processed by Idura and is never stored on Tripmates servers.
            </Text>
          </View>
        </View>

        {/* International / Stripe Identity */}
        <View style={styles.sectionCard}>
          <View style={styles.intlHeader}>
            <Text style={styles.intlIcon}>🌍</Text>
            <Text style={styles.intlTitle}>International Verification</Text>
          </View>
          <Text style={styles.intlBody}>
            Not in a supported eID country? Verify your identity with any government-issued document — passport, driving licence, or national ID card.
          </Text>
          <View style={styles.docChips}>
            {['🛂 Passport', '🪪 National ID', '🚗 Driving Licence'].map(label => (
              <View key={label} style={styles.docChip}>
                <Text style={styles.docChipText}>{label}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.stripeBtn}
            onPress={handleStripeVerify}
            activeOpacity={0.85}
          >
            <Text style={styles.stripeBtnText}>Verify with ID document 🪪</Text>
          </TouchableOpacity>
          <Text style={styles.stripeFooter}>
            🔒 Powered by Stripe Identity. Your documents are processed securely and never stored on Tripmates servers.
          </Text>
        </View>

        {/* Upgrade upsell */}
        <LinearGradient
          colors={['#1A2744', '#1a2e4a']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.upsellCard}
        >
          <View style={styles.upsellHeader}>
            <Text style={styles.upsellLock}>🔐</Text>
            <Text style={styles.upsellTitle}>Identity Verification Upgrade</Text>
          </View>
          <Text style={styles.upsellBody}>
            Get the highest trust tier with full identity verification. Stand out and unlock priority matching.
          </Text>
          <TouchableOpacity
            style={styles.upsellBtn}
            onPress={() => router.push('/subscription')}
            activeOpacity={0.85}
          >
            <Text style={styles.upsellBtnText}>Upgrade — €4.99 one-time</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Benefits */}
        <View style={styles.sectionCard}>
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

        {/* Trust score accordion */}
        <View style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.accordionBtn}
            onPress={() => setShowHow(v => !v)}
            activeOpacity={0.75}
          >
            <Text style={styles.accordionTitle}>How is the trust score calculated?</Text>
            <Text style={[styles.accordionChevron, showHow && styles.accordionChevronOpen]}>›</Text>
          </TouchableOpacity>
          {showHow && (
            <View style={styles.accordionBody}>
              {TRUST_FACTORS.map((r, i) => (
                <View
                  key={r.label}
                  style={[styles.trustRow, i < TRUST_FACTORS.length - 1 && styles.trustRowBorder]}
                >
                  <Text style={styles.trustLabel}>{r.label}</Text>
                  <Text style={styles.trustPct}>{r.pct}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

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
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  scroll: { padding: 16, paddingBottom: 52, gap: 14 },

  // Verified banner
  verifiedBanner: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(34,197,94,0.35)',
    paddingHorizontal: 16, paddingVertical: 12, alignItems: 'center', gap: 4,
  },
  verifiedBannerText: { color: '#22c55e', fontSize: 16, fontWeight: '800' },
  verifiedBannerSub: { color: '#86efac', fontSize: 13 },

  // Status card
  statusCard: { borderRadius: 20, padding: 22 },
  statusHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  statusShield: { fontSize: 20 },
  statusTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  statusCount: { color: '#fff', fontSize: 36, fontWeight: '800' },
  statusCountSub: { color: 'rgba(255,255,255,0.7)', fontSize: 20, fontWeight: '400' },
  statusSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, marginBottom: 12 },
  progressTrack: {
    height: 8, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 4, marginBottom: 16,
  },
  progressFill: { height: '100%', backgroundColor: '#fff', borderRadius: 4 },
  completedRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  completedChip: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20, paddingHorizontal: 11, paddingVertical: 5,
  },
  completedChipText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  pageSubtitle: {
    color: '#9ca3af', fontSize: 13, textAlign: 'center', lineHeight: 20,
  },

  // Shared card shell
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },

  // eID section
  eidHeader: { padding: 16, paddingBottom: 12 },
  eidHeaderLabel: {
    fontSize: 11, fontWeight: '700', color: '#6b7280',
    letterSpacing: 1, marginBottom: 6,
  },
  eidHeaderSub: { fontSize: 12, color: '#6b7280', lineHeight: 18 },
  iduraAccent: { color: '#00B89C', fontWeight: '700' },

  countryRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  countryFlag: { fontSize: 18 },
  countryName: { fontSize: 12, fontWeight: '700', color: '#d1d5db', letterSpacing: 0.5 },

  providerRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  providerRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  providerLabel: { fontSize: 14, fontWeight: '700', color: '#fff' },
  providerLabelDim: { color: '#6b7280' },
  comingSoonText: { fontSize: 11, color: '#4b5563', fontWeight: '600', marginTop: 2 },
  verifyBtn: {
    backgroundColor: '#1A6FFF', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  verifyBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dashText: { color: '#4b5563', fontSize: 14 },

  eidFooter: {
    padding: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  eidFooterText: { color: '#6b7280', fontSize: 11, lineHeight: 16 },

  // International section
  intlHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, paddingBottom: 8 },
  intlIcon: { fontSize: 20 },
  intlTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  intlBody: { color: '#9ca3af', fontSize: 13, lineHeight: 20, paddingHorizontal: 16, marginBottom: 12 },
  docChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  docChip: {
    backgroundColor: 'rgba(99,102,241,0.15)', borderRadius: 20,
    paddingHorizontal: 11, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)',
  },
  docChipText: { color: '#a5b4fc', fontSize: 12, fontWeight: '600' },
  stripeBtn: {
    marginHorizontal: 16, marginBottom: 12,
    backgroundColor: '#6366F1', borderRadius: 14, paddingVertical: 15, alignItems: 'center',
  },
  stripeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  stripeFooter: { color: '#6b7280', fontSize: 11, lineHeight: 16, paddingHorizontal: 16, paddingBottom: 16 },

  // Upsell card
  upsellCard: { borderRadius: 20, padding: 20 },
  upsellHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  upsellLock: { fontSize: 18 },
  upsellTitle: { color: '#fff', fontSize: 16, fontWeight: '800' },
  upsellBody: { color: 'rgba(255,255,255,0.8)', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  upsellBtn: {
    backgroundColor: '#FBBF24', borderRadius: 14, paddingVertical: 14, alignItems: 'center',
  },
  upsellBtnText: { color: '#1a1a2e', fontSize: 15, fontWeight: '800' },

  // Benefits
  benefitsTitle: { color: '#fff', fontSize: 15, fontWeight: '700', padding: 16, paddingBottom: 8 },
  benefitRow: { color: '#d1d5db', fontSize: 14, lineHeight: 24, paddingHorizontal: 16, paddingBottom: 4 },

  // Trust score accordion
  accordionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16,
  },
  accordionTitle: { color: '#fff', fontSize: 15, fontWeight: '700', flex: 1 },
  accordionChevron: { color: '#6b7280', fontSize: 22, fontWeight: '300' },
  accordionChevronOpen: { transform: [{ rotate: '90deg' }] },
  accordionBody: {
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 16,
  },
  trustRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12,
  },
  trustRowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  trustLabel: { color: '#d1d5db', fontSize: 13, flex: 1 },
  trustPct: { color: '#00B89C', fontSize: 13, fontWeight: '700' },
})
