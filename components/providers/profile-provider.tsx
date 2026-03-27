"use client";

import { createContext, useContext } from "react";

import type { UserProfile } from "@/lib/api";

interface ProfileContextValue {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  setProfile: () => {},
});

export function ProfileProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: ProfileContextValue;
}) {
  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
