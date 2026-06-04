import AsyncStorage from '@react-native-async-storage/async-storage'
import {
  WorldSession, WorldState, StoryArc, Post, GameEvent,
  PlayerGameState, GameAction, Notification, PlayerSlot,
} from '@/types'
import { generateInviteCode } from '@/utils/inviteCode'
import { xpToNextLevel } from '@/utils/xpCalc'
import { generateId } from '@/utils/generateId'

const SESSIONS_KEY = 'clout:sessions'
const ACTIVE_SESSION_KEY = 'clout:activeSessionId'

export interface CreateSessionParams {
  scenarioId: string | null
  characters: import('@/types').Character[]
  playerCharacterId: string
  firstFollowerCharacterId: string
  firstFollowerChemistry: string
  mainGoal: string
  worldSetting: string
  fandom: string | null
  difficulty: 'easy' | 'normal' | 'hard'
  madnessScale: number
}

export interface IWorldSessionService {
  createSession(params: CreateSessionParams): Promise<WorldSession>
  getSession(sessionId: string): Promise<WorldSession | null>
  getAllSessions(): Promise<WorldSession[]>
  getActiveSession(): Promise<WorldSession | null>
  setActiveSession(sessionId: string): Promise<void>
  updateWorldState(sessionId: string, patch: Partial<WorldState>): Promise<void>
  updateStoryArc(sessionId: string, patch: Partial<StoryArc>): Promise<void>
  addPost(sessionId: string, post: Post): Promise<void>
  addEvent(sessionId: string, event: GameEvent): Promise<void>
  resolveEvent(sessionId: string, eventId: string, userId: string, response: string): Promise<void>
  updatePlayerState(sessionId: string, userId: string, patch: Partial<PlayerGameState>): Promise<void>
  dispatchAction(sessionId: string, action: GameAction): Promise<void>
  addNotification(sessionId: string, notification: Notification): Promise<void>
  deleteSession(sessionId: string): Promise<void>
  clearAllData(): Promise<void>
}

async function loadAll(): Promise<Record<string, WorldSession>> {
  const raw = await AsyncStorage.getItem(SESSIONS_KEY)
  return raw ? JSON.parse(raw) : {}
}

async function saveAll(sessions: Record<string, WorldSession>): Promise<void> {
  await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions))
}

function createDefaultPlayerGameState(): PlayerGameState {
  return {
    level: 1,
    xp: 0,
    xpToNextLevel: xpToNextLevel(1),
    followerCount: 1000,
    stats: { aura: 50, humor: 50, charisma: 50, drama: 30 },
    relationships: {},
    skills: {
      'Content Creation': { value: 10, pointsNeeded: 5, flavorText: 'Your ability to craft viral posts' },
      'Social Reading': { value: 10, pointsNeeded: 5, flavorText: 'Reading the room before you post' },
      'Crisis Management': { value: 10, pointsNeeded: 5, flavorText: 'Handling scandals without losing followers' },
      'Network Building': { value: 10, pointsNeeded: 5, flavorText: 'Turning interactions into alliances' },
    },
    skillPoints: 0,
    actionLog: [],
    mainGoalProgress: 0,
    totalActionsThisSession: 0,
  }
}

function createDefaultStoryArc(): StoryArc {
  return {
    act: 1,
    arcSummary: 'Your story is just beginning. The world is watching.',
    act1Summary: 'Establish your presence and make your first moves.',
    act2Summary: 'Things escalate. Alliances form and break.',
    act3Summary: 'The climax approaches. Everything comes to a head.',
    plannedEvents: [],
    castDynamics: [],
    currentTension: 20,
    pendingConsequences: [],
  }
}

export const LocalWorldSessionService: IWorldSessionService = {
  async createSession(params) {
    const sessions = await loadAll()
    const sessionId = generateId()
    const userId = 'player_1'

    const playerCharacter = params.characters.find(c => c.id === params.playerCharacterId)!
    const follower = params.characters.find(c => c.id === params.firstFollowerCharacterId)

    const gameState = createDefaultPlayerGameState()
    if (follower) {
      gameState.relationships[params.firstFollowerCharacterId] = {
        value: 60,
        flavorText: `Your first follower. You two have ${params.firstFollowerChemistry} energy.`,
        chemistry: params.firstFollowerChemistry,
      }
    }

    const storyArc = createDefaultStoryArc()

    const session: WorldSession = {
      id: sessionId,
      scenarioId: params.scenarioId,
      mode: 'singleplayer',
      inviteCode: generateInviteCode(),
      hostUserId: userId,
      players: [{
        userId,
        characterId: params.playerCharacterId,
        displayName: playerCharacter?.name || 'Player',
        gameState,
        isOnline: false,
        lastSeenAt: Date.now(),
      }],
      sharedFeed: [],
      sharedEvents: [],
      sharedNotifications: [],
      worldState: {
        dayNumber: 1,
        mainGoal: params.mainGoal,
        worldSetting: params.worldSetting,
        fandom: params.fandom,
        difficulty: params.difficulty,
        madnessScale: params.madnessScale,
        characters: params.characters,
        milestones: [
          {
            id: generateId(),
            title: 'First Impression',
            requirements: [
              { name: 'Make 3 posts', isCompleted: false, pointsNeeded: 3 },
              { name: 'Gain 500 followers', isCompleted: false, pointsNeeded: 500 },
            ],
            isCompleted: false,
            unlocksCharacterId: null,
          },
        ],
        sideQuests: [
          { id: generateId(), description: 'Post something controversial and survive', xpReward: 25, isCompleted: false, isBookmarked: false },
          { id: generateId(), description: 'Get a reply from your favorite character', xpReward: 20, isCompleted: false, isBookmarked: false },
          { id: generateId(), description: 'Reach 5,000 followers', xpReward: 30, isCompleted: false, isBookmarked: false },
        ],
      },
      storyArc,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    sessions[sessionId] = session
    await saveAll(sessions)
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, sessionId)
    return session
  },

  async getSession(sessionId) {
    const sessions = await loadAll()
    return sessions[sessionId] || null
  },

  async getAllSessions() {
    const sessions = await loadAll()
    return Object.values(sessions).sort((a, b) => b.updatedAt - a.updatedAt)
  },

  async getActiveSession() {
    const id = await AsyncStorage.getItem(ACTIVE_SESSION_KEY)
    if (!id) return null
    return LocalWorldSessionService.getSession(id)
  },

  async setActiveSession(sessionId) {
    await AsyncStorage.setItem(ACTIVE_SESSION_KEY, sessionId)
  },

  async updateWorldState(sessionId, patch) {
    const sessions = await loadAll()
    if (!sessions[sessionId]) return
    sessions[sessionId].worldState = { ...sessions[sessionId].worldState, ...patch }
    sessions[sessionId].updatedAt = Date.now()
    await saveAll(sessions)
  },

  async updateStoryArc(sessionId, patch) {
    const sessions = await loadAll()
    if (!sessions[sessionId]) return
    sessions[sessionId].storyArc = { ...sessions[sessionId].storyArc, ...patch }
    sessions[sessionId].updatedAt = Date.now()
    await saveAll(sessions)
  },

  async addPost(sessionId, post) {
    const sessions = await loadAll()
    if (!sessions[sessionId]) return
    sessions[sessionId].sharedFeed.unshift(post)
    sessions[sessionId].updatedAt = Date.now()
    await saveAll(sessions)
  },

  async addEvent(sessionId, event) {
    const sessions = await loadAll()
    if (!sessions[sessionId]) return
    sessions[sessionId].sharedEvents.unshift(event)
    sessions[sessionId].updatedAt = Date.now()
    await saveAll(sessions)
  },

  async resolveEvent(sessionId, eventId, userId, response) {
    const sessions = await loadAll()
    if (!sessions[sessionId]) return
    const event = sessions[sessionId].sharedEvents.find(e => e.id === eventId)
    if (event) {
      event.resolvedByUserId = userId
      event.resolvedByResponse = response
    }
    sessions[sessionId].updatedAt = Date.now()
    await saveAll(sessions)
  },

  async updatePlayerState(sessionId, userId, patch) {
    const sessions = await loadAll()
    if (!sessions[sessionId]) return
    const slot = sessions[sessionId].players.find(p => p.userId === userId)
    if (slot) {
      slot.gameState = { ...slot.gameState, ...patch }
    }
    sessions[sessionId].updatedAt = Date.now()
    await saveAll(sessions)
  },

  async dispatchAction(sessionId, action) {
    const sessions = await loadAll()
    const session = sessions[sessionId]
    if (!session) return

    const slot = session.players.find(p => p.userId === (action.payload as any).userId)

    switch (action.type) {
      case 'XP_GAINED': {
        if (!slot) break
        slot.gameState.xp += action.payload.amount
        while (slot.gameState.xp >= slot.gameState.xpToNextLevel) {
          slot.gameState.xp -= slot.gameState.xpToNextLevel
          slot.gameState.level++
          slot.gameState.xpToNextLevel = xpToNextLevel(slot.gameState.level)
        }
        break
      }
      case 'FOLLOWERS_GAINED': {
        if (!slot) break
        slot.gameState.followerCount = Math.max(0, slot.gameState.followerCount + action.payload.amount)
        break
      }
      case 'STAT_CHANGED': {
        if (!slot) break
        const current = slot.gameState.stats[action.payload.stat] ?? 0
        slot.gameState.stats[action.payload.stat] = Math.min(100, Math.max(0, current + action.payload.delta))
        break
      }
      case 'RELATIONSHIP_CHANGED': {
        if (!slot) break
        const rel = slot.gameState.relationships[action.payload.characterId]
        if (rel) {
          rel.value = Math.min(100, Math.max(0, rel.value + action.payload.delta))
          rel.flavorText = action.payload.flavorText
        } else {
          slot.gameState.relationships[action.payload.characterId] = {
            value: Math.min(100, Math.max(0, 50 + action.payload.delta)),
            flavorText: action.payload.flavorText,
            chemistry: 'friends',
          }
        }
        break
      }
      case 'POST_CREATED': {
        session.sharedFeed.unshift(action.payload.post)
        break
      }
      case 'TENSION_CHANGED': {
        session.storyArc.currentTension = Math.min(100, Math.max(0, session.storyArc.currentTension + action.payload.delta))
        break
      }
      case 'CONSEQUENCE_QUEUED': {
        session.storyArc.pendingConsequences.push(action.payload.consequence)
        break
      }
      case 'ACT_ADVANCED': {
        session.storyArc.act = action.payload.newAct
        break
      }
      case 'DAY_ADVANCED': {
        session.worldState.dayNumber = action.payload.newDay
        break
      }
      case 'LEVEL_UP': {
        // handled in XP_GAINED
        break
      }
      case 'MILESTONE_COMPLETED': {
        const milestone = session.worldState.milestones.find(m => m.id === action.payload.milestoneId)
        if (milestone) milestone.isCompleted = true
        break
      }
      case 'SCANDAL_TRIGGERED': {
        if (!slot) break
        slot.gameState.followerCount = Math.max(0, slot.gameState.followerCount - action.payload.followerLoss)
        break
      }
      case 'SCANDAL_STARTED': {
        session.worldState.scandalState = action.payload.scandal
        break
      }
      case 'SCANDAL_TICK': {
        const scandal = session.worldState.scandalState
        if (scandal && scandal.active) {
          if (!slot) break
          slot.gameState.followerCount = Math.max(0, slot.gameState.followerCount - scandal.followerLossPerTick)
          scandal.ticksRemaining -= 1
          if (scandal.ticksRemaining <= 0) {
            session.worldState.scandalState = { ...scandal, active: false }
          }
        }
        break
      }
    }

    session.updatedAt = Date.now()
    await saveAll(sessions)
  },

  async addNotification(sessionId, notification) {
    const sessions = await loadAll()
    if (!sessions[sessionId]) return
    sessions[sessionId].sharedNotifications.unshift(notification)
    sessions[sessionId].updatedAt = Date.now()
    await saveAll(sessions)
  },

  async deleteSession(sessionId) {
    const sessions = await loadAll()
    delete sessions[sessionId]
    await saveAll(sessions)
    const activeId = await AsyncStorage.getItem(ACTIVE_SESSION_KEY)
    if (activeId === sessionId) {
      await AsyncStorage.removeItem(ACTIVE_SESSION_KEY)
    }
  },

  async clearAllData() {
    await AsyncStorage.multiRemove([SESSIONS_KEY, ACTIVE_SESSION_KEY])
  },
}
