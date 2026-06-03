import { create } from 'zustand'

interface UIStore {
  isPostComposerOpen: boolean
  isDMSheetOpen: boolean
  toastMessage: string | null
  toastType: 'success' | 'error' | 'info'
  isSettingsOpen: boolean

  openPostComposer: () => void
  closePostComposer: () => void
  showToast: (message: string, type?: UIStore['toastType']) => void
  hideToast: () => void
  setSettingsOpen: (open: boolean) => void
}

export const useUIStore = create<UIStore>((set) => ({
  isPostComposerOpen: false,
  isDMSheetOpen: false,
  toastMessage: null,
  toastType: 'info',
  isSettingsOpen: false,

  openPostComposer: () => set({ isPostComposerOpen: true }),
  closePostComposer: () => set({ isPostComposerOpen: false }),

  showToast: (message, type = 'info') => {
    set({ toastMessage: message, toastType: type })
    setTimeout(() => set({ toastMessage: null }), 3000)
  },

  hideToast: () => set({ toastMessage: null }),

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}))
