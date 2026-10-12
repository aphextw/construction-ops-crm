import { useState } from "react";
import { api } from "@/hooks/api_client";

type TogglePaidResponse = {
  id: string;
  is_paid: boolean;
  paid_at: string | null;
};

export function useToggleExpensePaid() {
  const [loadingToggle, setLoadingToggle] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const togglePaid = async (
    projectId: any,
    expenseId: string,
    currentValue: boolean,
  ): Promise<TogglePaidResponse | null> => {
    try {
      setLoadingToggle(true);
      setError(null);

      // 🔥 логика бекенда
      const body = currentValue ? { is_paid: false } : {};

      const response: TogglePaidResponse = await api.patch(
        `api/v1/projects/${projectId}/material-expenses/${expenseId}/paid`,
        body,
      );

      return response;
    } catch (e: any) {
      const errorMessage = e?.message || "Ошибка смены статуса оплаты";
      setError(errorMessage);
      return null;
    } finally {
      setLoadingToggle(false);
    }
  };

  return { togglePaid, loadingToggle, error };
}
