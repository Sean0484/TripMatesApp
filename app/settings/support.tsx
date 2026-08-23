import { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

const FAQS = [
  {
    q: 'How does matching work on Tripmates?',
    a: 'Tripmates uses your travel vibes, personality type, and destination preferences to suggest compatible travel companions. Swipe right to like someone — if they like you back, it\'s a match and you can start chatting.',
  },
  {
    q: 'Is Tripmates free to use?',
    a: 'Yes! The free plan lets you discover travellers, send likes, and chat with matches. Premium plans unlock unlimited likes, super likes, seeing who liked you, and exclusive features like ARIA AI travel planning.',
  },
  {
    q: 'How do I upgrade my subscription?',
    a: 'Go to your Profile tab and tap the subscription banner, or tap any locked feature. You\'ll see our Explorer Plus, Voyager, and Premium plans with all the details.',
  },
  {
    q: 'How do I join or create a trip?',
    a: 'Head to the Discover tab and switch to the Trips section. Browse open trips and tap "Request to Join", or tap "+ Create" to post your own trip and find companions.',
  },
  {
    q: 'What is ARIA?',
    a: 'ARIA is your AI travel companion. She can help you plan itineraries, suggest destinations, build packing lists, and answer travel questions. Access ARIA from the chat tab or profile.',
  },
  {
    q: 'How do I report someone or block a user?',
    a: 'Tap on a user\'s profile and scroll to the bottom to find the Report option. You can also block someone from your match chat. Reported users are reviewed by our safety team within 24 hours.',
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Profile → Settings → Data & GDPR → Delete my account. This will send a deletion request to our team. Your account and all data will be permanently removed within 30 days.',
  },
]

export default function SupportScreen() {
  const router = useRouter()
  const [expanded, setExpanded] = useState<number | null>(null)

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Could not open link'))
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support ❓</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.card}>
          {FAQS.map((faq, i) => {
            const isOpen = expanded === i
            return (
              <View key={i} style={i < FAQS.length - 1 ? styles.faqBorder : undefined}>
                <TouchableOpacity
                  style={styles.faqQ}
                  onPress={() => setExpanded(isOpen ? null : i)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.faqQText}>{faq.q}</Text>
                  <Text style={[styles.faqChevron, isOpen && styles.faqChevronOpen]}>›</Text>
                </TouchableOpacity>
                {isOpen && (
                  <View style={styles.faqA}>
                    <Text style={styles.faqAText}>{faq.a}</Text>
                  </View>
                )}
              </View>
            )
          })}
        </View>

        <Text style={styles.sectionLabel}>CONTACT US</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={() => openUrl('mailto:hello@tripmatess.com?subject=Tripmates Support')}
            activeOpacity={0.75}
          >
            <Text style={styles.rowIcon}>✉️</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Contact Us</Text>
              <Text style={styles.rowSub}>hello@tripmatess.com</Text>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openUrl('mailto:hello@tripmatess.com?subject=Bug Report')}
            activeOpacity={0.75}
          >
            <Text style={styles.rowIcon}>🐛</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Report a Bug</Text>
              <Text style={styles.rowSub}>Help us improve the app</Text>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
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

  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48 },

  sectionLabel: {
    color: '#6b7280', fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10, paddingHorizontal: 4,
  },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
    marginBottom: 28,
  },

  faqBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  faqQ: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 16, gap: 12,
  },
  faqQText: { flex: 1, color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  faqChevron: { color: '#4b5563', fontSize: 20, transform: [{ rotate: '0deg' }] },
  faqChevronOpen: { transform: [{ rotate: '90deg' }] },
  faqA: {
    paddingHorizontal: 16, paddingBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  faqAText: { color: '#9ca3af', fontSize: 14, lineHeight: 22 },

  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  rowSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  rowChevron: { color: '#4b5563', fontSize: 20 },
})
