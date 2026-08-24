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
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'

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
  const { language } = useLanguage()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [dob, setDob] = useState<Date | null>(null)
  const [tempDob, setTempDob] = useState(new Date(2000, 0, 1))
  const [showPicker, setShowPicker] = useState(false)
  const [loading, setLoading] = useState(false)

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
    router.replace('/(onboarding)/vibes')
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
          <Text style={styles.heading}>{t('createAccount', language)}</Text>
          <Text style={styles.subheading}>{t('joinThousands', language)}</Text>
        </View>

        {/* Name row */}
        <View style={styles.nameRow}>
          <View style={styles.nameField}>
            <Text style={styles.label}>{t('firstName', language)}</Text>
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
            <Text style={styles.label}>{t('lastName', language)}</Text>
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
          <Text style={styles.label}>{t('emailAddress', language)}</Text>
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
          <Text style={styles.label}>{t('password', language)}</Text>
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
          <Text style={styles.label}>{t('dateOfBirth', language)}</Text>
          <TouchableOpacity style={styles.input} onPress={() => setShowPicker(true)} activeOpacity={0.7}>
            <Text style={dob ? styles.inputText : styles.inputPlaceholder}>
              {dob ? formatDate(dob) : 'DD/MM/YYYY'}
            </Text>
          </TouchableOpacity>
          <Text style={styles.dobHint}>{t('dobHint', language)}</Text>
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
          <Text style={styles.signinText}>{t('alreadyHaveAccount', language)}</Text>
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
                  <Text style={styles.modalCancel}>{t('cancel', language)}</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>{t('dateOfBirth', language)}</Text>
                <TouchableOpacity onPress={() => { setDob(tempDob); setShowPicker(false) }}>
                  <Text style={styles.modalDone}>{t('done', language)}</Text>
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

  signinLink: {
    alignItems: 'center',
  },
  signinText: {
    color: '#6b7280',
    fontSize: 14,
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
