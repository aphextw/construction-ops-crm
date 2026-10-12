import { useState } from "react";
import { api } from "@/hooks/api_client";

interface UseDeleteProjectResult {
  deleteProjectFile: any;
  loading: boolean;
  error: string | null;
}

export function useDeleteProjectFile(): UseDeleteProjectResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteProjectFile = async (
    projectId: string,
    fileId: string,
  ): Promise<boolean> => {
    if (!projectId) {
      setError("ID проекта не указан");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await api.delete(`api/v1/projects/${projectId}/files/${fileId}`);

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ошибка удаления проекта";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteProjectFile, loading, error };
}
