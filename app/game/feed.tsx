import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert, ScrollView,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { COLORS } from '@/constants/colors'
import { useGameStore } from '@/store/gameStore'
import { useAI } from '@/hooks/useAI'
import { useGameLoop } from '@/hooks/useGameLoop'
import { PostCard } from '@/components/feed/PostCard'
import { ResultsToast } from '@/components/feed/ResultsToast'
import { EventBanner } from '@/components/feed/EventBanner'
import { Avatar } from '@/components/common/Avatar'
import { Post, GameEvent } from '@/types'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { generateId } from '@/utils/generateId'
import { formatFollowerCount } from '@/utils/statHelpers'

const ACTIVITY_TYPES = [
  { id: 'Collab Post', emoji: '🤝', label: 'Collab' },
  { id: 'Go Live Together', emoji: '🎥', label: 'Go Live' },
  { id: 'IRL Hangout', emoji: '🛋️', label: 'Hangout' },
  { id: 'Gossip Session', emoji: '🤫', label: 'Gossip' },
  { id: 'Host Event', emoji: '🎉', label: 'Host Event' },
  { id: 'Call Out', emoji: '📢', label: 'Call Out' },
  { id: 'Challenge', emoji: '🏆', label: 'Challenge' },
  { id: 'Romantic Date', emoji: '💕', label: 'Date' },
  { id: 'Expose Drama', emoji: '🔥', label: 'Expose' },
  { id: 'Group Chat Leak', emoji: '💬', label: 'Leak' },
  { id: 'Surprise Collab', emoji: '⚡', label: 'Surprise' },
  { id: 'Public Apology', emoji: '🙏', label: 'Apology' },
]

export default function FeedScreen() {
  const { session, resultToast, showResultToast, hideResultToast, refreshSession } = useGameStore()
  const { isGenerating, generateNewEvent, handlePlayerAction, loadInitialFeed, doActivity, advanceDay } = useAI()
  useGameLoop()

  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null)
  const [eventModalVisible, setEventModalVisible] = useState(false)
  const [postComposerVisible, setPostComposerVisible] = useState(false)
  const [activityModalVisible, setActivityModalVisible] = useState(false)
  const [dayModalVisible, setDayModalVisible] = useState(false)
  const [dayModalData, setDayModalData] = useState<{ daySummary: string; day: number } | null>(null)
  const [fabExpanded, setFabExpanded] = useState(false)
  const [postText, setPostText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAdvancingDay, setIsAdvancingDay] = useState(false)

  // Activity state
  const [selectedActivityType, setSelectedActivityType] = useState('')
  const [selectedCharIds, setSelectedCharIds] = useState<string[]>([])
  const [activityDesc, setActivityDesc] = useState('')
  const [activityStep, setActivityStep] = useState<'type' | 'chars' | 'desc'>('type')

  useEffect(() => {
    if (session) {
      loadInitialFeed()
      const pending = session.sharedEvents.find(e => !e.resolvedByUserId)
      if (pending) setActiveEvent(pending)
      else loadNextEvent()
    }
  }, [])

  const loadNextEvent = async () => {
    const event = await generateNewEvent()
    if (event) setActiveEvent(event)
  }

  const playerSlot = session?.players[0]
  const playerChar = session?.worldState.characters.find(c => c.id === playerSlot?.characterId)
  const allChars = session?.worldState.characters || []
  const npcChars = allChars.filter(c => c.id !== playerChar?.id)

  const getCharacter = (id: string) => allChars.find(c => c.id === id) || null

  const handleSubmitResponse = async () => {
    if (!responseText.trim() || !activeEvent) return
    setIsSubmitting(true)
    setEventModalVisible(false)
    const result = await handlePlayerAction(responseText.trim(), activeEvent.id)
    if (result) {
      showResultToast({
        visible: true,
        xpGained: result.xpGained,
        followersGained: result.followersGained,
        narrativeResult: result.narrativeResult,
        statChanges: result.statChanges,
      })
    }
    setResponseText('')
    setActiveEvent(null)
    setTimeout(() => loadNextEvent(), 2000)
    setIsSubmitting(false)
  }

  const handleSubmitPost = async () => {
    if (!postText.trim() || !session || !playerSlot || !playerChar) return
    setIsSubmitting(true)
    setPostComposerVisible(false)
    const post: Post = {
      id: generateId(),
      sessionId: session.id,
      authorCharacterId: playerChar.id,
      authorUserId: playerSlot.userId,
      content: postText.trim(),
      likes: 0,
      reposts: 0,
      replies: [],
      isPlayerPost: true,
      resolvedEventId: null,
      createdAt: Date.now(),
    }
    await LocalWorldSessionService.addPost(session.id, post)
    const result = await handlePlayerAction(`Posted: "${postText.trim()}"`)
    if (result) {
      showResultToast({
        visible: true,
        xpGained: result.xpGained,
        followersGained: result.followersGained,
        narrativeResult: result.narrativeResult,
        statChanges: result.statChanges,
      })
    }
    setPostText('')
    await refreshSession()
    setIsSubmitting(false)
  }

  const handleSubmitActivity = async () => {
    if (!selectedActivityType || selectedCharIds.length === 0) return
    setActivityModalVisible(false)
    setIsSubmitting(true)
    const result = await doActivity(selectedActivityType, activityDesc, selectedCharIds)
    if (result) {
      showResultToast({
        visible: true,
        xpGained: result.xpGained,
        followersGained: result.followersGained,
        narrativeResult: result.narrativeResult,
        statChanges: result.statChanges,
      })
    }
    setSelectedActivityType('')
    setSelectedCharIds([])
    setActivityDesc('')
    setActivityStep('type')
    setIsSubmitting(false)
  }

  const handleEndDay = async () => {
    if (isAdvancingDay) return
    setIsAdvancingDay(true)
    setFabExpanded(false)
    const result = await advanceDay()
    if (result && session) {
      setDayModalData({ daySummary: result.daySummary, day: session.worldState.dayNumber + 1 })
      setDayModalVisible(true)
      if (result.hasEvent) {
        const pending = session.sharedEvents.find(e => !e.resolvedByUserId)
        if (pending) setActiveEvent(pending)
      }
    }
    setIsAdvancingDay(false)
  }

  const toggleChar = (id: string) => {
    setSelectedCharIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.day}>☀️ Day {session.worldState.dayNumber}</Text>
        <View style={styles.headerCenter}>
          <View style={styles.unlimitedBadge}>
            <Text style={styles.unlimitedText}>✨ Unlimited</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.endDayBtn, isAdvancingDay && styles.endDayBtnDisabled]}
            onPress={handleEndDay}
            disabled={isAdvancingDay}
          >
            {isAdvancingDay
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.endDayText}>🌙 End Day</Text>
            }
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.headerIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {resultToast && (
        <ResultsToast
          visible={resultToast.visible}
          xpGained={resultToast.xpGained}
          followersGained={resultToast.followersGained}
          narrativeResult={resultToast.narrativeResult}
          statChanges={resultToast.statChanges}
          onDismiss={hideResultToast}
        />
      )}

      {activeEvent && !activeEvent.resolvedByUserId && (
        <EventBanner event={activeEvent} onPress={() => setEventModalVisible(true)} />
      )}

      <FlatList
        data={session.sharedFeed}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard post={item} character={getCharacter(item.authorCharacterId)} />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            {isGenerating
              ? <><ActivityIndicator color={COLORS.primary} /><Text style={styles.emptyText}>Loading your world...</Text></>
              : <Text style={styles.emptyText}>Your feed is loading. Events will appear soon.</Text>
            }
          </View>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {/* FAB */}
      {fabExpanded && (
        <TouchableOpacity style={styles.fabBackdrop} onPress={() => setFabExpanded(false)} activeOpacity={1} />
      )}
      {fabExpanded && (
        <View style={styles.fabMenu}>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabExpanded(false); setPostComposerVisible(true) }}>
            <Text style={styles.fabMenuEmoji}>📝</Text>
            <Text style={styles.fabMenuLabel}>Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fabMenuItem} onPress={() => { setFabExpanded(false); setActivityStep('type'); setActivityModalVisible(true) }}>
            <Text style={styles.fabMenuEmoji}>🎭</Text>
            <Text style={styles.fabMenuLabel}>Activity</Text>
          </TouchableOpacity>
        </View>
      )}
      <TouchableOpacity
        style={[styles.fab, fabExpanded && styles.fabActive]}
        onPress={() => setFabExpanded(!fabExpanded)}
        activeOpacity={0.85}
      >
        <Text style={[styles.fabText, fabExpanded && styles.fabTextRotated]}>{fabExpanded ? '✕' : '+'}</Text>
      </TouchableOpacity>

      {/* Event Response Modal */}
      <Modal visible={eventModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEventModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEventModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Respond to Event</Text>
            <TouchableOpacity onPress={handleSubmitResponse} disabled={!responseText.trim() || isSubmitting}>
              <Text style={[styles.modalSubmit, responseText.trim() && styles.modalSubmitActive]}>Submit</Text>
            </TouchableOpacity>
          </View>
          {activeEvent && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.eventBadgeRow}>
                <View style={styles.eventBadge}><Text style={styles.eventBadgeText}>🎭 Event</Text></View>
                <Text style={styles.eventXP}>+{activeEvent.xpMin}–{activeEvent.xpMax} XP</Text>
              </View>
              <Text style={styles.eventTitle}>{activeEvent.title}</Text>
              <Text style={styles.eventDesc}>{activeEvent.description}</Text>
              <TextInput
                style={styles.responseInput}
                placeholder="What do you do?"
                placeholderTextColor={COLORS.textSecondary}
                value={responseText}
                onChangeText={setResponseText}
                multiline
                autoFocus
              />
              {activeEvent.suggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsLabel}>💡 Quick responses</Text>
                  {activeEvent.suggestions.slice(0, 3).map((s, i) => (
                    <TouchableOpacity key={i} style={styles.suggestionPill} onPress={() => setResponseText(s)}>
                      <Text style={styles.suggestionText}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Post Composer Modal */}
      <Modal visible={postComposerVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPostComposerVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPostComposerVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity onPress={handleSubmitPost} disabled={!postText.trim() || isSubmitting}>
              <Text style={[styles.modalSubmit, postText.trim() && styles.modalSubmitActive]}>
                {isSubmitting ? '...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {playerChar && (
              <View style={styles.postComposerHeader}>
                <Avatar uri={playerChar.avatar} size={40} />
                <Text style={styles.postComposerName}>{playerChar.name}</Text>
              </View>
            )}
            <TextInput
              style={styles.postInput}
              placeholder={`What's on your mind?`}
              placeholderTextColor={COLORS.textSecondary}
              value={postText}
              onChangeText={setPostText}
              multiline
              autoFocus
            />
            <Text style={styles.postCharCount}>{postText.length}/280</Text>
          </View>
        </View>
      </Modal>

      {/* Activity Modal */}
      <Modal visible={activityModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setActivityModalVisible(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => {
              if (activityStep === 'type') { setActivityModalVisible(false) }
              else if (activityStep === 'chars') { setActivityStep('type') }
              else { setActivityStep('chars') }
            }}>
              <Text style={styles.modalClose}>{activityStep === 'type' ? '✕' : '←'}</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {activityStep === 'type' ? 'Pick Activity' : activityStep === 'chars' ? "Who's Involved?" : 'Describe it'}
            </Text>
            {activityStep === 'desc' ? (
              <TouchableOpacity onPress={handleSubmitActivity} disabled={selectedCharIds.length === 0 || isSubmitting}>
                <Text style={[styles.modalSubmit, selectedCharIds.length > 0 && styles.modalSubmitActive]}>
                  {isSubmitting ? '...' : 'Do It'}
                </Text>
              </TouchableOpacity>
            ) : activityStep === 'chars' ? (
              <TouchableOpacity onPress={() => selectedCharIds.length > 0 && setActivityStep('desc')} disabled={selectedCharIds.length === 0}>
                <Text style={[styles.modalSubmit, selectedCharIds.length > 0 && styles.modalSubmitActive]}>Next</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 50 }} />
            )}
          </View>

          {activityStep === 'type' && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.activitySectionLabel}>What are you doing?</Text>
              <View style={styles.activityGrid}>
                {ACTIVITY_TYPES.map(a => (
                  <TouchableOpacity
                    key={a.id}
                    style={[styles.activityCell, selectedActivityType === a.id && styles.activityCellActive]}
                    onPress={() => { setSelectedActivityType(a.id); setActivityStep('chars') }}
                  >
                    <Text style={styles.activityEmoji}>{a.emoji}</Text>
                    <Text style={styles.activityLabel}>{a.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {activityStep === 'chars' && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.activitySectionLabel}>Who do you want to involve?</Text>
              <Text style={styles.activitySectionHint}>Tap to select — you can pick multiple</Text>
              {npcChars.map(char => {
                const rel = playerSlot?.gameState.relationships[char.id]
                const isSelected = selectedCharIds.includes(char.id)
                return (
                  <TouchableOpacity
                    key={char.id}
                    style={[styles.charRow, isSelected && styles.charRowSelected]}
                    onPress={() => toggleChar(char.id)}
                    activeOpacity={0.8}
                  >
                    <Avatar uri={char.avatar} size={44} />
                    <View style={styles.charInfo}>
                      <Text style={styles.charName}>{char.name}</Text>
                      <Text style={styles.charHandle}>@{char.handle}</Text>
                      {rel && <Text style={styles.charChem}>{rel.chemistry} · {rel.value}%</Text>}
                    </View>
                    <View style={[styles.charCheck, isSelected && styles.charCheckActive]}>
                      {isSelected && <Text style={styles.charCheckText}>✓</Text>}
                    </View>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          )}

          {activityStep === 'desc' && (
            <ScrollView style={styles.modalContent}>
              <Text style={styles.activitySectionLabel}>{selectedActivityType}</Text>
              <Text style={styles.activitySectionHint}>
                With: {selectedCharIds.map(id => allChars.find(c => c.id === id)?.name).filter(Boolean).join(', ')}
              </Text>
              <TextInput
                style={[styles.responseInput, { marginTop: 16 }]}
                placeholder="Describe what happens, what you want, or just leave blank and let the AI decide..."
                placeholderTextColor={COLORS.textSecondary}
                value={activityDesc}
                onChangeText={setActivityDesc}
                multiline
                autoFocus
                numberOfLines={5}
              />
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Day Transition Modal */}
      <Modal visible={dayModalVisible} animationType="fade" transparent>
        <View style={styles.dayOverlay}>
          <View style={styles.dayCard}>
            <Text style={styles.dayCardEmoji}>🌅</Text>
            <Text style={styles.dayCardTitle}>Day {dayModalData?.day}</Text>
            <Text style={styles.dayCardSummary}>{dayModalData?.daySummary}</Text>
            <TouchableOpacity
              style={styles.dayCardButton}
              onPress={() => {
                setDayModalVisible(false)
                const pending = session?.sharedEvents.find(e => !e.resolvedByUserId)
                if (pending) { setActiveEvent(pending) }
                else { loadNextEvent() }
              }}
            >
              <Text style={styles.dayCardButtonText}>Start the Day →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  day: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', minWidth: 70 },
  headerCenter: { alignItems: 'center' },
  unlimitedBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  unlimitedText: { color: COLORS.positive, fontSize: 12, fontWeight: '600' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  endDayBtn: { backgroundColor: '#1A1A2E', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: '#4B5563', minWidth: 90, alignItems: 'center' },
  endDayBtnDisabled: { opacity: 0.5 },
  endDayText: { color: '#C4B5FD', fontSize: 12, fontWeight: '600' },
  headerIcon: { fontSize: 18, color: COLORS.textSecondary },
  emptyFeed: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  fabBackdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  fabMenu: { position: 'absolute', bottom: 90, right: 20, gap: 10 },
  fabMenuItem: { backgroundColor: '#1A1A1A', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#2A2A2A', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabMenuEmoji: { fontSize: 20 },
  fabMenuLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  fab: { position: 'absolute', bottom: 24, right: 20, width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  fabActive: { backgroundColor: '#374151' },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  fabTextRotated: { fontSize: 20, marginTop: 0 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  modalClose: { color: COLORS.textPrimary, fontSize: 18, width: 40 },
  modalTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: '700' },
  modalSubmit: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  modalSubmitActive: { color: COLORS.primary },
  modalContent: { flex: 1, padding: 20 },
  eventBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  eventBadge: { backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  eventBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  eventXP: { color: COLORS.xp, fontSize: 14, fontWeight: '700' },
  eventTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  eventDesc: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  responseInput: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, color: COLORS.textPrimary, fontSize: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.divider },
  suggestionsSection: { marginTop: 20 },
  suggestionsLabel: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  suggestionPill: { borderWidth: 1.5, borderColor: COLORS.divider, borderStyle: 'dashed', borderRadius: 12, padding: 12, marginBottom: 8 },
  suggestionText: { color: COLORS.textSecondary, fontSize: 14 },
  postComposerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  postComposerName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  postInput: { color: COLORS.textPrimary, fontSize: 18, minHeight: 150, textAlignVertical: 'top' },
  postCharCount: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'right', marginTop: 8 },
  activitySectionLabel: { color: '#fff', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  activitySectionHint: { color: '#9CA3AF', fontSize: 13, marginBottom: 16 },
  activityGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  activityCell: { width: '30%', aspectRatio: 1, backgroundColor: '#1A1A1A', borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#2A2A2A' },
  activityCellActive: { borderColor: COLORS.primary, backgroundColor: 'rgba(59,130,246,0.1)' },
  activityEmoji: { fontSize: 26, marginBottom: 4 },
  activityLabel: { color: '#9CA3AF', fontSize: 11, fontWeight: '600', textAlign: 'center' },
  charRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#1A1A1A' },
  charRowSelected: { backgroundColor: 'rgba(59,130,246,0.05)', borderRadius: 12 },
  charInfo: { flex: 1 },
  charName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  charHandle: { color: '#9CA3AF', fontSize: 13 },
  charChem: { color: '#6B7280', fontSize: 11, marginTop: 2 },
  charCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: '#2A2A2A', alignItems: 'center', justifyContent: 'center' },
  charCheckActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  charCheckText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  dayOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center' },
  dayCard: { backgroundColor: '#111827', borderRadius: 24, padding: 32, marginHorizontal: 24, alignItems: 'center', borderWidth: 1, borderColor: '#1F2937' },
  dayCardEmoji: { fontSize: 48, marginBottom: 12 },
  dayCardTitle: { color: '#fff', fontSize: 28, fontWeight: '900', marginBottom: 12 },
  dayCardSummary: { color: '#9CA3AF', fontSize: 15, lineHeight: 22, textAlign: 'center', marginBottom: 24 },
  dayCardButton: { backgroundColor: COLORS.primary, borderRadius: 999, paddingVertical: 14, paddingHorizontal: 32 },
  dayCardButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
