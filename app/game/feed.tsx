import React, { useEffect, useState, useCallback } from 'react'
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, Alert,
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
import { Post, GameEvent } from '@/types'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { generateId } from '@/utils/generateId'
import { formatFollowerCount } from '@/utils/statHelpers'

export default function FeedScreen() {
  const { session, resultToast, showResultToast, hideResultToast, refreshSession } = useGameStore()
  const { isGenerating, generateNewEvent, handlePlayerAction, loadInitialFeed } = useAI()
  useGameLoop()

  const [activeEvent, setActiveEvent] = useState<GameEvent | null>(null)
  const [eventModalVisible, setEventModalVisible] = useState(false)
  const [postComposerVisible, setPostComposerVisible] = useState(false)
  const [postText, setPostText] = useState('')
  const [responseText, setResponseText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (session) {
      loadInitialFeed()
      // Load or create pending event
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

  if (!session) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator color={COLORS.primary} size="large" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Feed Header */}
      <View style={styles.header}>
        <Text style={styles.day}>☀️ Day {session.worldState.dayNumber}</Text>
        <View style={styles.headerCenter}>
          <View style={styles.unlimitedBadge}>
            <Text style={styles.unlimitedText}>✨ Unlimited</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/customize-world')}>
            <Text style={styles.headerIcon}>⚙️</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.replace('/')}>
            <Text style={styles.headerIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results toast */}
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

      {/* Active event banner */}
      {activeEvent && !activeEvent.resolvedByUserId && (
        <EventBanner
          event={activeEvent}
          onPress={() => setEventModalVisible(true)}
        />
      )}

      {/* Feed */}
      <FlatList
        data={session.sharedFeed}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            character={getCharacter(item.authorCharacterId)}
          />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyFeed}>
            {isGenerating ? (
              <>
                <ActivityIndicator color={COLORS.primary} />
                <Text style={styles.emptyText}>Loading your world...</Text>
              </>
            ) : (
              <Text style={styles.emptyText}>Your feed is loading. Events will appear soon.</Text>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Post composer FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setPostComposerVisible(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Event Response Modal */}
      <Modal
        visible={eventModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEventModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEventModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>+ Add a Power-up</Text>
            <TouchableOpacity
              onPress={handleSubmitResponse}
              disabled={!responseText.trim() || isSubmitting}
            >
              <Text style={[styles.modalSubmit, responseText.trim() && styles.modalSubmitActive]}>
                Submit
              </Text>
            </TouchableOpacity>
          </View>

          {activeEvent && (
            <View style={styles.modalContent}>
              <View style={styles.eventBadgeRow}>
                <View style={styles.eventBadge}>
                  <Text style={styles.eventBadgeText}>🎭 Event</Text>
                </View>
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

              {/* Suggestions */}
              {activeEvent.suggestions.length > 0 && (
                <View style={styles.suggestionsSection}>
                  <Text style={styles.suggestionsLabel}>💡 Suggestions</Text>
                  <View style={styles.suggestions}>
                    {activeEvent.suggestions.slice(0, 3).map((s, i) => (
                      <TouchableOpacity
                        key={i}
                        style={styles.suggestionPill}
                        onPress={() => setResponseText(s)}
                      >
                        <Text style={styles.suggestionText}>{s}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>

      {/* Post Composer Modal */}
      <Modal
        visible={postComposerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPostComposerVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setPostComposerVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Post</Text>
            <TouchableOpacity
              onPress={handleSubmitPost}
              disabled={!postText.trim() || isSubmitting}
            >
              <Text style={[styles.modalSubmit, postText.trim() && styles.modalSubmitActive]}>
                {isSubmitting ? '...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.postInput}
              placeholder={`What's on your mind, ${playerChar?.name || 'you'}?`}
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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  day: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  headerCenter: { alignItems: 'center' },
  unlimitedBadge: { backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  unlimitedText: { color: COLORS.positive, fontSize: 12, fontWeight: '600' },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerIcon: { fontSize: 18 },
  emptyFeed: { paddingTop: 80, alignItems: 'center', gap: 12 },
  emptyText: { color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 54, height: 54, borderRadius: 27, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  fabText: { color: '#fff', fontSize: 28, fontWeight: '300', marginTop: -2 },
  modal: { flex: 1, backgroundColor: COLORS.background },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  modalClose: { color: COLORS.textPrimary, fontSize: 18 },
  modalTitle: { color: COLORS.textSecondary, fontSize: 14 },
  modalSubmit: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  modalSubmitActive: { color: COLORS.textPrimary },
  modalContent: { padding: 20 },
  eventBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  eventBadge: { backgroundColor: 'rgba(59,130,246,0.2)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  eventBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: '600' },
  eventXP: { color: COLORS.xp, fontSize: 14, fontWeight: '700' },
  eventTitle: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800', marginBottom: 10 },
  eventDesc: { color: COLORS.textSecondary, fontSize: 15, lineHeight: 22, marginBottom: 20 },
  responseInput: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14, color: COLORS.textPrimary, fontSize: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 1, borderColor: COLORS.divider },
  suggestionsSection: { marginTop: 20 },
  suggestionsLabel: { color: COLORS.textSecondary, fontSize: 13, marginBottom: 10 },
  suggestions: { gap: 8 },
  suggestionPill: { borderWidth: 1.5, borderColor: COLORS.divider, borderStyle: 'dashed', borderRadius: 12, padding: 12 },
  suggestionText: { color: COLORS.textSecondary, fontSize: 14 },
  postInput: { color: COLORS.textPrimary, fontSize: 18, minHeight: 150, textAlignVertical: 'top' },
  postCharCount: { color: COLORS.textSecondary, fontSize: 12, textAlign: 'right', marginTop: 8 },
})
