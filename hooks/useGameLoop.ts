import { useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { useStoryArc } from './useStoryArc'

export function useGameLoop() {
  const { session } = useGameStore()
  const { processConsequences, checkActProgression } = useStoryArc()
  const actionCountRef = useRef(0)

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
}
