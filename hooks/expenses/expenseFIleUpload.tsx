import { useState } from "react";
import { api } from "@/hooks/api_client";

export function useUploadExpenseFile() {
  const [loadingExpFile, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadExpFile = async (
    projectId: string | string[],
    expenseId: string,
    type: string,
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
        `api/v1/projects/${projectId}/material-expenses/${expenseId}/files`,
        {
          method: "POST",
          body: formData,
          multipart: true,
          headers: {
            accept: "application/json",
          },
        },
      );

      console.log("UPLOAD RESPONSE:", data);
      return data;
    } catch (e: any) {
      console.log("UPLOAD ERROR:", e);
      setError(e?.message || "Ошибка загрузки файла");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadExpFile, loadingExpFile, error };
}
