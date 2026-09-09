import 'react-native-gesture-handler'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import * as Notifications from 'expo-notifications'
import Constants from 'expo-constants'
import { supabase } from '../lib/supabase'
import { registerForPushNotifications } from '../lib/notifications'
import { LanguageProvider } from '../context/LanguageContext'
import { SubscriptionProvider } from '../context/SubscriptionContext'

const isExpoGo = Constants.appOwnership === 'expo'

// Only load IAP in native builds — dynamic require prevents Expo Go crash
if (!isExpoGo && Platform.OS === 'ios') {
  const InAppPurchases = require('expo-in-app-purchases')
  InAppPurchases.setPurchaseListener(({ responseCode, results }: any) => {
    if (responseCode === InAppPurchases.IAPResponseCode.OK) {
      results?.forEach(async (purchase: any) => {
        if (!purchase.acknowledged) {
          const tier = purchase.productId.includes('explorer_plus') ? 'explorer_plus'
            : purchase.productId.includes('voyager') ? 'voyager'
            : 'premium'
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            await supabase.from('users').update({ subscription_tier: tier }).eq('id', user.id)
          }
          await InAppPurchases.finishTransactionAsync(purchase, true)
        }
      })
    }
  })
}

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        setInitialized(true)
        return
      }

      // Register for push notifications once we have a confirmed user
      registerForPushNotifications(session.user.id)

      const { data } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single()

      if (data?.onboarding_complete !== false) {
        router.replace('/(tabs)/discover')
      } else {
        router.replace('/(onboarding)/vibes')
      }

      setInitialized(true)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/welcome')
      }
      if (event === 'SIGNED_IN' && session?.user) {
        registerForPushNotifications(session.user.id)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Navigate to url from notification tap
  useEffect(() => {
    const received = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification.request.content.title)
    })

    const responded = Notifications.addNotificationResponseReceivedListener(response => {
      const url = response.notification.request.content.data?.url as string | undefined
      if (url) router.push(url as any)
    })

    return () => {
      received.remove()
      responded.remove()
    }
  }, [])

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A6FFF" />
      </View>
    )
  }

  return (
    <LanguageProvider>
      <SubscriptionProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </SubscriptionProvider>
    </LanguageProvider>
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center' },
})
