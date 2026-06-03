import React, { useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { StatBar } from '@/components/common/StatBar'
import { formatFollowerCount } from '@/utils/statHelpers'
import { LocalWorldSessionService } from '@/services/worldSessionService'

export default function GoalsScreen() {
  const { session, dispatch, refreshSession } = useGameStore()

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color="#3B82F6" />
        </View>
      </SafeAreaView>
    )
  }

  const playerSlot = session.players[0]
  const gs = playerSlot?.gameState
  if (!gs) return null

  const xpPercent = gs.xpToNextLevel > 0 ? (gs.xp / gs.xpToNextLevel) * 100 : 0
  const milestones = session.worldState.milestones
  const nextMilestone = milestones.find(m => !m.isCompleted)
  const sideQuests = session.worldState.sideQuests

  const handleUpgradeSkill = async (skillName: string) => {
    if (!gs.skillPoints || gs.skillPoints < 1) return
    const skill = gs.skills[skillName]
    if (!skill) return
    await dispatch({
      type: 'SKILL_UPGRADED',
      payload: { userId: playerSlot.userId, skillName, newValue: skill.value + 5 },
    })
    await LocalWorldSessionService.updatePlayerState(session.id, playerSlot.userId, {
      skillPoints: gs.skillPoints - 1,
    })
    await refreshSession()
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>Lvl {gs.level}</Text>
        </View>
        <View style={styles.xpBarContainer}>
          <View style={styles.xpBarBg}>
            <View style={[styles.xpBarFill, { width: `${xpPercent}%` }]} />
          </View>
          <Text style={styles.xpText}>{gs.xp}/{gs.xpToNextLevel} XP</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.headerIcon}>🔖</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Main goal */}
        <View style={styles.goalCard}>
          <Text style={styles.goalTitle}>{session.worldState.mainGoal}</Text>
          <View style={styles.goalProgressRow}>
            <View style={styles.goalProgressBg}>
              <View style={[styles.goalProgressFill, { width: `${gs.mainGoalProgress}%` }]} />
            </View>
            <Text style={styles.goalPercent}>{gs.mainGoalProgress}%</Text>
          </View>
          <Text style={styles.goalDesc}>Keep playing to progress toward your main goal.</Text>
          <TouchableOpacity
            style={styles.customizeBtn}
            onPress={() => router.push('/customize-world')}
          >
            <Text style={styles.customizeBtnText}>⚙️ Customize world</Text>
          </TouchableOpacity>
        </View>

        {/* Milestones track */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Milestones</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.milestonesRow}>
            {milestones.map((m, i) => (
              <View key={m.id} style={styles.milestoneItem}>
                <View style={[styles.milestoneDot, m.isCompleted && styles.milestoneDotDone]}>
                  <Text style={styles.milestoneDotText}>{m.isCompleted ? '✓' : i + 1}</Text>
                </View>
                {i < milestones.length - 1 && <View style={styles.milestoneLine} />}
                <Text style={styles.milestoneLabel} numberOfLines={2}>{m.title}</Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Next milestone */}
        {nextMilestone && (
          <View style={styles.nextMilestoneCard}>
            <Text style={styles.nextMilestoneTitle}>{nextMilestone.title}</Text>
            {nextMilestone.requirements.map((req, i) => (
              <View key={i} style={styles.requirementRow}>
                <Text style={styles.requirementIcon}>{req.isCompleted ? '✓' : '🔥'}</Text>
                <Text style={[styles.requirementText, req.isCompleted && styles.requirementDone]}>
                  {req.name}{req.pointsNeeded > 1 ? ` (+${req.pointsNeeded} needed)` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Side quests */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Side Quests</Text>
          {sideQuests.map(sq => (
            <View key={sq.id} style={styles.sideQuestRow}>
              <View style={[styles.sqCheck, sq.isCompleted && styles.sqCheckDone]}>
                {sq.isCompleted && <Text style={styles.sqCheckText}>✓</Text>}
              </View>
              <Text style={[styles.sqDesc, sq.isCompleted && styles.sqDescDone]}>{sq.description}</Text>
              <Text style={styles.sqXP}>⭐ +{sq.xpReward} XP</Text>
            </View>
          ))}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <View style={styles.skillsHeader}>
            <Text style={styles.sectionTitle}>Skills</Text>
            {gs.skillPoints > 0 && (
              <Text style={styles.skillPoints}>{gs.skillPoints} points to use</Text>
            )}
          </View>
          {Object.entries(gs.skills).map(([name, skill]) => (
            <View key={name} style={styles.skillRow}>
              <View style={styles.skillInfo}>
                <Text style={styles.skillName}>{name}</Text>
                <Text style={styles.skillFlavor}>{skill.flavorText}</Text>
              </View>
              <View style={styles.skillRight}>
                <StatBar
                  label=""
                  value={skill.value}
                  color="#F97316"
                  style={{ marginBottom: 0, width: 80 }}
                />
                <Text style={styles.skillValue}>{skill.value}</Text>
                {gs.skillPoints > 0 && (
                  <TouchableOpacity
                    style={styles.upgradeBtn}
                    onPress={() => handleUpgradeSkill(name)}
                  >
                    <Text style={styles.upgradeBtnText}>+</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A' },
  levelBadge: { backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { color: '#000', fontWeight: '800', fontSize: 13 },
  xpBarContainer: { flex: 1 },
  xpBarBg: { height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, marginBottom: 3 },
  xpBarFill: { height: 6, backgroundColor: '#F59E0B', borderRadius: 3 },
  xpText: { color: '#9CA3AF', fontSize: 11 },
  headerIcon: { fontSize: 18 },
  goalCard: { margin: 16, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  goalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  goalProgressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  goalProgressBg: { flex: 1, height: 8, backgroundColor: '#2A2A2A', borderRadius: 4 },
  goalProgressFill: { height: 8, backgroundColor: '#3B82F6', borderRadius: 4 },
  goalPercent: { color: '#3B82F6', fontSize: 13, fontWeight: '700', width: 36 },
  goalDesc: { color: '#9CA3AF', fontSize: 13, lineHeight: 18, marginBottom: 12 },
  customizeBtn: { backgroundColor: '#222222', borderRadius: 999, paddingVertical: 10, alignItems: 'center' },
  customizeBtnText: { color: '#9CA3AF', fontSize: 13 },
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 14 },
  milestonesRow: { paddingBottom: 8 },
  milestoneItem: { alignItems: 'center', marginRight: 8, maxWidth: 80 },
  milestoneDot: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  milestoneDotDone: { backgroundColor: '#3B82F6' },
  milestoneDotText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  milestoneLine: { position: 'absolute', top: 18, left: 36, width: 30, height: 2, backgroundColor: '#2A2A2A' },
  milestoneLabel: { color: '#9CA3AF', fontSize: 10, textAlign: 'center' },
  nextMilestoneCard: { marginHorizontal: 16, marginBottom: 24, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
  nextMilestoneTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  requirementRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  requirementIcon: { fontSize: 14, width: 20 },
  requirementText: { color: '#9CA3AF', fontSize: 14 },
  requirementDone: { color: '#22C55E', textDecorationLine: 'line-through' },
  sideQuestRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', gap: 12 },
  sqCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  sqCheckDone: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  sqCheckText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  sqDesc: { flex: 1, color: '#fff', fontSize: 14 },
  sqDescDone: { color: '#9CA3AF', textDecorationLine: 'line-through' },
  sqXP: { color: '#F59E0B', fontSize: 13, fontWeight: '600' },
  skillsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  skillPoints: { color: '#F97316', fontSize: 13, fontWeight: '600' },
  skillRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#2A2A2A', gap: 12 },
  skillInfo: { flex: 1 },
  skillName: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 2 },
  skillFlavor: { color: '#9CA3AF', fontSize: 12 },
  skillRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  skillValue: { color: '#fff', fontSize: 13, fontWeight: '700', width: 32, textAlign: 'center' },
  upgradeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F97316', alignItems: 'center', justifyContent: 'center' },
  upgradeBtnText: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: -2 },
})
