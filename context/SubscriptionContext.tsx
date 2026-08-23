import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'

type Tier = 'free' | 'explorer_plus' | 'voyager' | 'premium'

const SubscriptionContext = createContext<{
  tier: Tier
  canAccess: (feature: string) => boolean
  showUpgradeModal: (feature: string) => void
}>({ tier: 'free', canAccess: () => true, showUpgradeModal: () => {} })

const FEATURE_GATES: Record<string, Tier[]> = {
  'unlimited_requests': ['explorer_plus', 'voyager', 'premium'],
  'who_liked_you':      ['explorer_plus', 'voyager', 'premium'],
  'profile_boost':      ['voyager', 'premium'],
  'duo_trips':          ['voyager', 'premium'],
  'who_visited_you':    ['voyager', 'premium'],
  'unlimited_aria':     ['voyager', 'premium'],
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [tier, setTier] = useState<Tier>('free')
  const [showModal, setShowModal] = useState(false)
  const [lockedFeature, setLockedFeature] = useState('')

  useEffect(() => {
    const fetchTier = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('users').select('subscription_tier').eq('id', user.id).single()
      if (data?.subscription_tier) setTier(data.subscription_tier as Tier)
    }
    fetchTier()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') fetchTier()
      if (event === 'SIGNED_OUT') setTier('free')
    })
    return () => subscription.unsubscribe()
  }, [])

  const canAccess = (feature: string) => {
    const required = FEATURE_GATES[feature]
    if (!required) return true
    return required.includes(tier)
  }

  const showUpgradeModal = (feature: string) => {
    setLockedFeature(feature)
    setShowModal(true)
  }

  return (
    <SubscriptionContext.Provider value={{ tier, canAccess, showUpgradeModal }}>
      {children}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.emoji}>🔒</Text>
            <Text style={styles.title}>Upgrade Required</Text>
            <Text style={styles.subtitle}>This feature requires a higher subscription plan.</Text>
            <TouchableOpacity
              style={styles.upgradeBtn}
              onPress={() => { setShowModal(false); router.push('/subscription') }}
            >
              <Text style={styles.upgradeBtnText}>View Plans →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={styles.cancelText}>Not now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SubscriptionContext.Provider>
  )
}

export const useSubscription = () => useContext(SubscriptionContext)

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#0A1628',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 32, alignItems: 'center',
  },
  emoji: { fontSize: 40, marginBottom: 12 },
  title: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: '#8BA4C8', fontSize: 15, marginBottom: 24, textAlign: 'center' },
  upgradeBtn: {
    backgroundColor: '#1A6FFF', borderRadius: 12, padding: 16,
    alignItems: 'center', marginBottom: 12, width: '100%',
  },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  cancelText: { color: '#6B7280', textAlign: 'center', fontSize: 14 },
})
