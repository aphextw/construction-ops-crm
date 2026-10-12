import { useCallback, useState } from "react";

import { api } from "@/hooks/api_client";

type ProjectHistoryUser = {
  id: string;
  full_name: string;
};

export type ProjectHistoryItem = {
  id: string;
  action: string;
  changed_by?: ProjectHistoryUser | null;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  created_at: string;
};

export function useProjectHistory() {
  const [loadingProjectHistory, setLoadingProjectHistory] = useState(false);
  const [projectHistoryError, setProjectHistoryError] = useState<string | null>(
    null,
  );

  const listProjectHistory = useCallback(async (projectId: string) => {
    try {
      setLoadingProjectHistory(true);
      setProjectHistoryError(null);

      const response = await api.get(`api/v1/projects/${projectId}/history`);
      return response?.history ?? [];
    } catch (error: any) {
      setProjectHistoryError(
        error?.message || "Не удалось загрузить историю проекта",
      );
      return [];
    } finally {
      setLoadingProjectHistory(false);
    }
  }, []);

  return {
    loadingProjectHistory,
    projectHistoryError,
    listProjectHistory,
  };
}
