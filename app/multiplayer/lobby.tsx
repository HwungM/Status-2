import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function MultiplayerLobbyScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Game Lobby</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.content}>
        <Text style={styles.emoji}>⏳</Text>
        <Text style={styles.heading}>Waiting for Players</Text>
        <Text style={styles.desc}>
          The lobby is scaffolded and ready. In v2, players will join here using an invite code and see each other's online status.
        </Text>
        {/* TODO v2: PlayerSlotCard list with presence dots */}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  back: { color: '#fff', fontSize: 24 },
  title: { color: '#fff', fontSize: 17, fontWeight: '700' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emoji: { fontSize: 64, marginBottom: 20 },
  heading: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 12, textAlign: 'center' },
  desc: { color: '#9CA3AF', fontSize: 15, lineHeight: 22, textAlign: 'center' },
})
