import { useState, useEffect, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, TextInput, Alert, ActivityIndicator, Platform,
  KeyboardAvoidingView, Image, FlatList, Keyboard,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'
import { useSubscription } from '../../context/SubscriptionContext'

const AVATAR_SIZE = 88
const AVATAR_RADIUS = AVATAR_SIZE / 2
const COVER_BASE = 160

const PERSONALITY: Record<string, { label: string; color: string; bg: string }> = {
  Spontaneous: { label: '⚡ Spontaneous', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  Planner:     { label: '📋 Planner',     color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  Adventurer:  { label: '🏔️ Adventurer',  color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  Social:      { label: '🎉 Social',      color: '#a855f7', bg: 'rgba(168,85,247,0.15)' },
  Relaxed:     { label: '🌊 Relaxed',     color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  Cultural:    { label: '🎭 Cultural',    color: '#ec4899', bg: 'rgba(236,72,153,0.15)' },
}

const TIER_INFO: Record<string, { badge: string; color: string; upgrade: string | null; icon: string }> = {
  free:         { badge: 'Free',          color: '#6b7280', upgrade: 'Upgrade to Explorer Plus', icon: '🌱' },
  explorer_plus:{ badge: 'Explorer Plus', color: '#1A6FFF', upgrade: 'Upgrade to Voyager',       icon: '🗺️' },
  voyager:      { badge: 'Voyager',       color: '#00B89C', upgrade: 'Upgrade to Premium',       icon: '✈️' },
  premium:      { badge: 'Premium',       color: '#f59e0b', upgrade: null,                       icon: '👑' },
}

const DESTINATIONS = [
  { name: 'Paris',          country: 'France',       flag: '🇫🇷' },
  { name: 'London',         country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Tokyo',          country: 'Japan',        flag: '🇯🇵' },
  { name: 'New York',       country: 'USA',          flag: '🇺🇸' },
  { name: 'Rome',           country: 'Italy',        flag: '🇮🇹' },
  { name: 'Barcelona',      country: 'Spain',        flag: '🇪🇸' },
  { name: 'Amsterdam',      country: 'Netherlands',  flag: '🇳🇱' },
  { name: 'Dubai',          country: 'UAE',          flag: '🇦🇪' },
  { name: 'Sydney',         country: 'Australia',    flag: '🇦🇺' },
  { name: 'Bangkok',        country: 'Thailand',     flag: '🇹🇭' },
  { name: 'Singapore',      country: 'Singapore',    flag: '🇸🇬' },
  { name: 'Bali',           country: 'Indonesia',    flag: '🇮🇩' },
  { name: 'Cancún',         country: 'Mexico',       flag: '🇲🇽' },
  { name: 'Santorini',      country: 'Greece',       flag: '🇬🇷' },
  { name: 'Istanbul',       country: 'Turkey',       flag: '🇹🇷' },
  { name: 'Prague',         country: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Vienna',         country: 'Austria',      flag: '🇦🇹' },
  { name: 'Lisbon',         country: 'Portugal',     flag: '🇵🇹' },
  { name: 'Berlin',         country: 'Germany',      flag: '🇩🇪' },
  { name: 'Budapest',       country: 'Hungary',      flag: '🇭🇺' },
  { name: 'Cape Town',      country: 'South Africa', flag: '🇿🇦' },
  { name: 'Marrakech',      country: 'Morocco',      flag: '🇲🇦' },
  { name: 'Dubrovnik',      country: 'Croatia',      flag: '🇭🇷' },
  { name: 'Kyoto',          country: 'Japan',        flag: '🇯🇵' },
  { name: 'Osaka',          country: 'Japan',        flag: '🇯🇵' },
  { name: 'Seoul',          country: 'South Korea',  flag: '🇰🇷' },
  { name: 'Hong Kong',      country: 'Hong Kong',    flag: '🇭🇰' },
  { name: 'Mumbai',         country: 'India',        flag: '🇮🇳' },
  { name: 'Rio de Janeiro', country: 'Brazil',       flag: '🇧🇷' },
  { name: 'Buenos Aires',   country: 'Argentina',    flag: '🇦🇷' },
  { name: 'Medellín',       country: 'Colombia',     flag: '🇨🇴' },
  { name: 'Mexico City',    country: 'Mexico',       flag: '🇲🇽' },
  { name: 'Toronto',        country: 'Canada',       flag: '🇨🇦' },
  { name: 'Vancouver',      country: 'Canada',       flag: '🇨🇦' },
  { name: 'Miami',          country: 'USA',          flag: '🇺🇸' },
  { name: 'Los Angeles',    country: 'USA',          flag: '🇺🇸' },
  { name: 'Maldives',       country: 'Maldives',     flag: '🇲🇻' },
  { name: 'Phuket',         country: 'Thailand',     flag: '🇹🇭' },
  { name: 'Mykonos',        country: 'Greece',       flag: '🇬🇷' },
  { name: 'Ibiza',          country: 'Spain',        flag: '🇪🇸' },
  { name: 'Reykjavik',      country: 'Iceland',      flag: '🇮🇸' },
  { name: 'Stockholm',      country: 'Sweden',       flag: '🇸🇪' },
  { name: 'Copenhagen',     country: 'Denmark',      flag: '🇩🇰' },
  { name: 'Zurich',         country: 'Switzerland',  flag: '🇨🇭' },
  { name: 'Cairo',          country: 'Egypt',        flag: '🇪🇬' },
  { name: 'Nairobi',        country: 'Kenya',        flag: '🇰🇪' },
  { name: 'Havana',         country: 'Cuba',         flag: '🇨🇺' },
  { name: 'Kathmandu',      country: 'Nepal',        flag: '🇳🇵' },
  { name: 'Chiang Mai',     country: 'Thailand',     flag: '🇹🇭' },
  { name: 'Lisbon',         country: 'Portugal',     flag: '🇵🇹' },
]

const SETTINGS_ROWS = [
  { icon: '🔒', label: 'Privacy Settings',      sub: 'Control who sees your profile',      route: '/settings/privacy' },
  { icon: '🔔', label: 'Notification Settings', sub: 'Manage alerts and push notifications', route: '/settings/notifications' },
  { icon: '🛡️', label: 'Data & GDPR',           sub: 'Your data rights and privacy',        route: '/settings/gdpr' },
  { icon: '❓', label: 'Help & Support',         sub: 'FAQs, contact and bug reports',       route: '/settings/support' },
]

type Dest = { name: string; country: string; flag: string }

type Profile = {
  id: string
  first_name: string | null
  last_name: string | null
  avatar_url: string | null
  travel_vibes: string[] | null
  personality_tags: string[] | null
  city: string | null
  country: string | null
  bio: string | null
  subscription_tier: string | null
  verification_level: string | null
  match_score: number | null
  wishlist: string[] | null
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets()
  const { language, setLanguage } = useLanguage()
  const { showUpgradeModal } = useSubscription()
  const router = useRouter()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [tripCount, setTripCount] = useState(0)
  const [rating, setRating] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [wishlist, setWishlist] = useState<string[]>([])

  const [editVisible, setEditVisible] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editCity, setEditCity] = useState('')

  const [wishlistVisible, setWishlistVisible] = useState(false)
  const [wishQuery, setWishQuery] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const userId = session.user.id

    const [profileRes, tripRes, ratingRes] = await Promise.all([
      supabase.from('users').select('*').eq('id', userId).single(),
      supabase.from('trip_members')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'Approved'),
      supabase.from('reviews').select('rating').eq('reviewee_id', userId),
    ])

    if (profileRes.data) {
      setProfile(profileRes.data)
      setWishlist(profileRes.data.wishlist ?? [])
    }
    if (tripRes.count !== null) setTripCount(tripRes.count)
    if (ratingRes.data && ratingRes.data.length > 0) {
      const avg = ratingRes.data.reduce((s: number, r: any) => s + r.rating, 0) / ratingRes.data.length
      setRating(Math.round(avg * 10) / 10)
    }
    setLoading(false)
  }

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (result.canceled || !profile) return

    setUploading(true)
    try {
      const uri = result.assets[0].uri
      const ext = uri.split('.').pop() ?? 'jpg'
      const fileName = `${profile.id}/avatar.${ext}`
      const resp = await fetch(uri)
      const blob = await resp.blob()
      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob, { upsert: true, contentType: `image/${ext}` })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', profile.id)
      setProfile(p => p ? { ...p, avatar_url: publicUrl } : p)
    } catch (e: any) {
      Alert.alert('Upload failed', e.message)
    } finally {
      setUploading(false)
    }
  }

  const openEdit = () => {
    if (!profile) return
    setEditFirstName(profile.first_name ?? '')
    setEditLastName(profile.last_name ?? '')
    setEditBio(profile.bio ?? '')
    setEditCity(profile.city ?? '')
    setEditVisible(true)
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    const updates = {
      first_name: editFirstName.trim(),
      last_name: editLastName.trim(),
      bio: editBio.trim(),
      city: editCity.trim(),
    }
    const { error } = await supabase.from('users').update(updates).eq('id', profile.id)
    if (error) {
      Alert.alert('Error', error.message)
    } else {
      setProfile(p => p ? { ...p, ...updates } : p)
      setEditVisible(false)
    }
    setSaving(false)
  }

  const handleLogOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          router.replace('/welcome')
        },
      },
    ])
  }

  const handleAddWishlist = async (dest: Dest) => {
    if (!profile || wishlist.includes(dest.name)) return
    const newList = [...wishlist, dest.name]
    setWishlist(newList)
    setWishlistVisible(false)
    setWishQuery('')
    await supabase.from('users').update({ wishlist: newList }).eq('id', profile.id)
  }

  const handleRemoveWishlist = async (name: string) => {
    if (!profile) return
    const newList = wishlist.filter(d => d !== name)
    setWishlist(newList)
    await supabase.from('users').update({ wishlist: newList }).eq('id', profile.id)
  }

  const handleSettingsRow = (route: string) => {
    router.push(route as any)
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" color="#1A6FFF" />
      </View>
    )
  }

  if (!profile) return null

  const coverHeight = COVER_BASE + insets.top
  const personalityKey = Array.isArray(profile.personality_tags)
    ? profile.personality_tags[0]
    : (profile.personality_tags as string | null)
  const personality = personalityKey ? PERSONALITY[personalityKey] : null
  const isVerified = profile.verification_level === 'ID_verified'
  const location = [profile.city, profile.country].filter(Boolean).join(', ')
  const initials = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`

  const tierKey = profile.subscription_tier ?? 'free'
  const tier = TIER_INFO[tierKey] ?? TIER_INFO.free
  const isPaid = tierKey !== 'free'
  const isDanish = ['denmark', 'dk', 'danmark'].includes((profile.country ?? '').toLowerCase())

  const wishFiltered = wishQuery.length > 0
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(wishQuery.toLowerCase()) ||
        d.country.toLowerCase().includes(wishQuery.toLowerCase())
      ).filter(d => !wishlist.includes(d.name)).slice(0, 7)
    : DESTINATIONS.filter(d => !wishlist.includes(d.name)).slice(0, 7)

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Cover + Avatar ── */}
        <View style={[styles.coverContainer, { height: coverHeight }]}>
          <LinearGradient
            colors={['#1A6FFF', '#00B89C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.avatarWrapper, { bottom: -AVATAR_RADIUS }]}>
            <View style={styles.avatarRing}>
              {profile.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
              ) : (
                <LinearGradient colors={['#1e3a5f', '#0A1628']} style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{initials.toUpperCase()}</Text>
                </LinearGradient>
              )}
            </View>
            <TouchableOpacity style={styles.cameraBtn} onPress={handlePickPhoto} disabled={uploading}>
              {uploading
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.cameraIcon}>📷</Text>
              }
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Content ── */}
        <View style={[styles.content, { paddingTop: AVATAR_RADIUS + 16 }]}>

          {/* Name + badges */}
          <View style={styles.nameRow}>
            <Text style={styles.name}>{profile.first_name} {profile.last_name}</Text>
            {isVerified && <Text style={styles.verifiedBadge}>✅</Text>}
          </View>
          {!!location && <Text style={styles.location}>📍 {location}</Text>}
          {personality && (
            <View style={[styles.personalityBadge, { backgroundColor: personality.bg, borderColor: personality.color + '55' }]}>
              <Text style={[styles.personalityText, { color: personality.color }]}>{personality.label}</Text>
            </View>
          )}

          {/* Stats */}
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tripCount}</Text>
              <Text style={styles.statLabel}>Trips Taken</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{profile.match_score != null ? `${profile.match_score}%` : '--'}</Text>
              <Text style={styles.statLabel}>Match Score</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{rating != null ? `${rating}` : '--'}</Text>
              <Text style={styles.statLabel}>Rating ⭐</Text>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>About</Text>
              <TouchableOpacity style={styles.editBtn} onPress={openEdit}>
                <Text style={styles.editBtnText}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.bio}>
              {profile.bio || 'No bio yet. Tap Edit to add one.'}
            </Text>
          </View>

          {/* ── 1. Travel Style ── */}
          {profile.personality_tags && profile.personality_tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🧭 Travel Style</Text>
              <View style={styles.chipsRow}>
                {profile.personality_tags.map((tag, i) => {
                  const p = PERSONALITY[tag]
                  return (
                    <View
                      key={i}
                      style={[
                        styles.styleChip,
                        p ? { backgroundColor: p.bg, borderColor: p.color + '55' } : styles.styleChipDefault,
                      ]}
                    >
                      <Text style={[styles.styleChipText, p ? { color: p.color } : { color: '#9ca3af' }]}>
                        {p ? p.label : tag}
                      </Text>
                    </View>
                  )
                })}
              </View>
            </View>
          )}

          {/* ── 2. Verification Center ── */}
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.verifyHeader}>
                <Text style={styles.cardTitle}>Verification Center 🛡️</Text>
                {isDanish && (
                  <View style={styles.mitidBadge}>
                    <Text style={styles.mitidText}>MitID</Text>
                  </View>
                )}
              </View>
              {isVerified ? (
                <View style={styles.verifiedRow}>
                  <View style={styles.verifiedDot} />
                  <Text style={styles.verifiedLabel}>✅ Identity Verified</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.verifySubtitle}>
                    Verified profiles get 3× more matches and build trust instantly.
                  </Text>
                  <TouchableOpacity
                    style={styles.verifyBtn}
                    onPress={() => router.push('/verification')}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['#1A6FFF', '#0A4CC9']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={styles.verifyBtnGrad}
                    >
                      <Text style={styles.verifyBtnText}>Get Verified →</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>

          {/* ── 3. Who Liked You ── */}
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Who liked your trips? 💙</Text>
              <View style={styles.lockedAvatarRow}>
                {['#1A6FFF', '#00B89C', '#7c3aed'].map((bg, i) => (
                  <View
                    key={i}
                    style={[
                      styles.lockedAvatar,
                      { backgroundColor: bg, marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i, opacity: isPaid ? 1 : 0.5 },
                    ]}
                  >
                    <Text style={styles.lockedAvatarLetter}>{['A', 'B', 'C'][i]}</Text>
                  </View>
                ))}
                {!isPaid && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                  </View>
                )}
              </View>
              {!isPaid && (
                <TouchableOpacity
                  style={styles.unlockBtn}
                  onPress={() => showUpgradeModal('who_liked_you')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1A6FFF', '#00B89C']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.unlockBtnGrad}
                  >
                    <Text style={styles.unlockBtnText}>✨ Unlock with Explorer Plus</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── 4. Who Visited You ── */}
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Who visited your profile? 👀</Text>
              <View style={styles.lockedAvatarRow}>
                {['#ec4899', '#f59e0b', '#06b6d4'].map((bg, i) => (
                  <View
                    key={i}
                    style={[
                      styles.lockedAvatar,
                      { backgroundColor: bg, marginLeft: i > 0 ? -10 : 0, zIndex: 3 - i, opacity: isPaid ? 1 : 0.5 },
                    ]}
                  >
                    <Text style={styles.lockedAvatarLetter}>{['D', 'E', 'F'][i]}</Text>
                  </View>
                ))}
                {!isPaid && (
                  <View style={styles.lockOverlay}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                  </View>
                )}
              </View>
              {!isPaid && (
                <TouchableOpacity
                  style={styles.unlockBtn}
                  onPress={() => showUpgradeModal('who_visited_you')}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#1A6FFF', '#00B89C']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.unlockBtnGrad}
                  >
                    <Text style={styles.unlockBtnText}>✨ Unlock with Explorer Plus</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* ── 5. Subscription Banner ── */}
          <View style={styles.section}>
            <LinearGradient
              colors={tierKey === 'premium' ? ['#92400e', '#78350f'] : ['#0D2040', '#0D2040']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.subCard}
            >
              <View style={styles.subCardLeft}>
                <Text style={styles.subIcon}>{tier.icon}</Text>
                <View>
                  <Text style={styles.subPlanLabel}>Current Plan</Text>
                  <Text style={[styles.subPlanName, { color: tier.color }]}>{tier.badge}</Text>
                </View>
              </View>
              {tier.upgrade ? (
                <TouchableOpacity
                  style={[styles.subUpgradeBtn, { borderColor: tier.color + '60' }]}
                  onPress={() => router.push('/subscription')}
                >
                  <Text style={[styles.subUpgradeText, { color: tier.color }]}>
                    {tier.upgrade} →
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.subCrownWrap}>
                  <Text style={styles.subCrownText}>You're on top 👑</Text>
                </View>
              )}
            </LinearGradient>
          </View>

          {/* Travel Vibes */}
          {profile.travel_vibes && profile.travel_vibes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Travel Vibes</Text>
              <View style={styles.chipsRow}>
                {profile.travel_vibes.map(vibe => (
                  <View key={vibe} style={styles.vibeChip}>
                    <Text style={styles.vibeText}>{vibe}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── 6. Destination Wishlist ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🌍 Destination Wishlist</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => setWishlistVisible(true)}>
                <Text style={styles.addBtnText}>+ Add</Text>
              </TouchableOpacity>
            </View>
            {wishlist.length === 0 ? (
              <Text style={styles.emptyHint}>Add places you dream of visiting ✈️</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.wishScroll}
              >
                {wishlist.map(name => {
                  const dest = DESTINATIONS.find(d => d.name === name)
                  return (
                    <View key={name} style={styles.wishChip}>
                      <Text style={styles.wishChipFlag}>{dest?.flag ?? '🌍'}</Text>
                      <Text style={styles.wishChipName}>{name}</Text>
                      <TouchableOpacity
                        onPress={() => handleRemoveWishlist(name)}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 8 }}
                      >
                        <Text style={styles.wishChipX}>✕</Text>
                      </TouchableOpacity>
                    </View>
                  )
                })}
              </ScrollView>
            )}
          </View>

          {/* ── 7. Settings & Support ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ Settings & Support</Text>
            <View style={styles.card}>
              {SETTINGS_ROWS.map((row, i) => (
                <TouchableOpacity
                  key={row.label}
                  style={[styles.settingsItem, i < SETTINGS_ROWS.length - 1 && styles.settingsItemBorder]}
                  onPress={() => handleSettingsRow(row.route)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.settingsItemIcon}>{row.icon}</Text>
                  <View style={styles.settingsItemContent}>
                    <Text style={styles.settingsItemLabel}>{row.label}</Text>
                    {row.sub && <Text style={styles.settingsItemSub}>{row.sub}</Text>}
                  </View>
                  <Text style={styles.settingsChevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Language Selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌐 Language / Sprog</Text>
            <View style={styles.card}>
              <View style={styles.languageRow}>
                <TouchableOpacity
                  style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                  onPress={() => setLanguage('en')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.langFlag}>🇬🇧</Text>
                  <Text style={[styles.langLabel, language === 'en' && styles.langLabelActive]}>English</Text>
                  {language === 'en' && <Text style={styles.langCheck}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.langBtn, language === 'da' && styles.langBtnActive]}
                  onPress={() => setLanguage('da')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.langFlag}>🇩🇰</Text>
                  <Text style={[styles.langLabel, language === 'da' && styles.langLabelActive]}>Dansk</Text>
                  {language === 'da' && <Text style={styles.langCheck}>✓</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Log Out */}
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogOut} activeOpacity={0.8}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Edit Modal ── */}
      <Modal visible={editVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <View style={styles.nameFields}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.fieldLabel}>First Name</Text>
                <TextInput style={styles.input} value={editFirstName} onChangeText={setEditFirstName} placeholder="First name" placeholderTextColor="#4b5563" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Last Name</Text>
                <TextInput style={styles.input} value={editLastName} onChangeText={setEditLastName} placeholder="Last name" placeholderTextColor="#4b5563" />
              </View>
            </View>
            <Text style={styles.fieldLabel}>City</Text>
            <TextInput style={styles.input} value={editCity} onChangeText={setEditCity} placeholder="Your city" placeholderTextColor="#4b5563" />
            <Text style={styles.fieldLabel}>Bio</Text>
            <TextInput
              style={[styles.input, styles.bioInput]}
              value={editBio}
              onChangeText={setEditBio}
              placeholder="Tell travelers about yourself..."
              placeholderTextColor="#4b5563"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditVisible(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Wishlist Modal ── */}
      <Modal visible={wishlistVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.modalSheet, { maxHeight: '80%' }]}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Add to Wishlist</Text>
            <View style={styles.wishSearchBar}>
              <Text style={styles.wishSearchIcon}>🔍</Text>
              <TextInput
                style={styles.wishSearchInput}
                value={wishQuery}
                onChangeText={setWishQuery}
                placeholder="Search destinations..."
                placeholderTextColor="#4b5563"
                autoFocus
              />
              {wishQuery.length > 0 && (
                <TouchableOpacity onPress={() => setWishQuery('')}>
                  <Text style={styles.wishClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={wishFiltered}
              keyExtractor={d => d.name + d.country}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.wishRow}
                  onPress={() => handleAddWishlist(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.wishRowFlag}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.wishRowName}>{item.name}</Text>
                    <Text style={styles.wishRowCountry}>{item.country}</Text>
                  </View>
                  <Text style={styles.wishRowAdd}>+</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.wishSeparator} />}
              style={{ marginTop: 8 }}
            />
            <TouchableOpacity style={styles.cancelBtn} onPress={() => { setWishlistVisible(false); setWishQuery('') }}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  loadingWrap: { flex: 1, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center' },

  // Cover
  coverContainer: { width: '100%', overflow: 'visible' },
  avatarWrapper: { position: 'absolute', left: 20, width: AVATAR_SIZE },
  avatarRing: {
    width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_RADIUS,
    borderWidth: 3, borderColor: '#0A1628', overflow: 'hidden', backgroundColor: '#1e3a5f',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { color: '#fff', fontSize: 30, fontWeight: '800' },
  cameraBtn: {
    position: 'absolute', bottom: 2, right: -4, width: 28, height: 28,
    borderRadius: 14, backgroundColor: '#1A6FFF', borderWidth: 2, borderColor: '#0A1628',
    alignItems: 'center', justifyContent: 'center',
  },
  cameraIcon: { fontSize: 13 },

  // Content
  content: { paddingHorizontal: 20 },

  // Name
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  verifiedBadge: { fontSize: 18 },
  location: { color: '#9ca3af', fontSize: 13, marginBottom: 10 },
  personalityBadge: {
    alignSelf: 'flex-start', borderRadius: 8, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: 20,
  },
  personalityText: { fontSize: 13, fontWeight: '600' },

  // Stats
  statsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 18, paddingHorizontal: 8, marginBottom: 24,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 2 },
  statLabel: { color: '#6b7280', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  statDivider: { width: 1, height: 36, backgroundColor: 'rgba(255,255,255,0.08)' },

  // Generic section / card
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16,
  },
  cardTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 12 },

  // Chips row (reused for travel style + vibes)
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  styleChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  styleChipDefault: { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' },
  styleChipText: { fontSize: 13, fontWeight: '600' },
  vibeChip: {
    backgroundColor: 'rgba(0,184,156,0.12)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(0,184,156,0.3)', paddingHorizontal: 12, paddingVertical: 6,
  },
  vibeText: { color: '#00B89C', fontSize: 13, fontWeight: '600' },

  // Verification
  verifyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  mitidBadge: {
    backgroundColor: '#003b8e', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#0050b3',
  },
  mitidText: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  verifiedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  verifiedLabel: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  verifySubtitle: { color: '#9ca3af', fontSize: 13, lineHeight: 19, marginBottom: 14 },
  verifyBtn: { borderRadius: 12, overflow: 'hidden' },
  verifyBtnGrad: { paddingVertical: 13, alignItems: 'center' },
  verifyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Locked avatar row
  lockedAvatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14, position: 'relative' },
  lockedAvatar: {
    width: 48, height: 48, borderRadius: 24,
    borderWidth: 2, borderColor: '#0A1628',
    alignItems: 'center', justifyContent: 'center',
  },
  lockedAvatarLetter: { color: '#fff', fontSize: 18, fontWeight: '800' },
  lockOverlay: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 100,
  },
  lockEmoji: { fontSize: 22 },
  unlockBtn: { borderRadius: 12, overflow: 'hidden' },
  unlockBtnGrad: { paddingVertical: 12, alignItems: 'center' },
  unlockBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Subscription banner
  subCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  subCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  subIcon: { fontSize: 28 },
  subPlanLabel: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
  subPlanName: { fontSize: 16, fontWeight: '800' },
  subUpgradeBtn: {
    borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 8, maxWidth: 160,
  },
  subUpgradeText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
  subCrownWrap: { flex: 1, alignItems: 'flex-end' },
  subCrownText: { color: '#f59e0b', fontSize: 13, fontWeight: '700' },

  // Wishlist
  addBtn: {
    backgroundColor: 'rgba(26,111,255,0.12)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.25)',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { color: '#1A6FFF', fontSize: 13, fontWeight: '600' },
  emptyHint: { color: '#4b5563', fontSize: 13, fontStyle: 'italic' },
  wishScroll: { gap: 8, paddingRight: 4 },
  wishChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(26,111,255,0.12)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.25)',
    paddingHorizontal: 12, paddingVertical: 8,
  },
  wishChipFlag: { fontSize: 16 },
  wishChipName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  wishChipX: { color: '#4b5563', fontSize: 12, fontWeight: '700' },

  // About
  editBtn: {
    backgroundColor: 'rgba(26,111,255,0.12)', borderRadius: 8,
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.25)',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  editBtnText: { color: '#1A6FFF', fontSize: 13, fontWeight: '600' },
  bio: { color: '#d1d5db', fontSize: 14, lineHeight: 22 },

  // Settings rows
  settingsItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12,
  },
  settingsItemBorder: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  settingsItemIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  settingsItemContent: { flex: 1 },
  settingsItemLabel: { color: '#fff', fontSize: 15, fontWeight: '500' },
  settingsItemSub: { color: '#6b7280', fontSize: 12, marginTop: 1 },
  settingsChevron: { color: '#4b5563', fontSize: 20 },

  // Logout
  // Language selector
  languageRow: { flexDirection: 'row', gap: 10, padding: 4 },
  langBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 12, paddingHorizontal: 14,
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  langBtnActive: {
    borderColor: '#1A6FFF',
    backgroundColor: 'rgba(26,111,255,0.12)',
  },
  langFlag: { fontSize: 20 },
  langLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  langLabelActive: { color: '#1A6FFF' },
  langCheck: { color: '#1A6FFF', fontSize: 14, fontWeight: '700' },

  logoutBtn: {
    backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.2)',
    padding: 16, alignItems: 'center', marginTop: 4,
  },
  logoutText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },

  // Edit Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalSheet: {
    backgroundColor: '#0D1F3C', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 20,
  },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  nameFields: { flexDirection: 'row', marginBottom: 0 },
  fieldLabel: {
    color: '#9ca3af', fontSize: 11, fontWeight: '700', letterSpacing: 0.8,
    marginTop: 14, marginBottom: 6, textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#0A1628', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 15,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 13 : 10,
  },
  bioInput: { height: 100, paddingTop: 12 },
  saveBtn: { backgroundColor: '#1A6FFF', borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  cancelBtn: { padding: 14, alignItems: 'center', marginTop: 2 },
  cancelBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },

  // Wishlist modal
  wishSearchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0A1628', borderRadius: 12, borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)', paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 9, gap: 10, marginTop: 12,
  },
  wishSearchIcon: { fontSize: 15 },
  wishSearchInput: { flex: 1, color: '#fff', fontSize: 15, padding: 0 },
  wishClear: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
  wishRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 4, gap: 12,
  },
  wishRowFlag: { fontSize: 22 },
  wishRowName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  wishRowCountry: { color: '#6b7280', fontSize: 12 },
  wishRowAdd: { color: '#1A6FFF', fontSize: 22, fontWeight: '700' },
  wishSeparator: { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },
})
