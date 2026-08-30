import { useEffect, useState, useCallback, useRef } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  TextInput, Modal, KeyboardAvoidingView, Platform,
  ActivityIndicator, Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useRouter } from 'expo-router'
import { supabase } from '../../lib/supabase'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'

// ─── Types ────────────────────────────────────────────────────────────────────

type TripChatItem = {
  tripId: string
  title: string
  destination: string
  lastMessage: string | null
  lastMessageAt: string | null
}

type DMItem = {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  lastMessage: string
  lastMessageAt: string
}

type Message = {
  id: string
  content: string
  sender_id: string
  created_at: string
}

type ChatTarget =
  | { type: 'trip'; tripId: string; title: string; destination: string }
  | { type: 'dm'; partnerId: string; partnerName: string; partnerAvatar: string | null }

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getFlag = (dest: string) => {
  const l = dest.toLowerCase()
  const map: [string, string][] = [
    ['france','🇫🇷'],['japan','🇯🇵'],['spain','🇪🇸'],['italy','🇮🇹'],
    ['germany','🇩🇪'],['uk','🇬🇧'],['usa','🇺🇸'],['australia','🇦🇺'],
    ['thailand','🇹🇭'],['bali','🇮🇩'],['portugal','🇵🇹'],['greece','🇬🇷'],
    ['mexico','🇲🇽'],['ireland','🇮🇪'],['morocco','🇲🇦'],['vietnam','🇻🇳'],
  ]
  for (const [k, f] of map) { if (l.includes(k)) return f }
  return '✈️'
}

const formatTime = (d: string) =>
  new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

const timeAgo = (d: string) => {
  const diff = Date.now() - new Date(d).getTime()
  if (diff < 60000) return 'now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h`
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ name, url, emoji, size = 46 }: {
  name?: string; url?: string | null; emoji?: string; size?: number
}) {
  if (url) {
    return (
      <Image
        source={{ uri: url }}
        style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#0D2040' }}
      />
    )
  }
  if (emoji) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: 'rgba(26,111,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: size * 0.42 }}>{emoji}</Text>
      </View>
    )
  }
  const initials = (name ?? '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <LinearGradient
      colors={['#1A6FFF', '#00B89C']}
      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}
    >
      <Text style={{ color: '#fff', fontWeight: '800', fontSize: size * 0.36 }}>{initials}</Text>
    </LinearGradient>
  )
}

// ─── Chat Partner Profile Modal ───────────────────────────────────────────────

function ChatPartnerProfileModal({ partnerId, partnerName, partnerAvatar, visible, onClose }: {
  partnerId: string
  partnerName: string
  partnerAvatar: string | null
  visible: boolean
  onClose: () => void
}) {
  const router = useRouter()
  const [bio, setBio] = useState<string | null>(null)
  const [city, setCity] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!visible || !partnerId) return
    setLoading(true)
    supabase
      .from('users')
      .select('bio, city')
      .eq('id', partnerId)
      .single()
      .then(({ data }) => {
        if (data) { setBio(data.bio); setCity(data.city) }
        setLoading(false)
      })
  }, [partnerId, visible])

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={cp.overlay}>
        <View style={cp.sheet}>
          <View style={cp.handle} />
          <Avatar name={partnerName} url={partnerAvatar} size={72} />
          <Text style={cp.name}>{partnerName}</Text>
          {city ? <Text style={cp.city}>📍 {city}</Text> : null}
          {loading ? (
            <ActivityIndicator color="#1A6FFF" style={{ marginTop: 16 }} />
          ) : bio ? (
            <Text style={cp.bio}>{bio}</Text>
          ) : (
            <Text style={cp.noBio}>No bio yet</Text>
          )}
          <TouchableOpacity
            style={cp.reviewBtn}
            onPress={() => {
              onClose()
              router.push(`/review?revieweeId=${partnerId}&revieweeName=${encodeURIComponent(partnerName)}` as any)
            }}
            activeOpacity={0.85}
          >
            <Text style={cp.reviewBtnText}>⭐ Leave a Review</Text>
          </TouchableOpacity>
          <TouchableOpacity style={cp.cancelBtn} onPress={onClose}>
            <Text style={cp.cancelBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const cp = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: '#0D1F3C', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 28, paddingBottom: 44, alignItems: 'center',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)',
    alignSelf: 'center', marginBottom: 24,
  },
  name: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 14, marginBottom: 4 },
  city: { color: '#9ca3af', fontSize: 13, marginBottom: 12 },
  bio: { color: '#d1d5db', fontSize: 14, lineHeight: 22, textAlign: 'center', marginTop: 8, marginBottom: 8 },
  noBio: { color: '#4b5563', fontSize: 14, fontStyle: 'italic', marginTop: 8 },
  reviewBtn: {
    marginTop: 24, width: '100%', backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(245,158,11,0.4)',
    paddingVertical: 14, alignItems: 'center',
  },
  reviewBtnText: { color: '#f59e0b', fontSize: 15, fontWeight: '700' },
  cancelBtn: { marginTop: 10, paddingVertical: 10, width: '100%', alignItems: 'center' },
  cancelBtnText: { color: '#6b7280', fontSize: 14, fontWeight: '600' },
})

// ─── Chat Detail ──────────────────────────────────────────────────────────────

function ChatDetail({ target, userId, visible, onClose }: {
  target: ChatTarget | null
  userId: string
  visible: boolean
  onClose: () => void
}) {
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const { language } = useLanguage()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [profileVisible, setProfileVisible] = useState(false)
  const flatRef = useRef<FlatList>(null)

  const targetKey = target
    ? (target.type === 'trip' ? `trip-${target.tripId}` : `dm-${target.partnerId}`)
    : null

  useEffect(() => {
    if (!visible || !target) return
    setMessages([])
    setText('')

    const load = async () => {
      setLoading(true)
      let msgs: Message[] = []

      if (target.type === 'trip') {
        const { data } = await supabase
          .from('messages')
          .select('id, content, sender_id, created_at')
          .eq('trip_id', target.tripId)
          .order('created_at', { ascending: true })
          .limit(100)
        msgs = data ?? []
      } else {
        const { data } = await supabase
          .from('direct_messages')
          .select('id, content, sender_id, receiver_id, created_at')
          .or(
            `and(sender_id.eq.${userId},receiver_id.eq.${target.partnerId}),` +
            `and(sender_id.eq.${target.partnerId},receiver_id.eq.${userId})`
          )
          .order('created_at', { ascending: true })
          .limit(100)
        msgs = (data ?? []).map(m => ({ id: m.id, content: m.content, sender_id: m.sender_id, created_at: m.created_at }))
      }

      setMessages(msgs)
      setLoading(false)
    }

    load()

    // Real-time subscription
    const channelName = target.type === 'trip'
      ? `trip-msg-${target.tripId}`
      : `dm-${[userId, target.partnerId].sort().join('-')}`

    const channel = supabase.channel(channelName)

    if (target.type === 'trip') {
      channel.on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'messages',
        filter: `trip_id=eq.${target.tripId}`,
      }, (payload) => {
        const msg = payload.new as Message
        setMessages(prev => {
          if (prev.find(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      })
    } else {
      const partnerId = target.partnerId
      channel.on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'direct_messages',
      }, (payload) => {
        const dm = payload.new as any
        if (
          (dm.sender_id === userId && dm.receiver_id === partnerId) ||
          (dm.sender_id === partnerId && dm.receiver_id === userId)
        ) {
          setMessages(prev => {
            if (prev.find(m => m.id === dm.id)) return prev
            return [...prev, { id: dm.id, content: dm.content, sender_id: dm.sender_id, created_at: dm.created_at }]
          })
        }
      })
    }

    channel.subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [visible, targetKey])

  const handleSend = async () => {
    const content = text.trim()
    if (!content || !target) return
    setSending(true)
    setText('')

    if (target.type === 'trip') {
      await supabase.from('messages').insert({
        trip_id: target.tripId, sender_id: userId, content,
      })
    } else {
      await supabase.from('direct_messages').insert({
        sender_id: userId, receiver_id: target.partnerId, content,
      })
    }
    setSending(false)
  }

  const headerTitle = target
    ? (target.type === 'trip' ? `${getFlag(target.destination)} ${target.title}` : target.partnerName)
    : ''

  const headerAvatar = target?.type === 'dm'
    ? <Avatar name={target.partnerName} url={target.partnerAvatar} size={36} />
    : null

  return (
    <Modal visible={visible} animationType="slide">
      <KeyboardAvoidingView
        style={[cd.root, { backgroundColor: '#0A1628' }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[cd.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity onPress={onClose} style={cd.backBtn}>
            <Text style={cd.backArrow}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={cd.headerCenter}
            onPress={() => { if (target?.type === 'dm') setProfileVisible(true) }}
            activeOpacity={target?.type === 'dm' ? 0.7 : 1}
          >
            {headerAvatar}
            <Text style={cd.headerTitle} numberOfLines={1}>{headerTitle}</Text>
          </TouchableOpacity>
          {target?.type === 'dm' ? (
            <TouchableOpacity
              style={cd.reviewBtn}
              onPress={() => {
                onClose()
                router.push(`/review?revieweeId=${target.partnerId}&revieweeName=${encodeURIComponent(target.partnerName)}` as any)
              }}
              activeOpacity={0.7}
            >
              <Text style={cd.reviewBtnText}>⭐</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* Messages */}
        {loading ? (
          <View style={cd.center}><ActivityIndicator color="#1A6FFF" size="large" /></View>
        ) : (
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={m => m.id}
            contentContainerStyle={cd.msgList}
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={cd.emptyChat}>
                <Text style={cd.emptyChatEmoji}>👋</Text>
                <Text style={cd.emptyChatText}>No messages yet. Say hello!</Text>
              </View>
            }
            renderItem={({ item }) => {
              const isMe = item.sender_id === userId
              return (
                <View style={[cd.bubbleWrap, isMe ? cd.bubbleWrapMe : cd.bubbleWrapOther]}>
                  <View style={[cd.bubble, isMe ? cd.bubbleMe : cd.bubbleOther]}>
                    <Text style={[cd.bubbleText, isMe ? cd.bubbleTextMe : cd.bubbleTextOther]}>
                      {item.content}
                    </Text>
                  </View>
                  <Text style={[cd.bubbleTime, isMe ? { textAlign: 'right' } : { textAlign: 'left' }]}>
                    {formatTime(item.created_at)}
                  </Text>
                </View>
              )
            }}
          />
        )}

        {/* Input */}
        <View style={[cd.inputRow, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={cd.input}
            placeholder={t('typeMessage', language)}
            placeholderTextColor="#4b5563"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[cd.sendBtn, (!text.trim() || sending) && cd.sendBtnOff]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
            activeOpacity={0.8}
          >
            {sending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={cd.sendArrow}>↑</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      {target?.type === 'dm' && (
        <ChatPartnerProfileModal
          partnerId={target.partnerId}
          partnerName={target.partnerName}
          partnerAvatar={target.partnerAvatar}
          visible={profileVisible}
          onClose={() => setProfileVisible(false)}
        />
      )}
    </Modal>
  )
}

const cd = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
  },
  backArrow: { color: '#fff', fontSize: 20, fontWeight: '600' },
  reviewBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(245,158,11,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  reviewBtnText: { fontSize: 18 },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff', flexShrink: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { padding: 16, paddingBottom: 8 },
  emptyChat: { alignItems: 'center', paddingTop: 80 },
  emptyChatEmoji: { fontSize: 40, marginBottom: 10 },
  emptyChatText: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
  bubbleWrap: { marginBottom: 12 },
  bubbleWrapMe: { alignItems: 'flex-end' },
  bubbleWrapOther: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMe: { backgroundColor: '#1A6FFF', borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: '#1e3a5f', borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextOther: { color: '#e5e7eb' },
  bubbleTime: { fontSize: 11, color: '#4b5563', marginTop: 3, paddingHorizontal: 4 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 10,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1, backgroundColor: '#0D2040', borderRadius: 22,
    paddingHorizontal: 16, paddingVertical: 10,
    fontSize: 15, color: '#fff', maxHeight: 100,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1A6FFF', alignItems: 'center', justifyContent: 'center',
  },
  sendBtnOff: { backgroundColor: '#1e3a5f' },
  sendArrow: { color: '#fff', fontSize: 20, fontWeight: '700', marginTop: -2 },
})

// ─── Chat List Item ───────────────────────────────────────────────────────────

function ChatListItem({ avatar, name, subtitle, time, onPress }: {
  avatar: React.ReactNode
  name: string
  subtitle: string | null
  time: string | null
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={cl.row} onPress={onPress} activeOpacity={0.8}>
      {avatar}
      <View style={{ flex: 1 }}>
        <Text style={cl.name} numberOfLines={1}>{name}</Text>
        <Text style={cl.preview} numberOfLines={1}>{subtitle ?? 'No messages yet'}</Text>
      </View>
      {time && <Text style={cl.time}>{timeAgo(time)}</Text>}
    </TouchableOpacity>
  )
}

const cl = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  name: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  preview: { fontSize: 13, color: '#6b7280' },
  time: { fontSize: 11, color: '#4b5563' },
})

// ─── Trip Chats Tab ───────────────────────────────────────────────────────────

function TripChatsTab({ userId, onOpen }: {
  userId: string
  onOpen: (target: ChatTarget) => void
}) {
  const [chats, setChats] = useState<TripChatItem[]>([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      // Get approved trip memberships
      const { data: memberships } = await supabase
        .from('trip_members')
        .select('trip_id, trips(id, title, destination)')
        .eq('user_id', userId)
        .eq('status', 'Approved')

      if (!memberships || memberships.length === 0) {
        setChats([])
        setLoading(false)
        return
      }

      const trips = memberships.map((m: any) => ({
        tripId: m.trip_id,
        title: m.trips?.title ?? 'Unknown trip',
        destination: m.trips?.destination ?? '',
      }))

      // Fetch last message for each trip
      const withMessages = await Promise.all(
        trips.map(async (t) => {
          const { data } = await supabase
            .from('messages')
            .select('content, created_at')
            .eq('trip_id', t.tripId)
            .order('created_at', { ascending: false })
            .limit(1)
          const last = data?.[0]
          return {
            ...t,
            lastMessage: last?.content ?? null,
            lastMessageAt: last?.created_at ?? null,
          }
        })
      )

      setChats(withMessages.sort((a, b) => {
        if (!a.lastMessageAt) return 1
        if (!b.lastMessageAt) return -1
        return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      }))
      setLoading(false)
    }

    load()
  }, [userId])

  if (loading) return <View style={s.center}><ActivityIndicator color="#1A6FFF" /></View>

  if (chats.length === 0) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyEmoji}>✈️</Text>
        <Text style={s.emptyTitle}>{t('noTripChats', language)}</Text>
        <Text style={s.emptySub}>{t('joinTripToChat', language)}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={c => c.tripId}
      renderItem={({ item }) => (
        <ChatListItem
          avatar={<Avatar emoji={getFlag(item.destination)} size={46} />}
          name={item.title}
          subtitle={item.lastMessage}
          time={item.lastMessageAt}
          onPress={() => onOpen({ type: 'trip', tripId: item.tripId, title: item.title, destination: item.destination })}
        />
      )}
    />
  )
}

// ─── Direct Messages Tab ──────────────────────────────────────────────────────

function DirectMessagesTab({ userId, onOpen }: {
  userId: string
  onOpen: (target: ChatTarget) => void
}) {
  const [conversations, setConversations] = useState<DMItem[]>([])
  const [loading, setLoading] = useState(true)
  const { language } = useLanguage()

  useEffect(() => {
    const load = async () => {
      setLoading(true)

      const { data } = await supabase
        .from('direct_messages')
        .select('id, sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(200)

      if (!data || data.length === 0) {
        setConversations([])
        setLoading(false)
        return
      }

      // Group by partner, keep most recent message per conversation
      const partnerMap: Record<string, typeof data[0]> = {}
      for (const msg of data) {
        const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id
        if (!partnerMap[partnerId]) partnerMap[partnerId] = msg
      }

      // Fetch partner user info
      const partnerIds = Object.keys(partnerMap)
      const { data: users } = await supabase
        .from('users')
        .select('id, first_name, last_name, avatar_url')
        .in('id', partnerIds)

      const userMap: Record<string, { name: string; avatar: string | null }> = {}
      users?.forEach(u => {
        userMap[u.id] = { name: `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim(), avatar: u.avatar_url }
      })

      const convos: DMItem[] = partnerIds.map(partnerId => {
        const msg = partnerMap[partnerId]
        const user = userMap[partnerId] ?? { name: 'Unknown', avatar: null }
        return {
          partnerId,
          partnerName: user.name || 'Unknown',
          partnerAvatar: user.avatar,
          lastMessage: msg.content,
          lastMessageAt: msg.created_at,
        }
      }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())

      setConversations(convos)
      setLoading(false)
    }

    load()
  }, [userId])

  if (loading) return <View style={s.center}><ActivityIndicator color="#1A6FFF" /></View>

  if (conversations.length === 0) {
    return (
      <View style={s.emptyState}>
        <Text style={s.emptyEmoji}>💬</Text>
        <Text style={s.emptyTitle}>{t('noDirectMessages', language)}</Text>
        <Text style={s.emptySub}>{t('startSwiping', language)}</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={conversations}
      keyExtractor={c => c.partnerId}
      renderItem={({ item }) => (
        <ChatListItem
          avatar={<Avatar name={item.partnerName} url={item.partnerAvatar} size={46} />}
          name={item.partnerName}
          subtitle={item.lastMessage}
          time={item.lastMessageAt}
          onPress={() => onOpen({ type: 'dm', partnerId: item.partnerId, partnerName: item.partnerName, partnerAvatar: item.partnerAvatar })}
        />
      )}
    />
  )
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type MainTab = 'trips' | 'dms'

export default function ChatScreen() {
  const insets = useSafeAreaInsets()
  const { language } = useLanguage()
  const [tab, setTab] = useState<MainTab>('trips')
  const [userId, setUserId] = useState<string | null>(null)
  const [chatTarget, setChatTarget] = useState<ChatTarget | null>(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id)
    })
  }, [])

  const openChat = useCallback((target: ChatTarget) => {
    setChatTarget(target)
    setChatOpen(true)
  }, [])

  const closeChat = useCallback(() => {
    setChatOpen(false)
    setTimeout(() => setChatTarget(null), 300)
  }, [])

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Top bar */}
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>{t('messages', language)}</Text>
      </View>

      {/* Tab toggle */}
      <View style={s.tabRow}>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'trips' && s.tabBtnActive]}
          onPress={() => setTab('trips')}
        >
          <Text style={[s.tabText, tab === 'trips' && s.tabTextActive]}>{t('tripChats', language)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tabBtn, tab === 'dms' && s.tabBtnActive]}
          onPress={() => setTab('dms')}
        >
          <Text style={[s.tabText, tab === 'dms' && s.tabTextActive]}>{t('directMessages', language)}</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!userId ? (
        <View style={s.center}><ActivityIndicator color="#1A6FFF" /></View>
      ) : tab === 'trips' ? (
        <TripChatsTab userId={userId} onOpen={openChat} />
      ) : (
        <DirectMessagesTab userId={userId} onOpen={openChat} />
      )}

      {/* Chat detail */}
      {userId && (
        <ChatDetail
          target={chatTarget}
          userId={userId}
          visible={chatOpen}
          onClose={closeChat}
        />
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },
  topBar: { paddingHorizontal: 20, paddingVertical: 14 },
  topBarTitle: { fontSize: 22, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  tabRow: {
    flexDirection: 'row', marginHorizontal: 16, marginBottom: 4,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  tabBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#1A6FFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#fff', marginBottom: 6, textAlign: 'center' },
  emptySub: { fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 20 },
})
