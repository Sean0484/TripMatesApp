import 'react-native-gesture-handler'
import { useEffect, useState } from 'react'
import { View, ActivityIndicator, StyleSheet } from 'react-native'
import { Stack, useRouter } from 'expo-router'
import { supabase } from '../lib/supabase'

export default function RootLayout() {
  const [initialized, setInitialized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        // Already on welcome via index.tsx redirect — nothing to do
        setInitialized(true)
        return
      }

      const { data } = await supabase
        .from('users')
        .select('onboarding_complete')
        .eq('id', session.user.id)
        .single()

      // Treat null/undefined onboarding_complete as complete for existing users
      if (data?.onboarding_complete !== false) {
        router.replace('/(tabs)/discover')
      } else {
        router.replace('/(onboarding)/vibes')
      }

      setInitialized(true)
    }

    init()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/(auth)/welcome')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!initialized) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A6FFF" />
      </View>
    )
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  )
}

const styles = StyleSheet.create({
  loading: { flex: 1, backgroundColor: '#0A1628', alignItems: 'center', justifyContent: 'center' },
})
