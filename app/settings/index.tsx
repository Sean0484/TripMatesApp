import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'

const VERSION = '1.0.0'

type SettingRow = {
  icon: string
  label: string
  sub?: string
  onPress: () => void
  danger?: boolean
}

export default function SettingsScreen() {
  const router = useRouter()

  const openUrl = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Could not open link'))
  }

  const sections: { title: string; rows: SettingRow[] }[] = [
    {
      title: 'Support',
      rows: [
        {
          icon: '💬',
          label: 'Help & FAQ',
          sub: 'Common questions and guides',
          onPress: () => openUrl('https://tripmatess.com/help'),
        },
        {
          icon: '📧',
          label: 'Contact Support',
          sub: 'Email us at support@tripmatess.com',
          onPress: () => openUrl('mailto:support@tripmatess.com'),
        },
        {
          icon: '🐛',
          label: 'Report a Bug',
          sub: 'Help us improve the app',
          onPress: () => openUrl('mailto:bugs@tripmatess.com?subject=Bug Report'),
        },
      ],
    },
    {
      title: 'Legal',
      rows: [
        {
          icon: '🔒',
          label: 'Privacy Policy',
          onPress: () => openUrl('https://tripmatess.com/privacy'),
        },
        {
          icon: '📄',
          label: 'Terms of Service',
          onPress: () => openUrl('https://tripmatess.com/terms'),
        },
        {
          icon: '🍪',
          label: 'Cookie Policy',
          onPress: () => openUrl('https://tripmatess.com/cookies'),
        },
      ],
    },
    {
      title: 'Danger Zone',
      rows: [
        {
          icon: '🗑️',
          label: 'Delete Account',
          sub: 'Permanently remove your account and data',
          danger: true,
          onPress: () => {
            Alert.alert(
              'Delete Account',
              'This will permanently delete your account and all your data. This cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => openUrl('mailto:support@tripmatess.com?subject=Delete my account'),
                },
              ]
            )
          },
        },
      ],
    },
  ]

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.card}>
              {section.rows.map((row, i) => (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.row, i < section.rows.length - 1 && styles.rowBorder]}
                  onPress={row.onPress}
                  activeOpacity={0.7}
                >
                  <Text style={styles.rowIcon}>{row.icon}</Text>
                  <View style={styles.rowContent}>
                    <Text style={[styles.rowLabel, row.danger && styles.rowLabelDanger]}>
                      {row.label}
                    </Text>
                    {row.sub ? <Text style={styles.rowSub}>{row.sub}</Text> : null}
                  </View>
                  <Text style={styles.rowChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.versionWrap}>
          <Text style={styles.appName}>Tripmates</Text>
          <Text style={styles.version}>Version {VERSION}</Text>
          <Text style={styles.tagline}>Find your perfect travel companion ✈️</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 28, lineHeight: 34, fontWeight: '300' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '700' },

  scroll: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },

  section: { marginBottom: 24 },
  sectionTitle: {
    color: '#6b7280', fontSize: 11, fontWeight: '700',
    letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowContent: { flex: 1 },
  rowLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  rowLabelDanger: { color: '#ef4444' },
  rowSub: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  rowChevron: { color: '#4b5563', fontSize: 20 },

  versionWrap: { alignItems: 'center', paddingTop: 8, gap: 4 },
  appName: { color: '#fff', fontSize: 16, fontWeight: '800' },
  version: { color: '#4b5563', fontSize: 12 },
  tagline: { color: '#4b5563', fontSize: 12, marginTop: 2 },
})
