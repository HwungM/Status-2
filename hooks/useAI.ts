import { useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/store/uiStore'
import {
  generateEvent, resolvePlayerAction, generateFeedPosts,
  generateDMResponse, initializeStoryArc, generateWorldInspiration,
  generateSideQuests, ActionResult,
} from '@/services/openaiService'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { v4 as uuidv4 } from 'uuid'
import { Post, GameEvent, Notification } from '@/types'

export function useAI() {
  const { session, dispatch, refreshSession } = useGameStore()
  const { showToast } = useUIStore()
  const [isGenerating, setIsGenerating] = useState(false)

  const getContext = () => {
    if (!session) return null
    const playerSlot = session.players[0]
    const playerCharacter = session.worldState.characters.find(c => c.id === playerSlot?.characterId)
    if (!playerSlot || !playerCharacter) return null
    return { playerSlot, playerCharacter, worldState: session.worldState, storyArc: session.storyArc }
  }

  const generateNewEvent = useCallback(async () => {
    const ctx = getContext()
    if (!ctx || !session) return null
    setIsGenerating(true)
    try {
      const event = await generateEvent(
        ctx.worldState, ctx.storyArc, ctx.playerSlot.gameState,
        ctx.playerCharacter, ctx.worldState.characters, session.sharedFeed,
      )
      event.sessionId = session.id
      await LocalWorldSessionService.addEvent(session.id, event)
      await refreshSession()
      return event
    } catch (e: any) {
      showToast(e.message, 'error')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [session])

  const handlePlayerAction = useCallback(async (action: string, eventId?: string): Promise<ActionResult | null> => {
    const ctx = getContext()
    if (!ctx || !session) return null
    setIsGenerating(true)
    try {
      const result = await resolvePlayerAction(
        action, ctx.worldState, ctx.storyArc, ctx.playerSlot.gameState,
        ctx.playerCharacter, ctx.worldState.characters, session.sharedFeed,
      )

      // Dispatch all state changes
      if (result.xpGained > 0) {
        await dispatch({ type: 'XP_GAINED', payload: { userId: ctx.playerSlot.userId, amount: result.xpGained } })
      }
      if (result.followersGained !== 0) {
        await dispatch({ type: 'FOLLOWERS_GAINED', payload: { userId: ctx.playerSlot.userId, amount: result.followersGained, reason: result.narrativeResult } })
      }
      for (const sc of result.statChanges) {
        await dispatch({ type: 'STAT_CHANGED', payload: { userId: ctx.playerSlot.userId, stat: sc.stat, delta: sc.delta, flavorText: sc.flavorText } })
      }
      for (const rc of result.relationshipChanges) {
        await dispatch({ type: 'RELATIONSHIP_CHANGED', payload: { userId: ctx.playerSlot.userId, characterId: rc.characterId, delta: rc.delta, flavorText: rc.flavorText } })
      }
      if (result.tensionDelta !== 0) {
        await dispatch({ type: 'TENSION_CHANGED', payload: { delta: result.tensionDelta, newTension: Math.min(100, Math.max(0, ctx.storyArc.currentTension + result.tensionDelta)) } })
      }

      // Add NPC posts
      for (const npcPost of result.newNpcPosts) {
        const post: Post = {
          id: uuidv4(),
          sessionId: session.id,
          authorCharacterId: npcPost.characterId,
          authorUserId: null,
          content: npcPost.content,
          likes: npcPost.likes,
          reposts: npcPost.reposts,
          replies: [],
          isPlayerPost: false,
          resolvedEventId: eventId || null,
          createdAt: Date.now(),
        }
        await LocalWorldSessionService.addPost(session.id, post)
      }

      // Resolve event if provided
      if (eventId) {
        await LocalWorldSessionService.resolveEvent(session.id, eventId, ctx.playerSlot.userId, action)
      }

      // Add notifications
      if (result.newNpcPosts.length > 0) {
        const firstNpc = result.newNpcPosts[0]
        const notification: Notification = {
          id: uuidv4(),
          sessionId: session.id,
          type: 'reaction',
          sourceCharacterId: firstNpc.characterId,
          title: 'reacted to your action',
          preview: firstNpc.content.slice(0, 100),
          createdAt: Date.now(),
          isRead: false,
        }
        await LocalWorldSessionService.addNotification(session.id, notification)
      }

      // Day progression
      const totalActions = (ctx.playerSlot.gameState.totalActionsThisSession || 0) + 1
      if (totalActions % 10 === 0) {
        await dispatch({ type: 'DAY_ADVANCED', payload: { newDay: ctx.worldState.dayNumber + 1 } })
      }
      await LocalWorldSessionService.updatePlayerState(session.id, ctx.playerSlot.userId, {
        totalActionsThisSession: totalActions,
      })

      await refreshSession()
      return result
    } catch (e: any) {
      showToast(e.message, 'error')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [session])

  const loadInitialFeed = useCallback(async () => {
    const ctx = getContext()
    if (!ctx || !session || session.sharedFeed.length > 0) return
    setIsGenerating(true)
    try {
      const posts = await generateFeedPosts(
        ctx.worldState, ctx.storyArc, ctx.playerSlot.gameState,
        ctx.playerCharacter, ctx.worldState.characters,
      )
      for (const p of posts) {
        const post: Post = {
          id: uuidv4(),
          sessionId: session.id,
          authorCharacterId: p.characterId,
          authorUserId: null,
          content: p.content,
          likes: p.likes,
          reposts: p.reposts,
          replies: [],
          isPlayerPost: false,
          resolvedEventId: null,
          createdAt: Date.now() - Math.floor(Math.random() * 3600000),
        }
        await LocalWorldSessionService.addPost(session.id, post)
      }
      await refreshSession()
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [session])

  const sendDM = useCallback(async (
    characterId: string,
    history: { role: 'player' | 'npc'; content: string }[],
  ): Promise<string | null> => {
    const ctx = getContext()
    if (!ctx || !session) return null
    setIsGenerating(true)
    try {
      const character = ctx.worldState.characters.find(c => c.id === characterId)
      if (!character) return null
      const response = await generateDMResponse(character, history, ctx.worldState, ctx.storyArc)
      return response
    } catch (e: any) {
      showToast(e.message, 'error')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [session])

  const getWorldInspiration = useCallback(async (
    fandom: string | null,
    characters: import('@/types').Character[],
  ): Promise<string[]> => {
    setIsGenerating(true)
    try {
      return await generateWorldInspiration(fandom, characters)
    } catch (e: any) {
      showToast(e.message, 'error')
      return []
    } finally {
      setIsGenerating(false)
    }
  }, [])

  const initWorld = useCallback(async () => {
    const ctx = getContext()
    if (!ctx || !session) return
    setIsGenerating(true)
    try {
      const storyArc = await initializeStoryArc(ctx.worldState, ctx.playerCharacter)
      await LocalWorldSessionService.updateStoryArc(session.id, storyArc)
      await refreshSession()
    } catch (e: any) {
      showToast(e.message, 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [session])

  return { isGenerating, generateNewEvent, handlePlayerAction, loadInitialFeed, sendDM, getWorldInspiration, initWorld }
}
