import { useState } from "react";
import { Alert } from "react-native";
import { Directory, File, Paths } from "expo-file-system";

import { api } from "@/hooks/api_client";

const inflightDownloads = new Map<string, Promise<string | null>>();
const resolvedDocuments = new Map<string, string>();

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      try {
        const result = reader.result as string;
        resolve(result.split(",")[1] || "");
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

const askDownloadConfirmation = () =>
  new Promise<boolean>((resolve) => {
    Alert.alert(
      "Создать Word-файл",
      "Открыть экспорт раздела в Word?",
      [
        {
          text: "Отмена",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Открыть",
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });

export const useMaterialSectionDocument = () => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const getSharingModule = () => {
    try {
      return require("expo-sharing");
    } catch (error) {
      console.log("Sharing module unavailable:", error);
      return null;
    }
  };

  const openWithSystemShare = async (uri: string) => {
    const Sharing = getSharingModule();

    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, {
        UTI: "org.openxmlformats.wordprocessingml.document",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      return;
    }

    Alert.alert(
      "Готово",
      "Word-файл сохранён в приложении «Файлы» в папке STU / exports",
    );
  };

  const downloadDocument = async (
    projectId: string | string[],
    sectionId: string,
  ): Promise<string | null> => {
    const confirmed = await askDownloadConfirmation();
    if (!confirmed) {
      return null;
    }

    const normalizedProjectId = Array.isArray(projectId)
      ? projectId[0]
      : projectId;

    const cacheKey = `${normalizedProjectId}-${sectionId}`;

    try {
      const cachedUri = resolvedDocuments.get(cacheKey);
      if (cachedUri) {
        await openWithSystemShare(cachedUri);
        return cachedUri;
      }

      if (inflightDownloads.has(cacheKey)) {
        return await inflightDownloads.get(cacheKey)!;
      }

      setLoadingMap((prev) => ({ ...prev, [sectionId]: true }));

      const downloadPromise = (async () => {
        const blob = await api.download(
          `api/v1/projects/${normalizedProjectId}/material-sections/${sectionId}/document`,
        );

        const dir = new Directory(Paths.document, "exports");
        if (!dir.exists) {
          await dir.create({ intermediates: true });
        }

        const fileName = `section_${sectionId}_${Date.now()}.docx`;
        const file = new File(dir, fileName);
        const base64 = await blobToBase64(blob);

        await file.write(base64, { encoding: "base64" });
        resolvedDocuments.set(cacheKey, file.uri);

        return file.uri;
      })();

      inflightDownloads.set(cacheKey, downloadPromise);

      const localUri = await downloadPromise;
      if (!localUri) {
        return null;
      }

      await openWithSystemShare(localUri);

      return localUri;
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Ошибка",
        error?.message || "Не удалось подготовить Word-файл",
      );
      return null;
    } finally {
      inflightDownloads.delete(cacheKey);
      setLoadingMap((prev) => ({ ...prev, [sectionId]: false }));
    }
  };

  return {
    downloadDocument,
    loadingMap,
  };
};
