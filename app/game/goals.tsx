import React, { useState } from 'react'
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Modal, Animated,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { StatBar } from '@/components/common/StatBar'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { LegendProgress } from '@/types'

interface LegendRequirement {
  key: keyof LegendProgress
  label: string
  description: string
  emoji: string
}

const LEGEND_REQUIREMENTS: LegendRequirement[] = [
  { key: 'followersReached', label: '500K Followers', description: 'Amass 500,000+ followers', emoji: '👥' },
  { key: 'survivedScandal', label: 'Scandal Survivor', description: 'Survive at least one scandal', emoji: '🛡️' },
  { key: 'mainGoalCompleted', label: 'Goal Achieved', description: 'Complete your main goal (100%)', emoji: '🎯' },
  { key: 'relationshipsBuilt', label: 'Inner Circle', description: '3+ relationships above 50%', emoji: '💞' },
  { key: 'rivalExists', label: 'Iconic Rivalry', description: 'Have a rival or enemy', emoji: '⚔️' },
  { key: 'act3Reached', label: 'Act 3 Reached', description: 'Reach the climax of your story', emoji: '🎭' },
]

function LegendCelebration({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={celebStyles.backdrop}>
        <View style={celebStyles.card}>
          <Text style={celebStyles.crown}>👑</Text>
          <Text style={celebStyles.title}>LEGEND UNLOCKED</Text>
          <Text style={celebStyles.subtitle}>You've become a true legend.</Text>
          <Text style={celebStyles.body}>
            All six requirements met. Your story will be remembered forever.
          </Text>
          <TouchableOpacity style={celebStyles.btn} onPress={onClose}>
            <Text style={celebStyles.btnText}>I am a Legend 👑</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

export default function GoalsScreen() {
  const { session, dispatch, refreshSession } = useGameStore()
  const [showLegendCelebration, setShowLegendCelebration] = useState(false)
  const [celebShown, setCelebShown] = useState(false)

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

  const legendProgress = session.worldState.legendProgress
  const legendMet = legendProgress
    ? LEGEND_REQUIREMENTS.filter(r => legendProgress[r.key]).length
    : 0
  const legendTotal = LEGEND_REQUIREMENTS.length

  if (legendProgress?.legendUnlocked && !celebShown) {
    setCelebShown(true)
    setShowLegendCelebration(true)
  }

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

        {/* Legend Status Section */}
        <View style={[styles.legendCard, legendProgress?.legendUnlocked && styles.legendCardUnlocked]}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendCrown}>👑</Text>
            <View style={styles.legendTitles}>
              <Text style={styles.legendTitle}>Become a Legend</Text>
              <Text style={styles.legendSubtitle}>{legendMet}/{legendTotal} requirements met</Text>
            </View>
            {legendProgress?.legendUnlocked && (
              <View style={styles.legendUnlockedBadge}>
                <Text style={styles.legendUnlockedText}>UNLOCKED</Text>
              </View>
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.legendProgressBg}>
            <View style={[
              styles.legendProgressFill,
              { width: `${(legendMet / legendTotal) * 100}%` },
              legendProgress?.legendUnlocked && styles.legendProgressFillDone,
            ]} />
          </View>

          {/* Requirements list */}
          <View style={styles.legendList}>
            {LEGEND_REQUIREMENTS.map(req => {
              const met = legendProgress ? !!legendProgress[req.key] : false
              return (
                <View key={req.key} style={styles.legendReq}>
                  <Text style={styles.legendReqEmoji}>{req.emoji}</Text>
                  <View style={styles.legendReqInfo}>
                    <Text style={[styles.legendReqLabel, met && styles.legendReqDone]}>{req.label}</Text>
                    <Text style={styles.legendReqDesc}>{req.description}</Text>
                  </View>
                  <Text style={[styles.legendReqCheck, met && styles.legendReqCheckDone]}>
                    {met ? '✓' : '○'}
                  </Text>
                </View>
              )
            })}
          </View>
        </View>

        {/* Follower goal card */}
        {(() => {
          const mainGoal = session.worldState.mainGoal || ''
          const goalMatch = mainGoal.match(/Reach (\d+(?:\.\d+)?[KM]?) followers/)
          const goalLabel = goalMatch ? goalMatch[1] : null
          const goalTargets: Record<string, number> = { '10K': 10000, '100K': 100000, '1M': 1000000, '10M': 10000000, '100M': 100000000 }
          const goalTarget = goalLabel ? (goalTargets[goalLabel] || 1000000) : 1000000
          const followerPct = Math.min(100, (gs.followerCount / goalTarget) * 100)
          const formatNum = (n: number) => n >= 1000000 ? `${(n/1000000).toFixed(1)}M` : n >= 1000 ? `${(n/1000).toFixed(0)}K` : n.toString()
          return (
            <View style={styles.goalCard}>
              <Text style={styles.goalTitle}>{mainGoal}</Text>
              <View style={styles.goalProgressRow}>
                <View style={styles.goalProgressBg}>
                  <View style={[styles.goalProgressFill, { width: `${followerPct}%` }]} />
                </View>
                <Text style={styles.goalPercent}>{Math.floor(followerPct)}%</Text>
              </View>
              <Text style={styles.goalDesc}>
                {formatNum(gs.followerCount)} / {formatNum(goalTarget)} followers
              </Text>
              <TouchableOpacity style={styles.customizeBtn} onPress={() => router.push('/customize-world')}>
                <Text style={styles.customizeBtnText}>⚙️ Customize world</Text>
              </TouchableOpacity>
            </View>
          )
        })()}

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

      <LegendCelebration
        visible={showLegendCelebration}
        onClose={() => setShowLegendCelebration(false)}
      />
    </SafeAreaView>
  )
}

const celebStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#0D0D0D',
    borderRadius: 28,
    padding: 36,
    marginHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 30,
    elevation: 20,
  },
  crown: { fontSize: 72, marginBottom: 16 },
  title: { color: '#F59E0B', fontSize: 28, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  subtitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 12 },
  body: { color: '#9CA3AF', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 28 },
  btn: { backgroundColor: '#F59E0B', borderRadius: 999, paddingVertical: 14, paddingHorizontal: 36 },
  btnText: { color: '#000', fontSize: 16, fontWeight: '800' },
})

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A0A0A' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  levelBadge: { backgroundColor: '#F59E0B', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { color: '#000', fontWeight: '800', fontSize: 13 },
  xpBarContainer: { flex: 1 },
  xpBarBg: { height: 6, backgroundColor: '#2A2A2A', borderRadius: 3, marginBottom: 3 },
  xpBarFill: { height: 6, backgroundColor: '#F59E0B', borderRadius: 3 },
  xpText: { color: '#9CA3AF', fontSize: 11 },
  headerIcon: { fontSize: 18 },

  // Legend Card
  legendCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#111218',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  legendCardUnlocked: {
    borderColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  legendCrown: { fontSize: 32 },
  legendTitles: { flex: 1 },
  legendTitle: { color: '#fff', fontSize: 17, fontWeight: '800' },
  legendSubtitle: { color: '#9CA3AF', fontSize: 13, marginTop: 2 },
  legendUnlockedBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  legendUnlockedText: { color: '#F59E0B', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  legendProgressBg: {
    height: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 3,
    marginBottom: 16,
    overflow: 'hidden',
  },
  legendProgressFill: {
    height: 6,
    backgroundColor: '#A855F7',
    borderRadius: 3,
  },
  legendProgressFillDone: { backgroundColor: '#F59E0B' },
  legendList: { gap: 12 },
  legendReq: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  legendReqEmoji: { fontSize: 20, width: 28, textAlign: 'center' },
  legendReqInfo: { flex: 1 },
  legendReqLabel: { color: '#E5E7EB', fontSize: 14, fontWeight: '600' },
  legendReqDone: { color: '#22C55E' },
  legendReqDesc: { color: '#6B7280', fontSize: 12, marginTop: 1 },
  legendReqCheck: { color: '#4B5563', fontSize: 18, fontWeight: '700' },
  legendReqCheckDone: { color: '#22C55E' },

  goalCard: { margin: 16, marginTop: 8, backgroundColor: '#1A1A1A', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2A2A2A' },
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
