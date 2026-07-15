import { create } from "zustand";
import Cookies from "js-cookie";
import axios from "axios";

interface User {
  id: string;
  email: string;
  display_name?: string;
  name?: string;
  experience_level?: string | null;
  hasCompletedOnboarding?: boolean;
  skill_categories?: string[];
  tech_stacks?: string[];
  role?: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string | null) => void;
  setTokens: (accessToken: string, refreshToken: string | null) => void;
  logout: () => void;
  hydrate: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function isOnboardingComplete(user: User | null): boolean {
  if (!user) return false;
  return !!(user.experience_level || user.hasCompletedOnboarding);
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: (user, accessToken, refreshToken) => {
    Cookies.set("accessToken", accessToken, { secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    set({ user, accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },
  setTokens: (accessToken, refreshToken) => {
    Cookies.set("accessToken", accessToken, { secure: process.env.NODE_ENV === "production", sameSite: "strict" });
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
    set({ accessToken, refreshToken, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    Cookies.remove("accessToken");
    localStorage.removeItem("refreshToken");
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
  },
  hydrate: () => {
    const token = Cookies.get("accessToken");
    const storedRefreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

    if (token) {
      set({ accessToken: token, refreshToken: storedRefreshToken, isAuthenticated: true });
      axios.get(`${API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      }).then((res) => {
        const user = res.data.data ?? res.data.user ?? res.data;
        set({ user, isLoading: false });
      }).catch(async (err) => {
        // If 401 and we have a refresh token, try refreshing
        if (err.response?.status === 401 && storedRefreshToken) {
          try {
            const refreshRes = await axios.post(`${API_URL}/api/auth/refresh`, {
              refreshToken: storedRefreshToken,
            });
            const { accessToken: newToken, refreshToken: newRefresh } = refreshRes.data;
            Cookies.set("accessToken", newToken, { secure: process.env.NODE_ENV === "production", sameSite: "strict" });
            localStorage.setItem("refreshToken", newRefresh);

            // Retry fetching user with new token
            const userRes = await axios.get(`${API_URL}/api/users/me`, {
              headers: { Authorization: `Bearer ${newToken}` },
            });
            const user = userRes.data.data ?? userRes.data.user ?? userRes.data;
            set({ accessToken: newToken, refreshToken: newRefresh, user, isLoading: false });
          } catch {
            Cookies.remove("accessToken");
            localStorage.removeItem("refreshToken");
            set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      });
    } else {
      set({ isLoading: false });
    }
  },
}));
