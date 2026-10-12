import { useCallback, useState } from "react";

import { api } from "@/hooks/api_client";
import { AppUser } from "@/hooks/useUsers";

export function useUserModeration() {
  const [loadingModerationUsers, setLoadingModerationUsers] = useState(false);
  const [savingModerationUser, setSavingModerationUser] = useState(false);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const getModerationUsers = useCallback(async () => {
    try {
      setLoadingModerationUsers(true);
      setModerationError(null);

      const response = await api.get("api/v1/users");
      return response?.users ?? [];
    } catch (error: any) {
      setModerationError(
        error?.message || "Не удалось загрузить список пользователей",
      );
      return [];
    } finally {
      setLoadingModerationUsers(false);
    }
  }, []);

  const approveUser = useCallback(async (
    userId: string,
    payload: { role: string; company_code?: string },
  ) => {
    try {
      setSavingModerationUser(true);
      setModerationError(null);

      const response = await api.post(`api/v1/users/${userId}/approve`, payload);
      return response?.user ?? null;
    } catch (error: any) {
      setModerationError(error?.message || "Не удалось подтвердить пользователя");
      return null;
    } finally {
      setSavingModerationUser(false);
    }
  }, []);

  const rejectUser = useCallback(async (userId: string) => {
    try {
      setSavingModerationUser(true);
      setModerationError(null);

      const response = await api.post(`api/v1/users/${userId}/reject`, {});
      return response?.user ?? null;
    } catch (error: any) {
      setModerationError(error?.message || "Не удалось отклонить пользователя");
      return null;
    } finally {
      setSavingModerationUser(false);
    }
  }, []);

  const updateUserAdminProfile = useCallback(async (
    userId: string,
    payload: Record<string, string | null>,
  ) => {
    try {
      setSavingModerationUser(true);
      setModerationError(null);

      const response = await api.patch(`api/v1/users/${userId}`, payload);
      return response?.user ?? null;
    } catch (error: any) {
      setModerationError(
        error?.message || "Не удалось обновить данные пользователя",
      );
      return null;
    } finally {
      setSavingModerationUser(false);
    }
  }, []);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setSavingModerationUser(true);
      setModerationError(null);

      const response = await api.delete(`api/v1/users/${userId}`);
      return response?.user ?? true;
    } catch (error: any) {
      setModerationError(
        error?.message || "Не удалось удалить пользователя",
      );
      return null;
    } finally {
      setSavingModerationUser(false);
    }
  }, []);

  return {
    loadingModerationUsers,
    savingModerationUser,
    moderationError,
    getModerationUsers,
    approveUser,
    rejectUser,
    updateUserAdminProfile,
    deleteUser,
  };
}
