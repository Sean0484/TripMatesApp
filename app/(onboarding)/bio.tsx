import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView,
  ActivityIndicator, Modal, FlatList,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { StatusBar } from 'expo-status-bar'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'
import * as SecureStore from 'expo-secure-store'

const BUDGETS = ['Budget', 'Mid-range', 'Luxury'] as const
type Budget = typeof BUDGETS[number]

const COUNTRIES = [
  'Afghanistan','Albania','Algeria','Andorra','Angola','Antigua and Barbuda','Argentina',
  'Armenia','Australia','Austria','Azerbaijan','Bahamas','Bahrain','Bangladesh','Barbados',
  'Belarus','Belgium','Belize','Benin','Bhutan','Bolivia','Bosnia and Herzegovina','Botswana',
  'Brazil','Brunei','Bulgaria','Burkina Faso','Burundi','Cabo Verde','Cambodia','Cameroon',
  'Canada','Central African Republic','Chad','Chile','China','Colombia','Comoros',
  'Congo (Brazzaville)','Congo (Kinshasa)','Costa Rica','Croatia','Cuba','Cyprus','Czech Republic',
  'Denmark','Djibouti','Dominica','Dominican Republic','Ecuador','Egypt','El Salvador',
  'Equatorial Guinea','Eritrea','Estonia','Eswatini','Ethiopia','Fiji','Finland','France',
  'Gabon','Gambia','Georgia','Germany','Ghana','Greece','Grenada','Guatemala','Guinea',
  'Guinea-Bissau','Guyana','Haiti','Honduras','Hungary','Iceland','India','Indonesia','Iran',
  'Iraq','Ireland','Israel','Italy','Jamaica','Japan','Jordan','Kazakhstan','Kenya','Kiribati',
  'Kosovo','Kuwait','Kyrgyzstan','Laos','Latvia','Lebanon','Lesotho','Liberia','Libya',
  'Liechtenstein','Lithuania','Luxembourg','Madagascar','Malawi','Malaysia','Maldives','Mali',
  'Malta','Marshall Islands','Mauritania','Mauritius','Mexico','Micronesia','Moldova','Monaco',
  'Mongolia','Montenegro','Morocco','Mozambique','Myanmar','Namibia','Nauru','Nepal',
  'Netherlands','New Zealand','Nicaragua','Niger','Nigeria','North Korea','North Macedonia',
  'Norway','Oman','Pakistan','Palau','Palestine','Panama','Papua New Guinea','Paraguay','Peru',
  'Philippines','Poland','Portugal','Qatar','Romania','Russia','Rwanda','Saint Kitts and Nevis',
  'Saint Lucia','Saint Vincent and the Grenadines','Samoa','San Marino','Sao Tome and Principe',
  'Saudi Arabia','Senegal','Serbia','Seychelles','Sierra Leone','Singapore','Slovakia',
  'Slovenia','Solomon Islands','Somalia','South Africa','South Korea','South Sudan','Spain',
  'Sri Lanka','Sudan','Suriname','Sweden','Switzerland','Syria','Taiwan','Tajikistan',
  'Tanzania','Thailand','Timor-Leste','Togo','Tonga','Trinidad and Tobago','Tunisia','Turkey',
  'Turkmenistan','Tuvalu','Uganda','Ukraine','United Arab Emirates','United Kingdom',
  'United States','Uruguay','Uzbekistan','Vanuatu','Vatican City','Venezuela','Vietnam',
  'Yemen','Zambia','Zimbabwe',
].sort()

function StepBar({ step }: { step: number }) {
  return (
    <View style={stepStyles.row}>
      {[1, 2, 3, 4].map(n => (
        <View key={n} style={[stepStyles.dot, n <= step && stepStyles.dotActive]} />
      ))}
    </View>
  )
}

const stepStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: 24 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.12)' },
  dotActive: { backgroundColor: '#1A6FFF' },
})

export default function BioScreen() {
  const router = useRouter()
  const { language } = useLanguage()
  const [country, setCountry] = useState('')
  const [countrySearch, setCountrySearch] = useState('')
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [bio, setBio] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [cachedVibes, setCachedVibes] = useState<string[]>([])
  const [cachedPersonality, setCachedPersonality] = useState('')

  const filteredCountries = COUNTRIES.filter(c =>
    c.toLowerCase().includes(countrySearch.toLowerCase())
  )

  const handleComplete = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase.from('users').update({
        city: country || null,
        budget_preference: budget,
        bio: bio,
        onboarding_complete: true,
      }).eq('id', user.id)
      console.log('Save result:', error)
      if (error) throw error
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'Could not save profile.')
      setLoading(false)
      return
    }
    setLoading(false)
    await SecureStore.deleteItemAsync('pending_email')
    await SecureStore.deleteItemAsync('pending_password')
    router.replace('/(tabs)/discover')
  }

  const handleGenerateBio = async () => {
    setAiLoading(true)

    let selectedVibes = cachedVibes
    let selectedPersonality = cachedPersonality

    if (!selectedVibes.length || !selectedPersonality) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('users')
            .select('travel_vibes, personality_tags')
            .eq('id', user.id)
            .single()
          if (profile) {
            selectedVibes = Array.isArray(profile.travel_vibes) ? profile.travel_vibes : []
            selectedPersonality = Array.isArray(profile.personality_tags)
              ? (profile.personality_tags[0] ?? '')
              : (profile.personality_tags ?? '')
            setCachedVibes(selectedVibes)
            setCachedPersonality(selectedPersonality)
          }
        }
      } catch {}
    }

    const randomStyle = [
      'adventurous and bold',
      'funny and lighthearted',
      'mysterious and intriguing',
      'warm and friendly',
      'passionate and driven',
    ][Math.floor(Math.random() * 5)]

    const uniqueSeed = Math.random().toString(36).substring(7)
    const timestamp = Date.now()

    let prompt = ''
    if (notes && notes.trim().length > 0) {
      prompt = `Write a unique travel bio (max 120 characters) based on these personal notes: "${notes}". Writing style: ${randomStyle}. Make it creative and personal. Reference: ${uniqueSeed}-${timestamp}.`
    } else {
      const vibesStr = selectedVibes.length ? selectedVibes.join(', ') : 'adventure'
      const personalityStr = selectedPersonality.replace('_', ' ') || 'spontaneous'
      prompt = `Write a unique travel bio (max 120 characters) for someone who loves ${vibesStr} and is a ${personalityStr} traveller. Writing style: ${randomStyle}. Make it creative and different every time. Reference: ${uniqueSeed}-${timestamp}.`
    }

    try {
      const response = await fetch('https://www.tripmatess.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      })
      const data = await response.json()
      console.log('AI bio response:', JSON.stringify(data))
      const generatedBio = data.reply || data.message || data.content?.[0]?.text || ''
      if (generatedBio) {
        setBio(generatedBio.substring(0, 150))
      } else {
        Alert.alert('Error', 'Could not generate bio. Please try again.')
      }
    } catch (err: any) {
      console.log('AI bio error:', err?.message, err)
      Alert.alert('Error', 'Could not generate bio. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#0A1628' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back button */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <StepBar step={4} />
        <Text style={styles.heading}>{t('almostThere', language)}</Text>
        <Text style={styles.sub}>{t('tellTravellers', language)}</Text>

        {/* Country picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('yourCountry', language)}</Text>
          <TouchableOpacity
            style={styles.input}
            onPress={() => { setCountrySearch(''); setShowCountryModal(true) }}
            activeOpacity={0.8}
          >
            <Text style={country ? styles.inputText : styles.inputPlaceholder}>
              {country || t('selectCountry', language)}
            </Text>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Budget */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{t('travelBudget', language)}</Text>
          <View style={styles.budgetRow}>
            {BUDGETS.map(b => {
              const on = budget === b
              return (
                <TouchableOpacity
                  key={b}
                  style={[styles.budgetChip, on && styles.budgetChipOn]}
                  onPress={() => setBudget(b)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.budgetText, on && styles.budgetTextOn]}>{b}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        {/* Notes for AI */}
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Help AI write your bio (optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="e.g. 23 years old, spontaneous, love hiking, been to 15 countries..."
            placeholderTextColor="#4b5563"
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Bio */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>{t('bio', language)}</Text>
            <Text style={styles.charCount}>{bio.length}/150</Text>
          </View>
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Share your travel style, favourite destinations, or what you're looking for..."
            placeholderTextColor="#4b5563"
            value={bio}
            onChangeText={v => setBio(v.slice(0, 150))}
            multiline
            textAlignVertical="top"
          />

          {/* AI Generate button */}
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={handleGenerateBio}
            disabled={aiLoading}
            activeOpacity={0.8}
          >
            {aiLoading
              ? <ActivityIndicator size="small" color="#1A6FFF" />
              : <Text style={styles.aiBtnText}>{t('generateBio', language)}</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleComplete}
          disabled={loading}
          style={styles.btnWrap}
        >
          <LinearGradient colors={['#1A6FFF', '#00B89C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>{t('completeProfile', language)}</Text>}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Country picker modal */}
      <Modal visible={showCountryModal} animationType="slide" transparent>
        <View style={modal.overlay}>
          <View style={modal.sheet}>
            <View style={modal.header}>
              <Text style={modal.title}>Select Country</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Text style={modal.close}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={modal.searchWrap}>
              <TextInput
                style={modal.search}
                placeholder={t('searchCountries', language)}
                placeholderTextColor="#4b5563"
                value={countrySearch}
                onChangeText={setCountrySearch}
                autoFocus
                clearButtonMode="while-editing"
              />
            </View>

            <FlatList
              data={filteredCountries}
              keyExtractor={item => item}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={modal.countryRow}
                  onPress={() => {
                    setCountry(item)
                    setShowCountryModal(false)
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={[modal.countryText, item === country && modal.countryTextSelected]}>
                    {item}
                  </Text>
                  {item === country && <Text style={modal.checkmark}>✓</Text>}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={modal.separator} />}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 48 },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
  },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },
  heading: { fontSize: 28, fontWeight: '800', color: '#fff', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 32 },
  fieldGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#9ca3af', letterSpacing: 0.3, marginBottom: 8 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  charCount: { fontSize: 11, color: '#4b5563' },
  input: {
    backgroundColor: '#0D2040',
    borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  inputText: { fontSize: 15, color: '#fff', flex: 1 },
  inputPlaceholder: { fontSize: 15, color: '#4b5563', flex: 1 },
  chevron: { color: '#4b5563', fontSize: 20, fontWeight: '300' },
  notesInput: { height: 72, paddingTop: 14, flexDirection: undefined as any },
  bioInput: { height: 120, paddingTop: 14, flexDirection: undefined as any },
  aiBtn: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(26,111,255,0.4)',
    backgroundColor: 'rgba(26,111,255,0.08)',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    minHeight: 42,
  },
  aiBtnText: { color: '#1A6FFF', fontSize: 14, fontWeight: '600' },
  budgetRow: { flexDirection: 'row', gap: 10 },
  budgetChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  budgetChipOn: { backgroundColor: 'rgba(26,111,255,0.2)', borderColor: '#1A6FFF' },
  budgetText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  budgetTextOn: { color: '#fff' },
  btnWrap: {
    borderRadius: 14, overflow: 'hidden', marginTop: 8,
    shadowColor: '#1A6FFF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btn: { paddingVertical: 17, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

const modal = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#0D2040',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  title: { color: '#fff', fontSize: 16, fontWeight: '700' },
  close: { color: '#6b7280', fontSize: 18, fontWeight: '600', paddingHorizontal: 4 },
  searchWrap: { paddingHorizontal: 16, paddingVertical: 12 },
  search: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: '#fff',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  countryRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14,
  },
  countryText: { fontSize: 15, color: '#d1d5db' },
  countryTextSelected: { color: '#1A6FFF', fontWeight: '600' },
  checkmark: { color: '#1A6FFF', fontSize: 16, fontWeight: '700' },
  separator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)', marginHorizontal: 20 },
})
