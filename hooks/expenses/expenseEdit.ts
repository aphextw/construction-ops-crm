import { useState } from "react";
import { api } from "@/hooks/api_client";

type UpdateExpensePayload = {
  section_id?: string;
  material_type?: string;
  quantity?: string;
  unit_price?: string;
  actual_unit_price?: string;
  due_at?: string;
  comment?: string;
  is_paid: boolean;
};

type UpdateExpenseResponse = {
  id: string;
  section_id: string;
  material_type: string;
  quantity: string;
  unit_price: string;
  actual_unit_price: string | null;
  line_total: string;
  planned_line_total: string;
  comment: string;
  is_paid: boolean;
  due_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export function useUpdateExpense() {
  const [loadingUpdate, setLoadingUpdate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateExpense = async (
    projectId: any,
    expenseId: string,
    data: any,
  ): Promise<UpdateExpenseResponse | null> => {
    try {
      setLoadingUpdate(true);
      setError(null);

      const response: UpdateExpenseResponse = await api.patch(
        `api/v1/projects/${projectId}/material-expenses/${expenseId}`,
        data,
      );

      return response;
    } catch (e: any) {
      const errorMessage = e?.message || "Ошибка обновления расхода";

      setError(errorMessage);
      return null;
    } finally {
      setLoadingUpdate(false);
    }
  };

  return { updateExpense, loadingUpdate, error };
}
