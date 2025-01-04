import { create } from 'zustand'
import { type AyameSlice, createAyameSlice } from './createAyameSlice'
import { type SettingsSlice, createSettingsSlice } from './createSettingsSlice'

export const useStore = create<AyameSlice & SettingsSlice>()((...a) => ({
  ...createAyameSlice(...a),
  ...createSettingsSlice(...a),
}))