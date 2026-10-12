import { useState } from "react";
import { api } from "@/hooks/api_client";

export function useUploadMaterialImport() {
  const [loadingMaterialImport, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadMaterialImport = async (
    projectId: any,
    file: {
      uri: any;
      name: any;
      type: any;
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
        `api/v1/projects/${projectId}/material-imports`,
        {
          method: "POST",
          body: formData,
          multipart: true,
          headers: {
            accept: "application/json",
            // НЕ ставим Content-Type
          },
        },
      );

      console.log("MATERIAL IMPORT RESPONSE:", data);
      return data;
    } catch (e: any) {
      console.log("MATERIAL IMPORT ERROR:", e);
      setError(e?.message || "Ошибка загрузки файла");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadMaterialImport, loadingMaterialImport, error };
}
