import { create } from 'zustand'

interface ViralMomentData {
  followersGained: number
  narrativeResult: string
}

interface UIStore {
  isPostComposerOpen: boolean
  isDMSheetOpen: boolean
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info'
  isSettingsOpen: boolean
  viralMoment: (ViralMomentData & { visible: boolean }) | null

  openPostComposer: () => void
  closePostComposer: () => void
  showToast: (message: string, type?: UIStore['toastType']) => void
  hideToast: () => void
  setSettingsOpen: (open: boolean) => void
  showViralMoment: (data: ViralMomentData) => void
  hideViralMoment: () => void
}

export const useUIStore = create<UIStore>((set) => ({
  isPostComposerOpen: false,
  isDMSheetOpen: false,
  toastMessage: null,
  toastType: 'info',
  isSettingsOpen: false,
  viralMoment: null,

  openPostComposer: () => set({ isPostComposerOpen: true }),
  closePostComposer: () => set({ isPostComposerOpen: false }),

  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type })
    setTimeout(() => set({ toastMessage: null }), 3000)
  },

  hideToast: () => set({ toastMessage: null }),

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),

  showViralMoment: (data) => {
    set({ viralMoment: { ...data, visible: true } })
    setTimeout(() => set({ viralMoment: null }), 4000)
  },

  hideViralMoment: () => set({ viralMoment: null }),
}))
