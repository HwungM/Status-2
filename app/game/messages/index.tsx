import React from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { Avatar } from '@/components/common/Avatar'

export default function MessagesScreen() {
  const { session } = useGameStore()

  const npcs = session?.worldState.characters.filter(
    c => !c.isPlayerControlled && c.id !== session.players[0]?.characterId
  ) || []

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <Text style={styles.sparkle}>💜</Text>
      </View>

      {npcs.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptyDesc}>Start a DM with someone from your world</Text>
          <TouchableOpacity
            style={styles.newDmButton}
            onPress={() => router.push('/game/messages/new')}
          >
            <Text style={styles.newDmText}>+ New Message</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={npcs}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/game/messages/${item.id}`)}
              activeOpacity={0.8}
            >
              <Avatar uri={item.avatar} size={48} />
              <View style={styles.rowInfo}>
                <View style={styles.rowTop}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  {item.isVerified && <Text style={styles.verified}> ✓</Text>}
                </View>
                <Text style={styles.rowHandle}>@{item.handle}</Text>
                <Text style={styles.rowPreview} numberOfLines={1}>{item.bio}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/game/messages/new' as any)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  sparkle: { fontSize: 20 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptyDesc: { color: '#9CA3AF', fontSize: 15, textAlign: 'center', marginBottom: 24 },
  newDmButton: { backgroundColor: '#3B82F6', borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  newDmText: { color: '#fff', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  rowInfo: { flex: 1, marginLeft: 14 },
  rowTop: { flexDirection: 'row', alignItems: 'center' },
  rowName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  verified: { color: '#3B82F6', fontSize: 14 },
  rowHandle: { color: '#9CA3AF', fontSize: 13, marginBottom: 2 },
  rowPreview: { color: '#9CA3AF', fontSize: 13 },
  chevron: { color: '#9CA3AF', fontSize: 22 },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: '#3B82F6', alignItems: 'center', justifyContent: 'center', shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
})
