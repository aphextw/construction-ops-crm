import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "@/hooks/api_client";
import { useAuthStore } from "@/store/authStore";

type User = {
  id: string;
  email: string;
  role: string;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("api/v1/auth/login", {
        email: email,
        password: password,
      });

      const json = await response;

      const token: string = json?.tokens?.access_token;
      const refresh_token: any = json?.tokens?.refresh_token;
      const userData = json?.user;

      if (!token || !userData) {
        throw new Error("Некорректный ответ сервера");
      }

      setToken(token);

      await SecureStore.setItemAsync("access_token", token);

      await SecureStore.setItemAsync("refresh_token", refresh_token);

      await AsyncStorage.setItem("user", JSON.stringify(userData));

      setAuthenticated(userData);

      return true;
    } catch (e: any) {
      setError(e.message || "Ошибка авторизации");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setUnauthenticated();
  };

  return {
    user,
    token,
    loading,
    error,
    login,
    logout,
    setError,
  };
}
