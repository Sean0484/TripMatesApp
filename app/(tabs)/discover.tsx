import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Pressable, Image,
  Dimensions, ActivityIndicator, FlatList, TextInput,
  Modal, ScrollView, Alert, Switch, Platform, KeyboardAvoidingView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming,
  runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated'
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler'
import { LinearGradient } from 'expo-linear-gradient'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'
import { useSubscription } from '../../context/SubscriptionContext'
import { calculateMatchScore } from '../../lib/matchScore'

const { width: W, height: H } = Dimensions.get('window')
const PHOTO_HEIGHT = H * 0.52
const CARD_W = W - 32
const CARD_H = H * 0.63
const SWIPE_THRESHOLD = 100
const SUPER_THRESHOLD = -130

// ─── Discover constants ───────────────────────────────────────────────────────

const PERSONALITY: Record<string, string> = {
  early_bird: '🌅 Early Bird',
  night_owl: '🦉 Night Owl',
  planner: '📋 Planner',
  spontaneous: '⚡ Spontaneous',
}

const VIBE_EMOJI: Record<string, string> = {
  Adventure: '🏔️', Party: '🎉', Culture: '🏛️', Nature: '🌿',
  Wellness: '🧘', Budget: '💰', Backpacking: '🎒', Luxury: '🥂',
  Ski: '⛷️', 'Digital Nomad': '💻', Beach: '🏖️', Foodie: '🍜',
}

// ─── Trips helpers ────────────────────────────────────────────────────────────

function getAge(dob: string | null): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

const formatDate = (d: string | null) => {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getFlag = (dest: string) => {
  const l = dest.toLowerCase()
  const map: [string, string][] = [
    ['france', '🇫🇷'], ['japan', '🇯🇵'], ['spain', '🇪🇸'], ['italy', '🇮🇹'],
    ['germany', '🇩🇪'], ['uk', '🇬🇧'], ['usa', '🇺🇸'], ['australia', '🇦🇺'],
    ['thailand', '🇹🇭'], ['indonesia', '🇮🇩'], ['bali', '🇮🇩'], ['portugal', '🇵🇹'],
    ['greece', '🇬🇷'], ['mexico', '🇲🇽'], ['brazil', '🇧🇷'], ['canada', '🇨🇦'],
    ['ireland', '🇮🇪'], ['netherlands', '🇳🇱'], ['amsterdam', '🇳🇱'],
    ['morocco', '🇲🇦'], ['turkey', '🇹🇷'], ['croatia', '🇭🇷'], ['india', '🇮🇳'],
    ['vietnam', '🇻🇳'], ['singapore', '🇸🇬'], ['south korea', '🇰🇷'], ['korea', '🇰🇷'],
    ['new zealand', '🇳🇿'], ['argentina', '🇦🇷'], ['colombia', '🇨🇴'],
    ['scandinavia', '🇸🇪'], ['norway', '🇳🇴'], ['sweden', '🇸🇪'],
  ]
  for (const [key, flag] of map) { if (l.includes(key)) return flag }
  return '✈️'
}

// ─── Types ────────────────────────────────────────────────────────────────────

type TravelUser = {
  id: string
  first_name: string
  last_name: string
  avatar_url: string | null
  avatar_urls: string[] | null
  travel_vibes: string[] | null
  personality_tags: string | string[] | null
  city: string | null
  bio: string | null
  subscription_tier: string | null
  date_of_birth: string | null
  verification_level: string | null
  match: number
}

type CurrentUserProfile = {
  travel_vibes: string[] | null
  personality_tags: string | string[] | null
  verification_level: string | null
  avatar_url: string | null
  bio: string | null
  city: string | null
}

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string | null
  end_date: string | null
  max_members: number | null
  description: string | null
  creator_id: string
  looking_for_duo: boolean | null
  status: string | null
  creator_name?: string
}

type MyTab = 'upcoming' | 'saved' | 'requests'
type MainTab = 'browse' | 'mine'


// ─── UserCard ─────────────────────────────────────────────────────────────────

function UserCard({ user, style }: { user: TravelUser; style?: object }) {
  const vibes = (user.travel_vibes ?? []).slice(0, 3)
  const personalityKey = Array.isArray(user.personality_tags)
    ? user.personality_tags[0]
    : user.personality_tags
  const personality = personalityKey ? PERSONALITY[personalityKey] : null

  return (
    <View style={[st.card, style]}>
      {user.avatar_url ? (
        <Image source={{ uri: user.avatar_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <LinearGradient
          colors={['#1A3A6A', '#0A1E3A', '#001830']}
          start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.5)', 'rgba(0,0,0,0.92)']}
        style={st.cardOverlay}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
      />
      <View style={st.matchBadge}>
        <Text style={st.matchText}>{user.match}% Match</Text>
      </View>
      <View style={st.cardContent}>
        <Text style={st.userName}>{user.first_name} {user.last_name}</Text>
        {(user.city || personality) && (
          <Text style={st.userMeta}>{[user.city, personality].filter(Boolean).join('  ·  ')}</Text>
        )}
        {vibes.length > 0 && (
          <View style={st.vibesRow}>
            {vibes.map(v => (
              <View key={v} style={st.vibePill}>
                <Text style={st.vibePillText}>{VIBE_EMOJI[v] ?? ''} {v}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  )
}

// ─── TripCard ─────────────────────────────────────────────────────────────────

function TripCard({ trip, onPress, saved, onSave }: {
  trip: Trip; onPress: () => void; saved?: boolean; onSave?: () => void
}) {
  return (
    <TouchableOpacity style={tc.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={tc.row}>
        <Text style={tc.flag}>{getFlag(trip.destination)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={tc.title} numberOfLines={1}>{trip.title}</Text>
          <Text style={tc.dest} numberOfLines={1}>{trip.destination}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {trip.looking_for_duo && (
            <View style={tc.duoBadge}><Text style={tc.duoText}>🤝 Duo</Text></View>
          )}
          {trip.max_members && (
            <View style={tc.memberBadge}><Text style={tc.memberText}>👥 {trip.max_members}</Text></View>
          )}
        </View>
      </View>
      <View style={tc.dates}>
        <Text style={tc.dateText}>{formatDate(trip.start_date)} → {formatDate(trip.end_date)}</Text>
        {trip.creator_name && <Text style={tc.creatorText}>by {trip.creator_name}</Text>}
      </View>
      <View style={tc.bottomRow}>
        <TouchableOpacity style={tc.viewBtn} onPress={onPress} activeOpacity={0.8}>
          <Text style={tc.viewBtnText}>View Trip →</Text>
        </TouchableOpacity>
        {onSave && (
          <TouchableOpacity
            style={[tc.saveBtn, saved && tc.saveBtnActive]}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Text style={[tc.saveBtnText, saved && tc.saveBtnTextActive]}>
              {saved ? '🔖 Saved' : '🔖 Save'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

const tc = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16, marginBottom: 12,
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 10 },
  flag: { fontSize: 28, marginTop: 2 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 2 },
  dest: { fontSize: 13, color: '#9ca3af' },
  duoBadge: { backgroundColor: 'rgba(0,184,156,0.2)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  duoText: { color: '#00B89C', fontSize: 11, fontWeight: '600' },
  memberBadge: { backgroundColor: 'rgba(26,111,255,0.15)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 3 },
  memberText: { color: '#1A6FFF', fontSize: 11, fontWeight: '600' },
  dates: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dateText: { fontSize: 13, color: '#6b7280' },
  creatorText: { fontSize: 12, color: '#4b5563' },
  bottomRow: { flexDirection: 'row', gap: 8 },
  viewBtn: {
    flex: 1, backgroundColor: 'rgba(26,111,255,0.15)', borderRadius: 10,
    paddingVertical: 9, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(26,111,255,0.3)',
  },
  viewBtnText: { color: '#1A6FFF', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  saveBtnActive: { backgroundColor: 'rgba(0,184,156,0.15)', borderColor: 'rgba(0,184,156,0.4)' },
  saveBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  saveBtnTextActive: { color: '#00B89C' },
})

// ─── Trip Detail Modal ────────────────────────────────────────────────────────

function TripDetailModal({ trip, visible, onClose, userId }: {
  trip: Trip | null; visible: boolean; onClose: () => void; userId: string
}) {
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (visible && trip) {
      supabase.from('trip_members').select('id, status')
        .eq('trip_id', trip.id).eq('user_id', userId).maybeSingle()
        .then(({ data }) => { if (data) setJoined(true) })
      setNote(''); setJoined(false)
    }
  }, [visible, trip?.id])

  const handleJoin = async () => {
    if (!trip) return
    setJoining(true)
    const { error } = await supabase.from('trip_members').insert({
      trip_id: trip.id, user_id: userId, status: 'pending', join_note: note.trim() || null,
    })
    setJoining(false)
    if (error) { Alert.alert('Error', error.message); return }
    setJoined(true)
    Alert.alert('Request sent! ✈️', 'Your join request has been sent to the trip creator.')
  }

  if (!trip) return null

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={dm.overlay}>
        <View style={dm.sheet}>
          <View style={dm.header}>
            <Text style={dm.headerFlag}>{getFlag(trip.destination)}</Text>
            <View style={{ flex: 1 }}>
              <Text style={dm.headerTitle} numberOfLines={2}>{trip.title}</Text>
              <Text style={dm.headerDest}>{trip.destination}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={dm.closeBtn}>
              <Text style={dm.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={dm.body} showsVerticalScrollIndicator={false}>
            <View style={dm.infoRow}>
              <View style={dm.infoBox}>
                <Text style={dm.infoLabel}>Start</Text>
                <Text style={dm.infoVal}>{formatDate(trip.start_date)}</Text>
              </View>
              <View style={dm.infoBox}>
                <Text style={dm.infoLabel}>End</Text>
                <Text style={dm.infoVal}>{formatDate(trip.end_date)}</Text>
              </View>
              <View style={dm.infoBox}>
                <Text style={dm.infoLabel}>Max</Text>
                <Text style={dm.infoVal}>{trip.max_members ?? '—'}</Text>
              </View>
            </View>
            {trip.looking_for_duo && (
              <View style={dm.duoBanner}>
                <Text style={dm.duoBannerText}>🤝 This trip is looking for another duo to join!</Text>
              </View>
            )}
            {trip.description && (
              <View style={dm.section}>
                <Text style={dm.sectionLabel}>About this trip</Text>
                <Text style={dm.sectionText}>{trip.description}</Text>
              </View>
            )}
            {trip.creator_name && (
              <View style={dm.section}>
                <Text style={dm.sectionLabel}>Organised by</Text>
                <Text style={dm.sectionText}>{trip.creator_name}</Text>
              </View>
            )}
            {!joined && (
              <View style={dm.section}>
                <Text style={dm.sectionLabel}>Message to organiser (optional)</Text>
                <TextInput
                  style={dm.noteInput}
                  placeholder="Tell them why you'd be a great travel companion..."
                  placeholderTextColor="#4b5563"
                  value={note} onChangeText={setNote}
                  multiline textAlignVertical="top" maxLength={200}
                />
              </View>
            )}
          </ScrollView>
          <View style={dm.footer}>
            {joined ? (
              <View style={dm.joinedBanner}>
                <Text style={dm.joinedText}>✓ Request sent — waiting for approval</Text>
              </View>
            ) : (
              <TouchableOpacity style={dm.joinBtnWrap} onPress={handleJoin} disabled={joining} activeOpacity={0.85}>
                <LinearGradient colors={['#1A6FFF', '#00B89C']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={dm.joinBtn}>
                  {joining ? <ActivityIndicator color="#fff" /> : <Text style={dm.joinBtnText}>Request to Join ✈️</Text>}
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  )
}

const dm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0D2040', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '88%' },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerFlag: { fontSize: 36 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#fff', marginBottom: 2 },
  headerDest: { fontSize: 14, color: '#6b7280' },
  closeBtn: { padding: 4 },
  closeText: { color: '#6b7280', fontSize: 20 },
  body: { padding: 20 },
  infoRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 12, alignItems: 'center',
  },
  infoLabel: { fontSize: 11, color: '#6b7280', fontWeight: '600', marginBottom: 4 },
  infoVal: { fontSize: 13, color: '#fff', fontWeight: '700', textAlign: 'center' },
  duoBanner: {
    backgroundColor: 'rgba(0,184,156,0.15)', borderRadius: 12, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: 'rgba(0,184,156,0.3)',
  },
  duoBannerText: { color: '#00B89C', fontSize: 14, fontWeight: '600', textAlign: 'center' },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 12, color: '#6b7280', fontWeight: '600', letterSpacing: 0.3, marginBottom: 6 },
  sectionText: { fontSize: 15, color: '#d1d5db', lineHeight: 22 },
  noteInput: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: 12, fontSize: 14, color: '#fff', minHeight: 80,
  },
  footer: { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  joinBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  joinBtn: { paddingVertical: 16, alignItems: 'center' },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  joinedBanner: {
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 14, padding: 16, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  joinedText: { color: '#22c55e', fontSize: 15, fontWeight: '600' },
})

// ─── Create Trip Modal ────────────────────────────────────────────────────────

function CreateTripModal({ visible, onClose, userId, onCreated }: {
  visible: boolean; onClose: () => void; userId: string; onCreated: () => void
}) {
  const [title, setTitle] = useState('')
  const [destination, setDestination] = useState('')
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [tempDate, setTempDate] = useState(new Date())
  const [activePicker, setActivePicker] = useState<'start' | 'end' | null>(null)
  const [maxMembers, setMaxMembers] = useState(4)
  const [description, setDescription] = useState('')
  const [lookingForDuo, setLookingForDuo] = useState(false)
  const [userTier, setUserTier] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (visible) {
      supabase.from('users').select('subscription_tier').eq('id', userId).single()
        .then(({ data }) => setUserTier(data?.subscription_tier ?? null))
      setTitle(''); setDestination(''); setStartDate(null); setEndDate(null)
      setMaxMembers(4); setDescription(''); setLookingForDuo(false)
    }
  }, [visible])

  const isDuoAllowed = userTier === 'voyager' || userTier === 'premium'

  const handleCreate = async () => {
    if (!title.trim()) { Alert.alert('Missing', 'Please enter a trip title.'); return }
    if (!destination.trim()) { Alert.alert('Missing', 'Please enter a destination.'); return }
    if (!startDate) { Alert.alert('Missing', 'Please select a start date.'); return }
    if (!endDate) { Alert.alert('Missing', 'Please select an end date.'); return }
    if (endDate < startDate) { Alert.alert('Invalid dates', 'End date must be after start date.'); return }
    setLoading(true)
    const { error } = await supabase.from('trips').insert({
      title: title.trim(), destination: destination.trim(),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      max_members: maxMembers, description: description.trim() || null,
      creator_id: userId, looking_for_duo: lookingForDuo, status: 'open',
    })
    setLoading(false)
    if (error) { Alert.alert('Error', error.message); return }
    Alert.alert('Trip created! ✈️', 'Your trip has been posted.')
    onCreated(); onClose()
  }

  const openPicker = (type: 'start' | 'end') => {
    setTempDate(type === 'start' ? (startDate ?? new Date()) : (endDate ?? new Date()))
    setActivePicker(type)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={cm.overlay}>
          <View style={cm.sheet}>
            <View style={cm.header}>
              <Text style={cm.headerTitle}>Create Trip ✈️</Text>
              <TouchableOpacity onPress={onClose}><Text style={cm.closeText}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={cm.body} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={cm.field}>
                <Text style={cm.label}>Trip Title</Text>
                <TextInput style={cm.input} placeholder="e.g. Tokyo Adventure 2025" placeholderTextColor="#4b5563"
                  value={title} onChangeText={setTitle} />
              </View>
              <View style={cm.field}>
                <Text style={cm.label}>Destination</Text>
                <TextInput style={cm.input} placeholder="e.g. Tokyo, Japan" placeholderTextColor="#4b5563"
                  value={destination} onChangeText={setDestination} />
              </View>
              <View style={cm.dateRow}>
                <View style={{ flex: 1 }}>
                  <Text style={cm.label}>Start Date</Text>
                  <TouchableOpacity style={cm.input} onPress={() => openPicker('start')} activeOpacity={0.8}>
                    <Text style={startDate ? cm.dateVal : cm.datePlaceholder}>
                      {startDate ? formatDate(startDate.toISOString()) : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={cm.label}>End Date</Text>
                  <TouchableOpacity style={cm.input} onPress={() => openPicker('end')} activeOpacity={0.8}>
                    <Text style={endDate ? cm.dateVal : cm.datePlaceholder}>
                      {endDate ? formatDate(endDate.toISOString()) : 'Select date'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={cm.field}>
                <Text style={cm.label}>Max Members</Text>
                <View style={cm.stepper}>
                  <TouchableOpacity style={cm.stepBtn} onPress={() => setMaxMembers(m => Math.max(2, m - 1))}>
                    <Text style={cm.stepIcon}>−</Text>
                  </TouchableOpacity>
                  <Text style={cm.stepVal}>{maxMembers}</Text>
                  <TouchableOpacity style={cm.stepBtn} onPress={() => setMaxMembers(m => Math.min(20, m + 1))}>
                    <Text style={cm.stepIcon}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={cm.field}>
                <Text style={cm.label}>Description</Text>
                <TextInput
                  style={[cm.input, { height: 90, paddingTop: 12 }]}
                  placeholder="Tell people about this trip..."
                  placeholderTextColor="#4b5563"
                  value={description} onChangeText={setDescription}
                  multiline textAlignVertical="top"
                />
              </View>
              <View style={cm.toggleRow}>
                <View>
                  <Text style={cm.toggleLabel}>🤝 Looking for a Duo</Text>
                  <Text style={cm.toggleSub}>{isDuoAllowed ? 'Travel as a pair, find another pair' : 'Voyager+ required'}</Text>
                </View>
                <Switch
                  value={lookingForDuo}
                  onValueChange={(v) => {
                    if (!isDuoAllowed) { Alert.alert('Voyager+ required', 'Upgrade to enable Duo trips.'); return }
                    setLookingForDuo(v)
                  }}
                  trackColor={{ false: '#1e3a5f', true: '#1A6FFF' }}
                  thumbColor="#fff"
                />
              </View>
            </ScrollView>
            <View style={cm.footer}>
              <TouchableOpacity style={cm.createBtnWrap} onPress={handleCreate} disabled={loading} activeOpacity={0.85}>
                <LinearGradient colors={['#1A6FFF', '#0A4CC9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={cm.createBtn}>
                  {loading ? <ActivityIndicator color="#fff" /> : <Text style={cm.createBtnText}>Create Trip</Text>}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {Platform.OS === 'android' && activePicker && (
        <DateTimePicker
          value={tempDate} mode="date" display="default" minimumDate={new Date()}
          onChange={(_e, d) => {
            setActivePicker(null)
            if (d) { activePicker === 'start' ? setStartDate(d) : setEndDate(d) }
          }}
        />
      )}

      {Platform.OS === 'ios' && activePicker && (
        <Modal transparent animationType="slide">
          <View style={dm.overlay}>
            <View style={dm.sheet}>
              <View style={[dm.header, { justifyContent: 'space-between' }]}>
                <TouchableOpacity onPress={() => setActivePicker(null)}>
                  <Text style={{ color: '#6b7280', fontSize: 15 }}>Cancel</Text>
                </TouchableOpacity>
                <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>
                  {activePicker === 'start' ? 'Start Date' : 'End Date'}
                </Text>
                <TouchableOpacity onPress={() => {
                  if (activePicker === 'start') setStartDate(tempDate)
                  else setEndDate(tempDate)
                  setActivePicker(null)
                }}>
                  <Text style={{ color: '#1A6FFF', fontSize: 15, fontWeight: '700' }}>Done</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDate} mode="date" display="spinner" minimumDate={new Date()}
                onChange={(_e, d) => { if (d) setTempDate(d) }}
                style={{ backgroundColor: '#0D2040' }} themeVariant="dark"
              />
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  )
}

const cm = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0D2040', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#fff' },
  closeText: { color: '#6b7280', fontSize: 20 },
  body: { padding: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#9ca3af', letterSpacing: 0.3, marginBottom: 8 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#fff', justifyContent: 'center',
  },
  dateRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  dateVal: { fontSize: 14, color: '#fff' },
  datePlaceholder: { fontSize: 14, color: '#4b5563' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  stepBtn: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: 'rgba(26,111,255,0.15)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.3)',
  },
  stepIcon: { color: '#1A6FFF', fontSize: 20, fontWeight: '700' },
  stepVal: { fontSize: 20, fontWeight: '800', color: '#fff', minWidth: 32, textAlign: 'center' },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    padding: 16, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  toggleLabel: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  toggleSub: { fontSize: 12, color: '#6b7280' },
  footer: { padding: 20, paddingBottom: 36, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' },
  createBtnWrap: { borderRadius: 14, overflow: 'hidden' },
  createBtn: { paddingVertical: 16, alignItems: 'center' },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})

// ─── Browse Trips Tab ─────────────────────────────────────────────────────────

function BrowseTripsTab({ userId, onCreatePress }: { userId: string; onCreatePress: () => void }) {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())

  const fetchTrips = useCallback(async () => {
    setLoading(true)
    const [tripsRes, savedRes] = await Promise.all([
      supabase.from('trips')
        .select('id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status')
        .order('start_date', { ascending: true }).limit(50),
      supabase.from('saved_trips').select('trip_id').eq('user_id', userId),
    ])
    if (tripsRes.error) { setLoading(false); return }
    const saved = new Set<string>((savedRes.data ?? []).map((r: any) => r.trip_id))
    setSavedIds(saved)
    const creatorIds = [...new Set((tripsRes.data ?? []).map(t => t.creator_id))]
    let nameMap: Record<string, string> = {}
    if (creatorIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, first_name').in('id', creatorIds)
      users?.forEach(u => { nameMap[u.id] = u.first_name })
    }
    setTrips((tripsRes.data ?? []).map(t => ({ ...t, creator_name: nameMap[t.creator_id] ?? undefined })))
    setLoading(false)
  }, [refreshKey, userId])

  const handleSaveTrip = useCallback(async (tripId: string) => {
    const isSaved = savedIds.has(tripId)
    setSavedIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.delete(tripId); else next.add(tripId)
      return next
    })
    if (isSaved) {
      const { error } = await supabase.from('saved_trips').delete().eq('user_id', userId).eq('trip_id', tripId)
      if (error) {
        setSavedIds(prev => { const next = new Set(prev); next.add(tripId); return next })
        Alert.alert('Error', error.message)
      }
    } else {
      const { error } = await supabase.from('saved_trips').insert({ user_id: userId, trip_id: tripId })
      if (error) {
        setSavedIds(prev => { const next = new Set(prev); next.delete(tripId); return next })
        Alert.alert('Error', error.message)
      }
    }
  }, [savedIds, userId])

  useEffect(() => { fetchTrips() }, [fetchTrips])

  const filtered = trips.filter(t =>
    !search ||
    t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.destination.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <View style={{ flex: 1 }}>
      <View style={ts.searchWrap}>
        <Text style={ts.searchIcon}>🔍</Text>
        <TextInput
          style={ts.searchInput} placeholder="Search destinations..."
          placeholderTextColor="#4b5563" value={search} onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#4b5563', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>
      {loading ? (
        <View style={ts.center}><ActivityIndicator color="#1A6FFF" /></View>
      ) : filtered.length === 0 ? (
        <View style={ts.center}>
          <Text style={ts.emptyEmoji}>✈️</Text>
          <Text style={ts.emptyTitle}>{search ? 'No trips found' : 'No trips yet'}</Text>
          <Text style={ts.emptySub}>{search ? 'Try a different search' : 'Be the first to create a trip!'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered} keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item} onPress={() => setSelectedTrip(item)}
              saved={savedIds.has(item.id)} onSave={() => handleSaveTrip(item.id)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TripDetailModal trip={selectedTrip} visible={!!selectedTrip} onClose={() => setSelectedTrip(null)} userId={userId} />
    </View>
  )
}

// ─── My Trips Tab ─────────────────────────────────────────────────────────────

function MyTripsTab({ userId }: { userId: string }) {
  const [myTab, setMyTab] = useState<MyTab>('upcoming')
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  const fetchMyTrips = useCallback(async () => {
    setLoading(true); setTrips([])
    if (myTab === 'upcoming') {
      const { data } = await supabase
        .from('trip_members')
        .select('trips(id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status)')
        .eq('user_id', userId).eq('status', 'approved')
      setTrips((data ?? []).flatMap((r: any) => r.trips ? [r.trips] : []))
    } else if (myTab === 'saved') {
      const { data } = await supabase
        .from('saved_trips')
        .select('trips(id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status)')
        .eq('user_id', userId)
      setTrips((data ?? []).flatMap((r: any) => r.trips ? [r.trips] : []))
    } else {
      const { data } = await supabase
        .from('trip_members')
        .select('trips(id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status)')
        .eq('user_id', userId).eq('status', 'pending')
      setTrips((data ?? []).flatMap((r: any) => r.trips ? [r.trips] : []))
    }
    setLoading(false)
  }, [myTab, userId])

  useEffect(() => { fetchMyTrips() }, [fetchMyTrips])

  const MY_TABS: { key: MyTab; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'saved', label: 'Saved' },
    { key: 'requests', label: 'Requests' },
  ]

  return (
    <View style={{ flex: 1 }}>
      <View style={ts.subTabRow}>
        {MY_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[ts.subTab, myTab === t.key && ts.subTabActive]}
            onPress={() => setMyTab(t.key)}
          >
            <Text style={[ts.subTabText, myTab === t.key && ts.subTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <View style={ts.center}><ActivityIndicator color="#1A6FFF" /></View>
      ) : trips.length === 0 ? (
        <View style={ts.center}>
          <Text style={ts.emptyEmoji}>{myTab === 'upcoming' ? '✈️' : myTab === 'saved' ? '🔖' : '📋'}</Text>
          <Text style={ts.emptyTitle}>
            {myTab === 'upcoming' ? 'No upcoming trips' : myTab === 'saved' ? 'No saved trips' : 'No pending requests'}
          </Text>
          <Text style={ts.emptySub}>
            {myTab === 'upcoming' ? 'Join a trip to see it here' : myTab === 'saved' ? 'Save trips you love' : 'Request to join a trip'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips} keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TripCard trip={item} onPress={() => setSelectedTrip(item)} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TripDetailModal trip={selectedTrip} visible={!!selectedTrip} onClose={() => setSelectedTrip(null)} userId={userId} />
    </View>
  )
}

const ts = StyleSheet.create({
  subTabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  subTab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  subTabActive: { backgroundColor: 'rgba(26,111,255,0.2)', borderColor: '#1A6FFF' },
  subTabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  subTabTextActive: { color: '#1A6FFF' },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
})

// ─── Profile Detail Modal ─────────────────────────────────────────────────────

function ProfileDetailModal({ user, visible, onClose, onPass, onLike }: {
  user: TravelUser | null
  visible: boolean
  onClose: () => void
  onPass: () => void
  onLike: () => void
}) {
  const [reviews, setReviews] = useState<any[]>([])
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [photoIndex, setPhotoIndex] = useState(0)

  useEffect(() => {
    if (!user || !visible) return
    setReviews([])
    setAvgRating(null)
    setPhotoIndex(0)
    supabase
      .from('reviews')
      .select('rating, comment, created_at, reviewer:reviewer_id(first_name, last_name)')
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setReviews(data)
          const avg = data.reduce((s: number, r: any) => s + r.rating, 0) / data.length
          setAvgRating(Math.round(avg * 10) / 10)
        }
      })
  }, [user?.id, visible])

  if (!user) return null

  const vibes = user.travel_vibes ?? []
  const personalityKey = Array.isArray(user.personality_tags)
    ? user.personality_tags[0]
    : user.personality_tags
  const personality = personalityKey ? PERSONALITY[personalityKey] : null
  const age = getAge(user.date_of_birth)
  const tripsCount = 12 + (user.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 38)
  const buildPhotos = (u: TravelUser): string[] => {
    console.log('Building photos for:', u.first_name, 'avatar_urls:', u.avatar_urls, 'avatar_url:', u.avatar_url)
    if (u.avatar_urls && Array.isArray(u.avatar_urls) && u.avatar_urls.length > 0) {
      return u.avatar_urls.filter(Boolean)
    }
    if (u.avatar_url) return [u.avatar_url]
    return []
  }
  const photos = buildPhotos(user)

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent>
      <View style={pm.container}>
        {/* Photo gallery — tap left/right to navigate */}
        <View style={{ width: '100%', height: PHOTO_HEIGHT }}>
          {photos.length > 0 ? (
            <Image
              source={{ uri: photos[photoIndex] }}
              style={{ width: '100%', height: PHOTO_HEIGHT }}
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={['#1A3A6A', '#0A1E3A', '#001830']}
              start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
              style={{ width: '100%', height: PHOTO_HEIGHT }}
            />
          )}
          {/* Gradient overlay — pointerEvents none so taps pass through */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={[pm.photoGradient, { zIndex: 1, pointerEvents: 'none' }]}
            start={{ x: 0, y: 0.5 }} end={{ x: 0, y: 1 }}
          />
          {/* Dot indicators — pointerEvents none */}
          {photos.length > 1 && (
            <View style={{
              position: 'absolute', top: 12, width: '100%',
              flexDirection: 'row', justifyContent: 'center', gap: 6,
              zIndex: 3, pointerEvents: 'none',
            }}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: index === photoIndex ? 20 : 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: index === photoIndex ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
                  }}
                />
              ))}
            </View>
          )}
          {/* Close */}
          <TouchableOpacity style={[pm.closeBtn, { zIndex: 9999 }]} onPress={onClose} activeOpacity={0.8}>
            <Text style={pm.closeBtnText}>✕</Text>
          </TouchableOpacity>
          {/* Match badge */}
          <View style={[pm.matchBadge, { zIndex: 10 }]}>
            <Text style={pm.matchBadgeText}>{user.match}% Match</Text>
          </View>
          {/* Name overlay on photo */}
          <View style={[pm.photoNameWrap, { zIndex: 10 }]}>
            <Text style={pm.photoName}>
              {user.first_name} {user.last_name}{age ? `, ${age}` : ''}
            </Text>
            {user.city && (
              <Text style={pm.photoCity}>{getFlag(user.city)} {user.city}</Text>
            )}
          </View>
          {/* Tap left to go back — starts below close button area */}
          <Pressable
            style={{ position: 'absolute', left: 0, top: 60, width: '45%', height: PHOTO_HEIGHT - 60, zIndex: 999 }}
            onPress={() => {
              console.log('LEFT PRESSED, going to index:', Math.max(0, photoIndex - 1))
              setPhotoIndex(i => Math.max(0, i - 1))
            }}
          />
          {/* Tap right to go forward — starts below close button area */}
          <Pressable
            style={{ position: 'absolute', right: 0, top: 60, width: '45%', height: PHOTO_HEIGHT - 60, zIndex: 999 }}
            onPress={() => {
              console.log('RIGHT PRESSED, going to index:', Math.min(photos.length - 1, photoIndex + 1))
              setPhotoIndex(i => Math.min(photos.length - 1, i + 1))
            }}
          />
        </View>

        <ScrollView style={pm.body} contentContainerStyle={pm.bodyPad} showsVerticalScrollIndicator={false}>
          {/* Personality */}
          {personality && (
            <View style={pm.personalityBadge}>
              <Text style={pm.personalityText}>{personality}</Text>
            </View>
          )}

          {/* Vibes */}
          {vibes.length > 0 && (
            <View>
              <Text style={pm.sectionLabel}>TRAVEL VIBES</Text>
              <View style={pm.vibesWrap}>
                {vibes.map(v => (
                  <View key={v} style={pm.vibePill}>
                    <Text style={pm.vibePillText}>{VIBE_EMOJI[v] ?? ''} {v}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Bio */}
          {user.bio ? (
            <View style={{ marginTop: 20 }}>
              <Text style={pm.sectionLabel}>ABOUT</Text>
              <Text style={pm.bioText}>{user.bio}</Text>
            </View>
          ) : null}

          {/* Stats */}
          <View style={pm.statsRow}>
            <View style={pm.statBox}>
              <Text style={pm.statNum}>{tripsCount}</Text>
              <Text style={pm.statLabel}>Trips taken</Text>
            </View>
            <View style={pm.statDivider} />
            <View style={pm.statBox}>
              <Text style={pm.statNum}>{user.match}%</Text>
              <Text style={pm.statLabel}>Match score</Text>
            </View>
            {avgRating !== null && (
              <>
                <View style={pm.statDivider} />
                <View style={pm.statBox}>
                  <Text style={pm.statNum}>{avgRating}</Text>
                  <Text style={pm.statLabel}>Rating ⭐</Text>
                </View>
              </>
            )}
          </View>

          {/* Reviews */}
          <View style={{ marginTop: 24 }}>
            <Text style={pm.sectionLabel}>REVIEWS</Text>
            {reviews.length === 0 ? (
              <Text style={pm.noReviews}>No reviews yet</Text>
            ) : (
              reviews.map((r, i) => (
                <View key={i} style={pm.reviewItem}>
                  <View style={pm.reviewItemHeader}>
                    <Text style={pm.reviewerName}>
                      {(r.reviewer as any)?.first_name ?? 'Traveller'}
                    </Text>
                    <Text style={pm.reviewStars}>
                      {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
                    </Text>
                  </View>
                  {r.comment ? (
                    <Text style={pm.reviewComment}>{r.comment}</Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={pm.footer}>
          <TouchableOpacity style={pm.passBtn} onPress={onPass} activeOpacity={0.85}>
            <Text style={pm.passBtnText}>Pass ✕</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pm.likeBtn} onPress={onLike} activeOpacity={0.85}>
            <Text style={pm.likeBtnText}>Like ♥</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const pm = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },

  photo: { width: '100%', height: '100%' },
  photoGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '60%' },

  closeBtn: {
    position: 'absolute', top: 52, right: 16,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  matchBadge: {
    position: 'absolute', top: 52, left: 16,
    backgroundColor: 'rgba(0,184,156,0.85)',
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  matchBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  photoNameWrap: { position: 'absolute', bottom: 18, left: 18, right: 18 },
  photoName: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4 },
  photoCity: { fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  body: { flex: 1 },
  bodyPad: { padding: 20, paddingBottom: 8 },

  sectionLabel: {
    fontSize: 10, fontWeight: '700', color: '#6b7280',
    letterSpacing: 1.2, marginBottom: 10,
  },

  personalityBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(26,111,255,0.15)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(26,111,255,0.3)',
    paddingHorizontal: 12, paddingVertical: 6, marginBottom: 18,
  },
  personalityText: { color: '#93c5fd', fontSize: 13, fontWeight: '600' },

  vibesWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  vibePill: {
    backgroundColor: 'rgba(0,184,156,0.15)',
    borderColor: 'rgba(0,184,156,0.4)', borderWidth: 1,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  vibePillText: { color: '#00B89C', fontSize: 13, fontWeight: '600' },

  bioText: { fontSize: 15, color: '#d1d5db', lineHeight: 24 },

  statsRow: {
    flexDirection: 'row', marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  statBox: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 4 },
  statLabel: { fontSize: 12, color: '#6b7280', fontWeight: '500' },

  footer: {
    flexDirection: 'row', gap: 12, padding: 20, paddingBottom: 36,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  passBtn: {
    flex: 1, backgroundColor: '#ef4444', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  passBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  likeBtn: {
    flex: 1, backgroundColor: '#22c55e', borderRadius: 16,
    paddingVertical: 16, alignItems: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  likeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  // Reviews
  noReviews: { color: '#4b5563', fontSize: 14, fontStyle: 'italic', marginBottom: 8 },
  reviewItem: {
    backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    padding: 12, marginBottom: 8,
  },
  reviewItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  reviewerName: { color: '#d1d5db', fontSize: 13, fontWeight: '700' },
  reviewStars: { color: '#f59e0b', fontSize: 13 },
  reviewComment: { color: '#9ca3af', fontSize: 13, lineHeight: 18 },
})

// ─── Main Screen ──────────────────────────────────────────────────────────────

type TopTab = 'travellers' | 'trips'

const LIKE_LIMITS: Record<string, number> = {
  free: 25,
  explorer_plus: 50,
  voyager: Infinity,
  premium: Infinity,
}
const SUPERLIKE_LIMITS: Record<string, number> = {
  free: 0,
  explorer_plus: 5,
  voyager: 10,
  premium: 15,
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const { tier, showUpgradeModal } = useSubscription()
  const [topTab, setTopTab] = useState<TopTab>('travellers')

  // Email banner
  const [showBanner, setShowBanner] = useState(false)
  const [bannerEmail, setBannerEmail] = useState('')

  // Travellers state
  const [users, setUsers] = useState<TravelUser[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [likesToday, setLikesToday] = useState(0)
  const [superLikesToday, setSuperLikesToday] = useState(0)
  const [currentUserProfile, setCurrentUserProfile] = useState<CurrentUserProfile | null>(null)

  // Trips state
  const [userId, setUserId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [browseKey, setBrowseKey] = useState(0)
  const [tripsMainTab, setTripsMainTab] = useState<MainTab>('browse')

  const [profileUser, setProfileUser] = useState<TravelUser | null>(null)

  const tx = useSharedValue(0)
  const ty = useSharedValue(0)


  useEffect(() => {
    const fetchAll = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const isEmailConfirmed = !!user.email_confirmed_at
      if (!isEmailConfirmed && user.email) {
        setBannerEmail(user.email)
        setShowBanner(true)
      }

      const [meRes, othersRes] = await Promise.all([
        supabase
          .from('users')
          .select('travel_vibes, personality_tags, verification_level, avatar_url, bio, city')
          .eq('id', user.id)
          .single(),
        supabase
          .from('users')
          .select('id, first_name, last_name, avatar_url, avatar_urls, travel_vibes, personality_tags, city, bio, subscription_tier, date_of_birth, verification_level')
          .neq('id', user.id)
          .limit(20),
      ])

      const me: CurrentUserProfile = meRes.data ?? {
        travel_vibes: null, personality_tags: null, verification_level: null,
        avatar_url: null, bio: null, city: null,
      }
      setCurrentUserProfile(me)

      if (othersRes.data) {
        console.log('First user raw data:', JSON.stringify(othersRes.data[0]))
        setUsers(othersRes.data.map(u => ({
          ...u,
          match: calculateMatchScore(me, u),
        })))
      }
      setLoading(false)
    }
    fetchAll()
  }, [])

  const handleSwipe = useCallback((action: 'like' | 'pass' | 'super_like') => {
    const currentTier = tier ?? 'free'

    if (action === 'like') {
      const limit = LIKE_LIMITS[currentTier] ?? 25
      if (likesToday >= limit) {
        tx.value = withSpring(0, { damping: 15, stiffness: 120 })
        ty.value = withSpring(0, { damping: 15, stiffness: 120 })
        showUpgradeModal('unlimited_likes')
        return
      }
      setLikesToday(prev => prev + 1)
    } else if (action === 'super_like') {
      const limit = SUPERLIKE_LIMITS[currentTier] ?? 0
      if (limit === 0) {
        tx.value = withSpring(0, { damping: 15, stiffness: 120 })
        ty.value = withSpring(0, { damping: 15, stiffness: 120 })
        showUpgradeModal('super_likes')
        return
      }
      if (superLikesToday >= limit) {
        tx.value = withSpring(0, { damping: 15, stiffness: 120 })
        ty.value = withSpring(0, { damping: 15, stiffness: 120 })
        showUpgradeModal('more_superlikes')
        return
      }
      setSuperLikesToday(prev => prev + 1)
    }

    tx.value = 0; ty.value = 0
    setCurrentIndex(i => i + 1)
  }, [tx, ty, tier, likesToday, superLikesToday, showUpgradeModal])

  const swipeRight = () => {
    tx.value = withTiming(W + 150, { duration: 350 }, (done) => {
      if (done) runOnJS(handleSwipe)('like')
    })
  }
  const swipeLeft = () => {
    tx.value = withTiming(-W - 150, { duration: 350 }, (done) => {
      if (done) runOnJS(handleSwipe)('pass')
    })
  }
  const swipeUp = () => {
    ty.value = withTiming(-H - 100, { duration: 350 }, (done) => {
      if (done) runOnJS(handleSwipe)('super_like')
    })
  }

  const isDragging = useRef(false)
  const setDragging = (v: boolean) => { isDragging.current = v }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      runOnJS(setDragging)(true)
      tx.value = e.translationX
      ty.value = e.translationY
    })
    .onEnd((e) => {
      runOnJS(setDragging)(false)
      if (e.translationX > SWIPE_THRESHOLD) {
        tx.value = withTiming(W + 150, { duration: 300 }, (done) => { if (done) runOnJS(handleSwipe)('like') })
      } else if (e.translationX < -SWIPE_THRESHOLD) {
        tx.value = withTiming(-W - 150, { duration: 300 }, (done) => { if (done) runOnJS(handleSwipe)('pass') })
      } else if (e.translationY < SUPER_THRESHOLD) {
        ty.value = withTiming(-H - 100, { duration: 300 }, (done) => { if (done) runOnJS(handleSwipe)('super_like') })
      } else {
        tx.value = withSpring(0, { damping: 15, stiffness: 120 })
        ty.value = withSpring(0, { damping: 15, stiffness: 120 })
      }
    })

  const topCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${(tx.value / W) * 22}deg` },
    ],
  }))

  const backCardStyle = useAnimatedStyle(() => {
    const drag = Math.sqrt(tx.value * tx.value + ty.value * ty.value)
    const scale = interpolate(drag, [0, SWIPE_THRESHOLD], [0.93, 1], Extrapolation.CLAMP)
    const translateY = interpolate(drag, [0, SWIPE_THRESHOLD], [14, 0], Extrapolation.CLAMP)
    return { transform: [{ scale }, { translateY }] }
  })

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [20, SWIPE_THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }))
  const passOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(tx.value, [-SWIPE_THRESHOLD, -20], [1, 0], Extrapolation.CLAMP),
  }))
  const superOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(ty.value, [SUPER_THRESHOLD, -30], [1, 0], Extrapolation.CLAMP),
  }))

  const currentUser = users[currentIndex]
  const nextUser = users[currentIndex + 1]

  const handleResendEmail = async () => {
    const { error } = await supabase.auth.resend({ type: 'signup', email: bannerEmail })
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      Alert.alert('Email sent!', 'Check your inbox.')
    }
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#0A1628' }}>
      <View style={[st.container, { paddingTop: insets.top }]}>

        {/* Email confirmation banner */}
        {showBanner && (
          <View style={st.emailBanner}>
            <Text style={st.emailBannerText}>📧 Please confirm your email — check your inbox</Text>
            <View style={st.emailBannerActions}>
              <TouchableOpacity onPress={handleResendEmail} activeOpacity={0.75} style={st.emailBannerResend}>
                <Text style={st.emailBannerResendText}>Resend</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setShowBanner(false)} activeOpacity={0.75} style={st.emailBannerDismiss}>
                <Text style={st.emailBannerDismissText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Top bar */}
        <View style={st.topBar}>
          <LinearGradient
            colors={['#1A6FFF', '#00B89C']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={st.logoBox}
          >
            <Text style={st.logoLetter}>T</Text>
          </LinearGradient>

          <Text style={st.topBarTitle}>Discover</Text>

          {topTab === 'trips' && userId ? (
            <TouchableOpacity style={st.createBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
              <LinearGradient
                colors={['#1A6FFF', '#0A4CC9']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={st.createBtnGrad}
              >
                <Text style={st.createBtnText}>+ Create</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={st.filterBtn}>
              <Text style={st.filterIcon}>⚙️</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Top tab switcher */}
        <View style={st.topTabBar}>
          <TouchableOpacity
            style={st.topTabItem}
            onPress={() => setTopTab('travellers')}
            activeOpacity={0.75}
          >
            <Text style={[st.topTabLabel, topTab === 'travellers' && st.topTabLabelActive]}>
              {t('travellers', language)}
            </Text>
            {topTab === 'travellers' && <View style={st.topTabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity
            style={st.topTabItem}
            onPress={() => setTopTab('trips')}
            activeOpacity={0.75}
          >
            <Text style={[st.topTabLabel, topTab === 'trips' && st.topTabLabelActive]}>
              {t('trips', language)}
            </Text>
            {topTab === 'trips' && <View style={st.topTabUnderline} />}
          </TouchableOpacity>
        </View>

        {/* ── Travellers tab ── */}
        {topTab === 'travellers' && (
          <>
            {loading ? (
              <View style={st.center}>
                <ActivityIndicator size="large" color="#1A6FFF" />
              </View>
            ) : (
              <>
                <View style={st.cardStack}>
                  {!currentUser ? (
                    <View style={st.emptyState}>
                      <Text style={st.emptyEmoji}>🌍</Text>
                      <Text style={st.emptyTitle}>{t('noMoreProfiles', language)}</Text>
                    </View>
                  ) : (
                    <>
                      {nextUser && (
                        <Animated.View style={[st.cardWrap, backCardStyle, { zIndex: 1 }]}>
                          <UserCard user={nextUser} />
                        </Animated.View>
                      )}
                      <GestureDetector gesture={pan}>
                        <Animated.View style={[st.cardWrap, topCardStyle, { zIndex: 2 }]}>
                          <UserCard user={currentUser} />
                          <Animated.View style={[st.likeOverlay, likeOpacity]}>
                            <Text style={st.likeLabel}>LIKE ♥</Text>
                          </Animated.View>
                          <Animated.View style={[st.passOverlay, passOpacity]}>
                            <Text style={st.passLabel}>NOPE ✕</Text>
                          </Animated.View>
                          <Animated.View style={[st.superOverlay, superOpacity]}>
                            <Text style={st.superLabel}>SUPER ★</Text>
                          </Animated.View>
                          <TouchableOpacity
                            activeOpacity={1}
                            onPress={() => {
                              if (!isDragging.current) setProfileUser(currentUser)
                            }}
                            style={StyleSheet.absoluteFill}
                          />
                        </Animated.View>
                      </GestureDetector>
                    </>
                  )}
                </View>

                {currentUser && (
                  <View style={st.actions}>
                    <TouchableOpacity style={[st.actionBtn, st.passBtn]} onPress={swipeLeft} activeOpacity={0.8}>
                      <Text style={st.passIcon}>✕</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.actionBtn, st.superBtn]} onPress={swipeUp} activeOpacity={0.8}>
                      <Text style={st.superIcon}>★</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[st.actionBtn, st.likeBtn]} onPress={swipeRight} activeOpacity={0.8}>
                      <Text style={st.likeIcon}>♥</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ── Trips tab ── */}
        {topTab === 'trips' && (
          <View style={{ flex: 1 }}>
            {/* Browse / My Trips toggle */}
            <View style={st.tripsTabRow}>
              <TouchableOpacity
                style={[st.tripsTab, tripsMainTab === 'browse' && st.tripsTabActive]}
                onPress={() => setTripsMainTab('browse')}
              >
                <Text style={[st.tripsTabText, tripsMainTab === 'browse' && st.tripsTabTextActive]}>
                  Browse Trips
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[st.tripsTab, tripsMainTab === 'mine' && st.tripsTabActive]}
                onPress={() => setTripsMainTab('mine')}
              >
                <Text style={[st.tripsTabText, tripsMainTab === 'mine' && st.tripsTabTextActive]}>
                  My Trips
                </Text>
              </TouchableOpacity>
            </View>

            {!userId ? (
              <View style={ts.center}><ActivityIndicator color="#1A6FFF" /></View>
            ) : tripsMainTab === 'browse' ? (
              <BrowseTripsTab key={browseKey} userId={userId} onCreatePress={() => setShowCreate(true)} />
            ) : (
              <MyTripsTab userId={userId} />
            )}

            {userId && (
              <CreateTripModal
                visible={showCreate}
                onClose={() => setShowCreate(false)}
                userId={userId}
                onCreated={() => setBrowseKey(k => k + 1)}
              />
            )}
          </View>
        )}

      </View>

      <ProfileDetailModal
        user={profileUser}
        visible={!!profileUser}
        onClose={() => setProfileUser(null)}
        onPass={() => { setProfileUser(null); swipeLeft() }}
        onLike={() => { setProfileUser(null); swipeRight() }}
      />

    </GestureHandlerRootView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  center: { flex: 1, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center' },

  // Email confirmation banner
  emailBanner: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14, paddingVertical: 10,
    gap: 6,
  },
  emailBannerText: { color: '#1a1a2e', fontSize: 13, fontWeight: '600', lineHeight: 18 },
  emailBannerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  emailBannerResend: {
    backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 5,
  },
  emailBannerResendText: { color: '#1a1a2e', fontSize: 13, fontWeight: '700' },
  emailBannerDismiss: { marginLeft: 'auto' as any, padding: 4 },
  emailBannerDismissText: { color: '#1a1a2e', fontSize: 15, fontWeight: '700' },

  // Top bar
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  logoBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logoLetter: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -1 },
  topBarTitle: { fontSize: 18, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  filterBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.07)', alignItems: 'center', justifyContent: 'center',
  },
  filterIcon: { fontSize: 18 },
  createBtn: { borderRadius: 10, overflow: 'hidden' },
  createBtnGrad: { paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Top tab switcher
  topTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    marginBottom: 2,
  },
  topTabItem: {
    flex: 1, alignItems: 'center', paddingVertical: 10, position: 'relative',
  },
  topTabLabel: { color: '#6b7280', fontSize: 15, fontWeight: '600' },
  topTabLabelActive: { color: '#fff' },
  topTabUnderline: {
    position: 'absolute', bottom: 0, left: '20%', right: '20%',
    height: 2, borderRadius: 1, backgroundColor: '#1A6FFF',
  },

  // Trips sub-tab
  tripsTabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginTop: 10, marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tripsTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tripsTabActive: { backgroundColor: '#1A6FFF' },
  tripsTabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tripsTabTextActive: { color: '#fff' },

  // Card stack
  cardStack: { height: H * 0.62, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16 },
  cardWrap: { position: 'absolute', width: CARD_W, height: CARD_H },

  // Card
  card: { width: '100%', height: '100%', borderRadius: 24, overflow: 'hidden', backgroundColor: '#0D2040' },
  cardOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, height: CARD_H * 0.6 },
  matchBadge: {
    position: 'absolute', top: 16, right: 16,
    backgroundColor: 'rgba(0,184,156,0.85)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  matchText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  cardContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, paddingBottom: 24 },
  userName: {
    fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 4,
  },
  userMeta: { fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12, fontWeight: '500' },
  vibesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  vibePill: {
    backgroundColor: 'rgba(0,184,156,0.25)', borderColor: 'rgba(0,184,156,0.6)',
    borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  vibePillText: { color: '#00B89C', fontSize: 12, fontWeight: '600' },

  // Swipe overlays
  likeOverlay: {
    position: 'absolute', top: 32, left: 20,
    borderWidth: 3, borderColor: '#22c55e', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, transform: [{ rotate: '-15deg' }],
  },
  likeLabel: { color: '#22c55e', fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  passOverlay: {
    position: 'absolute', top: 32, right: 20,
    borderWidth: 3, borderColor: '#ef4444', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6, transform: [{ rotate: '15deg' }],
  },
  passLabel: { color: '#ef4444', fontSize: 26, fontWeight: '900', letterSpacing: 2 },
  superOverlay: {
    position: 'absolute', bottom: 120, alignSelf: 'center',
    borderWidth: 3, borderColor: '#3b82f6', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  superLabel: { color: '#3b82f6', fontSize: 26, fontWeight: '900', letterSpacing: 2 },

  // Action buttons
  actions: {
    flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 24,
  },
  actionBtn: {
    width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  passBtn: { backgroundColor: '#ef4444', shadowColor: '#ef4444' },
  superBtn: { backgroundColor: '#3b82f6', shadowColor: '#3b82f6', width: 52, height: 52, borderRadius: 26 },
  likeBtn: { backgroundColor: '#22c55e', shadowColor: '#22c55e' },
  passIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },
  superIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  likeIcon: { color: '#fff', fontSize: 22, fontWeight: '700' },

  // Empty state
  emptyState: { alignItems: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#fff', marginBottom: 8, textAlign: 'center' },
  emptySub: { fontSize: 15, color: '#6b7280', textAlign: 'center', lineHeight: 22 },
})
