import { StoryArc, Consequence } from '@/types'

export function evaluateConsequences(storyArc: StoryArc, actionsCompleted: number): Consequence[] {
  return storyArc.pendingConsequences.filter(c => c.triggerInNActions <= 0)
}

export function decrementConsequences(storyArc: StoryArc): StoryArc {
  return {
    ...storyArc,
    pendingConsequences: storyArc.pendingConsequences.map(c => ({
      ...c,
      triggerInNActions: c.triggerInNActions - 1,
    })),
  }
}

export function shouldAdvanceAct(storyArc: StoryArc, milestonesCompleted: number): boolean {
  if (storyArc.act === 1 && milestonesCompleted >= 2 && storyArc.currentTension >= 50) return true
  if (storyArc.act === 2 && milestonesCompleted >= 4 && storyArc.currentTension >= 75) return true
  return false
}

export function shouldTriggerClimax(storyArc: StoryArc): boolean {
  return storyArc.currentTension >= 90
}
