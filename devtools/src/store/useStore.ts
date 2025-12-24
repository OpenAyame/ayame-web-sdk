import { create } from "zustand";
import { type AyameSlice, createAyameSlice } from "./createAyameSlice";
import { type MediaDeviceSlice, createMediaDeviceSlice } from "./createDeviceSlice";
import { type PermissionSlice, createPermissionSlice } from "./createPermissionSlice";
import { type SettingsSlice, createSettingsSlice } from "./createSettingsSlice";

export const useStore = create<AyameSlice & PermissionSlice & MediaDeviceSlice & SettingsSlice>()(
  (...a) => ({
    ...createAyameSlice(...a),
    ...createPermissionSlice(...a),
    ...createMediaDeviceSlice(...a),
    ...createSettingsSlice(...a),
  }),
);
