import React, { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { WorldSession } from '@/types'
import { formatFollowerCount } from '@/utils/statHelpers'

function ContinueCard({ session, onPress }: { session: WorldSession; onPress: () => void }) {
  const playerSlot = session.players[0]
  const playerChar = session.worldState.characters.find(c => c.id === playerSlot?.characterId)
  const goal = session.worldState.mainGoal || ''
  const goalMatch = goal.match(/Reach (\d+(?:\.\d+)?[KM]?) followers/)
  const goalLabel = goalMatch ? goalMatch[1] : null
  const goalTargets: Record<string, number> = { '10K': 10000, '100K': 100000, '1M': 1000000, '10M': 10000000, '100M': 100000000 }
  const goalTarget = goalLabel ? (goalTargets[goalLabel] || 1000000) : 1000000
  const followers = playerSlot?.gameState.followerCount || 0
  const pct = Math.min(100, Math.floor((followers / goalTarget) * 100))

  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.continueHeader}>
        <Text style={styles.continueLabel}>Continue playing</Text>
        <Text style={styles.continueDay}>Day {session.worldState.dayNumber}</Text>
      </View>
      <Text style={styles.continueName}>{playerChar?.name || 'Unknown'}</Text>
      <Text style={styles.continueHandle}>@{playerChar?.handle || 'unknown'}</Text>
      <Text style={styles.continueFollowers}>
        {formatFollowerCount(followers)} followers
        {goalLabel ? ` · ${pct}% to ${goalLabel}` : ''}
      </Text>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <View style={styles.playButton}>
        <Text style={styles.playText}>▶ Continue</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const [sessions, setSessions] = useState<WorldSession[]>([])

  useEffect(() => {
    LocalWorldSessionService.getAllSessions().then(setSessions)
  }, [])

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>CLOUT</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
            <Text style={styles.iconText}>⚙️</Text>
          </TouchableOpacity>
        </View>

        {/* Active sessions */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Worlds</Text>
            {sessions.map(session => (
              <ContinueCard
                key={session.id}
                session={session}
                onPress={async () => {
                  await LocalWorldSessionService.setActiveSession(session.id)
                  router.push('/game/feed')
                }}
              />
            ))}
          </View>
        )}

        {/* Empty state */}
        {sessions.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📱</Text>
            <Text style={styles.emptyTitle}>No worlds yet</Text>
            <Text style={styles.emptySubtitle}>Create your character and start building your clout</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* New game FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/preset/fandom')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ New Game</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
  },
  logo: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  iconBtn: { padding: 8 },
  iconText: { fontSize: 20 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700', marginBottom: 14 },
  continueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.divider,
    marginBottom: 12,
  },
  continueHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  continueLabel: { color: COLORS.textSecondary, fontSize: 13 },
  continueDay: { color: COLORS.textSecondary, fontSize: 13 },
  continueName: { color: '#fff', fontSize: 20, fontWeight: '800', marginBottom: 2 },
  continueHandle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: 6 },
  continueFollowers: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  progressBg: { height: 4, backgroundColor: '#2A2A2A', borderRadius: 2, marginBottom: 14 },
  progressFill: { height: 4, backgroundColor: COLORS.primary, borderRadius: 2 },
  playButton: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  playText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingTop: 100, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  emptySubtitle: { color: COLORS.textSecondary, fontSize: 15, textAlign: 'center', lineHeight: 22 },
  fab: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    backgroundColor: COLORS.primary, borderRadius: 999,
    paddingVertical: 16, paddingHorizontal: 32,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 16, fontWeight: '800' },
})
