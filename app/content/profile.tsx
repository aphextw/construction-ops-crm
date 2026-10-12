import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Constants from "expo-constants";
import { Image } from "expo-image";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { BottomSheet } from "react-native-sheet";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useProfile } from "@/hooks/useProfile";
import { api } from "@/hooks/api_client";
import { useDataUserStore } from "@/store/useStore";
import { useAuthStore } from "@/store/authStore";
import { ScreenHeading, ActionRow, WorkspaceButton, useWorkspaceTheme } from "@/components/ui/workspace";
import { Layout } from "@/constants/theme";

export default function ProfileScreen() {
  const theme = useWorkspaceTheme();
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    current_password: "",
    password: "",
    password_repeat: "",
  });
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [projects, setProjects] = useState<any[]>([]);
  const editSheetRef = useRef<any>(null);
  const {
    user,
    loadingProfile,
    refreshing,
    photoLoading,
    savingProfile,
    refreshProfile,
    pickAvatarFromLibrary,
    deleteAvatar,
    updateProfile,
    getAvatarUri,
  } = useProfile();

  const setProjectToOpen = useDataUserStore((state) => state.setProjectToOpen);
  const resetSession = useDataUserStore((state) => state.resetSession);
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);

  const syncEditForm = (profile: any) => {
    setEditForm({
      full_name: profile.full_name || "",
      email: profile.email || "",
      current_password: "",
      password: "",
      password_repeat: "",
    });
  };

  const handleRefresh = async () => {
    const freshUser = await refreshProfile();

    if (freshUser) {
      syncEditForm(freshUser);
    }
  };

  const handlePickAvatar = async () => {
    const nextUser = await pickAvatarFromLibrary();

    if (nextUser) {
      syncEditForm(nextUser);
    }
  };

  const handleDeleteAvatar = async () => {
    Alert.alert("Удалить фото", "Убрать текущую аватарку из профиля?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          const nextUser = await deleteAvatar();

          if (nextUser) {
            syncEditForm(nextUser);
          }
        },
      },
    ]);
  };

  const handleLogOut = async () => {
    resetSession();
    setProjects([]);
    setProjectToOpen({});

    await AsyncStorage.multiRemove([
      "projectsData",
      "user",
      "expense_rating_state_v1",
    ]);
    await Promise.all([
      SecureStore.deleteItemAsync("access_token"),
      SecureStore.deleteItemAsync("refresh_token"),
    ]);

    setUnauthenticated();
  };

  const getInitials = () => {
    const fullName = user.full_name?.trim();

    if (!fullName) {
      return "STU";
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  };

  const avatarUri = getAvatarUri();
  const appVersion = Constants.nativeAppVersion || Constants.expoConfig?.version;
  const roleCode = user.role?.code;
  const canEditOwnProfile = [
    "director",
    "deputy_director",
    "inzhkom_b_manager",
    "developer",
  ].includes(roleCode || "");
  const canManageUsers = [
    "director",
    "deputy_director",
    "developer",
    "estimator_plus",
    "pto",
  ].includes(roleCode || "");

  const openEditProfile = () => {
    syncEditForm(user);
    editSheetRef.current?.show();
  };

  const openUsersPage = () => {
    router.push("/inner_pages/usersModeration");
  };

  const handleEditField = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    if (!canEditOwnProfile) {
      editSheetRef.current?.hide();
      return;
    }

    const trimmedName = editForm.full_name.trim();
    const trimmedEmail = editForm.email.trim();
    const trimmedCurrentPassword = editForm.current_password.trim();
    const trimmedPassword = editForm.password.trim();
    const trimmedPasswordRepeat = editForm.password_repeat.trim();

    if (!trimmedName) {
      Alert.alert("Ошибка", "Введите имя");
      return;
    }

    if (!trimmedEmail) {
      Alert.alert("Ошибка", "Введите email");
      return;
    }

    if (trimmedPassword || trimmedPasswordRepeat) {
      if (trimmedPassword.length < 8) {
        Alert.alert("Ошибка", "Пароль должен быть не короче 8 символов");
        return;
      }

      if (trimmedPassword !== trimmedPasswordRepeat) {
        Alert.alert("Ошибка", "Новый пароль и повтор не совпадают");
        return;
      }

      if (!trimmedCurrentPassword) {
        Alert.alert(
          "Нужен текущий пароль",
          "Бэкенд сейчас требует текущий пароль для смены пароля.",
        );
        return;
      }
    }

    const payload: Record<string, string> = {};

    if (trimmedName !== (user.full_name || "")) {
      payload.full_name = trimmedName;
    }

    if (trimmedEmail !== (user.email || "")) {
      payload.email = trimmedEmail;
    }

    if (trimmedPassword) {
      payload.password = trimmedPassword;
      payload.current_password = trimmedCurrentPassword;
    }

    if (!Object.keys(payload).length) {
      editSheetRef.current?.hide();
      return;
    }

    const nextUser = await updateProfile(payload);

    if (nextUser) {
      syncEditForm(nextUser);
      editSheetRef.current?.hide();
    }
  };

  const STORAGE_KEY = "projectsData";

  const fetchProjects = async () => {
    try {
      if (pendingApproval) {
        setProjects([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }

      const token = await SecureStore.getItem("access_token");

      if (!token) {
        console.log("Нет токена");
        return;
      }

      const response = api.get("api/v1/projects");

      const data = await response;

      setProjects(data.projects);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.projects));
    } catch (err) {
      console.error(
        "Ошибка загрузки:",
        err instanceof Error ? err.message : err,
      );
    }
  };

  const pendingApproval = roleCode === "pending";

  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (pendingApproval) {
          setProjects([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }

        const saved = await AsyncStorage.getItem("projectsData");

        if (saved === null) {
          await fetchProjects();
        }

        if (saved) {
          const parsed = JSON.parse(saved);
          setProjects(parsed);
        }
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
      }
    };

    loadProjects();
  }, [pendingApproval]);

  return (
    <ThemedView style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom + 24, 32),
            paddingHorizontal: Layout.gutter,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.pageTitle}>Профиль</ThemedText>
          </View>

          <TouchableOpacity
            onPress={handleRefresh}
            style={[
              styles.refreshButton,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
            activeOpacity={0.8}
            disabled={refreshing || loadingProfile}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Ionicons name="refresh" size={18} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>

        <ThemedView
          style={[
            styles.heroCard,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
              borderColor: isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <View style={styles.heroTop}>
            <View style={styles.avatarWrap}>
              {loadingProfile && !user.full_name ? (
                <View
                  style={[
                    styles.avatar,
                    styles.skeletonBlock,
                    {
                      backgroundColor: isDark ? "#2c2c2e" : "#e5e7eb",
                    },
                  ]}
                />
              ) : avatarUri ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => setAvatarPreviewVisible(true)}
                >
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatar}
                    cachePolicy={"disk"}
                    contentFit="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarFallback,
                    {
                      backgroundColor: isDark ? "#2c2c2e" : "#eef4ff",
                    },
                  ]}
                >
                  <ThemedText style={styles.avatarInitials}>
                    {getInitials()}
                  </ThemedText>
                </View>
              )}

              {photoLoading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="#fff" />
                </View>
              )}
            </View>

            <View style={styles.heroInfo}>
              {loadingProfile && !user.full_name ? (
                <>
                  <View
                    style={[
                      styles.skeletonLine,
                      styles.skeletonNameLine,
                      {
                        backgroundColor: isDark ? "#2c2c2e" : "#e5e7eb",
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.skeletonLine,
                      styles.skeletonRoleLine,
                      {
                        backgroundColor: isDark ? "#2c2c2e" : "#e5e7eb",
                      },
                    ]}
                  />
                </>
              ) : (
                <>
                  <ThemedText style={styles.userName}>
                    {user.full_name || "Пользователь"}
                  </ThemedText>

                  <ThemedText style={styles.userRole}>
                    {user.role?.display_name || "Роль не указана"}
                  </ThemedText>
                </>
              )}
            </View>
          </View>

          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.editProfileButton}
              onPress={openEditProfile}
              activeOpacity={0.85}
            >
              <Ionicons
                name={canEditOwnProfile ? "create-outline" : "camera-outline"}
                size={18}
                color={theme.primary}
              />
              <ThemedText style={[styles.editProfileButtonText, { color: theme.primary }]}>
                {canEditOwnProfile ? "Изменить профиль" : "Сменить фото"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>

        {canManageUsers ? <View style={{ backgroundColor: theme.surface, borderRadius: 12, overflow: "hidden" }}><ActionRow icon="people-outline" title="Пользователи и доступы" onPress={openUsersPage} /></View> : null}

        {(roleCode?.includes("pto") ||
          roleCode?.includes("estimator") ||
          roleCode?.includes("dev")) && (
          <ThemedView
            style={[
              styles.detailsCard,
              {
                backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
              },
            ]}
          >
            <ThemedText style={styles.userName}>Задачи</ThemedText>

            <View style={styles.tasksList}>
              {projects
                .filter((project) => project.status === "project_analysis")
                .slice(0, 3) // Ограничиваем количество, чтобы не перегружать
                .map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.taskCard,
                      {
                        backgroundColor: isDark ? "#2c2c2e" : "#f8f9fa",
                      },
                    ]}
                    onPress={() => {
                      setProjectToOpen(project);
                      router.push("/inner_pages/projectPage");
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.taskCardContent}>
                      <View style={styles.taskCardLeft}>
                        <ThemedText style={styles.taskNumber} numberOfLines={1}>
                          №{project.number}
                        </ThemedText>
                        <ThemedText style={styles.taskName} numberOfLines={1}>
                          {project.name}
                        </ThemedText>
                      </View>

                      <View style={styles.taskBadge}>
                        <ThemedText style={styles.taskBadgeText}>
                          Анализ
                        </ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

              {projects.filter(
                (project) => project.status === "project_analysis",
              ).length === 0 && (
                <ThemedText style={styles.emptyTasksText}>
                  Нет активных задач на анализе
                </ThemedText>
              )}
            </View>
          </ThemedView>
        )}

        <View style={{ backgroundColor: theme.surface, borderRadius: 12, overflow: "hidden" }}><ActionRow icon="log-out-outline" title="Выйти из аккаунта" destructive onPress={handleLogOut} /></View>

        <View style={styles.versionWrap}>
          <ThemedText style={styles.versionText}>
            Версия {appVersion || "1.0.0"}
          </ThemedText>
        </View>

        {loadingProfile && (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={styles.loadingText}>
              Обновляем данные профиля
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={avatarPreviewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAvatarPreviewVisible(false)}
      >
        <View style={styles.avatarPreviewOverlay}>
          <TouchableOpacity
            style={styles.avatarPreviewBackdrop}
            activeOpacity={1}
            onPress={() => setAvatarPreviewVisible(false)}
          />

          <TouchableOpacity
            style={styles.avatarPreviewClose}
            onPress={() => setAvatarPreviewVisible(false)}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>

          {avatarUri ? (
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatarPreviewImage}
              contentFit="contain"
              cachePolicy="disk"
            />
          ) : null}
        </View>
      </Modal>

      <BottomSheet
        ref={editSheetRef}
        height={Platform.OS === "ios" ? 760 : 860}
        sheetStyle={{
          backgroundColor: isDark ? "#111111" : "#ffffff",
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.sheetKeyboardWrap}
        >
          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.sheetHeader, { flexDirection: "row" }]}>
              <View>
                <ThemedText style={styles.sheetTitle}>
                  {canEditOwnProfile ? "Изменить профиль" : "Фото профиля"}
                </ThemedText>
                <ThemedText style={styles.sheetSubtitle}>
                  {canEditOwnProfile
                    ? "Имя, почта, пароль и фото профиля"
                    : "Только обновление и удаление аватарки"}
                </ThemedText>
              </View>

              <TouchableOpacity
                onPress={() => editSheetRef.current?.hide()}
                style={[
                  styles.closeButton,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.06)",
                  },
                ]}
              >
                <Ionicons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.sheetHero,
                {
                  backgroundColor: isDark ? "#1c1c1e" : "#f8fafc",
                },
              ]}
            >
              <View style={styles.sheetAvatarRow}>
                <View style={styles.sheetAvatarWrap}>
                  {avatarUri ? (
                    <Image
                      source={{ uri: avatarUri }}
                      style={styles.sheetAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.sheetAvatar,
                        styles.avatarFallback,
                        {
                          backgroundColor: isDark ? "#2c2c2e" : "#eef4ff",
                        },
                      ]}
                    >
                      <ThemedText style={styles.avatarInitials}>
                        {getInitials()}
                      </ThemedText>
                    </View>
                  )}
                </View>

                <View style={styles.sheetAvatarInfo}>
                  <ThemedText style={styles.sheetAvatarTitle}>
                    Фото профиля
                  </ThemedText>
                  <ThemedText style={styles.sheetAvatarHint}>
                    Поддерживаются `jpg`, `png`, `webp` до 2 МБ
                  </ThemedText>
                </View>
              </View>

              <View style={styles.sheetAvatarActions}>
                <TouchableOpacity
                  style={styles.sheetPrimaryAction}
                  onPress={handlePickAvatar}
                  disabled={photoLoading}
                >
                  {photoLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons
                        name="cloud-upload-outline"
                        size={18}
                        color="#fff"
                      />
                      <ThemedText style={styles.sheetPrimaryActionText}>
                        {avatarUri ? "Обновить фото" : "Загрузить фото"}
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sheetSecondaryAction,
                    {
                      backgroundColor: isDark ? "#2c2c2e" : "#ffffff",
                      opacity: avatarUri ? 1 : 0.45,
                    },
                  ]}
                  onPress={handleDeleteAvatar}
                  disabled={!avatarUri || photoLoading}
                >
                  <Ionicons name="trash-outline" size={18} color="#ff5a5f" />
                  <ThemedText style={styles.secondaryActionText}>
                    Удалить
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>

            {canEditOwnProfile ? (
              <>
                <View style={styles.formBlock}>
                  <ThemedText style={styles.formSectionTitle}>
                    Основные данные
                  </ThemedText>

                  <ProfileInput
                    label="Имя"
                    value={editForm.full_name}
                    onChangeText={(value) => handleEditField("full_name", value)}
                    placeholder="Как вас зовут"
                    isDark={isDark}
                  />

                  <ProfileInput
                    label="Email"
                    value={editForm.email}
                    onChangeText={(value) => handleEditField("email", value)}
                    placeholder="example@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    isDark={isDark}
                  />
                </View>

                <View style={styles.formBlock}>
                  <ThemedText style={styles.formSectionTitle}>
                    Смена пароля
                  </ThemedText>
                  <ThemedText style={styles.formHint}>
                    Новый пароль нужно ввести дважды. Текущий пароль нужен только
                    если вы действительно меняете пароль.
                  </ThemedText>

                  <ProfileInput
                    label="Текущий пароль"
                    value={editForm.current_password}
                    onChangeText={(value) =>
                      handleEditField("current_password", value)
                    }
                    placeholder="Введите текущий пароль"
                    secureTextEntry
                    autoCapitalize="none"
                    isDark={isDark}
                  />

                  <ProfileInput
                    label="Новый пароль"
                    value={editForm.password}
                    onChangeText={(value) => handleEditField("password", value)}
                    placeholder="Минимум 8 символов"
                    secureTextEntry
                    autoCapitalize="none"
                    isDark={isDark}
                  />

                  <ProfileInput
                    label="Повторите новый пароль"
                    value={editForm.password_repeat}
                    onChangeText={(value) =>
                      handleEditField("password_repeat", value)
                    }
                    placeholder="Ещё раз введите новый пароль"
                    secureTextEntry
                    autoCapitalize="none"
                    isDark={isDark}
                  />
                </View>

                <View style={styles.sheetFooter}>
                  <TouchableOpacity
                    style={[
                      styles.cancelButton,
                      {
                        backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
                      },
                    ]}
                    onPress={() => editSheetRef.current?.hide()}
                    disabled={savingProfile}
                  >
                    <ThemedText style={styles.cancelButtonText}>Отмена</ThemedText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={handleSaveProfile}
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="#fff"
                        />
                        <ThemedText style={styles.saveButtonText}>
                          Сохранить
                        </ThemedText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </BottomSheet>
    </ThemedView>
  );
}

function ProfileInput({
  label,
  value,
  onChangeText,
  placeholder,
  isDark,
  secureTextEntry,
  autoCapitalize,
  keyboardType,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  isDark: boolean;
  secureTextEntry?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: "default" | "email-address";
}) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>{label}</ThemedText>
      <View
        style={[
          styles.inputShell,
          {
            backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8E8E93"
          autoCapitalize={autoCapitalize ?? "sentences"}
          keyboardType={keyboardType ?? "default"}
          secureTextEntry={hidden}
          style={[
            styles.input,
            {
              color: isDark ? "#ffffff" : "#111111",
            },
          ]}
        />

        {secureTextEntry && (
          <TouchableOpacity
            style={styles.inputIconButton}
            onPress={() => setHidden((prev) => !prev)}
          >
            <Ionicons
              name={hidden ? "eye-outline" : "eye-off-outline"}
              size={19}
              color="#8E8E93"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isDark,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        {
          borderBottomColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      <View style={styles.infoLeft}>
        <View
          style={[
            styles.infoIconWrap,
            {
              backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
            },
          ]}
        >
          <Ionicons name={icon} size={18} color="#8E8E93" />
        </View>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
      </View>

      <ThemedText style={styles.infoValue} numberOfLines={2}>
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  container: {
    gap: 18,
  },
  tasksList: {
    marginTop: 12,
    gap: 8,
  },
  taskCard: {
    borderRadius: 14,
    padding: 10,
    minHeight: 70,
    justifyContent: "center",
  },
  taskCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  taskCardLeft: {
    flex: 1,
    gap: 4,
  },
  taskNumber: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8E8E93",
  },
  taskName: {
    fontSize: 14,
    fontWeight: "600",
  },
  taskBadge: {
    backgroundColor: "#e4a75520",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taskBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e4a755",
  },
  emptyTasksText: {
    marginTop: 12,
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    paddingVertical: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pageTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: "700",
  },
  pageSubtitle: {
    marginTop: 4,
    fontSize: 15,
    lineHeight: 21,
    color: "#8E8E93",
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    borderRadius: 12,
    padding: 20,
    gap: 18,
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 28,
    fontWeight: "800",
    color: "#007AFF",
  },
  avatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  avatarPreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPreviewBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  avatarPreviewClose: {
    position: "absolute",
    top: 58,
    right: 20,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarPreviewImage: {
    width: "88%",
    height: "62%",
    borderRadius: 24,
  },
  heroInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "600",
  },
  userRole: {
    fontSize: 16,
    lineHeight: 20,
    color: "#4B5563",
    fontWeight: "600",
  },
  skeletonBlock: {
    overflow: "hidden",
  },
  skeletonLine: {
    borderRadius: 999,
  },
  skeletonNameLine: {
    width: "78%",
    height: 24,
  },
  skeletonRoleLine: {
    width: "52%",
    height: 16,
  },
  userEmail: {
    fontSize: 15,
    lineHeight: 20,
    color: "#8E8E93",
  },
  heroActions: {
    flexDirection: "column",
    gap: 10,
  },
  editProfileButton: {
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: "rgba(0,122,255,0.08)",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  editProfileButtonText: {
    color: "#111111",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryActionText: {
    color: "#ff5a5f",
    fontSize: 15,
    fontWeight: "700",
  },
  managementSection: {
    marginTop: 4,
  },
  managementButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  managementContent: {
    flex: 1,
  },
  managementTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 22,
    padding: 16,
    minHeight: 132,
    justifyContent: "space-between",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,122,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    fontSize: 14,
    color: "#8E8E93",
    fontWeight: "600",
  },
  skeletonStatLabel: {
    width: "42%",
    height: 14,
  },
  statValue: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: "800",
  },
  skeletonStatValue: {
    width: "72%",
    height: 18,
  },
  statCompactValue: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "700",
  },
  detailsCard: {
    borderRadius: 24,
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  infoRow: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexShrink: 1,
  },
  infoIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    fontSize: 15,
    color: "#8E8E93",
    fontWeight: "600",
  },
  infoValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
  },
  actions: {
    marginTop: 6,
  },
  logoutButton: {
    minHeight: 56,
    borderRadius: 18,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
  },
  versionWrap: {
    marginTop: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  versionText: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  sheetKeyboardWrap: {
    flex: 1,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  sheetTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
  },
  sheetSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetHero: {
    borderRadius: 22,
    padding: 16,
    gap: 14,
  },
  sheetAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  sheetAvatarWrap: {
    width: 76,
    height: 76,
  },
  sheetAvatar: {
    width: 76,
    height: 76,
    borderRadius: 22,
  },
  sheetAvatarInfo: {
    flex: 1,
    gap: 4,
  },
  sheetAvatarTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sheetAvatarHint: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  sheetAvatarActions: {
    flexDirection: "row",
    gap: 10,
  },
  sheetPrimaryAction: {
    flex: 1,
    minHeight: 48,
    borderRadius: 15,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  sheetPrimaryActionText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
  sheetSecondaryAction: {
    minWidth: 118,
    minHeight: 48,
    borderRadius: 15,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  formBlock: {
    gap: 12,
  },
  formSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  formHint: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  inputShell: {
    minHeight: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  inputIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetFooter: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8E8E93",
  },
  saveButton: {
    flex: 1.2,
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#ffffff",
  },
  usersSheetWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  usersScroll: {
    flex: 1,
  },
  usersContent: {
    paddingBottom: 30,
    gap: 12,
  },
  userModerationCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  userModerationTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  userModerationIdentity: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
  },
  userModerationAvatar: {
    width: 54,
    height: 54,
    borderRadius: 18,
  },
  userModerationInitials: {
    fontSize: 16,
    fontWeight: "800",
    color: "#007AFF",
  },
  userModerationMeta: {
    flex: 1,
    gap: 3,
  },
  userModerationName: {
    fontSize: 16,
    fontWeight: "700",
  },
  userModerationSub: {
    fontSize: 13,
    color: "#8E8E93",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusBadgePending: {
    backgroundColor: "rgba(228,167,85,0.14)",
  },
  statusBadgeActive: {
    backgroundColor: "rgba(25,135,84,0.14)",
  },
  statusBadgeRejected: {
    backgroundColor: "rgba(255,90,95,0.14)",
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  statusBadgeTextPending: {
    color: "#e4a755",
  },
  statusBadgeTextActive: {
    color: "#198754",
  },
  statusBadgeTextRejected: {
    color: "#ff5a5f",
  },
  userModerationActions: {
    flexDirection: "row",
    gap: 10,
  },
  approveButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  approveButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  rejectButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  rejectButtonText: {
    color: "#ff5a5f",
    fontSize: 14,
    fontWeight: "700",
  },
});
