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
      "Скачать файл",
      "Файл расхода",
      [
        {
          text: "Отмена",
          style: "cancel",
          onPress: () => resolve(false),
        },
        {
          text: "Скачать",
          onPress: () => resolve(true),
        },
      ],
      {
        cancelable: true,
        onDismiss: () => resolve(false),
      },
    );
  });

export const useExpenseFileDownload = () => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const getSharingModule = () => {
    try {
      return require("expo-sharing");
    } catch (error) {
      console.log("Sharing module unavailable:", error);

      return null;
    }
  };

  const openWithSystemShare = async (uri: string, mimeType?: string) => {
    const Sharing = getSharingModule();

    if (Sharing && (await Sharing.isAvailableAsync())) {
      await Sharing.shareAsync(uri, {
        mimeType,
      });

      return;
    }

    Alert.alert("Готово", "Файл сохранён в приложении «Файлы»");
  };

  const getExtensionFromMimeType = (mimeType?: string) => {
    if (!mimeType) {
      return "bin";
    }

    const mimeMap: Record<string, string> = {
      "application/pdf": "pdf",
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/heic": "heic",
      "application/msword": "doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        "docx",
      "application/vnd.ms-excel": "xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        "xlsx",
      "text/plain": "txt",
      "video/mp4": "mp4",
    };

    return mimeMap[mimeType] || "bin";
  };

  const downloadFile = async (
    fileUrl: string,
    contentType?: string,
    fileName?: string,
  ): Promise<string | null> => {
    const confirmed = await askDownloadConfirmation();

    if (!confirmed) {
      return null;
    }

    const cacheKey = fileUrl;

    try {
      // already downloaded
      const cachedUri = resolvedDocuments.get(cacheKey);

      if (cachedUri) {
        await openWithSystemShare(cachedUri, contentType);

        return cachedUri;
      }

      // prevent duplicate requests
      if (inflightDownloads.has(cacheKey)) {
        return await inflightDownloads.get(cacheKey)!;
      }

      setLoadingMap((prev) => ({
        ...prev,
        [cacheKey]: true,
      }));

      const downloadPromise = (async () => {
        const blob = await api.download(
          fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl,
        );

        const dir = new Directory(Paths.document, "downloads");

        if (!dir.exists) {
          await dir.create({
            intermediates: true,
          });
        }

        const extension = getExtensionFromMimeType(contentType);

        const resolvedFileName = fileName || `file_${Date.now()}.${extension}`;

        const file = new File(dir, resolvedFileName);

        const base64 = await blobToBase64(blob);

        await file.write(base64, {
          encoding: "base64",
        });

        resolvedDocuments.set(cacheKey, file.uri);

        return file.uri;
      })();

      inflightDownloads.set(cacheKey, downloadPromise);

      const localUri = await downloadPromise;

      if (!localUri) {
        return null;
      }

      await openWithSystemShare(localUri, contentType);

      return localUri;
    } catch (error: any) {
      console.log(error);

      Alert.alert("Ошибка", error?.message || "Не удалось скачать файл");

      return null;
    } finally {
      inflightDownloads.delete(cacheKey);

      setLoadingMap((prev) => ({
        ...prev,
        [cacheKey]: false,
      }));
    }
  };

  return {
    downloadFile,
    loadingMap,
  };
};
