import { useState } from "react";
import { File, Directory, Paths } from "expo-file-system";
import { api } from "@/hooks/api_client";

const PHOTO_CACHE_DIR = new Directory(Paths.cache, "expense-photos");
const resolvedPhotoUris = new Map<string, string>();
const inflightPhotoDownloads = new Map<string, Promise<string | null>>();
const missingPhotoKeys = new Set<string>();

// ---------- useExpensePhotos ----------

export const useExpensePhotos = () => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  // Convert blob to base64 (reusable)
  const blobToBase64 = (blob: Blob): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1]; // remove data:...;base64,
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

  /**
   * Downloads a photo and returns its local file URI (cached).
   */
  const getPhotoUri = async (
    expenseId: string,
    projectId: any,
    photoId: string,
  ): Promise<string | null> => {
    const cacheKey = `${projectId}-${expenseId}-${photoId}`;

    try {
      const cachedUri = resolvedPhotoUris.get(cacheKey);

      if (cachedUri) {
        return cachedUri;
      }

      if (missingPhotoKeys.has(cacheKey)) {
        return null;
      }

      if (inflightPhotoDownloads.has(cacheKey)) {
        return await inflightPhotoDownloads.get(cacheKey)!;
      }

      setLoadingMap((prev) => ({ ...prev, [photoId]: true }));

      const downloadPromise = (async () => {
        if (!PHOTO_CACHE_DIR.exists) {
          await PHOTO_CACHE_DIR.create({ intermediates: true });
        }

        const file = new File(PHOTO_CACHE_DIR, `${cacheKey}.jpg`);

        if (file.exists) {
          resolvedPhotoUris.set(cacheKey, file.uri);
          return file.uri;
        }

        const blob = await api.download(
          `api/v1/projects/${projectId}/material-expenses/${expenseId}/photos/${photoId}/download`,
        );

        const base64 = await blobToBase64(blob);
        await file.write(base64, { encoding: "base64" });

        resolvedPhotoUris.set(cacheKey, file.uri);

        return file.uri;
      })();

      inflightPhotoDownloads.set(cacheKey, downloadPromise);

      return await downloadPromise;
    } catch (e: any) {
      const errorMessage =
        typeof e?.message === "string" ? e.message.toLowerCase() : "";

      if (errorMessage.includes("material expense photo not found")) {
        missingPhotoKeys.add(cacheKey);
      }

      return null;
    } finally {
      inflightPhotoDownloads.delete(cacheKey);
      setLoadingMap((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  return {
    getPhotoUri,
    loadingMap,
  };
};

// ---------- useUploadExpensePhoto ----------

export const useUploadExpensePhoto = () => {
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});

  const uploadPhoto = async (
    expenseId: string,
    projectId: any,
    file: any, // UploadFile type (e.g. from expo-image-picker)
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
