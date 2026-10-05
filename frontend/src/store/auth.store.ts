import { api } from "@/api/axios";
import { endpoints } from "@/api/endpoints";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface LastUser {
  email: string;
  name: string;
  // profile image when you add it later
}

interface AuthState {
  accessToken: string | null;
  user: User | null;
  lastUser: LastUser | null; // persisted in localStorage
  setAuth: (token: string, user: User) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
  clearLastUser: () => void;
  isAuthenticated: () => boolean;
  hydrateAuth: () => Promise<void>;
}

// Split into two stores:
// 1. Session store — access token + user (memory only, cleared on tab close)
// 2. Persistent store — last logged-in user (localStorage)

interface LastUserState {
  lastUser: LastUser | null;
  setLastUser: (user: LastUser) => void;
  clearLastUser: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      lastUser: null,

      setAuth: (token, user) =>
        set({
          accessToken: token,
          user,
          lastUser: {
            email: user.email,
            name: user.name,
          },
        }),

      hydrateAuth: async () => {
        try {
          const response = await api.get<{ data: User }>(endpoints.auth.me);
          set({
            user: response.data.data,
          });
        } catch {
          // console.error("Failed to hydrate auth state:", error)
          set({
            accessToken: null,
            user: null,
          });
        }
      },

      setAccessToken: (token) =>
        set({
          accessToken: token,
        }),

      clearAuth: () =>
        set({
          accessToken: null,
          user: null,
        }),

      clearLastUser: () =>
        set({
          lastUser: null,
        }),

      isAuthenticated: () => {
        return !!get().accessToken;
      },
    }),
    {
      name: "auth-storage",
    },
  ),
);

export const useLastUserStore = create<LastUserState>()(
  persist(
    (set) => ({
      lastUser: null,
      setLastUser: (user) => set({ lastUser: user }),
      clearLastUser: () => set({ lastUser: null }),
    }),
    {
      name: "VM-app-last-user",
    },
  ),
);
