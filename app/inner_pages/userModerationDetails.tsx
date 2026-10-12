import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { BottomSheet } from "react-native-sheet";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_URL } from "@/hooks/api_client";
import { useUserModeration } from "@/hooks/useUserModeration";
import { COMPANY_OPTIONS, ROLE_OPTIONS } from "@/constants/authOptions";

const USER_DELETE_ROLES = ["director", "deputy_director", "developer"];

const getAvatarUri = (avatarPath?: string | null) => {
  if (!avatarPath) {
    return null;
  }

  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  return `${API_URL.replace(/\/$/, "")}${avatarPath}`;
};

const getInitials = (fullName?: string) => {
  if (!fullName?.trim()) {
    return "U";
  }

  return fullName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
};

const getUserStatusLabel = (status?: string) => {
  switch (status) {
    case "active":
      return "Подтвержден";
    case "pending":
      return "Ожидает подтверждения";
    case "rejected":
      return "Заблокирован";
    default:
      return "Неизвестно";
  }
};

export default function UserModerationDetailsScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const editSheetRef = useRef<any>(null);
  const params = useLocalSearchParams<{
    userId: string;
    fullName: string;
    email: string;
    roleName: string;
    companyName: string;
    roleCode?: string;
    companyCode?: string;
    status: string;
    avatarPath: string;
    rating?: string;
    canSeeRating?: string;
  }>();
  const [editForm, setEditForm] = useState({
    full_name: params.fullName || "",
    email: params.email || "",
    password: "",
    role: params.roleCode || "",
    company_code: params.companyCode || "",
  });
  const [status, setStatus] = useState(params.status || "");
  const [fullName, setFullName] = useState(params.fullName || "");
  const [email, setEmail] = useState(params.email || "");
  const [roleName, setRoleName] = useState(params.roleName || "");
  const [companyName, setCompanyName] = useState(params.companyName || "");
  const [viewerRoleCode, setViewerRoleCode] = useState("");
  const {
    approveUser,
    rejectUser,
    updateUserAdminProfile,
    deleteUser,
    savingModerationUser,
  } = useUserModeration();

  useEffect(() => {
    const hydrateViewerRole = async () => {
      const savedUser = await AsyncStorage.getItem("user");
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;
      setViewerRoleCode(parsedUser?.role?.code || "");
    };

    hydrateViewerRole();
  }, []);

  const avatarUri = useMemo(
    () => getAvatarUri(params.avatarPath),
    [params.avatarPath],
  );
  const canDeleteUser = USER_DELETE_ROLES.includes(viewerRoleCode);
  const canSeeRating = params.canSeeRating === "true";
  const userRating = Number(params.rating ?? 0);

  const selectedRoleLabel =
    ROLE_OPTIONS.find((item) => item.code === editForm.role)?.label ||
    roleName ||
    "Не указана";
  const selectedCompanyLabel =
    COMPANY_OPTIONS.find((item) => item.code === editForm.company_code)?.label ||
    companyName ||
    "Не указана";

  const handleApprove = async () => {
    const updatedUser = await approveUser(params.userId, {
      role: editForm.role || params.roleCode || "",
      company_code: editForm.company_code || undefined,
    });

    if (!updatedUser) {
      return;
    }

    setStatus(updatedUser.status || "active");
    setRoleName(updatedUser.role?.display_name || selectedRoleLabel);
    setCompanyName(updatedUser.company?.display_name || selectedCompanyLabel);
    Alert.alert("Готово", "Пользователь подтверждён.");
  };

  const handleBlock = async () => {
    Alert.alert(
      "Заблокировать пользователя",
      `Изменить статус пользователя ${fullName || "пользователя"}?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Заблокировать",
          style: "destructive",
          onPress: async () => {
            const updatedUser = await rejectUser(params.userId);

            if (!updatedUser) {
              return;
            }

            setStatus(updatedUser.status || "rejected");
            Alert.alert("Готово", "Пользователь заблокирован.");
          },
        },
      ],
    );
  };

  const openEditSheet = () => {
    editSheetRef.current?.show();
  };

  const handleSaveAdminProfile = async () => {
    const payload: Record<string, string | null> = {
      full_name: editForm.full_name.trim(),
      email: editForm.email.trim(),
      role: editForm.role,
      company_code: editForm.company_code,
    };

    if (editForm.password.trim()) {
      payload.password = editForm.password.trim();
    }

    const updatedUser = await updateUserAdminProfile(params.userId, payload);

    if (!updatedUser) {
      return;
    }

    setFullName(updatedUser.full_name || payload.full_name || "");
    setEmail(updatedUser.email || payload.email || "");
    setRoleName(updatedUser.role?.display_name || selectedRoleLabel);
    setCompanyName(updatedUser.company?.display_name || selectedCompanyLabel);
    setEditForm((prev) => ({
      ...prev,
      password: "",
    }));
    editSheetRef.current?.hide();
    Alert.alert("Готово", "Данные пользователя обновлены.");
  };

  const handleDeleteUser = async () => {
    Alert.alert(
      "Удалить аккаунт",
      `Аккаунт ${fullName || "пользователя"} будет удалён без возможности восстановления.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const deleted = await deleteUser(params.userId);

            if (!deleted) {
              return;
            }

            Alert.alert("Готово", "Аккаунт удалён.", [
              {
                text: "OK",
                onPress: () => router.back(),
              },
            ]);
          },
        },
      ],
    );
  };

  return (
    <ThemedView style={styles.screen}>
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
              },
            ]}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#8E8E93" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <ThemedText style={styles.title}>Пользователь</ThemedText>
            <ThemedText style={styles.subtitle}>
              Информация и модерация аккаунта
            </ThemedText>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View
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
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                contentFit="cover"
                cachePolicy="memory-disk"
              />
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
                  {getInitials(fullName)}
                </ThemedText>
              </View>
            )}

            <ThemedText style={styles.name}>
              {fullName || "Пользователь"}
            </ThemedText>

            <View
              style={[
                styles.statusBadge,
                status === "active"
                  ? styles.statusBadgeActive
                  : status === "pending"
                    ? styles.statusBadgePending
                    : styles.statusBadgeRejected,
              ]}
            >
              <ThemedText
                style={[
                  styles.statusBadgeText,
                  status === "active"
                    ? styles.statusBadgeTextActive
                    : status === "pending"
                      ? styles.statusBadgeTextPending
                      : styles.statusBadgeTextRejected,
                ]}
              >
                {getUserStatusLabel(status)}
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
              },
            ]}
          >
            <InfoRow
              icon="mail-outline"
              label="Email"
              value={email || "Не указан"}
            />
            <InfoRow
              icon="briefcase-outline"
              label="Роль"
              value={roleName || "Не указана"}
            />
            <InfoRow
              icon="business-outline"
              label="Компания"
              value={companyName || "Не указана"}
              last={!canSeeRating}
            />
            {canSeeRating ? (
              <InfoRow
                icon="star-outline"
                label="Рейтинг"
                value={String(userRating)}
                last
              />
            ) : null}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.secondaryButton,
                {
                  backgroundColor: isDark ? "#2c2c2e" : "#ffffff",
                },
              ]}
              onPress={openEditSheet}
              disabled={savingModerationUser}
            >
              <Ionicons name="create-outline" size={18} color="#007AFF" />
              <ThemedText style={styles.secondaryButtonEditText}>
                Изменить данные
              </ThemedText>
            </TouchableOpacity>

            {status !== "active" ? (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleApprove}
                disabled={savingModerationUser}
              >
                {savingModerationUser ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#fff"
                    />
                    <ThemedText style={styles.primaryButtonText}>
                      Подтвердить
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            ) : null}

            {status !== "rejected" ? (
              <TouchableOpacity
                style={[
                  styles.secondaryButton,
                  {
                    backgroundColor: isDark ? "#2c2c2e" : "#ffffff",
                  },
                ]}
                onPress={handleBlock}
                disabled={savingModerationUser}
              >
                <Ionicons name="ban-outline" size={18} color="#dc3545" />
                <ThemedText style={styles.secondaryButtonText}>
                  Заблокировать
                </ThemedText>
              </TouchableOpacity>
            ) : null}

            {canDeleteUser ? (
              <TouchableOpacity
                style={[
                  styles.dangerButton,
                  {
                    backgroundColor: isDark ? "#2c1618" : "#fff1f2",
                    borderColor: isDark
                      ? "rgba(255,107,107,0.18)"
                      : "rgba(220,53,69,0.14)",
                  },
                ]}
                onPress={handleDeleteUser}
                disabled={savingModerationUser}
              >
                <Ionicons name="trash-outline" size={18} color="#dc3545" />
                <ThemedText style={styles.dangerButtonText}>
                  Удалить аккаунт
                </ThemedText>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>

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
              contentContainerStyle={styles.sheetContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderText}>
                  <ThemedText style={styles.sheetTitle}>
                    Изменить пользователя
                  </ThemedText>
                  <ThemedText style={styles.sheetSubtitle}>
                    Имя, почта, роль, компания и пароль
                  </ThemedText>
                </View>

                <TouchableOpacity
                  onPress={() => editSheetRef.current?.hide()}
                  style={[
                    styles.closeIconButton,
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

              <AdminInput
                label="Имя"
                value={editForm.full_name}
                onChangeText={(value) =>
                  setEditForm((prev) => ({ ...prev, full_name: value }))
                }
                placeholder="Введите имя"
                isDark={isDark}
              />

              <AdminInput
                label="Email"
                value={editForm.email}
                onChangeText={(value) =>
                  setEditForm((prev) => ({ ...prev, email: value }))
                }
                placeholder="Введите email"
                keyboardType="email-address"
                isDark={isDark}
              />

              <AdminInput
                label="Новый пароль"
                value={editForm.password}
                onChangeText={(value) =>
                  setEditForm((prev) => ({ ...prev, password: value }))
                }
                placeholder="Оставь пустым, если не нужно менять"
                secureTextEntry
                isDark={isDark}
              />

              <View style={styles.optionBlock}>
                <ThemedText style={styles.optionLabel}>Роль</ThemedText>
                <View style={styles.optionList}>
                  {ROLE_OPTIONS.map((option) => {
                    const selected = editForm.role === option.code;
                    return (
                      <TouchableOpacity
                        key={option.code}
                        style={[
                          styles.optionChip,
                          selected && styles.optionChipSelected,
                          {
                            backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
                          },
                        ]}
                        onPress={() =>
                          setEditForm((prev) => ({ ...prev, role: option.code }))
                        }
                      >
                        <ThemedText
                          style={[
                            styles.optionChipText,
                            selected && styles.optionChipTextSelected,
                          ]}
                        >
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.optionBlock}>
                <ThemedText style={styles.optionLabel}>Компания</ThemedText>
                <View style={styles.optionList}>
                  {COMPANY_OPTIONS.map((option) => {
                    const selected = editForm.company_code === option.code;
                    return (
                      <TouchableOpacity
                        key={option.code}
                        style={[
                          styles.optionChip,
                          selected && styles.optionChipSelected,
                          {
                            backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
                          },
                        ]}
                        onPress={() =>
                          setEditForm((prev) => ({
                            ...prev,
                            company_code: option.code,
                          }))
                        }
                      >
                        <ThemedText
                          style={[
                            styles.optionChipText,
                            selected && styles.optionChipTextSelected,
                          ]}
                        >
                          {option.label}
                        </ThemedText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.sheetFooter}>
                <TouchableOpacity
                  style={[
                    styles.sheetCancelButton,
                    {
                      backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
                    },
                  ]}
                  onPress={() => editSheetRef.current?.hide()}
                >
                  <ThemedText style={styles.sheetCancelText}>Отмена</ThemedText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.sheetSaveButton}
                  onPress={handleSaveAdminProfile}
                  disabled={savingModerationUser}
                >
                  {savingModerationUser ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ThemedText style={styles.sheetSaveText}>
                      Сохранить
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </BottomSheet>
      </SafeAreaView>
    </ThemedView>
  );
}

function AdminInput({
  label,
  value,
  onChangeText,
  placeholder,
  isDark,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  isDark: boolean;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
}) {
  const isTechnicalInput = secureTextEntry || keyboardType === "email-address";

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
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType ?? "default"}
          autoCorrect={!isTechnicalInput}
          spellCheck={!isTechnicalInput}
          autoCapitalize={autoCapitalize ?? (isTechnicalInput ? "none" : "words")}
          style={[
            styles.input,
            {
              color: isDark ? "#ffffff" : "#111111",
            },
          ]}
        />
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.infoRow, !last && styles.infoRowBorder]}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={18} color="#007AFF" />
      </View>
      <View style={styles.infoMeta}>
        <ThemedText style={styles.infoLabel}>{label}</ThemedText>
        <ThemedText style={styles.infoValue}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  title: {
    paddingTop: 10,
    fontWeight: "800",
    fontSize: 28,
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 14,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
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
  name: {
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  statusBadgePending: {
    backgroundColor: "rgba(228,167,85,0.16)",
  },
  statusBadgeActive: {
    backgroundColor: "rgba(25,135,84,0.16)",
  },
  statusBadgeRejected: {
    backgroundColor: "rgba(220,53,69,0.14)",
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: "700",
  },
  statusBadgeTextPending: {
    color: "#e4a755",
  },
  statusBadgeTextActive: {
    color: "#198754",
  },
  statusBadgeTextRejected: {
    color: "#dc3545",
  },
  infoCard: {
    borderRadius: 24,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  infoRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(142,142,147,0.28)",
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,122,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoMeta: {
    flex: 1,
    gap: 2,
  },
  infoLabel: {
    fontSize: 13,
    color: "#8E8E93",
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  actions: {
    gap: 12,
    paddingTop: 8,
  },
  primaryButton: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(220,53,69,0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#dc3545",
  },
  secondaryButtonEditText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#007AFF",
  },
  dangerButton: {
    minHeight: 52,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#dc3545",
  },
  sheetKeyboardWrap: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
    gap: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16,
  },
  sheetHeaderText: {
    flex: 1,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  sheetSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
  },
  inputShell: {
    minHeight: 54,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  input: {
    fontSize: 16,
    paddingVertical: 0,
  },
  optionBlock: {
    gap: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#8E8E93",
  },
  optionList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  optionChip: {
    minHeight: 42,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,122,255,0.12)",
    justifyContent: "center",
  },
  optionChipSelected: {
    backgroundColor: "rgba(0,122,255,0.12)",
    borderColor: "rgba(0,122,255,0.32)",
  },
  optionChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionChipTextSelected: {
    color: "#007AFF",
  },
  sheetFooter: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sheetCancelButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8E8E93",
  },
  sheetSaveButton: {
    flex: 1,
    minHeight: 54,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
  },
  sheetSaveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
