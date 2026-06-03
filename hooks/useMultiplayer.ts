// TODO v2: wire Supabase Realtime for multiplayer
export function useMultiplayer() {
  return {
    isMultiplayer: false,
    onlinePlayers: [],
    joinSession: async (_code: string) => { throw new Error('Multiplayer coming in v2') },
    leaveSession: async () => {},
  }
}
