import { api } from "@/hooks/api_client";
import { useState } from "react";

type UpdateExpenseResponse = {
  id: string;
  section_id: string;
};

export function useUpdateStatus() {
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (
    projectId: any,
    newStatus: string,
  ): Promise<UpdateExpenseResponse | null> => {
    try {
      setLoadingUpdate(true);
      setError(null);

      const response: UpdateExpenseResponse = await api.patch(
        `api/v1/projects/${projectId}/status`,
        { status: newStatus },
      );

      return response;
    } catch (e: any) {
      const errorMessage = e?.message || "Ошибка обновления статуса";

      setError(errorMessage);
      return null;
    } finally {
      setLoadingUpdate(false);
    }
  };

  return { updateStatus, loadingUpdate, error };
}
