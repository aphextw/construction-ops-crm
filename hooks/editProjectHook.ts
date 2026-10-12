import { useState } from "react";
import { api } from "@/hooks/api_client";

interface UpdateProjectData {
  name?: string;
  object_code?: string;
  project_code?: string;
  comment?: string;
  total_materials_cost?: string;
  visible_roles?: string[];
}

interface UseUpdateProjectResult {
  updateProject: (projectId: string, data: UpdateProjectData) => Promise<any>;
  loading: boolean;
  error: string | null;
}

export function useUpdateProject(): UseUpdateProjectResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProject = async (
    projectId: string,
    data: UpdateProjectData,
  ): Promise<any> => {
    if (!projectId) {
      setError("ID проекта не указан");
      return null;
    }

    const cleanedData = Object.fromEntries(
      Object.entries(data).filter(([_, value]) => value !== undefined),
    );

    if (Object.keys(cleanedData).length === 0) {
      setError("Нет данных для обновления");
      return null;
    }

    // фикс типа
    if (cleanedData.total_materials_cost !== undefined) {
      cleanedData.total_materials_cost = String(
        cleanedData.total_materials_cost,
      );
    }

    setLoading(true);
    setError(null);

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await api.patch(
        `api/v1/projects/${projectId}`,
        cleanedData,
      );

      clearTimeout(timeout);

      // console.log("UPDATED PROJECT:", response);

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Ошибка сети";
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { updateProject, loading, error };
}
