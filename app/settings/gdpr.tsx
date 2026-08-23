import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

export default function GdprScreen() {
  const router = useRouter()

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Could not open link'))
  }

  const requestData = () => {
    openUrl('mailto:hello@tripmatess.com?subject=Data Request')
  }

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.\n\nWe will send you a confirmation email before deletion.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Deletion',
          style: 'destructive',
          onPress: () => openUrl('mailto:hello@tripmatess.com?subject=Delete Account Request'),
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Data & GDPR 🛡️</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        <Text style={styles.sectionLabel}>YOUR DATA RIGHTS</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Under GDPR and other applicable privacy laws, you have the right to access, correct, and delete the personal data we hold about you. Use the options below to exercise these rights.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>MANAGE YOUR DATA</Text>
        <View style={styles.card}>
          <TouchableOpacity style={[styles.row, styles.rowBorder]} onPress={requestData} activeOpacity={0.75}>
            <Text style={styles.rowIcon}>📥</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Download my data</Text>
              <Text style={styles.rowSub}>Request a copy of all data we hold about you</Text>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={deleteAccount} activeOpacity={0.75}>
            <Text style={styles.rowIcon}>🗑️</Text>
            <View style={styles.rowContent}>
              <Text style={[styles.rowLabel, styles.danger]}>Delete my account</Text>
              <Text style={styles.rowSub}>Permanently remove your account and all data</Text>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>LEGAL</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={() => openUrl('https://tripmatess.com/privacy')}
            activeOpacity={0.75}
          >
            <Text style={styles.rowIcon}>🔒</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Privacy Policy</Text>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.row}
            onPress={() => openUrl('https://tripmatess.com/terms')}
            activeOpacity={0.75}
          >
            <Text style={styles.rowIcon}>📄</Text>
            <View style={styles.rowContent}>
              <Text style={styles.rowLabel}>Terms of Service</Text>
            </View>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.contactNote}>
          For any data-related enquiries, contact us at{' '}
          <Text style={styles.contactEmail} onPress={() => openUrl('mailto:hello@tripmatess.com')}>
            hello@tripmatess.com
          </Text>
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

  infoCard: {
    backgroundColor: 'rgba(26,111,255,0.08)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.2)',
    padding: 16, marginBottom: 28,
  },
  infoText: { color: '#93c5fd', fontSize: 14, lineHeight: 22 },

  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
    marginBottom: 28,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  danger: { color: '#ef4444' },
  rowSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },
  rowChevron: { color: '#4b5563', fontSize: 20 },

  contactNote: { color: '#6b7280', fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 8 },
  contactEmail: { color: '#1A6FFF', textDecorationLine: 'underline' },
})
