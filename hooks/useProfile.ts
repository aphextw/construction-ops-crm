import { useEffect, useState } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { API_URL, api } from "@/hooks/api_client";

export type UserProfile = {
  id?: string;
  full_name?: string;
  email?: string;
  profile_photo_url?: string | null;
  rating?: number;
  role?: {
    code?: string;
    display_name?: string;
  };
  company?: {
    code?: string;
    display_name?: string;
  };
};

const PROFILE_STORAGE_KEY = "user";
const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

export function useProfile() {
  const [user, setUser] = useState<UserProfile>({});
  const [avatarVersion, setAvatarVersion] = useState(() => Date.now());
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    hydrateProfile();
  }, []);

  const applyUser = async (nextUser: UserProfile) => {
    setUser(nextUser);
    setAvatarVersion(Date.now());
    await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(nextUser));
    return nextUser;
  };

  const readStoredProfile = async () => {
    const saved = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  };

  const fetchProfile = async () => {
    const response = await api.get("api/v1/me");
    return response?.user ?? response;
  };

  const hydrateProfile = async () => {
    try {
      const savedUser = await readStoredProfile();

      if (savedUser) {
        setUser(savedUser);
      }

      const freshUser = await fetchProfile();
      return await applyUser(freshUser);
    } catch (error: any) {
      const message = error?.message || "";

      if (!message.includes("Нет refresh токена")) {
        console.error("Ошибка загрузки профиля:", error);
      }

      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  const refreshProfile = async () => {
    try {
      setRefreshing(true);
      const freshUser = await fetchProfile();
      return await applyUser(freshUser);
    } catch (error: any) {
      const message = error?.message || "";

      if (!message.includes("Нет refresh токена")) {
        console.error("Ошибка обновления профиля:", error);
        Alert.alert("Ошибка", "Не удалось обновить профиль");
      }

      return null;
    } finally {
      setRefreshing(false);
    }
  };

  const pickAvatarFromLibrary = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Нет доступа",
          "Разрешите доступ к фото, чтобы выбрать аватарку из фотоплёнки.",
        );
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets?.length) {
        return null;
      }

      const asset = result.assets[0];

      if (asset.fileSize && asset.fileSize > MAX_PHOTO_SIZE_BYTES) {
        Alert.alert("Файл слишком большой", "Фото должно быть не больше 2 МБ");
        return null;
      }

      setPhotoLoading(true);

      const formData = new FormData();
      formData.append("photo", {
        uri: asset.uri,
        name: asset.fileName ?? "avatar.jpg",
        type: asset.mimeType ?? "image/jpeg",
      } as any);

      const response = await api.request("api/v1/me/profile-photo/upload", {
        method: "POST",
        body: formData,
        multipart: true,
      });

      const nextUser = response?.user ?? response;
      return await applyUser(nextUser);
    } catch (error: any) {
      Alert.alert("Ошибка", error?.message || "Не удалось загрузить фото");
      return null;
    } finally {
      setPhotoLoading(false);
    }
  };

  const deleteAvatar = async () => {
    try {
      setPhotoLoading(true);

      const response = await api.patch("api/v1/me/profile-photo", {
        profile_photo_url: null,
      });

      const nextUser = response?.user ?? response;
      return await applyUser(nextUser);
    } catch (error: any) {
      Alert.alert("Ошибка", error?.message || "Не удалось удалить фото");
      return null;
    } finally {
      setPhotoLoading(false);
    }
  };

  const updateProfile = async (payload: Record<string, string>) => {
    try {
      setSavingProfile(true);

      if (!Object.keys(payload).length) {
        return user;
      }

      const response = await api.patch("api/v1/me", payload);
      const nextUser = response?.user ?? response;
      return await applyUser(nextUser);
    } catch (error: any) {
      Alert.alert("Ошибка", error?.message || "Не удалось сохранить профиль");
      return null;
    } finally {
      setSavingProfile(false);
    }
  };

  const getAvatarUri = (avatarPath = user.profile_photo_url) => {
    if (!avatarPath) {
      return null;
    }

    if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
      const separator = avatarPath.includes("?") ? "&" : "?";
      return `${avatarPath}${separator}v=${avatarVersion}`;
    }

    return `${API_URL.replace(/\/$/, "")}${avatarPath}?v=${avatarVersion}`;
  };

  return {
    user,
    loadingProfile,
    refreshing,
    photoLoading,
    savingProfile,
    hydrateProfile,
    refreshProfile,
    pickAvatarFromLibrary,
    deleteAvatar,
    updateProfile,
    getAvatarUri,
  };
}
