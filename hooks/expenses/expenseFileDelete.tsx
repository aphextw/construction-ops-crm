import { useState } from "react";
import { Alert } from "react-native";
import { api } from "@/hooks/api_client";

export const useDeleteExpenseFile = () => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const deleteExpenseFile = async (
    expenseId: string,
    projectId: string | string[],
    fileId: string,
    fileName?: string, // опционально для отображения имени файла
  ) => {
    // Показываем подтверждение удаления
    const confirmed = await new Promise<boolean>((resolve) => {
      Alert.alert(
        "Удалить файл",
        fileName
          ? `Вы уверены, что хотите удалить файл "${fileName}"?`
          : "Вы уверены, что хотите удалить этот файл?",
        [
          {
            text: "Отмена",
            style: "cancel",
            onPress: () => resolve(false),
          },
          {
            text: "Удалить",
            style: "destructive",
            onPress: () => resolve(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => resolve(false),
        },
      );
    });

    if (!confirmed) {
      return null;
    }

    try {
      setLoadingMap((prev) => ({
        ...prev,
        [fileId]: true,
      }));

      const response = await api.request(
        `api/v1/projects/${projectId}/material-expenses/${expenseId}/files/${fileId}`,
        {
          method: "DELETE",
        },
      );

      return response;
    } catch (e: any) {
      console.log(e);
      Alert.alert("Ошибка", e?.message || "Не удалось удалить файл");
      return null;
    } finally {
      setLoadingMap((prev) => ({
        ...prev,
        [fileId]: false,
      }));
    }
  };

  return {
    deleteExpenseFile,
    loadingMap,
  };
};
