import { useState } from "react";
import { File, Directory, Paths } from "expo-file-system";
import { api } from "@/hooks/api_client";

export function useDownloadProjectFile() {
  const [loadingDownload, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pdfUri, setPdfUri] = useState(null);

  const blobToBase64 = (blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result.split(",")[1]); // убираем data:...base64,
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  const downloadFile = async (
    projectId,
    fileId,
    fileName = "file.pdf",
    sectionId = null,
    expenseId = null,
  ) => {
    try {
      setLoading(true);
      setError(null);

      const endpoint = sectionId
        ? `api/v1/projects/${projectId}/material-sections/${sectionId}/files/${fileId}/download`
        : `api/v1/projects/${projectId}/material-expenses/${expenseId}/files/${fileId}/download`;
      // : `api/v1/projects/${projectId}/files/${fileId}/download`;

      const blob = await api.download(endpoint);

      const dir = new Directory(Paths.cache, "downloads");
      if (!dir.exists) {
        await dir.create({ intermediates: true });
      }

      const file = new File(dir, fileName);

      const base64 = await blobToBase64(blob);

      await file.write(base64, {
        encoding: "base64",
      });

      setPdfUri(file.uri);
      return file.uri;
    } catch (e) {
      console.log("DOWNLOAD ERROR:", e);
      setError(e?.message || "Ошибка");
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    downloadFile,
    loadingDownload,
    error,
    pdfUri,
  };
}
