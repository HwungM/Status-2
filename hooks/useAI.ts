import { useState, useCallback } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/store/uiStore'
import {
  generateEvent, resolvePlayerAction, generateFeedPosts,
  generateDMResponse, initializeStoryArc, generateWorldInspiration,
  generateSideQuests, ActionResult,
  generateActivity, ActivityResult, generateDayAdvance, DayAdvanceResult,
  generateNPCAutonomousPost,
} from '@/services/openaiService'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { generateId } from '@/utils/generateId'
import { Post, Reply, GameEvent, Notification, LegendProgress, ScandalState } from '@/types'

export function useAI() {
  const { session, dispatch, refreshSession } = useGameStore()
  const { showToast, showViralMoment } = useUIStore()
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

      // Attach postReplies to the player's most recent post
      if (result.postReplies && result.postReplies.length > 0) {
        const freshSession = await LocalWorldSessionService.getSession(session.id)
        const playerPost = freshSession?.sharedFeed.find(p => p.isPlayerPost)
        if (playerPost) {
          const newReplies: Reply[] = result.postReplies.map(r => ({
            id: generateId(),
            postId: playerPost.id,
            authorCharacterId: r.characterId,
            content: r.content,
            likes: r.likes,
            createdAt: Date.now(),
          }))
          await LocalWorldSessionService.updatePostReplies(session.id, playerPost.id, [...playerPost.replies, ...newReplies])
        }
      }

      // Add NPC posts
      for (const npcPost of result.newNpcPosts) {
        const post: Post = {
          id: generateId(),
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
      if (result.postReplies && result.postReplies.length > 0) {
        const firstReply = result.postReplies[0]
        const replyChar = ctx.worldState.characters.find(c => c.id === firstReply.characterId)
        const notification: Notification = {
          id: generateId(),
          sessionId: session.id,
          type: 'reaction',
          sourceCharacterId: firstReply.characterId,
          title: `replied to your post`,
          preview: firstReply.content.slice(0, 100),
          createdAt: Date.now(),
          isRead: false,
        }
        await LocalWorldSessionService.addNotification(session.id, notification)
      } else if (result.newNpcPosts.length > 0) {
        const firstNpc = result.newNpcPosts[0]
        const notification: Notification = {
          id: generateId(),
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

      // Viral moment check
      if (result.followersGained > 2000) {
        showViralMoment({ followersGained: result.followersGained, narrativeResult: result.narrativeResult })
      }

      // Scandal check
      if (result.scandalTriggered) {
        const scandal: ScandalState = {
          active: true,
          severity: result.scandalTriggered.severity,
          cause: result.scandalTriggered.cause,
          followerLossPerTick: result.scandalTriggered.followerLossPerTick,
          ticksRemaining: result.scandalTriggered.ticksRemaining,
          canRecover: result.scandalTriggered.severity !== 'career-ending',
        }
        await dispatch({ type: 'SCANDAL_STARTED', payload: { scandal } })
        await dispatch({ type: 'FOLLOWERS_GAINED', payload: { userId: ctx.playerSlot.userId, amount: -result.scandalTriggered.followerLossPerTick, reason: 'Scandal shock' } })
        showToast("You're being cancelled! 😱", 'error')
      }

      // Day progression
      const totalActions = (ctx.playerSlot.gameState.totalActionsThisSession || 0) + 1
      await LocalWorldSessionService.updatePlayerState(session.id, ctx.playerSlot.userId, {
        totalActionsThisSession: totalActions,
      })

      await refreshSession()

      // Legend progress check (after refreshSession so we have latest state)
      await checkAndUpdateLegendProgress(session.id, ctx.playerSlot.userId)

      return result
    } catch (e: any) {
      showToast(e.message, 'error')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [session])

  const checkAndUpdateLegendProgress = async (sessionId: string, userId: string) => {
    const freshSession = await LocalWorldSessionService.getSession(sessionId)
    if (!freshSession) return
    const slot = freshSession.players.find(p => p.userId === userId)
    if (!slot) return
    const gs = slot.gameState
    const ws = freshSession.worldState
    const arc = freshSession.storyArc

    const followersReached = gs.followerCount >= 500000
    const mainGoalCompleted = gs.mainGoalProgress >= 100
    const relationshipsBuilt = Object.values(gs.relationships).filter(r => r.value > 50).length >= 3
    const rivalExists = Object.values(gs.relationships).some(r => r.chemistry === 'rivals' || r.chemistry === 'enemies')
    const act3Reached = arc.act === 3
    const existingLegend = ws.legendProgress
    const survivedScandal = existingLegend?.survivedScandal || (ws.scandalState && !ws.scandalState.active && ws.scandalState.ticksRemaining <= 0) || false

    const legendUnlocked = followersReached && !!survivedScandal && mainGoalCompleted && relationshipsBuilt && rivalExists && act3Reached

    await LocalWorldSessionService.updateWorldState(sessionId, {
      legendProgress: {
        followersReached,
        survivedScandal: !!survivedScandal,
        mainGoalCompleted,
        relationshipsBuilt,
        rivalExists,
        act3Reached,
        legendUnlocked,
      },
    })
  }

  const triggerNPCAutonomousPost = useCallback(async () => {
    const ctx = getContext()
    if (!ctx || !session) return
    try {
      const npcPosts = await generateNPCAutonomousPost(
        ctx.worldState, ctx.storyArc, ctx.playerSlot.gameState,
        ctx.playerCharacter, ctx.worldState.characters, session.sharedFeed,
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
    } catch (e) {
      // silent fail for autonomous posts
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
        const postReplies: Reply[] = (p.replies || []).map((r: { characterId: string; content: string; likes: number }) => ({
          id: generateId(),
          postId: '',
          authorCharacterId: r.characterId,
          content: r.content,
          likes: r.likes,
          createdAt: Date.now() - Math.floor(Math.random() * 1800000),
        }))
        const post: Post = {
          id: generateId(),
          sessionId: session.id,
          authorCharacterId: p.characterId,
          authorUserId: null,
          content: p.content,
          likes: p.likes,
          reposts: p.reposts,
          replies: postReplies,
          isPlayerPost: false,
          resolvedEventId: null,
          createdAt: Date.now() - Math.floor(Math.random() * 3600000),
        }
        postReplies.forEach(r => { r.postId = post.id })
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

  const doActivity = useCallback(async (
    activityType: string,
    activityDesc: string,
    involvedCharacterIds: string[],
  ): Promise<ActivityResult | null> => {
    const ctx = getContext()
    if (!ctx || !session) return null
    setIsGenerating(true)
    try {
      const involvedChars = ctx.worldState.characters.filter(c => involvedCharacterIds.includes(c.id))
      const result = await generateActivity(
        activityType, activityDesc, involvedChars,
        ctx.worldState, ctx.storyArc, ctx.playerSlot.gameState,
        ctx.playerCharacter, ctx.worldState.characters,
      )

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

      // Create activity post from player
      const activityPost: Post = {
        id: generateId(),
        sessionId: session.id,
        authorCharacterId: ctx.playerCharacter.id,
        authorUserId: ctx.playerSlot.userId,
        content: `[Activity: ${activityType}] ${result.narrativeResult}`,
        likes: Math.floor(Math.random() * 5000) + 500,
        reposts: Math.floor(Math.random() * 500) + 50,
        replies: [],
        isPlayerPost: true,
        resolvedEventId: null,
        createdAt: Date.now(),
      }
      await LocalWorldSessionService.addPost(session.id, activityPost)

      // NPC reaction posts
      for (const fp of result.feedPosts) {
        const post: Post = {
          id: generateId(),
          sessionId: session.id,
          authorCharacterId: fp.characterId,
          authorUserId: null,
          content: fp.content,
          likes: fp.likes,
          reposts: fp.reposts,
          replies: [],
          isPlayerPost: false,
          resolvedEventId: null,
          createdAt: Date.now(),
        }
        await LocalWorldSessionService.addPost(session.id, post)
      }

      const totalActions = (ctx.playerSlot.gameState.totalActionsThisSession || 0) + 1
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

  const advanceDay = useCallback(async (): Promise<{ daySummary: string; hasEvent: boolean } | null> => {
    const ctx = getContext()
    if (!ctx || !session) return null
    setIsGenerating(true)
    try {
      const result = await generateDayAdvance(
        ctx.worldState, ctx.storyArc, ctx.playerSlot.gameState,
        ctx.playerCharacter, ctx.worldState.characters, session.sharedFeed,
      )

      // Advance day
      await dispatch({ type: 'DAY_ADVANCED', payload: { newDay: ctx.worldState.dayNumber + 1 } })

      // Add NPC posts
      for (const p of result.npcPosts) {
        const post: Post = {
          id: generateId(),
          sessionId: session.id,
          authorCharacterId: p.characterId,
          authorUserId: null,
          content: p.content,
          likes: p.likes,
          reposts: p.reposts,
          replies: [],
          isPlayerPost: false,
          resolvedEventId: null,
          createdAt: Date.now(),
        }
        await LocalWorldSessionService.addPost(session.id, post)
      }

      // Add event if generated
      if (result.randomEvent) {
        const event: GameEvent = {
          id: generateId(),
          sessionId: session.id,
          title: result.randomEvent.title,
          description: result.randomEvent.description,
          xpMin: result.randomEvent.xpMin,
          xpMax: result.randomEvent.xpMax,
          suggestions: result.randomEvent.suggestions,
          resolvedByUserId: null,
          resolvedByResponse: null,
          isFromStoryArc: false,
          createdAt: Date.now(),
        }
        await LocalWorldSessionService.addEvent(session.id, event)
      }

      await refreshSession()
      return { daySummary: result.daySummary, hasEvent: !!result.randomEvent }
    } catch (e: any) {
      showToast(e.message, 'error')
      return null
    } finally {
      setIsGenerating(false)
    }
  }, [session])

  return { isGenerating, generateNewEvent, handlePlayerAction, loadInitialFeed, sendDM, getWorldInspiration, initWorld, doActivity, advanceDay }
}
