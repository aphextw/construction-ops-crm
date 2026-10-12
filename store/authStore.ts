import { create } from "zustand";

type AuthUser = {
  id: string;
  email: string;
  role: string;
};

type AuthState = {
  user: AuthUser | null;
  isAuth: boolean | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setIsAuth: (isAuth: boolean) => void;
  setLoading: (loading: boolean) => void;
  setAuthenticated: (user: AuthUser | null) => void;
  setUnauthenticated: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: null,
  loading: true,
  setUser: (user) => set({ user }),
  setIsAuth: (isAuth) => set({ isAuth }),
  setLoading: (loading) => set({ loading }),
  setAuthenticated: (user) => set({ user, isAuth: true, loading: false }),
  setUnauthenticated: () => set({ user: null, isAuth: false, loading: false }),
}));
