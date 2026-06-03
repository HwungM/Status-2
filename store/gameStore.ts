import { create } from 'zustand'
import { WorldSession, GameAction, Post, GameEvent, Notification } from '@/types'
import { LocalWorldSessionService } from '@/services/worldSessionService'

interface GameStore {
  session: WorldSession | null
  isLoading: boolean
  error: string | null
  activeEventId: string | null
  resultToast: {
    visible: boolean
    xpGained: number
    followersGained: number
    narrativeResult: string
    statChanges: { stat: string; delta: number; flavorText: string }[]
  } | null

  loadSession: (sessionId: string) => Promise<void>
  loadActiveSession: () => Promise<void>
  dispatch: (action: GameAction) => Promise<void>
  setActiveEvent: (eventId: string | null) => void
  showResultToast: (data: GameStore['resultToast']) => void
  hideResultToast: () => void
  refreshSession: () => Promise<void>
  clearError: () => void
}

export const useGameStore = create<GameStore>((set, get) => ({
  session: null,
  isLoading: false,
  error: null,
  activeEventId: null,
  resultToast: null,

  loadSession: async (sessionId) => {
    set({ isLoading: true, error: null })
    try {
      const session = await LocalWorldSessionService.getSession(sessionId)
      set({ session, isLoading: false })
    } catch (e: any) {
      set({ error: e.message, isLoading: false })
    }
  },

  loadActiveSession: async () => {
    set({ isLoading: true, error: null })
    try {
      const session = await LocalWorldSessionService.getActiveSession()
      set({ session, isLoading: false })
    } catch (e: any) {
      set({ error: e.message, isLoading: false })
    }
  },

  dispatch: async (action) => {
    const { session } = get()
    if (!session) return
    try {
      await LocalWorldSessionService.dispatchAction(session.id, action)
      const updated = await LocalWorldSessionService.getSession(session.id)
      set({ session: updated })
    } catch (e: any) {
      set({ error: e.message })
    }
  },

  setActiveEvent: (eventId) => set({ activeEventId: eventId }),

  showResultToast: (data) => set({ resultToast: data }),

  hideResultToast: () => set({ resultToast: null }),

  refreshSession: async () => {
    const { session } = get()
    if (!session) return
    const updated = await LocalWorldSessionService.getSession(session.id)
    set({ session: updated })
  },

  clearError: () => set({ error: null }),
}))
