import { useState } from "react";
import { api } from "@/hooks/api_client";

interface UseDeleteProjectResult {
  deleteSectionFile: any;
  loading: boolean;
  error: string | null;
}

export function useDeleteSectionFile(): UseDeleteProjectResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSectionFile = async (
    projectId: string,
    sectionId: string,
    fileId: string,
  ): Promise<boolean> => {
    if (!projectId) {
      setError("ID проекта не указан");
      return false;
    }

    if (!sectionId) {
      setError("ID раздела не указан");
      return false;
    }

    if (!fileId) {
      setError("ID файла не указан");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      await api.delete(
        `api/v1/projects/${projectId}/material-sections/${sectionId}/files/${fileId}`,
      );

      return true;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Ошибка удаления файла";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { deleteSectionFile, loading, error };
}
