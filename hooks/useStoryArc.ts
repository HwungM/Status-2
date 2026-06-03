import { useGameStore } from '@/store/gameStore'
import { LocalWorldSessionService } from '@/services/worldSessionService'
import { shouldAdvanceAct, decrementConsequences, evaluateConsequences } from '@/utils/narrativeHelpers'

export function useStoryArc() {
  const { session, dispatch, refreshSession } = useGameStore()

  const storyArc = session?.storyArc
  const milestonesCompleted = session?.worldState.milestones.filter(m => m.isCompleted).length ?? 0

  async function processConsequences() {
    if (!session || !storyArc) return

    const triggered = evaluateConsequences(storyArc, 0)
    for (const c of triggered) {
      if (c.type === 'scandal' || c.type === 'follower_loss') {
        await dispatch({
          type: 'SCANDAL_TRIGGERED',
          payload: { description: c.description, followerLoss: Math.floor(c.severity * 10) },
        })
      }
    }

    const updated = decrementConsequences(storyArc)
    await LocalWorldSessionService.updateStoryArc(session.id, {
      pendingConsequences: updated.pendingConsequences.filter(c => c.triggerInNActions > 0),
    })
    await refreshSession()
  }

  async function checkActProgression() {
    if (!session || !storyArc) return
    if (shouldAdvanceAct(storyArc, milestonesCompleted)) {
      await dispatch({ type: 'ACT_ADVANCED', payload: { newAct: (storyArc.act + 1) as 1 | 2 | 3 } })
    }
  }

  return { storyArc, processConsequences, checkActProgression }
}
