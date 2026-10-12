import { useEffect } from "react";
import { api } from "@/hooks/api_client";
import * as SecureStore from "expo-secure-store";
import { useAuthStore } from "@/store/authStore";

export function useCheckAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuth = useAuthStore((state) => state.isAuth);
  const loading = useAuthStore((state) => state.loading);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);

  const fetchMe = async () => {
    const res = await api.get("api/v1/me");

    return res;
  };

  const refreshAccessToken = async () => {
    const refreshToken = await SecureStore.getItemAsync("refresh_token");

    if (!refreshToken) {
      throw new Error("No refresh token");
    }

    const res = await api.post("api/v1/auth/refresh", {
      refresh_token: refreshToken,
    });

    if (!res) {
      throw new Error("Refresh failed");
    }

    const data = await res;

    // console.log("access: ", data.tokens.access_token);
    // console.log("refresh: ", data.tokens.refresh_token);

    await SecureStore.setItemAsync("refresh_token", data.tokens.refresh_token);

    await SecureStore.setItemAsync("access_token", data.tokens.access_token);

    return data.tokens.access_token;
  };

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      setLoading(true);

      try {
        let token = await SecureStore.getItemAsync("access_token");

        if (!token) {
          if (!cancelled) {
            setUnauthenticated();
          }
          return;
        }

        try {
          const data = await fetchMe();

          if (!cancelled) {
            setAuthenticated(data);
          }
        } catch (err) {
          token = await refreshAccessToken();

          if (!token) throw new Error("No token");
          const data = await fetchMe();
          if (!cancelled) {
            setAuthenticated(data);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setUnauthenticated();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [setAuthenticated, setLoading, setUnauthenticated]);

  return { user, isAuth, loading };
}
