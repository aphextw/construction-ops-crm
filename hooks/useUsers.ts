import { useState } from "react";

import { api } from "@/hooks/api_client";

export type AppUser = {
  id: string;
  email: string;
  full_name: string;
  profile_photo_url?: string | null;
  rating?: number;
  status?: string;
  role?: {
    code?: string;
    display_name?: string;
  };
  company?: {
    code?: string;
    display_name?: string;
  };
};

export function useUsers() {
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);

  const getUsers = async () => {
    try {
      setLoadingUsers(true);
      setUsersError(null);

      const response = await api.get("api/v1/users");
      return response?.users ?? [];
    } catch (error: any) {
      setUsersError(error?.message || "Не удалось загрузить список пользователей");
      return [];
    } finally {
      setLoadingUsers(false);
    }
  };

  return {
    loadingUsers,
    usersError,
    getUsers,
  };
}
