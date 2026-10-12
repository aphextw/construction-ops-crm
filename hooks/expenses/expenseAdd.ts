import { useState } from "react";
import { api } from "@/hooks/api_client";

type CreateExpensePayload = {
  section_id: string;
  material_type: string;
  quantity: string;
  unit_price: string;
  actual_unit_price?: string;
  due_at?: string;
  comment?: string;
};

type CreateExpenseResponse = {
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
  created_by: {
    id: string;
    full_name: string;
  };
  paid_by: string | null;
  updated_by: string | null;
  photos: [];
};

export function useCreateExpense() {
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createExpense = async (data: any, id: any) => {
    try {
      setLoadingAdd(true);
      setError(null);

      console.log(data);

      const response: CreateExpenseResponse = await api.post(
        `api/v1/projects/${id}/material-expenses`,
        data,
      );

      console.log(response);

      return response;
    } catch (e: any) {
      const errorMessage =
        e?.response?.data?.message || e?.message || "Ошибка создания расхода";
      setError(errorMessage);
      return null;
    } finally {
      setLoadingAdd(false);
    }
  };

  return { createExpense, loadingAdd, error };
}
