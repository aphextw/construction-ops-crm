import { useState } from "react";
import { api } from "@/hooks/api_client";

export const useDeleteExpensePhoto = () => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const deletePhoto = async (
    expenseId: string,
    projectId: any,
    photoId: string,
  ) => {
    try {
      setLoadingMap((prev) => ({ ...prev, [photoId]: true }));

      const response = await api.request(
        `api/v1/projects/${projectId}/material-expenses/${expenseId}/photos/${photoId}`,
        {
          method: "DELETE",
        },
      );

      return response;
    } catch (e: any) {
      return null;
    } finally {
      setLoadingMap((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  return {
    deletePhoto,
    loadingMap,
  };
};
