import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

type AuthState = {
  /** Session token (fictitious for now) used for session-based auth. */
  hostId: string | null;
  /** "Manter conectado": keep the token across browser sessions. */
  remember: boolean;
  signIn: (hostId: string, remember: boolean) => void;
  clearHostId: () => void;
};

/**
 * Writes to localStorage when the user chose "Manter conectado",
 * otherwise to sessionStorage (cleared when the tab closes).
 */
const authStorage: StateStorage = {
  getItem: (name) => sessionStorage.getItem(name) ?? localStorage.getItem(name),
  setItem: (name, value) => {
    const remember = Boolean(JSON.parse(value)?.state?.remember);
    const [target, other] = remember
      ? [localStorage, sessionStorage]
      : [sessionStorage, localStorage];
    target.setItem(name, value);
    other.removeItem(name);
  },
  removeItem: (name) => {
    sessionStorage.removeItem(name);
    localStorage.removeItem(name);
  },
};

export function createFakeHostId() {
  return `host_${crypto.randomUUID().replaceAll("-", "")}`;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      hostId: null,
      remember: false,
      signIn: (hostId, remember) => set({ hostId, remember }),
      clearHostId: () => set({ hostId: null, remember: false }),
    }),
    {
      name: "matias-auth",
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        hostId: state.hostId,
        remember: state.remember,
      }),
      skipHydration: true,
    },
  ),
);
