import { Tabs } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'
import { useEffect } from 'react'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'

function TabIcon({ label, emoji, focused }: { label: string; emoji: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.emoji, focused && styles.emojiActive]}>{emoji}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function GameLayout() {
  const { session, loadActiveSession } = useGameStore()

  useEffect(() => {
    if (!session) loadActiveSession()
  }, [])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Home" emoji="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Goals" emoji="🎯" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Messages" emoji="💬" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Activity" emoji="🔔" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon label="Profile" emoji="👤" focused={focused} />,
        }}
      />
      <Tabs.Screen name="messages/[characterId]" options={{ href: null }} />
      <Tabs.Screen name="character/[id]" options={{ href: null }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.surface,
    borderTopColor: COLORS.divider,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabItem: { alignItems: 'center', gap: 2 },
  emoji: { fontSize: 20, opacity: 0.5 },
  emojiActive: { opacity: 1 },
  tabLabel: { fontSize: 10, color: COLORS.textSecondary },
  tabLabelActive: { color: COLORS.primary },
})
