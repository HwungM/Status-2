# Clout

A full-stack social media simulation RPG. Build worlds, play characters, and live out a story through a fake social media feed driven entirely by AI.

## Setup

1. Install dependencies:
```
npm install
```

2. Start the development server:
```
npm start
```

3. Open on device or simulator using the Expo Go app or iOS/Android simulators.

## OpenAI API Key

Clout requires an OpenAI API key to generate events, feed posts, DM responses, and story arcs.

1. Get a key from [platform.openai.com](https://platform.openai.com)
2. Open the app and go to **Settings** (gear icon on Home)
3. Paste your key into the **OpenAI API Key** field
4. Tap **Save API Key**

Your key is stored locally on-device only and is never sent anywhere except OpenAI's API.

## Architecture

### Core Philosophy

The AI is always running a narrative — it has a plan for your story. Every action compounds into consequences. A bad post leads to a scandal leads to a redemption arc.

### Key Files

- `services/openaiService.ts` — All AI calls (10 types). The narrative engine lives here.
- `services/worldSessionService.ts` — All session persistence via AsyncStorage in v1.
- `store/gameStore.ts` — Zustand store. All state mutations go through `dispatch()` — never direct `set()`.
- `types/index.ts` — Full TypeScript interfaces for WorldSession, StoryArc, GameAction, etc.

### State Mutations

All mutations go through dispatched actions (never `set()` directly):

```typescript
// Always use dispatch:
dispatch({ type: 'XP_GAINED', payload: { userId, amount: 20 } })
dispatch({ type: 'FOLLOWERS_GAINED', payload: { userId, amount: 500, reason: '...' } })
dispatch({ type: 'STAT_CHANGED', payload: { userId, stat: 'aura', delta: 2.5, flavorText: '...' } })
```

This pattern makes every state change broadcastable to multiplayer clients in v2.

### No Energy System

There is no energy system, gem system, daily limits, or paywalls anywhere in this codebase. The game is fully unlimited forever.

## How to Add Multiplayer in v2

1. **Enable Supabase:** In `services/worldSessionService.ts`, swap `LocalWorldSessionService` for `SupabaseWorldSessionService` at the DI root. The interface is identical.

2. **Activate Realtime:** In `supabase/schema.sql`, uncomment the three `ALTER PUBLICATION` lines. Subscribe in `hooks/useMultiplayer.ts`.

3. **Expose invite code UI:** The 6-char invite code is already generated on every session (`WorldSession.inviteCode`). Wire the "Convert to Multiplayer" button in `customize-world.tsx` to call `joinSessionByCode()`.

4. **Flip the mode flag:** Set `WorldSession.mode = 'multiplayer'` and add the second player's `PlayerSlot`. The AI prompts already accept multiple players — no prompt changes needed.

5. **Show presence:** Unhide `PlayerPresenceBar` in the feed header. Wire `PlayerSlot.isOnline` to Supabase Realtime presence.

Every data model, service call, and state mutation was designed with this upgrade in mind.
