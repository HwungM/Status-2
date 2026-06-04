import AsyncStorage from '@react-native-async-storage/async-storage'
import { StoryArc, Character, PlayerGameState, WorldState, GameEvent, Post } from '@/types'
import { generateId } from '@/utils/generateId'

const API_KEY_STORAGE = 'clout:gemini_key'
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions'
const GEMINI_MODEL = 'gemini-2.0-flash'

async function getApiKey(): Promise<string | null> {
  return AsyncStorage.getItem(API_KEY_STORAGE)
}

export async function saveApiKey(key: string): Promise<void> {
  await AsyncStorage.setItem(API_KEY_STORAGE, key)
}

export async function testApiKey(key: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(GEMINI_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: GEMINI_MODEL,
        messages: [{ role: 'user', content: 'Reply with the single word: ok' }],
        max_tokens: 5,
      }),
    })
    if (response.ok) return { ok: true }
    const data = await response.json().catch(() => ({}))
    const msg = data?.error?.message || `HTTP ${response.status}`
    return { ok: false, error: msg }
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Network error' }
  }
}

async function callOpenAI(messages: { role: string; content: string }[], signal?: AbortSignal, plainText = false): Promise<string> {
  const apiKey = await getApiKey()
  if (!apiKey) throw new Error('No Gemini API key configured. Go to Settings to add your key.')

  const body: any = {
    model: GEMINI_MODEL,
    messages,
    temperature: 0.9,
    max_tokens: 4096,
  }
  if (!plainText) body.response_format = { type: 'json_object' }

  const doFetch = () => fetch(GEMINI_BASE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  let response = await doFetch()

  // Retry up to 3 times on rate limit with backoff
  if (response.status === 429) {
    const delays = [8000, 16000, 30000]
    for (const delay of delays) {
      await new Promise(r => setTimeout(r, delay))
      response = await doFetch()
      if (response.status !== 429) break
    }
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error: ${response.status}`)
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

CHARACTERS (use the exact id field in all JSON responses):
${allCharacters.map(c => `id="${c.id}" name="${c.name}" handle="@${c.handle}" followers=${c.followerCount} — ${c.bio}`).join('\n')}

PLAYER: id="${playerCharacter.id}" name="${playerCharacter.name}" handle="@${playerCharacter.handle}"
- Followers: ${playerState.followerCount}
- Level: ${playerState.level}
- Stats: ${Object.entries(playerState.stats).map(([k, v]) => `${k}: ${v}%`).join(', ')}
- Relationships: ${relationshipStr || 'None yet'}

RECENT FEED (last 20):
${feedContext || 'Feed is empty — this is the beginning.'}

PLAYER STATS (use these names only in statChanges):
- charisma: social magnetism and charm
- looks: appearance, style, presentation
- luck: random opportunities and serendipity
- strength: mental toughness, resilience under pressure
- wit: humor, timing, comedic intelligence
- hustle: work ethic, grind, consistency

CHEMISTRY TYPES (shape how characters interact):
- rivals: shade, subtweeting, vague posting, indirect competition — NEVER say "rival" out loud
- spicy: flirtatious tension, thirst replies, ambiguous energy — let it simmer, don't announce it
- lovers: soft, inside jokes, defending, private-feeling public moments
- friends: hype, banter, @-ing each other, tag-ins, inside jokes
- enemies: cold shoulders, receipts, callouts, public beef
- strangers: no acknowledgment yet

MADNESS SCALE BEHAVIOR:
- 0-20 (Realistic): Grounded. Real social dynamics. Nothing over-the-top.
- 21-50 (Heightened): Drama moves faster. Coincidences pile up.
- 51-80 (Chaotic): Wild twists. Characters do unexpected things.
- 81-100 (Bonkers): Anything goes. Maximum chaos.

WRITING RULES — CRITICAL:
- Write like a REAL person on social media. Lowercase, casual, punchy. Emoji only when it fits naturally.
- NEVER write villain lines like "I see I have a new rival" / "watch your back" / "mark my words". Those are cringe.
- Show don't tell. Jealousy = subtly shady vague post, not an announcement. Interest = liking a post, not a declaration.
- Be SPECIFIC to this world/fandom. Reference actual places, events, character names, lore — not generic drama.
- Characters have their OWN lives outside the player. Most content should feel like it exists independently.
- Wit and humor come first. Drama is seasoning, not the whole meal.
- The player's handle is @${playerCharacter.handle} — only tag them when genuinely warranted, not every post.
- ALL responses must be valid JSON. characterId must be the exact id string from the CHARACTERS list above.`
}

export async function initializeStoryArc(
  worldState: WorldState,
  playerCharacter: Character,
): Promise<StoryArc> {
  const characterList = worldState.characters
    .map(c => `id="${c.id}" ${c.name} (@${c.handle}): ${c.bio}`)
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

export interface PhantomNPCReply {
  name: string
  handle: string
  content: string
  likes: number
  followerCount: number
}

export interface ActionResult {
  xpGained: number
  followersGained: number
  statChanges: { stat: string; delta: number; flavorText: string }[]
  relationshipChanges: { characterId: string; delta: number; flavorText: string }[]
  narrativeResult: string
  newNpcPosts: { characterId: string; content: string; likes: number; reposts: number }[]
  postReplies: { characterId: string; content: string; likes: number }[]
  phantomReplies: PhantomNPCReply[]
  tensionDelta: number
  newConsequences: { type: string; description: string; triggerInNActions: number }[]
  triggerPlannedEvent: boolean
  scandalTriggered?: {
    severity: 'minor' | 'major' | 'career-ending'
    cause: string
    followerLossPerTick: number
    ticksRemaining: number
  } | null
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

  const npcList = allCharacters.filter(c => c.id !== playerCharacter.id)
    .map(c => `id="${c.id}" @${c.handle}`)
    .join(', ')

  const relContext = Object.entries(playerState.relationships)
    .map(([id, rel]) => {
      const c = allCharacters.find(x => x.id === id)
      return c ? `${c.name} (chemistry: ${rel.chemistry}, value: ${rel.value}/100)` : null
    })
    .filter(Boolean).join(', ')

  const playerFollowers = playerState.followerCount
  const followerTier = playerFollowers < 5000 ? 'micro' : playerFollowers < 50000 ? 'rising' : playerFollowers < 500000 ? 'established' : 'mega'

  const prompt = `Player action: "${playerAction}"
Player followers: ${playerFollowers.toLocaleString()} (${followerTier}-level account)

Current relationships: ${relContext || 'none yet'}
Available NPC ids: ${npcList}

You are a NEUTRAL, realistic narrator. Outcomes must be EARNED, not given.

OUTCOME RULES:
- Safe, generic posts: small gains (+50 to +200 followers, +1-3 charisma)
- Strong, on-brand posts: medium gains (+200 to +800, +3-8 charisma)
- Controversial/risky: could go either way — big gain OR big loss, negative relationship changes
- Cringe/off-brand: lose followers (-100 to -500), lose stats, NPCs mock or ignore
- Posts directed at specific characters: MUST affect that character's relationship (positive or negative depending on chemistry)
- Rivals/enemies chemistry: their relationship should go DOWN when player does well (jealousy), they post shade
- Friends/lovers: defend and hype the player, relationship goes UP
- Strangers: don't react unless the post is directly about them
- Stats to use: charisma, looks, luck, strength, wit, hustle

FOLLOWER TIER RULES (affects who responds):
- micro (<5K): big celebs ignore you completely. Random internet people reply. A few mid-tier NPCs might notice.
- rising (5K-50K): some NPCs start paying attention. Established accounts might shade or like.
- established (50K-500K): real NPCs engage. Some big ones react. The world notices.
- mega (500K+): everyone responds. Big names engage. Everything has weight.

POST REPLIES — 2-6 replies directly on the player's post:
- Named NPC replies: from the available NPC character list (only ones who would realistically notice the player's follower tier)
- Mix of supportive, neutral, negative based on chemistry

PHANTOM REPLIES — 3-8 replies from RANDOM internet users (not on the NPC list):
- These are regular people, fans, trolls, critics, bots
- Give each a realistic @handle (lowercase, no spaces, under 20 chars), a name, follower count (100-50000)
- Their content reflects the post's virality and tone
- Make them feel REAL — specific, human reactions, not generic "nice post!" replies

Respond ONLY in JSON:
{
  "xpGained": 15,
  "followersGained": 200,
  "statChanges": [{ "stat": "charisma", "delta": 3, "flavorText": "brief why" }],
  "relationshipChanges": [{ "characterId": "exact_id_from_list", "delta": -8, "flavorText": "brief why" }],
  "narrativeResult": "1 sentence of what just happened in the world",
  "postReplies": [
    { "characterId": "exact_id", "content": "reply text under 120 chars", "likes": 340 }
  ],
  "phantomReplies": [
    { "name": "Jasmine K", "handle": "jasminek_nyc", "content": "reply text", "likes": 23, "followerCount": 847 }
  ],
  "newNpcPosts": [
    { "characterId": "exact_id", "content": "standalone post reacting to the moment", "likes": 1200, "reposts": 45 }
  ],
  "tensionDelta": 3,
  "newConsequences": [],
  "triggerPlannedEvent": false,
  "scandalTriggered": null
}`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw) as ActionResult
  if (!parsed.postReplies) parsed.postReplies = []
  if (!parsed.phantomReplies) parsed.phantomReplies = []
  return parsed
}

export async function generateFeedPosts(
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
): Promise<{ characterId: string; content: string; likes: number; reposts: number; replies: { characterId: string; content: string; likes: number }[] }[]> {
  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, [])

  const npcList = allCharacters.filter(c => c.id !== playerCharacter.id)
    .map(c => `id="${c.id}" @${c.handle}`)
    .join(', ')

  const worldDetail = `Setting: ${worldState.worldSetting}. Fandom: ${worldState.fandom || 'original'}. Day ${worldState.dayNumber}.`

  const prompt = `Generate 8-10 NPC social media posts for this world's timeline.

${worldDetail}
Available characters: ${npcList}

This is a LIVING social media world. The posts should feel like you opened Twitter/X right now and this is what's happening. Make it feel REAL.

POST VARIETY (mix these):
- Slice of life specific to THIS world/fandom (not generic — reference actual places, events, people from the setting)
- Hot takes and opinions that other characters would argue about
- Cryptic vague posts ("some people really need to check themselves 🙄")
- Humble brags disguised as complaints
- Two characters already mid-argument in the replies
- One totally random funny post that has nothing to do with drama
- A "gossip/news account" style post about something that just happened in this world
- A low follower count post that flopped (8 likes, 0 replies) — not everything goes viral

WRITING STYLE — CRITICAL:
- lowercase most of the time, like real twitter
- specific references to the world (character names, locations, events, lore)
- replies CHAIN off each other with @mentions — reply 2 is responding to reply 1, not the original post
- wit > drama. make it funny and sharp first, dramatic second
- characters have personality quirks that come through (the sarcastic one, the dramatic one, the hype beast, etc.)
- NO generic phrases like "I'm not one to gossip but..." or "just saying..." — be specific

ENGAGEMENT REALISM:
- Big accounts: 10K-500K likes on bangers, 500-5K on regular posts
- Small/new accounts: 50-2K likes
- Some posts genuinely flop: 8-80 likes
- Reposts = roughly 5-15% of likes

Replies should feel like a comment section that's alive — people reacting to each other, not just the original post. Use @handles in replies.

Respond ONLY in JSON:
{
  "posts": [
    {
      "characterId": "exact_id",
      "content": "post text",
      "likes": 3200,
      "reposts": 120,
      "replies": [
        { "characterId": "exact_id", "content": "@handle reply text", "likes": 890 },
        { "characterId": "exact_id", "content": "@handle replying to previous reply", "likes": 340 }
      ]
    }
  ]
}`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw)
  return (parsed.posts || []).map((p: any) => ({ ...p, replies: p.replies || [] }))
}

export async function generateDMResponse(
  character: Character,
  conversationHistory: { role: 'player' | 'npc'; content: string }[],
  worldState: WorldState,
  storyArc: StoryArc,
  playerFollowerCount: number,
): Promise<string | null> {
  // Ghost logic: bigger celeb = less likely to respond to small accounts
  const celebFollowers = character.followerCount
  const ratio = celebFollowers / Math.max(playerFollowerCount, 1)

  // Ghost probability increases with follower gap
  // e.g. celeb has 10M, player has 1K => ratio=10000 => 90% ghost chance
  // celeb has 100K, player has 50K => ratio=2 => 10% ghost
  let ghostChance = 0
  if (ratio > 1000) ghostChance = 0.90
  else if (ratio > 100) ghostChance = 0.70
  else if (ratio > 20) ghostChance = 0.40
  else if (ratio > 5) ghostChance = 0.15
  else ghostChance = 0.05

  // First message is always responded to (give the player a chance)
  if (conversationHistory.filter(m => m.role === 'npc').length === 0) ghostChance = Math.min(ghostChance, 0.3)

  if (Math.random() < ghostChance) return null

  const historyMessages = conversationHistory.map(m => ({
    role: m.role === 'player' ? 'user' : 'assistant',
    content: m.content,
  }))

  const system = `You are ${character.name} (@${character.handle}) in the world: "${worldState.worldSetting}".
Your bio: ${character.bio}
Your personality: ${character.description}
Current story tension: ${storyArc.currentTension}/100

The person DMing you has ${playerFollowerCount.toLocaleString()} followers. ${ratio > 100 ? 'They\'re a much smaller account — be somewhat guarded or distant unless their message is genuinely compelling.' : ratio > 10 ? 'They\'re smaller than you but not nobody.' : 'You\'re at a similar level — treat them as a peer.'}

Respond as ${character.name} via DM. Be in character. Keep it short — 1-3 sentences max. Write like real DMs: lowercase, casual, no punctuation overkill.
Do NOT use JSON. Just write the response as plain text.`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    ...historyMessages,
  ], undefined, true)

  return raw.trim()
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

export async function generateNPCAutonomousPost(
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
  recentFeed: Post[],
): Promise<{ characterId: string; content: string; likes: number; reposts: number; mentionsPlayer: boolean }[]> {
  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, recentFeed)

  const npcIds = allCharacters.filter(c => c.id !== playerCharacter.id).map(c => `id="${c.id}" @${c.handle}`).join(', ')

  const prompt = `Generate 2-3 organic NPC social media posts that happen without the player's involvement.

CRITICAL — 60% of posts should involve NPC-to-NPC interaction (not about the player). Use these interaction types:
- Two NPCs arguing in replies: one NPC starts a post, another NPC quote-tweets or fires back directly (use @handle in content)
- An NPC vague-posting that's obviously aimed at another NPC (e.g., "some people really need to learn loyalty 🙄")
- An NPC directly calling out another NPC by name or handle
- Two NPCs hyping each other, forming a public alliance, or declaring a collab
- An NPC publicly distancing from or subtweeting another NPC they used to be close with

The remaining 40% can be standalone posts about the NPC's own life, opinions, or world events.

Only RARELY mention the player — they're not the center of every post.

Match each character's voice exactly. Write like real social media — lowercase, short, punchy, platform-native. Make it feel like you opened Twitter right now.

Available NPCs: ${npcIds}

Respond in JSON:
{
  "posts": [
    { "characterId": "exact_character_id", "content": "post content", "likes": 3200, "reposts": 120, "mentionsPlayer": false }
  ]
}

Generate 2-3 posts. mentionsPlayer should be true only if the post explicitly tags or mentions ${playerCharacter.name} (@${playerCharacter.handle}).`

  const raw = await callOpenAI([
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ])

  const parsed = JSON.parse(raw)
  return parsed.posts || []
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

export type RandomWorldEventType =
  | 'stranger_callout'
  | 'viral_screenshot'
  | 'brand_dm'
  | 'npc_drama_involving_player'
  | 'rumor'
  | 'unexpected_follow'
  | 'npc_beef'

export interface RandomWorldEvent {
  type: RandomWorldEventType
  title: string
  description: string
  npcPost?: { characterId: string; content: string; likes: number; reposts: number }
  xpMin: number
  xpMax: number
  suggestions: string[]
}

export async function generateRandomWorldEvent(
  worldState: WorldState,
  storyArc: StoryArc,
  playerState: PlayerGameState,
  playerCharacter: Character,
  allCharacters: Character[],
): Promise<RandomWorldEvent | null> {
  // 40% chance of firing — not every tick produces an event
  if (Math.random() < 0.4) return null

  const system = buildMasterSystemPrompt(worldState, storyArc, playerState, playerCharacter, allCharacters, [])
  const npcList = allCharacters.filter(c => c.id !== playerCharacter.id)
    .map(c => `id="${c.id}" @${c.handle} (${c.name})`)
    .join(', ')

  const eventTypes = [
    'stranger_callout — someone with no prior relationship calls you out or quotes you',
    'viral_screenshot — an old post/moment of yours gets screenshotted and recirculates (good or bad)',
    'brand_dm — a brand or external account reaches out with an offer or accusation',
    'npc_drama_involving_player — two NPCs are beefing and both tagged you for your take',
    'rumor — a rumor about you starts spreading that you didn\'t create',
    'unexpected_follow — a huge or surprising account suddenly follows or unfollows you',
    'npc_beef — two NPCs start publicly beefing (player can choose sides or stay out)',
  ]

  const prompt = `Something unexpected just happened in the world — pick ONE event type and generate it. This fires randomly between player actions — it should feel like the world has a life of its own.

Event types:
${eventTypes.join('\n')}

Available NPCs: ${npcList}
World: ${worldState.worldSetting} (${worldState.fandom || 'original'})
Current tension: ${storyArc.currentTension}/100

Rules:
- Pick whichever event type feels most interesting right now given the tension and world state
- Make it specific to this world/fandom — reference real lore, places, characters
- It should give the player something to react to (suggestions for how to respond)
- Mix of positive and negative events — not everything is bad, not everything is good
- npcPost is optional — only include if an NPC would actually post about this event

Respond in JSON:
{
  "type": "one_of_the_types_above",
  "title": "short punchy title (under 8 words)",
  "description": "2-3 sentences describing exactly what happened, who's involved, why it matters to the player",
  "npcPost": { "characterId": "exact_id_or_omit_field", "content": "what they posted", "likes": 4200, "reposts": 180 },
  "xpMin": 20,
  "xpMax": 60,
  "suggestions": ["option 1 response", "option 2 response", "option 3 response"]
}`

  try {
    const raw = await callOpenAI([
      { role: 'system', content: system },
      { role: 'user', content: prompt },
    ])
    const parsed = JSON.parse(raw)
    if (!parsed.type || !parsed.title || !parsed.description) return null
    // Remove npcPost if characterId is missing or invalid
    if (parsed.npcPost && !allCharacters.find(c => c.id === parsed.npcPost?.characterId)) {
      delete parsed.npcPost
    }
    return parsed as RandomWorldEvent
  } catch {
    return null
  }
}
