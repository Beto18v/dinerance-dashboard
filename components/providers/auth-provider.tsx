"use client";

import {
  createContext,
  useContext,
  useEffect,
  useCallback,
  useLayoutEffect,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import {
  createClient,
  getStoredSessionSnapshot,
} from "@/lib/supabase/client";
import { clearUserCache, getStoredUserId, storeUserId } from "@/lib/cache";

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  signOut: async () => {},
});

const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

function handleSessionUser(uid: string) {
  const stored = getStoredUserId();
  if (stored && stored !== uid) {
    // Different user logged in — wipe stale cache immediately
    clearUserCache();
  }
  storeUserId(uid);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useIsomorphicLayoutEffect(() => {
    const storedSession = getStoredSessionSnapshot();
    if (storedSession?.user.id) {
      handleSessionUser(storedSession.user.id);
    }
    setSession(storedSession);
    setLoading(storedSession == null);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    const syncSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) {
          return;
        }

        const nextSession = data.session;
        if (nextSession?.user.id) {
          handleSessionUser(nextSession.user.id);
        } else if (getStoredUserId()) {
          clearUserCache();
        }

        setSession(nextSession);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (newSession?.user.id) {
        handleSessionUser(newSession.user.id);
      } else if (getStoredUserId()) {
        clearUserCache();
      }
      setSession(newSession);
      setLoading(false);
    });

    const handlePageShow = () => {
      void syncSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncSession();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createClient();
    clearUserCache(); // wipe before next user can log in
    await supabase.auth.signOut();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  return useContext(AuthContext);
}
