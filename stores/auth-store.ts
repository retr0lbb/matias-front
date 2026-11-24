import { create } from "zustand";
import {
  createJSONStorage,
  persist,
  type StateStorage,
} from "zustand/middleware";

export type SessionUser = {
  id?: string;
  name: string;
  email: string;
  emailVerified: boolean;
  loginProvider?: "LOCAL" | "GOOGLE";
};

type AuthState = {
  /**
   * The signed-in user. The real session is the backend's cookie; this is
   * the client's copy so pages know who is signed in without a request.
   */
  user: SessionUser | null;
  /** "Manter conectado": keep the user across browser sessions. */
  remember: boolean;
  signIn: (user: SessionUser, remember: boolean) => void;
  signOut: () => void;
  /** Replaces the user with fresh data (e.g. from GET /me), keeping `remember`. */
  setUser: (user: SessionUser) => void;
  setEmailVerified: (emailVerified: boolean) => void;

  /** "Missing e-mail verification" popup, opened by a 403 from the API. */
  verificationPromptOpen: boolean;
  openVerificationPrompt: () => void;
  closeVerificationPrompt: () => void;
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      remember: false,
      signIn: (user, remember) => set({ user, remember }),
      signOut: () =>
        set({ user: null, remember: false, verificationPromptOpen: false }),
      setUser: (user) => set({ user }),
      setEmailVerified: (emailVerified) =>
        set((state) =>
          state.user ? { user: { ...state.user, emailVerified } } : {},
        ),

      verificationPromptOpen: false,
      openVerificationPrompt: () => set({ verificationPromptOpen: true }),
      closeVerificationPrompt: () => set({ verificationPromptOpen: false }),
    }),
    {
      name: "matias-auth",
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        user: state.user,
        remember: state.remember,
      }),
      skipHydration: true,
    },
  ),
);
