import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useLanguage } from '../../context/LanguageContext'
import { t } from '../../lib/i18n'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
}

export default function TabsLayout() {
  const { language } = useLanguage()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0A1628',
          borderTopColor: '#1e3a5f',
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#1A6FFF',
        tabBarInactiveTintColor: '#6b7280',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="discover"
        options={{ title: t('discover', language), tabBarIcon: ({ focused }) => <TabIcon emoji="🌍" focused={focused} /> }}
      />
      <Tabs.Screen name="trips" options={{ href: null }} />
      <Tabs.Screen
        name="chat"
        options={{ title: t('chat', language), tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} /> }}
      />
      <Tabs.Screen
        name="safety"
        options={{ title: t('safety', language), tabBarIcon: ({ focused }) => <TabIcon emoji="🛡️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="marketplace"
        options={{ title: t('market', language), tabBarIcon: ({ focused }) => <TabIcon emoji="🛍️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: t('profile', language), tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tabs>
  )
}
