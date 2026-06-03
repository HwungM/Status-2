import AsyncStorage from '@react-native-async-storage/async-storage'
import { StoryArc, Character, PlayerGameState, WorldState, GameEvent, Post } from '@/types'
import { generateId } from '@/utils/generateId'

const API_KEY_STORAGE = 'clout:groq_key'

async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_STORAGE)
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_STORAGE, key)
}

async function callOpenAI(messages: { role: string; content: string }[], signal?: AbortSignal): Promise<string> {
  const apiKey = await getApiKey()
  if (!apiKey) throw new Error('No Groq API key configured. Go to Settings to add your key.')

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages,
      response_format: { type: 'json_object' },
      temperature: 0.9,
    }),
    signal,
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `OpenAI API error: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0].message.content
}

function buildMasterSystemPrompt(
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
  recentFeed: Post[],
): string {
  const castDynamicsStr = storyArc.castDynamics
    .map(d => {
      const charA = allCharacters.find(c => c.id === d.characterAId)?.name || d.characterAId
      const charB = allCharacters.find(c => c.id === d.characterBId)?.name || d.characterBId
      return `${charA} ↔ ${charB}: ${d.dynamic} (intensity: ${d.intensity}/100)`
    })
    .join('\n')

  const relationshipStr = Object.entries(playerState.relationships)
    .map(([id, rel]) => {
      const char = allCharacters.find(c => c.id === id)?.name || id
      return `${char}: ${rel.value}/100 (${rel.chemistry}) — ${rel.flavorText}`
    })
    .join('\n')

  const feedContext = recentFeed.slice(0, 20)
    .map(p => {
      const char = allCharacters.find(c => c.id === p.authorCharacterId)?.name || p.authorCharacterId
      return `@${char}: ${p.content}`
    })
    .join('\n')

  const consequencesStr = storyArc.pendingConsequences
    .map(c => `[${c.type}] ${c.description} (triggers in ${c.triggerInNActions} actions)`)
    .join('\n')

  return `You are the narrative engine and AI brain for "Clout," a social media simulation RPG.

WORLD:
- Setting: ${worldState.worldSetting}
- Fandom: ${worldState.fandom || 'Original'}
- Day: ${worldState.dayNumber}
- Madness scale: ${worldState.madnessScale}/100 (0=realistic, 100=completely unhinged)
- Difficulty: ${worldState.difficulty}

STORY ARC:
- Current act: ${storyArc.act}/3
- Arc summary: ${storyArc.arcSummary}
- Current tension: ${storyArc.currentTension}/100
- Pending consequences: ${consequencesStr || 'None'}
- Cast dynamics: ${castDynamicsStr || 'None established yet'}

CHARACTERS:
${allCharacters.map(c => `${c.name} (@${c.handle}): ${c.bio}`).join('\n')}

PLAYER: ${playerCharacter.name} (@${playerCharacter.handle})
- Followers: ${playerState.followerCount}
- Level: ${playerState.level}
- Stats: ${Object.entries(playerState.stats).map(([k, v]) => `${k}: ${v}%`).join(', ')}
- Relationships: ${relationshipStr || 'None yet'}

RECENT FEED (last 20):
${feedContext || 'Feed is empty — this is the beginning.'}

CHEMISTRY TYPES (these MUST shape how characters interact):
- rivals: public competition, callouts, subtweeting, shade, trying to one-up each other
- spicy: flirtatious tension, thirst replies, ambiguous will-they-won't-they energy
- lovers: soft, protective, private jokes, defending each other publicly
- friends: supportive hype, tag-ins, banter, inside jokes
- enemies: active hostility, blocking threats, exposing drama, direct conflict
- strangers: distant/cold, no acknowledgment yet

MADNESS SCALE BEHAVIOR:
- 0-20 (Realistic): Grounded drama. Real-feeling social dynamics. Consequences feel earned.
- 21-50 (Heightened): Exaggerated but believable. Drama escalates faster. Wilder coincidences.
- 51-80 (Chaotic): Absurd twists. Characters do unhinged things. Plot armor activated.
- 81-100 (Bonkers): Complete chaos. Anything goes. Reality-bending events. Maximum clout mayhem.

Rules:
- Stay in character always. Write like real social media — short, punchy, platform-native.
- Match each character's voice to their bio exactly.
- ALWAYS reflect the chemistry type in how NPCs post about/to the player.
- The madness scale (${worldState.madnessScale}/100) actively shapes event tone and NPC behavior.
- Negative consequences (scandals, cancellation, follower loss) should happen organically.
- Build toward narrative moments — you are telling a story, not just responding to inputs.
- ALL responses must be valid JSON.`
}

export async function initializeStoryArc(
  worldState: WorldState,
  playerCharacter: Character,
): Promise<StoryArc> {
  const characterList = worldState.characters
    .map(c => `${c.name} (@${c.handle}): ${c.bio}`)
    .join('\n')

  const prompt = `You are the narrative engine for "Clout," a social media simulation RPG.

World setting: ${worldState.worldSetting}
Fandom: ${worldState.fandom || 'Original'}
Characters: ${characterList}
Player's main goal: ${worldState.mainGoal}
Madness scale: ${worldState.madnessScale}/100
Difficulty: ${worldState.difficulty}

Generate a complete StoryArc in JSON:
{
  "arcSummary": "2-3 sentence description of the overall story this world will tell",
  "act1Summary": "What the first phase of the story looks like",
  "act2Summary": "The escalation — what goes wrong or intensifies",
  "act3Summary": "The climax and resolution arc",
  "plannedEvents": [
    {
      "id": "uuid",
      "triggerCondition": "after N player actions",
      "title": "event title",
      "description": "event description for player",
      "xpMin": 15,
      "xpMax": 45,
      "isTriggered": false
    }
  ],
  "castDynamics": [
    {
      "characterAId": "character_id",
      "characterBId": "character_id",
      "dynamic": "description of dynamic",
      "intensity": 75
    }
  ],
  "startingTension": 20
}

Generate 8-12 plannedEvents. Generate cast dynamics for all notable character pairs.`

  const raw = await callOpenAI([
    { role: 'system', content: 'You are a narrative engine. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw)

  return {
    act: 1,
    arcSummary: parsed.arcSummary,
    act1Summary: parsed.act1Summary,
    act2Summary: parsed.act2Summary,
    act3Summary: parsed.act3Summary,
    plannedEvents: (parsed.plannedEvents || []).map((e: any) => ({ ...e, id: e.id || generateId() })),
    castDynamics: parsed.castDynamics || [],
    currentTension: parsed.startingTension || 20,
    pendingConsequences: [],
  }
}

export async function generateEvent(
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
  recentFeed: Post[],
): Promise<GameEvent> {
  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, recentFeed)

  const nextPlanned = storyArc.plannedEvents.find(e => !e.isTriggered)

  const prompt = `Generate a game event for the player. ${nextPlanned ? `Consider this planned story beat: "${nextPlanned.title}: ${nextPlanned.description}"` : 'Generate an organic event fitting the current tension and story arc.'}

Respond in JSON:
{
  "title": "short event title",
  "description": "2-3 sentence event description — what's happening, what's the situation",
  "xpMin": 15,
  "xpMax": 45,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "isFromStoryArc": ${!!nextPlanned},
  "plannedEventId": ${nextPlanned ? `"${nextPlanned.id}"` : 'null'}
}`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw)

  return {
    id: generateId(),
    sessionId: '',
    title: parsed.title,
    description: parsed.description,
    xpMin: parsed.xpMin || 15,
    xpMax: parsed.xpMax || 45,
    suggestions: parsed.suggestions || [],
    resolvedByUserId: null,
    resolvedByResponse: null,
    isFromStoryArc: parsed.isFromStoryArc || false,
    createdAt: Date.now(),
  }
}

export interface ActionResult {
  xpGained: number
  followersGained: number
  statChanges: { stat: string; delta: number; flavorText: string }[]
  relationshipChanges: { characterId: string; delta: number; flavorText: string }[]
  narrativeResult: string
  newNpcPosts: { characterId: string; content: string; likes: number; reposts: number }[]
  tensionDelta: number
  newConsequences: { type: string; description: string; triggerInNActions: number }[]
  triggerPlannedEvent: boolean
}

export async function resolvePlayerAction(
  playerAction: string,
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
  recentFeed: Post[],
): Promise<ActionResult> {
  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, recentFeed)

  const prompt = `Player just did: "${playerAction}"

Respond in JSON:
{
  "xpGained": 20,
  "followersGained": 150,
  "statChanges": [{ "stat": "aura", "delta": 2.5, "flavorText": "Your aura grew stronger" }],
  "relationshipChanges": [{ "characterId": "character_id", "delta": 10, "flavorText": "They noticed you" }],
  "narrativeResult": "1-2 sentence description of what happened",
  "newNpcPosts": [
    { "characterId": "character_id", "content": "post content", "likes": 1240, "reposts": 89 }
  ],
  "tensionDelta": 5,
  "newConsequences": [],
  "triggerPlannedEvent": false
}

Generate 3-5 NPC reaction posts. followersGained can be negative. Make consequences from controversial actions.`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])

  return JSON.parse(raw) as ActionResult
}

export async function generateFeedPosts(
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
): Promise<{ characterId: string; content: string; likes: number; reposts: number }[]> {
  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, [])

  const prompt = `Generate 5-8 NPC social media posts for the current feed state.

Respond in JSON:
{
  "posts": [
    { "characterId": "character_id", "content": "post content", "likes": 5420, "reposts": 234 }
  ]
}

Posts should reflect current world tension (${storyArc.currentTension}/100) and cast dynamics. Write like real social media.`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw)
  return parsed.posts || []
}

export async function generateDMResponse(
  character: Character,
  conversationHistory: { role: 'player' | 'npc'; content: string }[],
  worldState: WorldState,
  storyArc: StoryArc,
): Promise<string> {
  const historyMessages = conversationHistory.map(m => ({
    role: m.role === 'player' ? 'user' : 'assistant',
    content: m.content,
  }))

  const system = `You are ${character.name} (@${character.handle}) in the world: "${worldState.worldSetting}".
Your bio: ${character.bio}
Your personality: ${character.description}
Current story tension: ${storyArc.currentTension}/100
Arc: ${storyArc.arcSummary}

Respond as ${character.name} via DM. Be in character. Be concise. Write like real DMs.
Respond with plain text only — no JSON, no formatting.`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    ...historyMessages,
  ])

  return raw
}

export async function generateWorldInspiration(
  fandom: string | null,
  characters: Character[],
): Promise<string[]> {
  const charList = characters.map(c => `${c.name}: ${c.bio}`).join('\n')

  const prompt = `Generate 3 world setting paragraph options for a social media RPG game.
Fandom: ${fandom || 'Original/Custom'}
Characters: ${charList}

Each paragraph should be 2-4 sentences. Make them feel alive, dramatic, and specific to these characters.

Respond in JSON: { "options": ["paragraph 1", "paragraph 2", "paragraph 3"] }`

  const raw = await callOpenAI([
    { role: 'system', content: 'You are a creative writing assistant for a social media RPG. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw)
  return parsed.options || []
}

export interface ActivityResult {
  narrativeResult: string
  xpGained: number
  followersGained: number
  statChanges: { stat: string; delta: number; flavorText: string }[]
  relationshipChanges: { characterId: string; delta: number; flavorText: string }[]
  feedPosts: { characterId: string; content: string; likes: number; reposts: number }[]
  tensionDelta: number
  worldReaction: string
}

export async function generateActivity(
  activityType: string,
  activityDesc: string,
  involvedCharacters: Character[],
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
): Promise<ActivityResult> {
  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, [])
  const charList = involvedCharacters.map(c => `${c.name} (@${c.handle}) [chemistry: ${playerState.relationships[c.id]?.chemistry || 'strangers'}]`).join(', ')

  const prompt = `Player did an activity: "${activityType}"
Characters involved: ${charList}
Player's description: "${activityDesc || 'No description provided'}"

Generate the full outcome. Make it dramatic, specific to these characters' chemistry with the player, and true to the world. Let the madness scale (${worldState.madnessScale}/100) shape how wild it gets.

Respond in JSON:
{
  "narrativeResult": "2-3 vivid sentences describing exactly what happened, who said what, how it went",
  "xpGained": 30,
  "followersGained": 800,
  "statChanges": [{ "stat": "aura", "delta": 5, "flavorText": "Your presence grew" }],
  "relationshipChanges": [{ "characterId": "exact_character_id", "delta": 15, "flavorText": "You two bonded over this" }],
  "feedPosts": [
    { "characterId": "exact_character_id", "content": "What this character posts about the activity", "likes": 5400, "reposts": 234 }
  ],
  "tensionDelta": 5,
  "worldReaction": "One sentence about how the broader public/fandom reacted to this activity"
}

Generate 2-4 feedPosts. followersGained and stat deltas can be negative if things went badly. The chemistry type between player and each character MUST shape the outcome — rivals will have tension, spicy will have heat, lovers will be soft, enemies will turn this into drama.`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw) as ActivityResult
}

export interface DayAdvanceResult {
  daySummary: string
  npcPosts: { characterId: string; content: string; likes: number; reposts: number }[]
  randomEvent: {
    title: string
    description: string
    xpMin: number
    xpMax: number
    suggestions: string[]
  } | null
}

export async function generateDayAdvance(
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
  recentFeed: Post[],
): Promise<DayAdvanceResult> {
  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, recentFeed)
  const includeEvent = Math.random() < (0.3 + storyArc.currentTension / 200)

  const prompt = `It's now Day ${worldState.dayNumber + 1}. Time has passed. Generate what happened overnight and what the world is posting about now.

Respond in JSON:
{
  "daySummary": "1-2 sentences capturing the vibe/energy of the new day",
  "npcPosts": [
    { "characterId": "exact_character_id", "content": "post content", "likes": 1200, "reposts": 89 }
  ],
  "randomEvent": ${includeEvent ? `{
    "title": "short event title",
    "description": "2-3 sentence situation the player now faces — make it specific to current story tension",
    "xpMin": 15,
    "xpMax": 45,
    "suggestions": ["option 1", "option 2", "option 3"]
  }` : 'null'}
}

Generate 4-7 NPC posts reflecting the current story arc and what happened in previous days. Make posts feel like a real social media morning — different tones, some catching up on drama, some starting new threads.`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])
  return JSON.parse(raw) as DayAdvanceResult
}

export async function generateSideQuests(
  worldState: WorldState,
  storyArc: StoryArc,
  playerCharacter: Character,
): Promise<{ description: string; xpReward: number }[]> {
  const prompt = `Generate 3 side quests for act ${storyArc.act} of this story.
World: ${worldState.worldSetting}
Arc summary: ${storyArc.arcSummary}
Player: ${playerCharacter.name}

Respond in JSON:
{ "quests": [{ "description": "quest description", "xpReward": 25 }] }

Each quest should be specific to this world and feel achievable through social media actions.`

  const raw = await callOpenAI([
    { role: 'system', content: 'You are a game designer. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw)
  return parsed.quests || []
}
