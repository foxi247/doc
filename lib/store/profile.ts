"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface UserProfile {
  age: number | null;
  gender: "male" | "female" | "other" | null;
  chronicConditions: string[];
  allergies: string[];
  medications: string[];
  onboardingComplete: boolean;
}

interface ProfileStore {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

const defaultProfile: UserProfile = {
  age: null,
  gender: null,
  chronicConditions: [],
  allergies: [],
  medications: [],
  onboardingComplete: false,
};

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      updateProfile: (updates) =>
        set((s) => ({ profile: { ...s.profile, ...updates } })),
      completeOnboarding: () =>
        set((s) => ({ profile: { ...s.profile, onboardingComplete: true } })),
      reset: () => set({ profile: defaultProfile }),
    }),
    { name: "mednavigator-profile" }
  )
);
