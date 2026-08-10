import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'

const { width, height } = Dimensions.get('window')

export default function WelcomeScreen() {
  const router = useRouter()

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Background blobs */}
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      {/* Logo */}
      <View style={styles.logoSection}>
        <LinearGradient
          colors={['#1A6FFF', '#00B89C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoCircle}
        >
          <Text style={styles.logoLetter}>T</Text>
        </LinearGradient>

        <Text style={styles.wordmark}>Tripmates</Text>
        <Text style={styles.tagline}>Find Your Crew.{'\n'}See The World.</Text>

        <View style={{ marginTop: 40 }}>
        <Text style={styles.subtitleDesc}>
          Connect with travelers, plan trips together, and explore the world with your perfect match.
        </Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { value: '195',  color: '#1A6FFF', label: 'Countries' },
            { value: '500+', color: '#00B89C', label: 'Community' },
            { value: '100%', color: '#1A6FFF', label: 'Verified' },
          ].map(stat => (
            <View key={stat.label} style={styles.statBox}>
              <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
        </View>

      </View>

      {/* CTA buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/register')}
          style={styles.primaryWrapper}
        >
          <LinearGradient
            colors={['#1A6FFF', '#0A4CC9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryText}>Get Started</Text>
            <Text style={styles.primaryArrow}>→</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => router.push('/(auth)/login')}
          style={styles.secondaryButton}
        >
          <Text style={styles.secondaryText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.legal}>
          By continuing you agree to our{' '}
          <Text style={styles.legalLink}>Terms</Text> &{' '}
          <Text style={styles.legalLink}>Privacy Policy</Text>
        </Text>
      </View>
    </View>
  )
}

const BLOB_SIZE = width * 0.85

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 48,
    paddingHorizontal: 28,
    overflow: 'hidden',
  },

  // Background decorations
  blobTopRight: {
    position: 'absolute',
    width: BLOB_SIZE,
    height: BLOB_SIZE,
    borderRadius: BLOB_SIZE / 2,
    backgroundColor: '#1A6FFF',
    opacity: 0.06,
    top: -BLOB_SIZE * 0.35,
    right: -BLOB_SIZE * 0.35,
  },
  blobBottomLeft: {
    position: 'absolute',
    width: BLOB_SIZE * 0.7,
    height: BLOB_SIZE * 0.7,
    borderRadius: BLOB_SIZE,
    backgroundColor: '#00B89C',
    opacity: 0.07,
    bottom: -BLOB_SIZE * 0.2,
    left: -BLOB_SIZE * 0.25,
  },

  // Logo section
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: '#1A6FFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
  },
  logoLetter: {
    fontSize: 52,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -2,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1,
    marginBottom: 14,
  },
  tagline: {
    fontSize: 22,
    fontWeight: '600',
    color: '#E8F0FF',
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 32,
    opacity: 0.9,
  },
  subtitleDesc: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 23,
    paddingHorizontal: 30,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 3,
  },
  statLabel: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
    opacity: 0.7,
  },


  // Button section
  buttonSection: {
    gap: 12,
  },
  primaryWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#1A6FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryArrow: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 17,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  secondaryText: {
    color: '#E8F0FF',
    fontSize: 17,
    fontWeight: '600',
  },
  legal: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 4,
  },
  legalLink: {
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
})
