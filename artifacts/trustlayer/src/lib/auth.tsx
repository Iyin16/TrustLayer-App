import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Models } from "appwrite";
import { account, ID } from "./appwrite";

type AuthUser = Models.User<Models.Preferences>;

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<AuthUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    account
      .get()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function login(email: string, password: string) {
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setUser(u);
  }

  async function signup(name: string, email: string, password: string) {
    await account.create(ID.unique(), email, password, name);
    await account.createEmailPasswordSession(email, password);
    const u = await account.get();
    setUser(u);
  }

  async function logout() {
    try {
      await account.deleteSession("current");
    } finally {
      setUser(null);
    }
  }

  async function refresh() {
    try {
      const u = await account.get();
      setUser(u);
      return u;
    } catch {
      setUser(null);
      return null;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export function userInitials(name: string | undefined | null): string {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
