// ─── SESSION ────────────────────────────────────────────────────

export interface WorldSession {
  id: string
  scenarioId: string | null
  mode: 'singleplayer' | 'multiplayer'
  inviteCode: string
  hostUserId: string
  players: PlayerSlot[]
  sharedFeed: Post[]
  sharedEvents: GameEvent[]
  sharedNotifications: Notification[]
  worldState: WorldState
  storyArc: StoryArc
  createdAt: number
  updatedAt: number
}

export interface PlayerSlot {
  userId: string
  characterId: string
  displayName: string
  gameState: PlayerGameState
  isOnline: boolean
  lastSeenAt: number
}

export interface WorldState {
  dayNumber: number
  mainGoal: string
  worldSetting: string
  fandom: string | null
  difficulty: 'easy' | 'normal' | 'hard'
  madnessScale: number
  characters: Character[]
  milestones: Milestone[]
  sideQuests: SideQuest[]
}

// ─── STORY ARC ───────────────────────────────────────────────────

export interface StoryArc {
  act: 1 | 2 | 3
  arcSummary: string
  act1Summary: string
  act2Summary: string
  act3Summary: string
  plannedEvents: PlannedEvent[]
  castDynamics: CastDynamic[]
  currentTension: number
  pendingConsequences: Consequence[]
}

export interface PlannedEvent {
  id: string
  triggerCondition: string
  title: string
  description: string
  xpMin: number
  xpMax: number
  isTriggered: boolean
}

export interface CastDynamic {
  characterAId: string
  characterBId: string
  dynamic: string
  intensity: number
}

export interface Consequence {
  id: string
  type: 'scandal' | 'alliance' | 'viral_moment' | 'follower_loss' | 'opportunity'
  description: string
  triggerInNActions: number
  severity: number
}

// ─── PLAYER ──────────────────────────────────────────────────────

export interface PlayerGameState {
  level: number
  xp: number
  xpToNextLevel: number
  followerCount: number
  stats: Record<string, number>
  relationships: Record<string, RelationshipEntry>
  skills: Record<string, SkillEntry>
  skillPoints: number
  actionLog: ActionLogEntry[]
  mainGoalProgress: number
  totalActionsThisSession: number
}

export interface RelationshipEntry {
  value: number
  flavorText: string
  chemistry: string
}

export interface SkillEntry {
  value: number
  pointsNeeded: number
  flavorText: string
}

// ─── CHARACTERS ──────────────────────────────────────────────────

export interface Character {
  id: string
  name: string
  handle: string
  avatar: string
  bio: string
  description: string
  fandom: string | null
  followerCount: number
  isVerified: boolean
  isPlayerControlled: boolean
  controlledByUserId: string | null
}

// ─── FEED ────────────────────────────────────────────────────────

export interface Post {
  id: string
  sessionId: string
  authorCharacterId: string
  authorUserId: string | null
  content: string
  likes: number
  reposts: number
  replies: Reply[]
  isPlayerPost: boolean
  resolvedEventId: string | null
  createdAt: number
}

export interface Reply {
  id: string
  postId: string
  authorCharacterId: string
  content: string
  likes: number
  createdAt: number
}

// ─── EVENTS ──────────────────────────────────────────────────────

export interface GameEvent {
  id: string
  sessionId: string
  title: string
  description: string
  xpMin: number
  xpMax: number
  suggestions: string[]
  resolvedByUserId: string | null
  resolvedByResponse: string | null
  isFromStoryArc: boolean
  createdAt: number
}

// ─── GAME ACTIONS ─────────────────────────────────────────────────

export type GameAction =
  | { type: 'XP_GAINED'; payload: { userId: string; amount: number } }
  | { type: 'FOLLOWERS_GAINED'; payload: { userId: string; amount: number; reason: string } }
  | { type: 'STAT_CHANGED'; payload: { userId: string; stat: string; delta: number; flavorText: string } }
  | { type: 'RELATIONSHIP_CHANGED'; payload: { userId: string; characterId: string; delta: number; flavorText: string } }
  | { type: 'POST_CREATED'; payload: { post: Post } }
  | { type: 'EVENT_RESOLVED'; payload: { eventId: string; userId: string; response: string } }
  | { type: 'LEVEL_UP'; payload: { userId: string; newLevel: number } }
  | { type: 'DAY_ADVANCED'; payload: { newDay: number } }
  | { type: 'SKILL_UPGRADED'; payload: { userId: string; skillName: string; newValue: number } }
  | { type: 'MILESTONE_COMPLETED'; payload: { userId: string; milestoneId: string } }
  | { type: 'TENSION_CHANGED'; payload: { delta: number; newTension: number } }
  | { type: 'CONSEQUENCE_QUEUED'; payload: { consequence: Consequence } }
  | { type: 'ACT_ADVANCED'; payload: { newAct: 1 | 2 | 3 } }
  | { type: 'SCANDAL_TRIGGERED'; payload: { description: string; followerLoss: number } }
  | { type: 'PLAYER_JOINED'; payload: { player: PlayerSlot } }
  | { type: 'PLAYER_LEFT'; payload: { userId: string } }

// ─── MISC ─────────────────────────────────────────────────────────

export interface Milestone {
  id: string
  title: string
  requirements: MilestoneRequirement[]
  isCompleted: boolean
  unlocksCharacterId: string | null
}

export interface MilestoneRequirement {
  name: string
  isCompleted: boolean
  pointsNeeded: number
}

export interface SideQuest {
  id: string
  description: string
  xpReward: number
  isCompleted: boolean
  isBookmarked: boolean
}

export interface Notification {
  id: string
  sessionId: string
  type: 'reply' | 'reaction' | 'follower_milestone' | 'activity_accepted' | 'scandal' | 'player_joined'
  sourceCharacterId: string
  title: string
  preview: string
  createdAt: number
  isRead: boolean
}

export interface ActionLogEntry {
  id: string
  userId: string
  type: string
  description: string
  xpGained: number
  followerDelta: number
  createdAt: number
}

export interface Scenario {
  id: string
  name: string
  description: string
  coverImage: string
  category: string
  fandom: string
  defaultCharacters: Character[]
  defaultWorldSetting: string
  defaultMainGoal: string
  playerCount: number
}

export interface Fandom {
  id: string
  name: string
  emoji: string
  worldCount: string
}

export type ChemistryType = 'rivals' | 'spicy' | 'lovers' | 'energy' | 'mentors' | 'family' | 'friends'

export interface CreateSessionParams {
  scenarioId: string | null
  characters: Character[]
  playerCharacterId: string
  firstFollowerCharacterId: string
  firstFollowerChemistry: ChemistryType
  mainGoal: string
  worldSetting: string
  fandom: string | null
  difficulty: 'easy' | 'normal' | 'hard'
  madnessScale: number
}
