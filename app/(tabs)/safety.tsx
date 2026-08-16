import { useState, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, FlatList, Keyboard, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorBoundary } from '../components/ErrorBoundary'

type Destination = {
  name: string
  country: string
  flag: string
  type: 'city' | 'country' | 'island'
}

const DESTINATIONS: Destination[] = [
  { name: 'Paris', country: 'France', flag: '🇫🇷', type: 'city' },
  { name: 'London', country: 'United Kingdom', flag: '🇬🇧', type: 'city' },
  { name: 'Tokyo', country: 'Japan', flag: '🇯🇵', type: 'city' },
  { name: 'New York', country: 'USA', flag: '🇺🇸', type: 'city' },
  { name: 'Rome', country: 'Italy', flag: '🇮🇹', type: 'city' },
  { name: 'Barcelona', country: 'Spain', flag: '🇪🇸', type: 'city' },
  { name: 'Amsterdam', country: 'Netherlands', flag: '🇳🇱', type: 'city' },
  { name: 'Dubai', country: 'UAE', flag: '🇦🇪', type: 'city' },
  { name: 'Sydney', country: 'Australia', flag: '🇦🇺', type: 'city' },
  { name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', type: 'city' },
  { name: 'Singapore', country: 'Singapore', flag: '🇸🇬', type: 'city' },
  { name: 'Bali', country: 'Indonesia', flag: '🇮🇩', type: 'island' },
  { name: 'Cancún', country: 'Mexico', flag: '🇲🇽', type: 'city' },
  { name: 'Santorini', country: 'Greece', flag: '🇬🇷', type: 'island' },
  { name: 'Istanbul', country: 'Turkey', flag: '🇹🇷', type: 'city' },
  { name: 'Prague', country: 'Czech Republic', flag: '🇨🇿', type: 'city' },
  { name: 'Vienna', country: 'Austria', flag: '🇦🇹', type: 'city' },
  { name: 'Lisbon', country: 'Portugal', flag: '🇵🇹', type: 'city' },
  { name: 'Berlin', country: 'Germany', flag: '🇩🇪', type: 'city' },
  { name: 'Budapest', country: 'Hungary', flag: '🇭🇺', type: 'city' },
  { name: 'Cape Town', country: 'South Africa', flag: '🇿🇦', type: 'city' },
  { name: 'Marrakech', country: 'Morocco', flag: '🇲🇦', type: 'city' },
  { name: 'Dubrovnik', country: 'Croatia', flag: '🇭🇷', type: 'city' },
  { name: 'Kyoto', country: 'Japan', flag: '🇯🇵', type: 'city' },
  { name: 'Osaka', country: 'Japan', flag: '🇯🇵', type: 'city' },
  { name: 'Seoul', country: 'South Korea', flag: '🇰🇷', type: 'city' },
  { name: 'Hong Kong', country: 'Hong Kong', flag: '🇭🇰', type: 'city' },
  { name: 'Mumbai', country: 'India', flag: '🇮🇳', type: 'city' },
  { name: 'Delhi', country: 'India', flag: '🇮🇳', type: 'city' },
  { name: 'Rio de Janeiro', country: 'Brazil', flag: '🇧🇷', type: 'city' },
  { name: 'Buenos Aires', country: 'Argentina', flag: '🇦🇷', type: 'city' },
  { name: 'Medellín', country: 'Colombia', flag: '🇨🇴', type: 'city' },
  { name: 'Mexico City', country: 'Mexico', flag: '🇲🇽', type: 'city' },
  { name: 'Toronto', country: 'Canada', flag: '🇨🇦', type: 'city' },
  { name: 'Vancouver', country: 'Canada', flag: '🇨🇦', type: 'city' },
  { name: 'Miami', country: 'USA', flag: '🇺🇸', type: 'city' },
  { name: 'Los Angeles', country: 'USA', flag: '🇺🇸', type: 'city' },
  { name: 'Maldives', country: 'Maldives', flag: '🇲🇻', type: 'island' },
  { name: 'Phuket', country: 'Thailand', flag: '🇹🇭', type: 'island' },
  { name: 'Mykonos', country: 'Greece', flag: '🇬🇷', type: 'island' },
  { name: 'Ibiza', country: 'Spain', flag: '🇪🇸', type: 'island' },
  { name: 'Reykjavik', country: 'Iceland', flag: '🇮🇸', type: 'city' },
  { name: 'Stockholm', country: 'Sweden', flag: '🇸🇪', type: 'city' },
  { name: 'Copenhagen', country: 'Denmark', flag: '🇩🇰', type: 'city' },
  { name: 'Zurich', country: 'Switzerland', flag: '🇨🇭', type: 'city' },
  { name: 'Cairo', country: 'Egypt', flag: '🇪🇬', type: 'city' },
  { name: 'Nairobi', country: 'Kenya', flag: '🇰🇪', type: 'city' },
  { name: 'Havana', country: 'Cuba', flag: '🇨🇺', type: 'city' },
  { name: 'Kathmandu', country: 'Nepal', flag: '🇳🇵', type: 'city' },
  { name: 'Chiang Mai', country: 'Thailand', flag: '🇹🇭', type: 'city' },
]

type SafetyData = {
  safetyScore: number
  summary: string
  advisory: string
  emergencyNumbers: { police: string; ambulance: string; fire: string }
  safetyTips: string[]
  areasToAvoid: string[]
}

function getScoreColor(score: number) {
  if (score >= 8) return '#22c55e'
  if (score >= 5) return '#f59e0b'
  return '#ef4444'
}

function getAdvisoryStyle(advisory: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'Safe': { bg: 'rgba(34,197,94,0.15)', text: '#22c55e', border: 'rgba(34,197,94,0.35)' },
    'Exercise Caution': { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b', border: 'rgba(245,158,11,0.35)' },
    'High Risk': { bg: 'rgba(239,68,68,0.15)', text: '#ef4444', border: 'rgba(239,68,68,0.35)' },
    'Do Not Travel': { bg: 'rgba(185,28,28,0.25)', text: '#fca5a5', border: 'rgba(239,68,68,0.5)' },
  }
  return map[advisory] ?? map['Exercise Caution']
}

export default function SafetyScreen() {
  const [query, setQuery] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [selected, setSelected] = useState<Destination | null>(null)
  const [loading, setLoading] = useState(false)
  const [safety, setSafety] = useState<SafetyData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const inputRef = useRef<TextInput>(null)

  const filtered = query.length > 0
    ? DESTINATIONS.filter(d =>
        d.name.toLowerCase().includes(query.toLowerCase()) ||
        d.country.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 6)
    : []

  const handleSelect = useCallback(async (dest: Destination) => {
    Keyboard.dismiss()
    setQuery(`${dest.flag} ${dest.name}, ${dest.country}`)
    setShowDropdown(false)
    setSelected(dest)
    setSafety(null)
    setError(null)
    setLoading(true)

    try {
      console.log('=== SAFETY FETCH START ===')
      console.log('A: dest object:', JSON.stringify(dest))

      const body = JSON.stringify({
        systemPrompt: 'You are a travel safety expert. Respond with valid JSON only.',
        userMessage: `Give safety information for ${dest.name}, ${dest.country}`,
      })
      console.log('B: request body built:', body.substring(0, 100))

      const response = await fetch('https://tripmatess.com/api/safety', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body,
      })
      console.log('C: fetch returned, status:', response.status)

      const text = await response.text()
      console.log('D: response body length:', text.length)
      console.log('E: raw response:', text.substring(0, 300))

      console.log('F: parsing outer JSON')
      const json = JSON.parse(text)
      console.log('G: outer JSON keys:', Object.keys(json).join(', '))

      const content = json.content?.[0]?.text || json.reply || json.message || text
      console.log('H: extracted content:', String(content).substring(0, 200))

      console.log('I: running regex match for JSON object')
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      console.log('J: jsonMatch found:', !!jsonMatch)

      if (jsonMatch) {
        console.log('K: parsing inner JSON, length:', jsonMatch[0].length)
        const safetyData = JSON.parse(jsonMatch[0])
        console.log('L: safetyData keys:', Object.keys(safetyData).join(', '))
        console.log('M: calling setSafety')
        setSafety(safetyData)
        console.log('N: setSafety called successfully')
      } else {
        throw new Error('Could not parse safety data')
      }
      console.log('=== SAFETY FETCH END ===')
    } catch (err: any) {
      console.log('SAFETY FETCH ERROR:', err.message)
      console.log('SAFETY FETCH ERROR stack:', err.stack)
      setError('Could not load safety data. Please try again.')
      setSafety(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleClear = () => {
    setQuery('')
    setSelected(null)
    setSafety(null)
    setError(null)
    setShowDropdown(false)
    inputRef.current?.focus()
  }

  return (
    <ErrorBoundary>
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerEmoji}>🛡️</Text>
        <View>
          <Text style={styles.headerTitle}>Safety Hub</Text>
          <Text style={styles.headerSub}>AI-powered travel safety</Text>
        </View>
      </View>

      {/* Search area with dropdown overlay */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Search any destination..."
            placeholderTextColor="#4b5563"
            value={query}
            onChangeText={t => {
              setQuery(t)
              setShowDropdown(true)
              if (!t) {
                setSelected(null)
                setSafety(null)
                setError(null)
              }
            }}
            onFocus={() => setShowDropdown(true)}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Autocomplete dropdown */}
        {showDropdown && filtered.length > 0 && (
          <View style={styles.dropdown}>
            {filtered.map((dest, i) => (
              <TouchableOpacity
                key={`${dest.name}-${dest.country}`}
                style={[styles.dropdownItem, i < filtered.length - 1 && styles.dropdownDivider]}
                onPress={() => handleSelect(dest)}
                activeOpacity={0.7}
              >
                <Text style={styles.dropdownFlag}>{dest.flag}</Text>
                <View style={styles.dropdownText}>
                  <Text style={styles.dropdownName}>{dest.name}</Text>
                  <Text style={styles.dropdownCountry}>{dest.country}</Text>
                </View>
                <View style={styles.dropdownBadge}>
                  <Text style={styles.dropdownBadgeText}>{dest.type}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Content area */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPad}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setShowDropdown(false)}
        showsVerticalScrollIndicator={false}
      >
        {/* Loading */}
        {loading && (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color="#1A6FFF" />
            <Text style={styles.loadingText}>Analyzing safety for {selected?.name}...</Text>
          </View>
        )}

        {/* Error */}
        {!loading && error && (
          <View style={styles.errorCard}>
            <Text style={styles.errorEmoji}>⚠️</Text>
            <Text style={styles.errorTitle}>Couldn't load safety data</Text>
            <Text style={styles.errorMsg}>{error}</Text>
            {selected && (
              <TouchableOpacity style={styles.retryBtn} onPress={() => handleSelect(selected)}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Results */}
        {!loading && !error && safety && selected && (
          <View>
            {/* Destination tag */}
            <View style={styles.destTag}>
              <Text style={styles.destTagFlag}>{selected.flag}</Text>
              <Text style={styles.destTagName}>{selected.name}, {selected.country}</Text>
            </View>

            {/* Score + Advisory row */}
            <View style={styles.scoreAdvisoryRow}>
              {/* Safety Score */}
              <View style={[styles.card, styles.scoreCard]}>
                <Text style={styles.cardLabel}>SAFETY SCORE</Text>
                <View style={styles.scoreDisplay}>
                  <Text style={[styles.scoreNumber, { color: getScoreColor(safety?.safetyScore ?? 5) }]}>
                    {safety?.safetyScore ?? '—'}
                  </Text>
                  <Text style={styles.scoreDenom}>/10</Text>
                </View>
                <View style={styles.scoreTrack}>
                  <View
                    style={[
                      styles.scoreFill,
                      {
                        width: `${((safety?.safetyScore ?? 0) / 10) * 100}%` as any,
                        backgroundColor: getScoreColor(safety?.safetyScore ?? 5),
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Advisory */}
              <View style={[styles.card, styles.advisoryCard]}>
                <Text style={styles.cardLabel}>ADVISORY</Text>
                {(() => {
                  const s = getAdvisoryStyle(safety?.advisory ?? 'Exercise Caution')
                  return (
                    <View style={[styles.advisoryBadge, { backgroundColor: s.bg, borderColor: s.border }]}>
                      <Text style={[styles.advisoryText, { color: s.text }]}>{safety?.advisory ?? 'Exercise Caution'}</Text>
                    </View>
                  )
                })()}
              </View>
            </View>

            {/* Summary */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>SAFETY SUMMARY</Text>
              <Text style={styles.summaryText}>{safety?.summary ?? ''}</Text>
            </View>

            {/* Emergency Numbers */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>EMERGENCY NUMBERS</Text>
              <View style={styles.emergencyGrid}>
                <View style={styles.emergencyItem}>
                  <Text style={styles.emergencyEmoji}>🚔</Text>
                  <Text style={styles.emergencyType}>Police</Text>
                  <Text style={styles.emergencyNum}>{safety?.emergencyNumbers?.police ?? 'N/A'}</Text>
                </View>
                <View style={styles.emergencyDivider} />
                <View style={styles.emergencyItem}>
                  <Text style={styles.emergencyEmoji}>🚑</Text>
                  <Text style={styles.emergencyType}>Ambulance</Text>
                  <Text style={styles.emergencyNum}>{safety?.emergencyNumbers?.ambulance ?? 'N/A'}</Text>
                </View>
                <View style={styles.emergencyDivider} />
                <View style={styles.emergencyItem}>
                  <Text style={styles.emergencyEmoji}>🚒</Text>
                  <Text style={styles.emergencyType}>Fire</Text>
                  <Text style={styles.emergencyNum}>{safety?.emergencyNumbers?.fire ?? 'N/A'}</Text>
                </View>
              </View>
            </View>

            {/* Safety Tips */}
            {(safety?.safetyTips?.length ?? 0) > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>SAFETY TIPS</Text>
                {(safety?.safetyTips ?? []).map((tip, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={styles.listDot} />
                    <Text style={styles.listText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Areas to Avoid */}
            {(safety?.areasToAvoid?.length ?? 0) > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>AREAS TO AVOID</Text>
                {(safety?.areasToAvoid ?? []).map((area, i) => (
                  <View key={i} style={styles.listItem}>
                    <View style={[styles.listDot, { backgroundColor: '#ef4444' }]} />
                    <Text style={styles.listText}>{area}</Text>
                  </View>
                ))}
              </View>
            )}

            <Text style={styles.disclaimer}>
              Safety information is AI-generated and may not reflect the latest conditions. Always check official government travel advisories before your trip.
            </Text>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && !safety && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🛡️</Text>
            <Text style={styles.emptyTitle}>Stay Safe Wherever You Go</Text>
            <Text style={styles.emptyText}>
              Search for a destination to see AI-powered safety information
            </Text>
            <View style={styles.exampleChips}>
              {['🇯🇵 Tokyo', '🇮🇩 Bali', '🇲🇦 Marrakech'].map(chip => (
                <TouchableOpacity
                  key={chip}
                  style={styles.chip}
                  onPress={() => {
                    const name = chip.split(' ').slice(1).join(' ')
                    const dest = DESTINATIONS.find(d => d.name === name)
                    if (dest) handleSelect(dest)
                  }}
                >
                  <Text style={styles.chipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A1628',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerEmoji: {
    fontSize: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 1,
  },

  // Search
  searchWrapper: {
    paddingHorizontal: 16,
    zIndex: 100,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2040',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 13 : 10,
    gap: 10,
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    padding: 0,
  },
  clearBtn: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    marginTop: 4,
    backgroundColor: '#0D2040',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
    zIndex: 200,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  dropdownDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  dropdownFlag: {
    fontSize: 22,
  },
  dropdownText: {
    flex: 1,
  },
  dropdownName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownCountry: {
    color: '#6b7280',
    fontSize: 12,
    marginTop: 1,
  },
  dropdownBadge: {
    backgroundColor: 'rgba(26,111,255,0.15)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  dropdownBadgeText: {
    color: '#1A6FFF',
    fontSize: 11,
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    marginTop: 8,
    zIndex: 1,
  },
  contentPad: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },

  // Center states
  centerState: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 16,
  },
  loadingText: {
    color: '#9ca3af',
    fontSize: 14,
    textAlign: 'center',
  },

  // Error
  errorCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
    padding: 24,
    marginTop: 20,
    gap: 8,
  },
  errorEmoji: { fontSize: 36 },
  errorTitle: { color: '#fca5a5', fontSize: 17, fontWeight: '700' },
  errorMsg: { color: '#9ca3af', fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(239,68,68,0.2)',
    borderRadius: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryText: { color: '#fca5a5', fontWeight: '600', fontSize: 14 },

  // Destination tag
  destTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  destTagFlag: { fontSize: 24 },
  destTagName: { color: '#fff', fontSize: 18, fontWeight: '700' },

  // Row layout for score + advisory
  scoreAdvisoryRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  scoreCard: {
    flex: 1,
  },
  advisoryCard: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    color: '#6b7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
  },

  // Score
  scoreDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '800',
    lineHeight: 44,
  },
  scoreDenom: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  scoreTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Advisory
  advisoryBadge: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  advisoryText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // Summary
  summaryText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 22,
  },

  // Emergency
  emergencyGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emergencyItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  emergencyDivider: {
    width: 1,
    height: 48,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emergencyEmoji: { fontSize: 20 },
  emergencyType: { color: '#6b7280', fontSize: 11, fontWeight: '600' },
  emergencyNum: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Lists
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  listDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#1A6FFF',
    marginTop: 7,
    flexShrink: 0,
  },
  listText: {
    color: '#d1d5db',
    fontSize: 14,
    lineHeight: 22,
    flex: 1,
  },

  // Disclaimer
  disclaimer: {
    color: '#4b5563',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  exampleChips: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  chip: {
    backgroundColor: 'rgba(26,111,255,0.12)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(26,111,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  chipText: {
    color: '#1A6FFF',
    fontSize: 14,
    fontWeight: '600',
  },
})
