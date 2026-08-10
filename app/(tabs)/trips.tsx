import { useEffect, useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, ScrollView, Alert, ActivityIndicator,
  Switch, Platform, KeyboardAvoidingView, Dimensions,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { supabase } from '../../lib/supabase'

const { width: W } = Dimensions.get('window')

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// ─── TripCard ─────────────────────────────────────────────────────────────────

function TripCard({
  trip, onPress, saved, onSave,
}: {
  trip: Trip
  onPress: () => void
  saved?: boolean
  onSave?: () => void
}) {
  return (
    <TouchableOpacity style={card.wrap} onPress={onPress} activeOpacity={0.8}>
      <View style={card.row}>
        <Text style={card.flag}>{getFlag(trip.destination)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={card.title} numberOfLines={1}>{trip.title}</Text>
          <Text style={card.dest} numberOfLines={1}>{trip.destination}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {onSave && (
            <TouchableOpacity
              onPress={onSave}
              style={card.bookmarkBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={[card.bookmarkIcon, saved && card.bookmarkIconSaved]}>
                {saved ? '🔖' : '🔖'}
              </Text>
              <View style={[card.bookmarkDot, saved && card.bookmarkDotActive]} />
            </TouchableOpacity>
          )}
          {trip.looking_for_duo && (
            <View style={card.duoBadge}><Text style={card.duoText}>🤝 Duo</Text></View>
          )}
          {trip.max_members && (
            <View style={card.memberBadge}>
              <Text style={card.memberText}>👥 {trip.max_members}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={card.dates}>
        <Text style={card.dateText}>
          {formatDate(trip.start_date)} → {formatDate(trip.end_date)}
        </Text>
        {trip.creator_name && (
          <Text style={card.creatorText}>by {trip.creator_name}</Text>
        )}
      </View>

      <View style={card.bottomRow}>
        <TouchableOpacity style={card.viewBtn} onPress={onPress} activeOpacity={0.8}>
          <Text style={card.viewBtnText}>View Trip →</Text>
        </TouchableOpacity>
        {onSave && (
          <TouchableOpacity
            style={[card.saveBtn, saved && card.saveBtnActive]}
            onPress={onSave}
            activeOpacity={0.8}
          >
            <Text style={[card.saveBtnText, saved && card.saveBtnTextActive]}>
              {saved ? '🔖 Saved' : '🔖 Save'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  )
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 16, marginBottom: 12,
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
    flex: 1,
    backgroundColor: 'rgba(26,111,255,0.15)',
    borderRadius: 10, paddingVertical: 9, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.3)',
  },
  viewBtnText: { color: '#1A6FFF', fontSize: 14, fontWeight: '600' },
  saveBtn: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10, paddingVertical: 9, paddingHorizontal: 14, alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  saveBtnActive: {
    backgroundColor: 'rgba(0,184,156,0.15)',
    borderColor: 'rgba(0,184,156,0.4)',
  },
  saveBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  saveBtnTextActive: { color: '#00B89C' },
  bookmarkBtn: { alignItems: 'center' },
  bookmarkIcon: { fontSize: 18, opacity: 0.35 },
  bookmarkIconSaved: { opacity: 1 },
  bookmarkDot: { width: 0, height: 0 },
  bookmarkDotActive: {},
})

// ─── Trip Detail Modal ────────────────────────────────────────────────────────

function TripDetailModal({
  trip, visible, onClose, userId,
}: { trip: Trip | null; visible: boolean; onClose: () => void; userId: string }) {
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [note, setNote] = useState('')

  useEffect(() => {
    if (visible && trip) {
      supabase.from('trip_members').select('id, status')
        .eq('trip_id', trip.id).eq('user_id', userId).maybeSingle()
        .then(({ data }) => { if (data) setJoined(true) })
      setNote('')
      setJoined(false)
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
                  value={note}
                  onChangeText={setNote}
                  multiline
                  textAlignVertical="top"
                  maxLength={200}
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
    backgroundColor: 'rgba(0,184,156,0.15)', borderRadius: 12,
    padding: 12, marginBottom: 16,
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
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 14,
    padding: 16, alignItems: 'center',
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
      // Reset form
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
      title: title.trim(),
      destination: destination.trim(),
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      max_members: maxMembers,
      description: description.trim() || null,
      creator_id: userId,
      looking_for_duo: lookingForDuo,
      status: 'open',
    })
    setLoading(false)
    if (error) { Alert.alert('Error', error.message); return }
    Alert.alert('Trip created! ✈️', 'Your trip has been posted.')
    onCreated()
    onClose()
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
                  <Text style={cm.toggleSub}>
                    {isDuoAllowed ? 'Travel as a pair, find another pair' : 'Voyager+ required'}
                  </Text>
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

      {/* Android date picker */}
      {Platform.OS === 'android' && activePicker && (
        <DateTimePicker
          value={tempDate} mode="date" display="default"
          minimumDate={new Date()}
          onChange={(_e, d) => {
            setActivePicker(null)
            if (d) { activePicker === 'start' ? setStartDate(d) : setEndDate(d) }
          }}
        />
      )}

      {/* iOS date picker modal */}
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
                value={tempDate} mode="date" display="spinner"
                minimumDate={new Date()}
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
    paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#fff',
    justifyContent: 'center',
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
    padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
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

    // Fetch trips and saved IDs in parallel
    const [tripsRes, savedRes] = await Promise.all([
      supabase
        .from('trips')
        .select('id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status')
        .order('start_date', { ascending: true })
        .limit(50),
      supabase
        .from('saved_trips')
        .select('trip_id')
        .eq('user_id', userId),
    ])

    if (tripsRes.error) { console.log('Trips error:', tripsRes.error); setLoading(false); return }

    // Build saved set
    const saved = new Set<string>((savedRes.data ?? []).map((r: any) => r.trip_id))
    setSavedIds(saved)

    // Fetch creator names
    const creatorIds = [...new Set((tripsRes.data ?? []).map(t => t.creator_id))]
    let nameMap: Record<string, string> = {}
    if (creatorIds.length > 0) {
      const { data: users } = await supabase
        .from('users').select('id, first_name').in('id', creatorIds)
      users?.forEach(u => { nameMap[u.id] = u.first_name })
    }

    setTrips((tripsRes.data ?? []).map(t => ({ ...t, creator_name: nameMap[t.creator_id] ?? undefined })))
    setLoading(false)
  }, [refreshKey, userId])

  const handleSaveTrip = useCallback(async (tripId: string) => {
    const isSaved = savedIds.has(tripId)

    // Optimistic update
    setSavedIds(prev => {
      const next = new Set(prev)
      if (isSaved) next.delete(tripId)
      else next.add(tripId)
      return next
    })

    if (isSaved) {
      const { error } = await supabase
        .from('saved_trips')
        .delete()
        .eq('user_id', userId)
        .eq('trip_id', tripId)
      if (error) {
        // Revert on failure
        setSavedIds(prev => { const next = new Set(prev); next.add(tripId); return next })
        Alert.alert('Error', error.message)
      }
    } else {
      const { error } = await supabase
        .from('saved_trips')
        .insert({ user_id: userId, trip_id: tripId })
      if (error) {
        // Revert on failure
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
      <View style={s.searchWrap}>
        <Text style={s.searchIcon}>🔍</Text>
        <TextInput
          style={s.searchInput}
          placeholder="Search destinations..."
          placeholderTextColor="#4b5563"
          value={search} onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Text style={{ color: '#4b5563', fontSize: 16 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#1A6FFF" /></View>
      ) : filtered.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>✈️</Text>
          <Text style={s.emptyTitle}>{search ? 'No trips found' : 'No trips yet'}</Text>
          <Text style={s.emptySub}>{search ? 'Try a different search' : 'Be the first to create a trip!'}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TripCard
              trip={item}
              onPress={() => setSelectedTrip(item)}
              saved={savedIds.has(item.id)}
              onSave={() => handleSaveTrip(item.id)}
            />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TripDetailModal
        trip={selectedTrip}
        visible={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        userId={userId}
      />
    </View>
  )
}

// ─── My Trips Tab ─────────────────────────────────────────────────────────────

type MyTab = 'upcoming' | 'saved' | 'requests'

function MyTripsTab({ userId }: { userId: string }) {
  const [myTab, setMyTab] = useState<MyTab>('upcoming')
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  const fetchMyTrips = useCallback(async () => {
    setLoading(true)
    setTrips([])

    if (myTab === 'upcoming') {
      const { data } = await supabase
        .from('trip_members')
        .select('trips(id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status)')
        .eq('user_id', userId)
        .eq('status', 'approved')
      const flat = (data ?? []).flatMap((r: any) => r.trips ? [r.trips] : [])
      setTrips(flat)
    } else if (myTab === 'saved') {
      const { data } = await supabase
        .from('saved_trips')
        .select('trips(id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status)')
        .eq('user_id', userId)
      const flat = (data ?? []).flatMap((r: any) => r.trips ? [r.trips] : [])
      setTrips(flat)
    } else {
      const { data } = await supabase
        .from('trip_members')
        .select('trips(id, title, destination, start_date, end_date, max_members, description, creator_id, looking_for_duo, status)')
        .eq('user_id', userId)
        .eq('status', 'pending')
      const flat = (data ?? []).flatMap((r: any) => r.trips ? [r.trips] : [])
      setTrips(flat)
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
      <View style={s.subTabRow}>
        {MY_TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            style={[s.subTab, myTab === t.key && s.subTabActive]}
            onPress={() => setMyTab(t.key)}
          >
            <Text style={[s.subTabText, myTab === t.key && s.subTabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#1A6FFF" /></View>
      ) : trips.length === 0 ? (
        <View style={s.center}>
          <Text style={s.emptyEmoji}>
            {myTab === 'upcoming' ? '✈️' : myTab === 'saved' ? '🔖' : '📋'}
          </Text>
          <Text style={s.emptyTitle}>
            {myTab === 'upcoming' ? 'No upcoming trips' : myTab === 'saved' ? 'No saved trips' : 'No pending requests'}
          </Text>
          <Text style={s.emptySub}>
            {myTab === 'upcoming' ? 'Join a trip to see it here' : myTab === 'saved' ? 'Save trips you love' : 'Request to join a trip'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={t => t.id}
          renderItem={({ item }) => (
            <TripCard trip={item} onPress={() => setSelectedTrip(item)} />
          )}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <TripDetailModal
        trip={selectedTrip}
        visible={!!selectedTrip}
        onClose={() => setSelectedTrip(null)}
        userId={userId}
      />
    </View>
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type MainTab = 'browse' | 'mine'

export default function TripsScreen() {
  const insets = useSafeAreaInsets()
  const [mainTab, setMainTab] = useState<MainTab>('browse')
  const [userId, setUserId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [browseKey, setBrowseKey] = useState(0)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>Trips</Text>
        {userId && (
          <TouchableOpacity style={s.createBtn} onPress={() => setShowCreate(true)} activeOpacity={0.8}>
            <LinearGradient colors={['#1A6FFF', '#0A4CC9']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.createBtnGrad}>
              <Text style={s.createBtnText}>+ Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

      {/* Main tabs toggle */}
      <View style={s.mainTabRow}>
        <TouchableOpacity
          style={[s.mainTab, mainTab === 'browse' && s.mainTabActive]}
          onPress={() => setMainTab('browse')}
        >
          <Text style={[s.mainTabText, mainTab === 'browse' && s.mainTabTextActive]}>Browse Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.mainTab, mainTab === 'mine' && s.mainTabActive]}
          onPress={() => setMainTab('mine')}
        >
          <Text style={[s.mainTabText, mainTab === 'mine' && s.mainTabTextActive]}>My Trips</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {mainTab === 'browse' && userId ? (
        <BrowseTripsTab key={browseKey} userId={userId} onCreatePress={() => setShowCreate(true)} />
      ) : mainTab === 'mine' && userId ? (
        <MyTripsTab userId={userId} />
      ) : (
        <View style={s.center}><ActivityIndicator color="#1A6FFF" /></View>
      )}

      {/* Create Trip Modal */}
      {userId && (
        <CreateTripModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          userId={userId}
          onCreated={() => setBrowseKey(k => k + 1)}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
  },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  createBtn: { borderRadius: 10, overflow: 'hidden' },
  createBtnGrad: { paddingHorizontal: 14, paddingVertical: 8 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  mainTabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  mainTab: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  mainTabActive: { backgroundColor: '#1A6FFF' },
  mainTabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  mainTabTextActive: { color: '#fff' },

  subTabRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  subTab: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  subTabActive: { backgroundColor: 'rgba(26,111,255,0.2)', borderColor: '#1A6FFF' },
  subTabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  subTabTextActive: { color: '#1A6FFF' },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 16, marginVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#fff' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6 },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', paddingHorizontal: 32 },
})
