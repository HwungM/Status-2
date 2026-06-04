import { useEffect, useRef, useCallback } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { useGameStore } from '@/store/gameStore'
import { useStoryArc } from './useStoryArc'
import { generateNPCAutonomousPost, generateRandomWorldEvent } from '@/services/openaiService'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { generateId } from '@/utils/generateId'
import { Post, Notification, GameEvent } from '@/types'

const NPC_POST_INTERVAL_MS = 40000  // 40 seconds
const RANDOM_EVENT_INTERVAL_MS = 90000 // 90 seconds

export function useGameLoop() {
  const { session, refreshSession } = useGameStore()
  const { processConsequences, checkActProgression } = useStoryArc()
  const actionCountRef = useRef(0)
  const appStateRef = useRef<AppStateStatus>('active')
  const npcIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const randomEventIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!session) return
    const playerSlot = session.players[0]
    if (!playerSlot) return

    const currentActions = playerSlot.gameState.totalActionsThisSession
    if (currentActions > actionCountRef.current) {
      actionCountRef.current = currentActions
      processConsequences()
      checkActProgression()
    }
  }, [session?.players[0]?.gameState.totalActionsThisSession])

  const triggerNPCAutonomousPost = useCallback(async () => {
    if (!session) return
    if (appStateRef.current !== 'active') return

    const playerSlot = session.players[0]
    const playerCharacter = session.worldState.characters.find(c => c.id === playerSlot?.characterId)
    if (!playerSlot || !playerCharacter) return

    try {
      const npcPosts = await generateNPCAutonomousPost(
        session.worldState,
        session.storyArc,
        playerSlot.gameState,
        playerCharacter,
        session.worldState.characters,
        session.sharedFeed.slice(0, 20),
      )

      for (const np of npcPosts) {
        const post: Post = {
          id: generateId(),
          sessionId: session.id,
          authorCharacterId: np.characterId,
          authorUserId: null,
          content: np.content,
          likes: np.likes,
          reposts: np.reposts,
          replies: [],
          isPlayerPost: false,
          resolvedEventId: null,
          createdAt: Date.now(),
        }
        await LocalWorldSessionService.addPost(session.id, post)

        if (np.mentionsPlayer) {
          const notification: Notification = {
            id: generateId(),
            sessionId: session.id,
            type: 'reaction',
            sourceCharacterId: np.characterId,
            title: 'mentioned you in a post',
            preview: np.content.slice(0, 100),
            createdAt: Date.now(),
            isRead: false,
          }
          await LocalWorldSessionService.addNotification(session.id, notification)
        }
      }

      await refreshSession()
    } catch {
      // Silent fail — autonomous posts are best-effort
    }
  }, [session])

  const triggerRandomWorldEvent = useCallback(async () => {
    if (!session) return
    if (appStateRef.current !== 'active') return

    const playerSlot = session.players[0]
    const playerCharacter = session.worldState.characters.find(c => c.id === playerSlot?.characterId)
    if (!playerSlot || !playerCharacter) return

    try {
      const randomEvent = await generateRandomWorldEvent(
        session.worldState,
        session.storyArc,
        playerSlot.gameState,
        playerCharacter,
        session.worldState.characters,
      )

      if (!randomEvent) return // 40% chance returns null

      // Add NPC post to feed if included
      if (randomEvent.npcPost) {
        const post: Post = {
          id: generateId(),
          sessionId: session.id,
          authorCharacterId: randomEvent.npcPost.characterId,
          authorUserId: null,
          content: randomEvent.npcPost.content,
          likes: randomEvent.npcPost.likes,
          reposts: randomEvent.npcPost.reposts,
          replies: [],
          isPlayerPost: false,
          resolvedEventId: null,
          createdAt: Date.now(),
        }
        await LocalWorldSessionService.addPost(session.id, post)
      }

      // Add as a game event the player can respond to
      const event: GameEvent = {
        id: generateId(),
        sessionId: session.id,
        title: randomEvent.title,
        description: randomEvent.description,
        xpMin: randomEvent.xpMin,
        xpMax: randomEvent.xpMax,
        suggestions: randomEvent.suggestions,
        resolvedByUserId: null,
        resolvedByResponse: null,
        isFromStoryArc: false,
        createdAt: Date.now(),
      }
      await LocalWorldSessionService.addEvent(session.id, event)

      // Notify player
      const notification: Notification = {
        id: generateId(),
        sessionId: session.id,
        type: 'reaction',
        sourceCharacterId: session.worldState.characters.find(c => c.id !== playerCharacter.id)?.id || playerCharacter.id,
        title: randomEvent.title,
        preview: randomEvent.description.slice(0, 100),
        createdAt: Date.now(),
        isRead: false,
      }
      await LocalWorldSessionService.addNotification(session.id, notification)

      await refreshSession()
    } catch {
      // Silent fail
    }
  }, [session])

  useEffect(() => {
    const handleAppStateChange = (state: AppStateStatus) => {
      appStateRef.current = state
    }
    const sub = AppState.addEventListener('change', handleAppStateChange)
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (!session) return

    if (npcIntervalRef.current) clearInterval(npcIntervalRef.current)
    if (randomEventIntervalRef.current) clearInterval(randomEventIntervalRef.current)

    // Fire immediately on mount so the feed starts populating right away
    setTimeout(() => { if (appStateRef.current === 'active') triggerNPCAutonomousPost() }, 3000)

    npcIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') triggerNPCAutonomousPost()
    }, NPC_POST_INTERVAL_MS)

    randomEventIntervalRef.current = setInterval(() => {
      if (appStateRef.current === 'active') triggerRandomWorldEvent()
    }, RANDOM_EVENT_INTERVAL_MS)

    return () => {
      if (npcIntervalRef.current) { clearInterval(npcIntervalRef.current); npcIntervalRef.current = null }
      if (randomEventIntervalRef.current) { clearInterval(randomEventIntervalRef.current); randomEventIntervalRef.current = null }
    }
  }, [session?.id, triggerNPCAutonomousPost, triggerRandomWorldEvent])
}
