import React, { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Dimensions, FlatList, Image,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { SCENARIOS, getFeaturedScenarios } from '@/constants/scenarios'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { WorldSession, Scenario } from '@/types'
import { formatFollowerCount } from '@/utils/statHelpers'

const { width } = Dimensions.get('window')

function ScenarioCard({ scenario, onPress }: { scenario: Scenario; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.scenarioCard} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: scenario.coverImage }}
        style={styles.cardImage}
      />
      <View style={styles.cardOverlay} />
      <View style={styles.cardContent}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{scenario.category}</Text>
        </View>
        <Text style={styles.cardTitle}>{scenario.name}</Text>
        <Text style={styles.cardDesc} numberOfLines={2}>{scenario.description}</Text>
        <Text style={styles.playerCount}>👥 {scenario.playerCount.toLocaleString()} playing</Text>
      </View>
    </TouchableOpacity>
  )
}

function ContinueCard({ session, onPress }: { session: WorldSession; onPress: () => void }) {
  const playerSlot = session.players[0]
  const playerChar = session.worldState.characters.find(c => c.id === playerSlot?.characterId)

  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.continueHeader}>
        <Text style={styles.continueLabel}>Continue playing</Text>
        <Text style={styles.continueDay}>Day {session.worldState.dayNumber}</Text>
      </View>
      <Text style={styles.continueTitle}>{session.worldState.fandom || 'Custom World'}</Text>
      <Text style={styles.continueName}>{playerChar?.name || 'Unknown'}</Text>
      <Text style={styles.continueFollowers}>
        👥 {formatFollowerCount(playerSlot?.gameState.followerCount || 0)} followers
      </Text>
      <View style={styles.playButton}>
        <Text style={styles.playText}>▶ Play</Text>
      </View>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const [sessions, setSessions] = useState<WorldSession[]>([])
  const featured = getFeaturedScenarios()

  useEffect(() => {
    LocalWorldSessionService.getAllSessions().then(setSessions)
  }, [])

  const activeSession = sessions[0]

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>clout</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Text style={styles.iconText}>🔍</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/settings')}>
              <Text style={styles.iconText}>⚙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Continue card */}
        {activeSession && (
          <View style={styles.section}>
            <ContinueCard
              session={activeSession}
              onPress={async () => {
                await LocalWorldSessionService.setActiveSession(activeSession.id)
                router.push('/game/feed')
              }}
            />
          </View>
        )}

        {/* Featured Worlds */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Worlds</Text>
            <TouchableOpacity onPress={() => router.push('/explore')}>
              <Text style={styles.seeAll}>Explore more →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {featured.map(s => (
              <ScenarioCard
                key={s.id}
                scenario={s}
                onPress={() => router.push(`/scenario/${s.id}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* My Presets */}
        {sessions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Worlds</Text>
            {sessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={styles.myPresetRow}
                onPress={async () => {
                  await LocalWorldSessionService.setActiveSession(session.id)
                  router.push('/game/feed')
                }}
              >
                <View style={styles.myPresetInfo}>
                  <Text style={styles.myPresetTitle}>
                    {session.worldState.fandom || 'Custom World'}
                  </Text>
                  <Text style={styles.myPresetSub}>
                    Day {session.worldState.dayNumber} · {session.players[0]?.displayName}
                  </Text>
                </View>
                <Text style={styles.myPresetChevron}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/preset/fandom')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
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
  logo: { color: COLORS.textPrimary, fontSize: 28, fontWeight: '900', letterSpacing: -1 },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: { padding: 8 },
  iconText: { fontSize: 20 },
  section: { paddingHorizontal: 20, marginBottom: 28 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  seeAll: { color: COLORS.primary, fontSize: 14 },
  horizontalScroll: { marginLeft: -4 },
  scenarioCard: {
    width: width * 0.72,
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginRight: 14,
    marginLeft: 4,
    backgroundColor: COLORS.surface,
  },
  cardImage: { width: '100%', height: '100%', position: 'absolute' },
  cardOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  cardContent: { flex: 1, padding: 14, justifyContent: 'flex-end' },
  categoryBadge: {
    backgroundColor: 'rgba(59,130,246,0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  categoryText: { color: '#93C5FD', fontSize: 11, fontWeight: '600' },
  cardTitle: { color: '#fff', fontSize: 16, fontWeight: '800', marginBottom: 4 },
  cardDesc: { color: 'rgba(255,255,255,0.7)', fontSize: 12, lineHeight: 16, marginBottom: 6 },
  playerCount: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
  continueCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.divider,
  },
  continueHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  continueLabel: { color: COLORS.textSecondary, fontSize: 13 },
  continueDay: { color: COLORS.textSecondary, fontSize: 13 },
  continueTitle: { color: COLORS.primary, fontSize: 16, fontWeight: '700', marginBottom: 4 },
  continueName: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 4 },
  continueFollowers: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 14 },
  playButton: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  playText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  myPresetRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  myPresetInfo: { flex: 1 },
  myPresetTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  myPresetSub: { color: COLORS.textSecondary, fontSize: 13, marginTop: 2 },
  myPresetChevron: { color: COLORS.textSecondary, fontSize: 22 },
  fab: {
    position: 'absolute', bottom: 32, alignSelf: 'center',
    width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
})
