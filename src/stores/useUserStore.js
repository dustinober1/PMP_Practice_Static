import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const defaultState = {
  name: '',
  theme: 'system',
  donationCodes: []
}

const sanitizeTheme = (theme) =>
  ['light', 'dark', 'system'].includes(theme) ? theme : defaultState.theme

const sanitizeUser = (payload = {}) => ({
  name: typeof payload.name === 'string' ? payload.name.slice(0, 120) : defaultState.name,
  theme: sanitizeTheme(payload.theme),
  donationCodes: Array.isArray(payload.donationCodes)
    ? Array.from(new Set(payload.donationCodes.filter(Boolean))).slice(0, 50)
    : defaultState.donationCodes
})

export const useUserStore = create(
  persist(
    (set, get) => ({
      ...defaultState,
      setName: (name) => set({ name: typeof name === 'string' ? name.slice(0, 120) : '' }),
      setTheme: (theme) => set({ theme: sanitizeTheme(theme) }),
      addDonationCode: (code) => {
        const value = typeof code === 'string' ? code.trim() : ''
        if (!value) return
        const existing = get().donationCodes
        if (existing.includes(value)) return
        set({ donationCodes: [...existing, value].slice(0, 50) })
      },
      resetUser: () => set(defaultState),
      importUser: (payload) => {
        const next = sanitizeUser(payload)
        set({ ...defaultState, ...next })
      }
    }),
    {
      name: 'pmp-user',
      storage: createJSONStorage(() => localStorage),
      version: 1
    }
  )
)
