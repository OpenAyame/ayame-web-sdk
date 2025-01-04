import { create } from 'zustand'
import { type AyameSlice, createAyameSlice } from './createAyameSlice'
import { type PermissionSlice, createPermissionSlice } from './createPermissionSlice'
import { type SettingsSlice, createSettingsSlice } from './createSettingsSlice'

export const useStore = create<AyameSlice & SettingsSlice & PermissionSlice>()((...a) => ({
  ...createAyameSlice(...a),
  ...createPermissionSlice(...a),
  ...createSettingsSlice(...a),
}))
