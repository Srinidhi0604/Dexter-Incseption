"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch } from "@/lib/client-api";
import type { SessionUser } from "@/types";

const SESSION_STORAGE_KEY = "civicpulse.session";

type StoredSession = {
  token: string;
  user: SessionUser;
};

export interface AuthContextValue {
  user: SessionUser | null;
  token: string | null;
  bootstrapped: boolean;
  login: (token: string, user: SessionUser) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setSessionUser: (user: SessionUser) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  const persist = useCallback((nextToken: string, nextUser: SessionUser) => {
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          token: nextToken,
          user: nextUser,
        } satisfies StoredSession),
      );
    } catch {
      // Ignore storage write errors on restricted browsers.
    }
  }, []);

  const clear = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // Ignore storage removal errors on restricted browsers.
    }
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!token) {
      return;
    }

    try {
      const response = await apiFetch<{ user: SessionUser }>("/api/me", {
        method: "GET",
        token,
        cache: "no-store",
      });
      setUser(response.user);
      persist(token, response.user);
    } catch {
      clear();
    }
  }, [clear, persist, token]);

  useEffect(() => {
    let active = true;

    const finishBootstrapping = () => {
      if (active) {
        setBootstrapped(true);
      }
    };

    try {
      const raw = localStorage.getItem(SESSION_STORAGE_KEY);
      if (!raw) {
        finishBootstrapping();
        return () => {
          active = false;
        };
      }

      const parsed = JSON.parse(raw) as StoredSession;
      if (!parsed?.token || !parsed?.user) {
        clear();
        finishBootstrapping();
        return () => {
          active = false;
        };
      }

      setToken(parsed.token);
      setUser(parsed.user);

      // Unblock the UI immediately; refresh session details in background.
      finishBootstrapping();

      apiFetch<{ user: SessionUser }>("/api/me", {
        method: "GET",
        token: parsed.token,
        cache: "no-store",
      })
        .then((response) => {
          if (!active) {
            return;
          }
          setUser(response.user);
          persist(parsed.token, response.user);
        })
        .catch(() => {
          if (!active) {
            return;
          }
          clear();
        });
    } catch {
      clear();
      finishBootstrapping();
    }

    return () => {
      active = false;
    };
  }, [clear, persist]);

  const login = useCallback(
    (nextToken: string, nextUser: SessionUser) => {
      setToken(nextToken);
      setUser(nextUser);
      persist(nextToken, nextUser);
    },
    [persist],
  );

  const logout = useCallback(() => {
    clear();
  }, [clear]);

  const setSessionUser = useCallback(
    (nextUser: SessionUser) => {
      setUser(nextUser);
      if (token) {
        persist(token, nextUser);
      }
    },
    [persist, token],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      bootstrapped,
      login,
      logout,
      refreshUser,
      setSessionUser,
    }),
    [bootstrapped, login, logout, refreshUser, setSessionUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
