import { useState } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "@/hooks/api_client";

type RegisterPayload = {
  full_name: string;
  email: string;
  password: string;
  role?: string;
  company_code: string;
};

export function useRegistration() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (payload: RegisterPayload) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post("api/v1/auth/register", payload);

      const accessToken: string | undefined = response?.tokens?.access_token;
      const refreshToken: string | undefined = response?.tokens?.refresh_token;
      const userData = response?.user;
      const message: string | undefined = response?.message;

      if (!accessToken || !refreshToken || !userData) {
        throw new Error("Некорректный ответ сервера");
      }

      await SecureStore.setItemAsync("access_token", accessToken);
      await SecureStore.setItemAsync("refresh_token", refreshToken);
      await AsyncStorage.setItem("user", JSON.stringify(userData));

      return {
        success: true as const,
        message: message || "Регистрация завершена",
      };
    } catch (e: any) {
      const nextError = e?.message || "Ошибка регистрации";
      setError(nextError);
      return {
        success: false as const,
        message: nextError,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    register,
  };
}
