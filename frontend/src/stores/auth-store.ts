import { create } from "zustand";
import type { User, LoginRequest, RegisterRequest } from "@/types";
import { authApi } from "@/lib/api";
import {
  setToken,
  setRefreshToken,
  getToken,
  clearAuth,
  isAuthenticated as checkAuth,
} from "@/lib/auth";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loadUser: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(data);
      const { token, refreshToken, user } = res.data;
      setToken(token);
      setRefreshToken(refreshToken);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || "登录失败";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.register(data);
      const { token, refreshToken, user } = res.data;
      setToken(token);
      setRefreshToken(refreshToken);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { message?: string })?.message || "注册失败";
      set({ error: message, isLoading: false });
      throw err;
    }
  },

  logout: () => {
    clearAuth();
    set({ user: null, token: null, isAuthenticated: false });
    window.location.href = "/login";
  },

  loadUser: async () => {
    if (!checkAuth()) {
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }
    set({ isLoading: true });
    try {
      const res = await authApi.me();
      set({ user: res.data, token: getToken(), isAuthenticated: true, isLoading: false });
    } catch {
      clearAuth();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  setError: (error) => set({ error }),
}));
