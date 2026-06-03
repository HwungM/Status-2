import { useEffect } from 'react'
import { useGameStore } from '@/store/gameStore'

export function useSession(sessionId?: string) {
  const { session, isLoading, error, loadSession, loadActiveSession, dispatch, refreshSession } = useGameStore()

  useEffect(() => {
    if (sessionId) {
      loadSession(sessionId)
    } else {
      loadActiveSession()
    }
  }, [sessionId])

  const playerSlot = session?.players[0] ?? null
  const playerCharacter = session?.worldState.characters.find(
    c => c.id === playerSlot?.characterId
  ) ?? null

  return { session, playerSlot, playerCharacter, isLoading, error, dispatch, refreshSession }
}
