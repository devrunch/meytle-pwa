import { create } from 'zustand'
import { api } from '../lib/api'

interface CompanionState {
  profileId: string | null
  loading: boolean
  fetch: () => Promise<void>
  clear: () => void
}

export const useCompanionStore = create<CompanionState>((set) => ({
  profileId: null,
  loading: false,
  fetch: async () => {
    set({ loading: true })
    try {
      const res = await api.get<{ id: string }>('/companions/me/profile')
      set({ profileId: res.data.id, loading: false })
    } catch {
      set({ profileId: null, loading: false })
    }
  },
  clear: () => set({ profileId: null, loading: false }),
}))
