import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { View } from 'react-native'
import { COLORS } from '@/constants/colors'

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.background }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="scenario/[id]" />
        <Stack.Screen name="preset/fandom" />
        <Stack.Screen name="preset/characters" />
        <Stack.Screen name="preset/play-as" />
        <Stack.Screen name="preset/first-follower" />
        <Stack.Screen name="preset/world-setup" />
        <Stack.Screen name="loading" />
        <Stack.Screen name="game" options={{ animation: 'fade' }} />
        <Stack.Screen name="customize-world" />
        <Stack.Screen name="create-character" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="multiplayer/join" />
        <Stack.Screen name="multiplayer/lobby" />
      </Stack>
    </View>
  )
}
