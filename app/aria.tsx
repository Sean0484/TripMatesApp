import { useState, useRef, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const SUGGESTIONS = [
  'Plan a trip to Bali 🌴',
  'Budget for 2 weeks Thailand 💰',
  'Best time to visit Japan 🇯🇵',
  'Packing list for Europe 🎒',
  'Safest countries for solo travel 🛡️',
]

const WELCOME = "Hey there! I'm ARIA, your AI travel companion. I can help you plan trips, find travel buddies, suggest destinations, and keep you safe. What are you dreaming about today? ✈️"

type Message = {
  id: string
  role: 'aria' | 'user'
  text: string
}

let msgId = 0
const newId = () => String(++msgId)

export default function AriaScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const listRef = useRef<FlatList>(null)

  const [messages, setMessages] = useState<Message[]>([
    { id: newId(), role: 'aria', text: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [suggestionsVisible, setSuggestionsVisible] = useState(true)

  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100)
    }
  }, [messages, typing])

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || typing) return
    setInput('')
    setSuggestionsVisible(false)

    const userMsg: Message = { id: newId(), role: 'user', text: trimmed }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)

    try {
      const res = await fetch('https://tripmatess.com/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      })
      const json = await res.json()
      const reply = json.reply ?? json.message ?? json.content ?? 'Sorry, I had trouble responding. Try again!'
      setMessages(prev => [...prev, { id: newId(), role: 'aria', text: reply }])
    } catch {
      setMessages(prev => [...prev, { id: newId(), role: 'aria', text: "I'm having connection issues right now. Please try again in a moment! 🔌" }])
    } finally {
      setTyping(false)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user'
    return (
      <View style={[styles.row, isUser ? styles.rowUser : styles.rowAria]}>
        {!isUser && (
          <View style={styles.ariaAvatar}>
            <LinearGradient colors={['#7C3AED', '#C084FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ariaAvatarGrad}>
              <Text style={styles.ariaAvatarIcon}>✦</Text>
            </LinearGradient>
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAria]}>
          <Text style={styles.bubbleText}>{item.text}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#C084FC']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerIcon}>✦</Text>
          <Text style={styles.headerTitle}>ARIA</Text>
        </View>

        <View style={styles.statusWrap}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </LinearGradient>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={m => m.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <>
              {/* Typing indicator */}
              {typing && (
                <View style={styles.row}>
                  <View style={styles.ariaAvatar}>
                    <LinearGradient colors={['#7C3AED', '#C084FC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.ariaAvatarGrad}>
                      <Text style={styles.ariaAvatarIcon}>✦</Text>
                    </LinearGradient>
                  </View>
                  <View style={[styles.bubble, styles.bubbleAria, styles.typingBubble]}>
                    <View style={styles.dotsRow}>
                      <View style={[styles.dot, styles.dot1]} />
                      <View style={[styles.dot, styles.dot2]} />
                      <View style={[styles.dot, styles.dot3]} />
                    </View>
                  </View>
                </View>
              )}

              {/* Suggestion chips */}
              {suggestionsVisible && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chips}
                  style={{ marginTop: 12 }}
                >
                  {SUGGESTIONS.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={styles.chip}
                      onPress={() => send(s)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.chipText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          }
        />

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            style={styles.input}
            placeholder="Ask ARIA anything..."
            placeholderTextColor="#4b5563"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || typing) && styles.sendBtnDisabled]}
            onPress={() => send(input)}
            disabled={!input.trim() || typing}
            activeOpacity={0.8}
          >
            {typing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <LinearGradient
                colors={['#7C3AED', '#C084FC']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sendBtnGrad}
              >
                <Text style={styles.sendIcon}>↑</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1628' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  backIcon: { color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '300' },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  statusWrap: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' },
  onlineText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: '600' },

  // Messages
  messageList: { padding: 16, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: 12, gap: 8 },
  rowUser: { justifyContent: 'flex-end' },
  rowAria: { justifyContent: 'flex-start' },

  ariaAvatar: { width: 32, height: 32, borderRadius: 16, overflow: 'hidden', flexShrink: 0 },
  ariaAvatarGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ariaAvatarIcon: { color: '#fff', fontSize: 14, fontWeight: '700' },

  bubble: {
    maxWidth: '78%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: '#1A6FFF',
    borderBottomRightRadius: 4,
  },
  bubbleAria: {
    backgroundColor: '#7C3AED',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: '#fff', fontSize: 15, lineHeight: 22 },

  // Typing dots
  typingBubble: { paddingVertical: 14, paddingHorizontal: 16 },
  dotsRow: { flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.7)' },
  dot1: {}, dot2: {}, dot3: {},

  // Suggestion chips
  chips: { paddingHorizontal: 16, paddingBottom: 4, gap: 8 },
  chip: {
    backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 8,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
  },
  chipText: { color: '#C084FC', fontSize: 13, fontWeight: '600' },

  // Input bar
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0A1628',
  },
  input: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 15, color: '#fff', maxHeight: 120,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden' },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnGrad: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sendIcon: { color: '#fff', fontSize: 20, fontWeight: '700' },
})
