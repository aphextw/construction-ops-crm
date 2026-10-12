import { useState } from "react";
import { api } from "@/hooks/api_client";

export function useUploadProjectFile() {
  const [loadingFile, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    projectId: string,
    type: string, // категория: "project_pdf", "document" и т.д.
    file: {
      uri: string;
      name: string;
      type: string;
    },
  ) => {
    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();

      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.type,
      } as any);

      formData.append("display_name", file.name);

      const data = await api.request(
        `api/v1/projects/${projectId}/files/project_pdf`,
        {
          method: "POST",
          body: formData,
          multipart: true,
          headers: {
            accept: "application/json",
            // Content-Type не ставим — он будет multipart/form-data автоматически
          },
        },
      );

      console.log("UPLOAD RESPONSE:", data);
      return data;
    } catch (e: any) {
      console.log("UPLOAD ERROR:", e);
      // Твой api-клиент уже выбрасывает Error с текстом ответа сервера
      setError(e?.message || "Ошибка загрузки файла");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loadingFile, error };
}
