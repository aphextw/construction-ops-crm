import { useState } from "react";

import { api } from "@/hooks/api_client";

export type ExpenseHistoryUser = {
  id: string;
  full_name: string;
};

export type ExpenseHistoryItem = {
  id: string;
  project_id: string;
  expense_id: string;
  changed_by?: ExpenseHistoryUser | null;
  action: string;
  before?: Record<string, any> | null;
  after?: Record<string, any> | null;
  created_at: string;
};

export function useExpenseHistory() {
  const [loadingExpenseHistory, setLoadingExpenseHistory] = useState(false);
  const [expenseHistoryError, setExpenseHistoryError] = useState<string | null>(
    null,
  );

  const getExpenseHistory = async (
    projectId: string,
    expenseId: string,
  ): Promise<ExpenseHistoryItem[]> => {
    try {
      setLoadingExpenseHistory(true);
      setExpenseHistoryError(null);

      const response = await api.get(
        `api/v1/projects/${projectId}/material-expenses/${expenseId}/history`,
      );

      return response?.history ?? [];
    } catch (error: any) {
      setExpenseHistoryError(
        error?.message || "Не удалось загрузить историю расхода",
      );
      return [];
    } finally {
      setLoadingExpenseHistory(false);
    }
  };

  return {
    loadingExpenseHistory,
    expenseHistoryError,
    getExpenseHistory,
  };
}
