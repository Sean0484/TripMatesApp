import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Modal,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'

function isAtLeast18(date: Date): boolean {
  const today = new Date()
  let age = today.getFullYear() - date.getFullYear()
  const m = today.getMonth() - date.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < date.getDate())) age--
  return age >= 18
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default function RegisterScreen() {
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState<Date | null>(null)
  const [tempDob, setTempDob] = useState(new Date(2000, 0, 1))
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState(false)

  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() - 18)

  const handleSignUp = async () => {
    if (!firstName.trim()) { Alert.alert('Missing field', 'Please enter your first name.'); return }
    if (!email.trim())     { Alert.alert('Missing field', 'Please enter your email.'); return }
    if (password.length < 6) { Alert.alert('Weak password', 'Password must be at least 6 characters.'); return }
    if (!dob)              { Alert.alert('Missing field', 'Please enter your date of birth.'); return }
    if (!isAtLeast18(dob)) { Alert.alert('Age requirement', 'You must be 18 or older to join Tripmates.'); return }

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          date_of_birth: dob.toISOString().split('T')[0],
        },
      },
    })

    if (error) {
      Alert.alert('Sign up failed', error.message)
      setLoading(false)
      return
    }

    setLoading(false)

    if (!data.session) {
      setVerificationSent(true)
      return
    }

    router.replace('/(onboarding)/vibes')
  }

  const handleResend = async () => {
    setResendLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setResendLoading(false)
    if (error) {
      Alert.alert('Failed to resend', error.message)
    } else {
      Alert.alert('Email sent', 'Check your inbox for the verification link.')
    }
  }

  const handleCheckVerified = async () => {
    setCheckLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setCheckLoading(false)
    if (error) {
      const msg = error.message.toLowerCase()
      if (msg.includes('not confirmed') || msg.includes('confirm') || msg.includes('verified')) {
        Alert.alert('Not verified yet', 'Please click the link in your email first, then try again.')
      } else {
        Alert.alert('Error', error.message)
      }
      return
    }
    if (data.session) {
      router.replace('/(onboarding)/vibes')
    }
  }

  if (verificationSent) {
    return (
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: '#0A1628' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <StatusBar style="light" />
        <View style={styles.verifyContainer}>
          <View style={styles.verifyIconWrap}>
            <Text style={styles.verifyIcon}>✉️</Text>
          </View>
          <Text style={styles.verifyTitle}>Check your email!</Text>
          <Text style={styles.verifyBody}>
            We sent a verification link to{'\n'}
            <Text style={styles.verifyEmail}>{email.trim()}</Text>
          </Text>
          <Text style={styles.verifyHint}>
            Please verify your email before continuing.
          </Text>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleCheckVerified}
            disabled={checkLoading}
            style={styles.buttonWrapper}
          >
            <LinearGradient
              colors={['#1A6FFF', '#00B89C']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {checkLoading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.buttonText}>I've verified my email</Text>
              }
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResend}
            disabled={resendLoading}
            activeOpacity={0.7}
          >
            {resendLoading
              ? <ActivityIndicator color="#1A6FFF" size="small" />
              : <Text style={styles.resendText}>Resend Email</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={{ marginTop: 16 }}>
            <Text style={styles.signinText}>
              Back to <Text style={styles.signinBold}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    )
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
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoSection}>
          <LinearGradient
            colors={['#1A6FFF', '#00B89C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBox}
          >
            <Text style={styles.logoLetter}>T</Text>
          </LinearGradient>
          <Text style={styles.heading}>Create your account</Text>
          <Text style={styles.subheading}>Join thousands of travellers worldwide</Text>
        </View>

        {/* Name row */}
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jane"
              placeholderTextColor="#4b5563"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>
          <View style={styles.nameField}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              style={styles.input}
              placeholder="Smith"
              placeholderTextColor="#4b5563"
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Email */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Email</Text>
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

        {/* Password */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Min. 6 characters"
            placeholderTextColor="#4b5563"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        {/* Date of birth */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Date of birth</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
            <Text style={dob ? styles.inputText : styles.inputPlaceholder}>
              {dob ? formatDate(dob) : 'DD/MM/YYYY'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dobHint}>You must be 18 or older to join</Text>
        </View>

        {/* Create Account button */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleSignUp}
          disabled={loading}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={['#1A6FFF', '#00B89C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.button}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.buttonText}>Create Account</Text>
            }
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign in link */}
        <TouchableOpacity onPress={() => router.replace('/(auth)/login')} style={styles.signinLink}>
          <Text style={styles.signinText}>
            Already have an account?{' '}
            <Text style={styles.signinBold}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date picker — iOS modal, Android inline */}
      {Platform.OS === 'android' && showPicker && (
        <DateTimePicker
          value={tempDob}
          mode="date"
          display="default"
          maximumDate={maxDate}
          minimumDate={new Date(1920, 0, 1)}
          onChange={(_e, date) => {
            setShowPicker(false)
            if (date) { setDob(date); setTempDob(date) }
          }}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setShowPicker(false)}>
                  <Text style={styles.modalCancel}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Date of birth</Text>
                <TouchableOpacity onPress={() => { setDob(tempDob); setShowPicker(false) }}>
                  <Text style={styles.modalDone}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDob}
                mode="date"
                display="spinner"
                maximumDate={maxDate}
                minimumDate={new Date(1920, 0, 1)}
                onChange={(_e, date) => { if (date) setTempDob(date) }}
                style={{ backgroundColor: '#0D2040' }}
                themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      )}
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 48,
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  backArrow: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },

  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#1A6FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  logoLetter: {
    fontSize: 48,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -2,
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  subheading: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },

  nameRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },

  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9ca3af',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#0D2040',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 15,
    color: '#fff',
  },
  inputPlaceholder: {
    fontSize: 15,
    color: '#4b5563',
  },
  dobHint: {
    fontSize: 11,
    color: '#4b5563',
    marginTop: 5,
  },

  buttonWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
    shadowColor: '#1A6FFF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  button: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },

  // Verification screen
  verifyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  verifyIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(26,111,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  verifyIcon: {
    fontSize: 48,
  },
  verifyTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  verifyBody: {
    fontSize: 15,
    color: '#9ca3af',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 6,
  },
  verifyEmail: {
    color: '#1A6FFF',
    fontWeight: '700',
  },
  verifyHint: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  resendBtn: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(26,111,255,0.3)',
    alignItems: 'center',
    marginTop: 4,
    minWidth: 200,
  },
  resendText: {
    color: '#1A6FFF',
    fontSize: 15,
    fontWeight: '600',
  },

  signinLink: {
    alignItems: 'center',
  },
  signinText: {
    color: '#6b7280',
    fontSize: 14,
  },
  signinBold: {
    color: '#1A6FFF',
    fontWeight: '700',
  },

  // Date picker modal (iOS)
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: '#0D2040',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  modalCancel: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '500',
  },
  modalDone: {
    color: '#1A6FFF',
    fontSize: 15,
    fontWeight: '700',
  },
})
