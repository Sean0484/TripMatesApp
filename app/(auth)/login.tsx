import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
  ScrollView, ActivityIndicator, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import * as AppleAuthentication from 'expo-apple-authentication'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { supabase } from '../../lib/supabase'

async function navigateAfterLogin(router: ReturnType<typeof useRouter>, userId: string) {
  const { data } = await supabase
    .from('users')
    .select('onboarding_complete')
    .eq('id', userId)
    .single()
  if (data?.onboarding_complete) {
    router.replace('/(tabs)/discover')
  } else {
    router.replace('/(onboarding)/photo')
  }
}

type BiometricType = 'faceid' | 'touchid' | 'fingerprint' | null

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [appleLoading, setAppleLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [biometricType, setBiometricType] = useState<BiometricType>(null)
  const [hasSavedCredentials, setHasSavedCredentials] = useState(false)

  useEffect(() => {
    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync()
      const isEnrolled = await LocalAuthentication.isEnrolledAsync()
      if (!hasHardware || !isEnrolled) return

      const savedEmail = await SecureStore.getItemAsync('lastUserEmail')
      const savedPassword = await SecureStore.getItemAsync('lastUserPassword')
      if (!savedEmail || !savedPassword) return

      setHasSavedCredentials(true)

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
      if (Platform.OS === 'ios') {
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('faceid')
        } else {
          setBiometricType('touchid')
        }
      } else {
        setBiometricType('fingerprint')
      }
    }
    checkBiometrics()
  }, [])

  const handleBiometricLogin = async () => {
    setBiometricLoading(true)
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Login to Tripmates',
        fallbackLabel: 'Use password',
        cancelLabel: 'Cancel',
      })
      if (!result.success) return

      const savedEmail = await SecureStore.getItemAsync('lastUserEmail')
      const savedPassword = await SecureStore.getItemAsync('lastUserPassword')
      if (!savedEmail || !savedPassword) {
        Alert.alert('No saved credentials', 'Please log in with your email and password first.')
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: savedEmail,
        password: savedPassword,
      })
      if (error) { Alert.alert('Login failed', error.message); return }
      if (data.user) await navigateAfterLogin(router, data.user.id)
    } catch (e: any) {
      Alert.alert('Biometric error', e.message)
    } finally {
      setBiometricLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) { Alert.alert('Login failed', error.message); return }
    if (data.user) {
      await SecureStore.setItemAsync('lastUserEmail', email.trim())
      await SecureStore.setItemAsync('lastUserPassword', password)
      await navigateAfterLogin(router, data.user.id)
    }
  }

  const handleAppleSignIn = async () => {
    setAppleLoading(true)
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      })
      console.log('Apple credential:', credential)
      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken!,
      })
      console.log('Supabase response:', data, error)
      if (error) { Alert.alert('Apple Sign In Error', error.message); return }
      if (data.user) await navigateAfterLogin(router, data.user.id)
    } catch (e: any) {
      console.log('Apple error:', e)
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Apple Sign In Error', e.message || JSON.stringify(e))
      }
    } finally {
      setAppleLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://tripmatess.com/app/discover',
          skipBrowserRedirect: true,
        },
      })
      if (error) throw error
      if (data?.url) await Linking.openURL(data.url)
    } catch (e: any) {
      Alert.alert('Google Sign In Error', e.message)
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A1628' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.titleSection}>
          <LinearGradient
            colors={['#1A6FFF', '#00B89C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoLetter}>T</Text>
          </LinearGradient>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your Tripmates account</Text>
        </View>

        {/* OAuth buttons */}
        <View style={styles.oauthSection}>
          {/* Apple Sign In */}
          <TouchableOpacity
            style={styles.appleButton}
            activeOpacity={0.85}
            onPress={handleAppleSignIn}
            disabled={appleLoading || googleLoading}
          >
            {appleLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.appleIcon}></Text>
                <Text style={styles.appleText}>Continue with Apple</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Google Sign In */}
          <TouchableOpacity
            style={styles.googleButton}
            activeOpacity={0.85}
            onPress={handleGoogleSignIn}
            disabled={appleLoading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#374151" />
            ) : (
              <>
                <View style={styles.googleLogoWrap}>
                  <Text style={styles.googleLogoR}>G</Text>
                </View>
                <Text style={styles.googleText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / password inputs */}
        <View style={styles.inputs}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor="#4b5563"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrapper}>
            <View style={styles.passwordLabelRow}>
              <Text style={styles.inputLabel}>Password</Text>
              <TouchableOpacity onPress={() => Alert.alert('Reset password', 'Check your email for a reset link.')}>
                <Text style={styles.forgotLink}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor="#4b5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        {/* Log In button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleLogin}
          disabled={loading}
          style={styles.loginWrapper}
        >
          <LinearGradient
            colors={['#1A6FFF', '#0A4CC9']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginButton}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginText}>Log In</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Biometric login */}
        {biometricType && hasSavedCredentials && (
          <TouchableOpacity
            style={styles.biometricBtn}
            onPress={handleBiometricLogin}
            disabled={biometricLoading}
            activeOpacity={0.8}
          >
            {biometricLoading ? (
              <ActivityIndicator color="#1A6FFF" size="small" />
            ) : (
              <>
                <Text style={styles.biometricIcon}>
                  {biometricType === 'faceid' ? '🔐' : '👆'}
                </Text>
                <Text style={styles.biometricText}>
                  {biometricType === 'faceid' ? 'Sign in with Face ID' : 'Sign in with Touch ID'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Register link */}
        <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
          <Text style={styles.registerText}>
            Don't have an account?{' '}
            <Text style={styles.registerBold}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  header: { marginBottom: 32 },
  backButton: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },

  titleSection: { marginBottom: 32, alignItems: 'center' },
  logoBox: {
    width: 80, height: 80, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
    shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 16, elevation: 10,
  },
  logoLetter: { fontSize: 48, fontWeight: '800', color: '#fff', letterSpacing: -2 },
  title: {
    fontSize: 30, fontWeight: '800', color: '#fff',
    marginBottom: 6, letterSpacing: -0.5, textAlign: 'center',
  },
  subtitle: { fontSize: 15, color: '#6b7280', textAlign: 'center' },

  // OAuth
  oauthSection: { gap: 10, marginBottom: 24 },
  appleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#000', borderRadius: 14, paddingVertical: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  appleIcon: { color: '#fff', fontSize: 18 },
  appleText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fff', borderRadius: 14, paddingVertical: 15,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12, shadowRadius: 6, elevation: 3,
  },
  googleLogoWrap: {
    width: 22, height: 22, borderRadius: 4,
    alignItems: 'center', justifyContent: 'center',
  },
  googleLogoR: { color: '#4285F4', fontSize: 17, fontWeight: '900' },
  googleText: { color: '#111827', fontSize: 15, fontWeight: '600' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  dividerText: { color: '#4b5563', fontSize: 12, fontWeight: '500' },

  // Inputs
  inputs: { gap: 14, marginBottom: 24 },
  inputWrapper: { gap: 6 },
  inputLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600', letterSpacing: 0.3 },
  passwordLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  forgotLink: { color: '#1A6FFF', fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: '#0D2040', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 15, fontSize: 15, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },

  // Login button
  loginWrapper: {
    borderRadius: 14, overflow: 'hidden',
    shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8, marginBottom: 20,
  },
  loginButton: { paddingVertical: 17, alignItems: 'center', justifyContent: 'center' },
  loginText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Biometric
  biometricBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.35)',
    borderRadius: 14, paddingVertical: 15,
    backgroundColor: 'rgba(26,111,255,0.08)',
    marginBottom: 20,
  },
  biometricIcon: { fontSize: 22 },
  biometricText: { color: '#1A6FFF', fontSize: 15, fontWeight: '600' },

  registerLink: { alignItems: 'center' },
  registerText: { color: '#6b7280', fontSize: 14 },
  registerBold: { color: '#1A6FFF', fontWeight: '700' },
})
