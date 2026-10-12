import { useState } from "react";
import { api } from "@/hooks/api_client";

export function useDeleteExpense() {
  const [loadingDelete, setLoadingDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteExpense = async (
    projectId: any,
    expenseId: string,
  ): Promise<boolean> => {
    try {
      setLoadingDelete(true);
      setError(null);

      const res = await api.delete(
        `api/v1/projects/${projectId}/material-expenses/${expenseId}`,
      );

      return true;
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.message || e?.message || "Ошибка удаления расхода";

      setError(errorMessage);
      return false;
    } finally {
      setLoadingDelete(false);
    }
  };

  return { deleteExpense, loadingDelete, error };
}
