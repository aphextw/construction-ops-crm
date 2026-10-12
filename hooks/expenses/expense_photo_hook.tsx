import { useState } from "react";
import { Alert } from "react-native";
import { api } from "@/hooks/api_client";

type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

export const useUploadExpensePhoto = () => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const uploadPhoto = async (
    expenseId: string,
    projectId: any,
    file: UploadFile,
  ) => {
    try {
      setLoadingMap((prev) => ({ ...prev, [expenseId]: true }));

      const formData = new FormData();
      formData.append("photo", file as any);

      const response = await api.request(
        `api/v1/projects/${projectId}/material-expenses/${expenseId}/photos`,
        {
          method: "POST",
          body: formData,
          multipart: true,
        },
      );

      return response;
    } catch (e: any) {
      // Alert.alert("Ошибка", e?.message || "Не удалось загрузить фото");
      return null;
    } finally {
      setLoadingMap((prev) => ({ ...prev, [expenseId]: false }));
    }
  };

  return {
    uploadPhoto,
    loadingMap,
  };
};
