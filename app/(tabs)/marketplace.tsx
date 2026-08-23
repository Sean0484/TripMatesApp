import { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Linking, Platform, Modal, FlatList, Keyboard,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'

// ── Data ──────────────────────────────────────────────────────────────────────

const DESTINATIONS = [
  { name: 'Paris', country: 'France', flag: '🇫🇷' },
  { name: 'London', country: 'United Kingdom', flag: '🇬🇧' },
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵' },
  { name: 'New York', country: 'USA', flag: '🇺🇸' },
  { name: 'Rome', country: 'Italy', flag: '🇮🇹' },
  { name: 'Barcelona', country: 'Spain', flag: '🇪🇸' },
  { name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱' },
  { name: 'Dubai', country: 'UAE', flag: '🇦🇪' },
  { name: 'Sydney', country: 'Australia', flag: '🇦🇺' },
  { name: 'Bangkok', country: 'Thailand', flag: '🇹🇭' },
  { name: 'Singapore', country: 'Singapore', flag: '🇸🇬' },
  { name: 'Bali', country: 'Indonesia', flag: '🇮🇩' },
  { name: 'Cancún', country: 'Mexico', flag: '🇲🇽' },
  { name: 'Santorini', country: 'Greece', flag: '🇬🇷' },
  { name: 'Istanbul', country: 'Turkey', flag: '🇹🇷' },
  { name: 'Prague', country: 'Czech Republic', flag: '🇨🇿' },
  { name: 'Vienna', country: 'Austria', flag: '🇦🇹' },
  { name: 'Lisbon', country: 'Portugal', flag: '🇵🇹' },
  { name: 'Berlin', country: 'Germany', flag: '🇩🇪' },
  { name: 'Budapest', country: 'Hungary', flag: '🇭🇺' },
  { name: 'Cape Town', country: 'South Africa', flag: '🇿🇦' },
  { name: 'Marrakech', country: 'Morocco', flag: '🇲🇦' },
  { name: 'Dubrovnik', country: 'Croatia', flag: '🇭🇷' },
  { name: 'Kyoto', country: 'Japan', flag: '🇯🇵' },
  { name: 'Osaka', country: 'Japan', flag: '🇯🇵' },
  { name: 'Seoul', country: 'South Korea', flag: '🇰🇷' },
  { name: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰' },
  { name: 'Mumbai', country: 'India', flag: '🇮🇳' },
  { name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷' },
  { name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷' },
  { name: 'Medellín', country: 'Colombia', flag: '🇨🇴' },
  { name: 'Mexico City', country: 'Mexico', flag: '🇲🇽' },
  { name: 'Toronto', country: 'Canada', flag: '🇨🇦' },
  { name: 'Vancouver', country: 'Canada', flag: '🇨🇦' },
  { name: 'Miami', country: 'USA', flag: '🇺🇸' },
  { name: 'Los Angeles', country: 'USA', flag: '🇺🇸' },
  { name: 'Maldives', country: 'Maldives', flag: '🇲🇻' },
  { name: 'Phuket', country: 'Thailand', flag: '🇹🇭' },
  { name: 'Mykonos', country: 'Greece', flag: '🇬🇷' },
  { name: 'Ibiza', country: 'Spain', flag: '🇪🇸' },
  { name: 'Reykjavik', country: 'Iceland', flag: '🇮🇸' },
  { name: 'Stockholm', country: 'Sweden', flag: '🇸🇪' },
  { name: 'Copenhagen', country: 'Denmark', flag: '🇩🇰' },
  { name: 'Zurich', country: 'Switzerland', flag: '🇨🇭' },
  { name: 'Cairo', country: 'Egypt', flag: '🇪🇬' },
  { name: 'Nairobi', country: 'Kenya', flag: '🇰🇪' },
  { name: 'Havana', country: 'Cuba', flag: '🇨🇺' },
  { name: 'Kathmandu', country: 'Nepal', flag: '🇳🇵' },
  { name: 'Chiang Mai', country: 'Thailand', flag: '🇹🇭' },
  { name: 'Lisbon', country: 'Portugal', flag: '🇵🇹' },
]

const CATEGORIES = [
  { id: 'flights',    label: 'Flights',    icon: '✈️' },
  { id: 'hotels',     label: 'Hotels',     icon: '🏨' },
  { id: 'hostels',    label: 'Hostels',    icon: '🛏️' },
  { id: 'car',        label: 'Car Rental', icon: '🚗' },
  { id: 'transport',  label: 'Transport',  icon: '🚌' },
  { id: 'activities', label: 'Activities', icon: '🎟️' },
  { id: 'food',       label: 'Food',       icon: '🍜' },
  { id: 'adventure',  label: 'Adventure',  icon: '🏔️' },
  { id: 'insurance',  label: 'Insurance',  icon: '🛡️' },
  { id: 'gear',       label: 'Gear',       icon: '🎒' },
]

const ARIA_CHIPS = ['Flights under €300', 'Hostels in Lisbon', 'Things to do in Bali', 'Travel insurance deals']

const POPULAR = [
  { id: '1', title: 'Bangkok Street Food Tour',  emoji: '🇹🇭', rating: 4.9, price: '€29', grad: ['#f59e0b', '#ef4444'] as [string,string] },
  { id: '2', title: 'Lisbon Surf Lessons',        emoji: '🇵🇹', rating: 4.8, price: '€45', grad: ['#1A6FFF', '#7c3aed'] as [string,string] },
  { id: '3', title: 'Tokyo Hidden Gems',          emoji: '🇯🇵', rating: 4.9, price: '€65', grad: ['#ec4899', '#7c3aed'] as [string,string] },
  { id: '4', title: 'Bali Yoga Retreat',          emoji: '🇮🇩', rating: 4.7, price: '€39', grad: ['#00B89C', '#1A6FFF'] as [string,string] },
  { id: '5', title: 'Barcelona Night Tour',       emoji: '🇪🇸', rating: 4.8, price: '€35', grad: ['#7c3aed', '#ec4899'] as [string,string] },
  { id: '6', title: 'Amsterdam Canal Cruise',     emoji: '🇳🇱', rating: 4.6, price: '€25', grad: ['#06b6d4', '#1A6FFF'] as [string,string] },
]

const HOTELS = [
  { id: 'h1', name: 'The Social Hub Amsterdam', location: 'Amsterdam', rating: 4.7, price: '€89', amenities: ['🛜 WiFi', '🏊 Pool', '🍳 Breakfast'], url: 'https://www.booking.com' },
  { id: 'h2', name: 'Generator Hostel Lisbon',  location: 'Lisbon',    rating: 4.5, price: '€28', amenities: ['🛜 WiFi', '🍺 Bar', '🗓️ Events'],   url: 'https://www.hostelworld.com' },
  { id: 'h3', name: 'Kimpton Tokyo',            location: 'Tokyo',     rating: 4.8, price: '€145', amenities: ['🛜 WiFi', '🧖 Spa', '🍱 Dining'], url: 'https://www.booking.com' },
]

const PARTNERS = [
  { name: 'Skyscanner',    icon: '✈️', color: '#00A680', url: 'https://www.skyscanner.net',       desc: 'Flights' },
  { name: 'Booking.com',  icon: '🏨', color: '#003580', url: 'https://www.booking.com',          desc: 'Hotels' },
  { name: 'Hostelworld',  icon: '🛏️', color: '#F26B1D', url: 'https://www.hostelworld.com',      desc: 'Hostels' },
  { name: 'GetYourGuide', icon: '🎟️', color: '#FF5533', url: 'https://www.getyourguide.com',     desc: 'Activities' },
  { name: 'World Nomads', icon: '🛡️', color: '#0070C0', url: 'https://www.worldnomads.com',      desc: 'Insurance' },
  { name: 'Airalo',       icon: '📱', color: '#00C6BE', url: 'https://www.airalo.com',            desc: 'eSIM' },
]

const fmt = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// ── Component ─────────────────────────────────────────────────────────────────

export default function MarketplaceScreen() {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { language } = useLanguage()

  // Global search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)

  // Category
  const [activeCategory, setActiveCategory] = useState('flights')

  // Wishlist
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())

  // Flight search
  const [flightFrom, setFlightFrom] = useState('')
  const [flightTo, setFlightTo] = useState('')
  const [flightFromFocused, setFlightFromFocused] = useState(false)
  const [flightToFocused, setFlightToFocused] = useState(false)
  const [departDate, setDepartDate] = useState(new Date(Date.now() + 7 * 86400000))
  const [returnDate, setReturnDate] = useState(new Date(Date.now() + 14 * 86400000))
  const [passengers, setPassengers] = useState(1)
  const [showDepartPicker, setShowDepartPicker] = useState(false)
  const [showReturnPicker, setShowReturnPicker] = useState(false)

  const toggleWishlist = useCallback((id: string) => {
    setWishlist(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const searchFiltered = searchQuery.length > 1
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.country.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : []

  const flightFromFiltered = flightFrom.length > 0
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(flightFrom.toLowerCase()) ||
        d.country.toLowerCase().includes(flightFrom.toLowerCase())
      ).slice(0, 5)
    : []

  const flightToFiltered = flightTo.length > 0
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(flightTo.toLowerCase()) ||
        d.country.toLowerCase().includes(flightTo.toLowerCase())
      ).slice(0, 5)
    : []

  const searchSkyscanner = () => {
    Linking.openURL('https://www.skyscanner.net')
  }

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 32 }}
        onScrollBeginDrag={() => Keyboard.dismiss()}
      >
        {/* ── Header ── */}
        <LinearGradient
          colors={['#1A6FFF', '#00B89C']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.header, { paddingTop: insets.top + 16 }]}
        >
          <Text style={styles.headerTitle}>{t('marketplace', language)}</Text>
          <Text style={styles.headerSub}>Flights, hotels, experiences & more</Text>

          {/* Search bar */}
          <View style={styles.searchWrap}>
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search flights, hotels, experiences..."
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
                returnKeyType="search"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={styles.searchClear}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            {searchFocused && searchFiltered.length > 0 && (
              <View style={styles.searchDropdown}>
                {searchFiltered.map((d, i) => (
                  <TouchableOpacity
                    key={d.name + d.country + i}
                    style={[styles.searchDropItem, i < searchFiltered.length - 1 && styles.dropDivider]}
                    onPress={() => { setSearchQuery(`${d.flag} ${d.name}`); setSearchFocused(false); Keyboard.dismiss() }}
                  >
                    <Text style={styles.dropFlag}>{d.flag}</Text>
                    <View>
                      <Text style={styles.dropName}>{d.name}</Text>
                      <Text style={styles.dropCountry}>{d.country}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </LinearGradient>

        {/* ── Category Pills ── */}
        <View style={styles.catSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catPill, activeCategory === cat.id && styles.catPillActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.75}
              >
                <Text style={styles.catIcon}>{cat.icon}</Text>
                <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── ARIA Quick Ask ── */}
        <TouchableOpacity
          style={styles.ariaCard}
          activeOpacity={0.88}
          onPress={() => router.push('/aria')}
        >
          <LinearGradient
            colors={['#4c1d95', '#7c3aed']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.ariaGrad}
          >
            <View style={styles.ariaTop}>
              <Text style={styles.ariaIcon}>✦</Text>
              <View>
                <Text style={styles.ariaTitle}>Ask ARIA anything</Text>
                <Text style={styles.ariaSub}>Your AI travel assistant</Text>
              </View>
              <Text style={styles.ariaChevron}>›</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ariaChips}>
              {ARIA_CHIPS.map(chip => (
                <TouchableOpacity
                  key={chip}
                  style={styles.ariaChip}
                  onPress={() => router.push('/aria')}
                >
                  <Text style={styles.ariaChipText}>"{chip}"</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Popular with Tripmates ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular with Tripmates 🔥</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularScroll}>
            {POPULAR.map(item => (
              <View key={item.id} style={styles.popularCard}>
                <LinearGradient colors={item.grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.popularGrad}>
                  <View style={styles.popularTop}>
                    <Text style={styles.popularEmoji}>{item.emoji}</Text>
                    <TouchableOpacity
                      style={styles.heartBtn}
                      onPress={() => toggleWishlist(item.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.heartIcon}>{wishlist.has(item.id) ? '❤️' : '🤍'}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.popularBottom}>
                    <Text style={styles.popularTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.popularMeta}>
                      <Text style={styles.popularRating}>⭐ {item.rating}</Text>
                      <Text style={styles.popularPrice}>{item.price}</Text>
                    </View>
                    <TouchableOpacity style={styles.popularBtn} onPress={() => Linking.openURL('https://www.getyourguide.com')}>
                      <Text style={styles.popularBtnText}>Book now →</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── Flights Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>✈️ Search Flights</Text>
          <View style={styles.card}>
            {/* From */}
            <View style={styles.flightFieldWrap}>
              <Text style={styles.flightFieldLabel}>FROM</Text>
              <TextInput
                style={styles.flightInput}
                placeholder="City or airport..."
                placeholderTextColor="#4b5563"
                value={flightFrom}
                onChangeText={setFlightFrom}
                onFocus={() => { setFlightFromFocused(true); setFlightToFocused(false) }}
                onBlur={() => setTimeout(() => setFlightFromFocused(false), 150)}
              />
              {flightFromFocused && flightFromFiltered.length > 0 && (
                <View style={styles.flightDropdown}>
                  {flightFromFiltered.map((d, i) => (
                    <TouchableOpacity
                      key={d.name + i}
                      style={[styles.flightDropItem, i < flightFromFiltered.length - 1 && styles.dropDivider]}
                      onPress={() => { setFlightFrom(`${d.flag} ${d.name}`); setFlightFromFocused(false) }}
                    >
                      <Text style={styles.dropFlag}>{d.flag}</Text>
                      <Text style={styles.dropName}>{d.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.swapRow}>
              <View style={styles.fieldDividerLine} />
              <View style={styles.swapBtn}>
                <Text style={styles.swapIcon}>⇅</Text>
              </View>
              <View style={styles.fieldDividerLine} />
            </View>

            {/* To */}
            <View style={styles.flightFieldWrap}>
              <Text style={styles.flightFieldLabel}>TO</Text>
              <TextInput
                style={styles.flightInput}
                placeholder="City or airport..."
                placeholderTextColor="#4b5563"
                value={flightTo}
                onChangeText={setFlightTo}
                onFocus={() => { setFlightToFocused(true); setFlightFromFocused(false) }}
                onBlur={() => setTimeout(() => setFlightToFocused(false), 150)}
              />
              {flightToFocused && flightToFiltered.length > 0 && (
                <View style={styles.flightDropdown}>
                  {flightToFiltered.map((d, i) => (
                    <TouchableOpacity
                      key={d.name + i}
                      style={[styles.flightDropItem, i < flightToFiltered.length - 1 && styles.dropDivider]}
                      onPress={() => { setFlightTo(`${d.flag} ${d.name}`); setFlightToFocused(false) }}
                    >
                      <Text style={styles.dropFlag}>{d.flag}</Text>
                      <Text style={styles.dropName}>{d.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Dates row */}
            <View style={styles.datesRow}>
              <TouchableOpacity
                style={styles.dateField}
                onPress={() => { setShowDepartPicker(true); setShowReturnPicker(false) }}
              >
                <Text style={styles.dateFieldLabel}>DEPART</Text>
                <Text style={styles.dateFieldValue}>{fmt(departDate)}</Text>
              </TouchableOpacity>
              <View style={styles.dateSep} />
              <TouchableOpacity
                style={styles.dateField}
                onPress={() => { setShowReturnPicker(true); setShowDepartPicker(false) }}
              >
                <Text style={styles.dateFieldLabel}>RETURN</Text>
                <Text style={styles.dateFieldValue}>{fmt(returnDate)}</Text>
              </TouchableOpacity>
            </View>

            {showDepartPicker && (
              <DateTimePicker
                value={departDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={new Date()}
                onChange={(_, d) => { setShowDepartPicker(Platform.OS === 'ios'); if (d) setDepartDate(d) }}
                themeVariant="dark"
              />
            )}
            {showReturnPicker && (
              <DateTimePicker
                value={returnDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                minimumDate={departDate}
                onChange={(_, d) => { setShowReturnPicker(Platform.OS === 'ios'); if (d) setReturnDate(d) }}
                themeVariant="dark"
              />
            )}

            {/* Passengers */}
            <View style={styles.passengerRow}>
              <Text style={styles.passengerLabel}>👤 Passengers</Text>
              <View style={styles.passengerStepper}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setPassengers(p => Math.max(1, p - 1))}
                >
                  <Text style={styles.stepBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.passengerCount}>{passengers}</Text>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => setPassengers(p => Math.min(9, p + 1))}
                >
                  <Text style={styles.stepBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.searchFlightsBtn} onPress={searchSkyscanner} activeOpacity={0.85}>
              <LinearGradient
                colors={['#1A6FFF', '#0A4CC9']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.searchFlightsBtnGrad}
              >
                <Text style={styles.searchFlightsBtnText}>Search on Skyscanner ✈️</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hotels Section ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏨 Hotels & Hostels</Text>
          {HOTELS.map(hotel => (
            <View key={hotel.id} style={[styles.card, styles.hotelCard]}>
              <View style={styles.hotelTop}>
                <View style={styles.hotelInfo}>
                  <Text style={styles.hotelName}>{hotel.name}</Text>
                  <Text style={styles.hotelLocation}>📍 {hotel.location}</Text>
                  <View style={styles.hotelAmenities}>
                    {hotel.amenities.map(a => (
                      <View key={a} style={styles.amenityChip}>
                        <Text style={styles.amenityText}>{a}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <View style={styles.hotelPriceCol}>
                  <Text style={styles.hotelRating}>⭐ {hotel.rating}</Text>
                  <Text style={styles.hotelPrice}>{hotel.price}</Text>
                  <Text style={styles.hotelPriceNight}>per night</Text>
                  <TouchableOpacity
                    style={[styles.heartBtn, { marginTop: 6 }]}
                    onPress={() => toggleWishlist(hotel.id)}
                  >
                    <Text style={styles.heartIcon}>{wishlist.has(hotel.id) ? '❤️' : '🤍'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                style={styles.hotelBookBtn}
                onPress={() => Linking.openURL(hotel.url)}
                activeOpacity={0.85}
              >
                <Text style={styles.hotelBookBtnText}>Book on {hotel.url.includes('hostelworld') ? 'Hostelworld' : 'Booking.com'} →</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* ── Partner Deals ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤝 Partner Deals</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnersScroll}>
            {PARTNERS.map(p => (
              <TouchableOpacity
                key={p.name}
                style={styles.partnerCard}
                onPress={() => Linking.openURL(p.url)}
                activeOpacity={0.8}
              >
                <View style={[styles.partnerIconWrap, { backgroundColor: p.color + '20', borderColor: p.color + '40' }]}>
                  <Text style={styles.partnerIcon}>{p.icon}</Text>
                </View>
                <Text style={styles.partnerName}>{p.name}</Text>
                <Text style={styles.partnerDesc}>{p.desc}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
  headerSub: { color: 'rgba(255,255,255,0.75)', fontSize: 14, marginBottom: 16 },

  // Search
  searchWrap: { position: 'relative', zIndex: 10 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', gap: 10,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, padding: 0 },
  searchClear: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600' },
  searchDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
    backgroundColor: '#0D2040', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden', zIndex: 100,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 16 }, android: { elevation: 8 } }),
  },
  searchDropItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, gap: 12 },
  dropDivider: { borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)' },
  dropFlag: { fontSize: 20 },
  dropName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dropCountry: { color: '#6b7280', fontSize: 12 },

  // Categories
  catSection: { paddingVertical: 14 },
  catScroll: { paddingHorizontal: 16, gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14, paddingVertical: 8,
  },
  catPillActive: { backgroundColor: 'rgba(26,111,255,0.2)', borderColor: '#1A6FFF' },
  catIcon: { fontSize: 16 },
  catLabel: { color: '#9ca3af', fontSize: 13, fontWeight: '600' },
  catLabelActive: { color: '#1A6FFF' },

  // ARIA
  ariaCard: { marginHorizontal: 16, marginBottom: 20, borderRadius: 16, overflow: 'hidden' },
  ariaGrad: { padding: 16 },
  ariaTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  ariaIcon: { color: '#c4b5fd', fontSize: 20 },
  ariaTitle: { color: '#fff', fontSize: 15, fontWeight: '800' },
  ariaSub: { color: 'rgba(255,255,255,0.6)', fontSize: 12 },
  ariaChevron: { color: 'rgba(255,255,255,0.5)', fontSize: 22, marginLeft: 'auto' as any },
  ariaChips: { gap: 8, paddingRight: 4 },
  ariaChip: {
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12, paddingVertical: 6,
  },
  ariaChipText: { color: '#e9d5ff', fontSize: 12, fontWeight: '500' },

  // Section
  section: { marginBottom: 24, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 14 },

  // Popular
  popularScroll: { gap: 12, paddingRight: 4 },
  popularCard: { width: 180, borderRadius: 16, overflow: 'hidden' },
  popularGrad: { padding: 14, height: 220, justifyContent: 'space-between' },
  popularTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  popularEmoji: { fontSize: 36 },
  heartBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  heartIcon: { fontSize: 20 },
  popularBottom: { gap: 4 },
  popularTitle: { color: '#fff', fontSize: 14, fontWeight: '700', lineHeight: 19 },
  popularMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  popularRating: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  popularPrice: { color: '#fff', fontSize: 16, fontWeight: '800' },
  popularBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8,
    paddingVertical: 6, alignItems: 'center', marginTop: 4,
  },
  popularBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Card (shared)
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', padding: 16,
  },

  // Flights
  flightFieldWrap: { position: 'relative', zIndex: 10 },
  flightFieldLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  flightInput: {
    color: '#fff', fontSize: 16, fontWeight: '600',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  flightDropdown: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 200,
    backgroundColor: '#0D2040', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 6 } }),
  },
  flightDropItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  swapRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 10, gap: 10 },
  fieldDividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  swapBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(26,111,255,0.15)', borderWidth: 1, borderColor: 'rgba(26,111,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  swapIcon: { color: '#1A6FFF', fontSize: 16 },
  datesRow: {
    flexDirection: 'row', marginTop: 14,
    backgroundColor: '#0A1628', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden',
  },
  dateField: { flex: 1, padding: 12 },
  dateFieldLabel: { color: '#6b7280', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  dateFieldValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dateSep: { width: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: 10 },
  passengerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 14, paddingTop: 14,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
  },
  passengerLabel: { color: '#d1d5db', fontSize: 14, fontWeight: '600' },
  passengerStepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(26,111,255,0.15)', borderWidth: 1, borderColor: 'rgba(26,111,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  stepBtnText: { color: '#1A6FFF', fontSize: 18, fontWeight: '700' },
  passengerCount: { color: '#fff', fontSize: 18, fontWeight: '800', minWidth: 24, textAlign: 'center' },
  searchFlightsBtn: { borderRadius: 12, overflow: 'hidden', marginTop: 16 },
  searchFlightsBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  searchFlightsBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Hotels
  hotelCard: { marginBottom: 12 },
  hotelTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  hotelInfo: { flex: 1 },
  hotelName: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 3 },
  hotelLocation: { color: '#9ca3af', fontSize: 12, marginBottom: 8 },
  hotelAmenities: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenityChip: {
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  amenityText: { color: '#9ca3af', fontSize: 11 },
  hotelPriceCol: { alignItems: 'flex-end' },
  hotelRating: { color: '#f59e0b', fontSize: 12, fontWeight: '600' },
  hotelPrice: { color: '#fff', fontSize: 20, fontWeight: '800', marginTop: 2 },
  hotelPriceNight: { color: '#6b7280', fontSize: 11 },
  hotelBookBtn: {
    backgroundColor: 'rgba(26,111,255,0.12)', borderRadius: 10,
    borderWidth: 1, borderColor: 'rgba(26,111,255,0.25)',
    paddingVertical: 10, alignItems: 'center',
  },
  hotelBookBtnText: { color: '#1A6FFF', fontSize: 14, fontWeight: '700' },

  // Partners
  partnersScroll: { gap: 10, paddingRight: 4 },
  partnerCard: {
    width: 100, alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
  },
  partnerIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
  },
  partnerIcon: { fontSize: 22 },
  partnerName: { color: '#fff', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  partnerDesc: { color: '#6b7280', fontSize: 10, textAlign: 'center' },
})
