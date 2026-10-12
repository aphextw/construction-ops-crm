import { useState } from "react";
import { api } from "@/hooks/api_client";

type UpdateDeadlinesPayload = {
  company_deadline?: any;
  supplies_deadline?: any;
};

type UpdateDeadlinesResponse = {
  company_deadline?: any;
  supplies_deadline?: any;
};

export function useUpdateDeadlines() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateDeadlines = async (
    projectId: string,
    data: UpdateDeadlinesPayload,
  ): Promise<UpdateDeadlinesResponse | null> => {
    try {
      setLoading(true);
      setError(null);

      const res: UpdateDeadlinesResponse = await api.patch(
        `api/v1/projects/${projectId}/deadlines`,
        data,
      );

      console.log(res);

      return res;
    } catch (e: any) {
      setError(e?.message || "Ошибка обновления дедлайнов");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateDeadlines, loading, error };
}
