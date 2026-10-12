import { useState } from "react";
import { api } from "@/hooks/api_client";

interface useCreateBigSection {
  createBigSection: (
    projectId: string,
    name: string,
    number: string,
  ) => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useCreateBigSection(): useCreateBigSection {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBigSection = async (
    projectId: string,
    name: string,
    number: string,
  ): Promise<boolean> => {
    if (!projectId) {
      setError("ID проекта не указан");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post(`api/v1/projects/${projectId}/big-sections`, {
        name: name,
        number: number,
      });

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ошибка при создании раздела";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { createBigSection, loading, error };
}
