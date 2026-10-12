import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { API_URL } from "@/hooks/api_client";
import { useUserModeration } from "@/hooks/useUserModeration";
import { AppUser } from "@/hooks/useUsers";
import { canCreateUserAccount } from "@/utils/userCreation";

const MODERATION_ROLES = [
  "director",
  "deputy_director",
  "developer",
  "estimator_plus",
  "pto",
];

const RATING_VISIBLE_ROLES = [
  "director",
  "deputy_director",
  "developer",
  "inzhkom_b_manager",
];

const getUserStatusLabel = (status?: string) => {
  switch (status) {
    case "active":
      return "Подтвержден";
    case "pending":
      return "Ожидает";
    case "rejected":
      return "Заблокирован";
    default:
      return "Неизвестно";
  }
};

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

export default function UsersModerationScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [users, setUsers] = useState<AppUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [canModerate, setCanModerate] = useState(false);
  const [canSeeRating, setCanSeeRating] = useState(false);
  const [canCreate, setCanCreate] = useState(false);
  const { getModerationUsers, loadingModerationUsers } = useUserModeration();

  const loadUsers = useCallback(async () => {
    const savedUser = await AsyncStorage.getItem("user");
    const parsedUser = savedUser ? JSON.parse(savedUser) : null;
    const roleCode = parsedUser?.role?.code || "";
    const allowed = MODERATION_ROLES.includes(roleCode);
    const showRating = RATING_VISIBLE_ROLES.includes(roleCode);

    setCanModerate(allowed);
    setCanSeeRating(showRating);
    setCanCreate(canCreateUserAccount(roleCode));

    if (!allowed) {
      setUsers([]);
      return;
    }

    const nextUsers = await getModerationUsers();
    setUsers(nextUsers);
  }, [getModerationUsers]);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers]),
  );

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      await loadUsers();
    } finally {
      setRefreshing(false);
    }
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
            <ThemedText style={styles.title}>Пользователи</ThemedText>
          </View>
          {canCreate ? (
            <TouchableOpacity
              style={styles.iconButton}
              hitSlop={4}
              accessibilityRole="button"
              accessibilityLabel="Создать аккаунт пользователя"
              onPress={() => router.push("/inner_pages/createUser" as never)}
            >
              <Ionicons name="add" size={24} color="#007AFF" />
            </TouchableOpacity>
          ) : null}
        </View>

        {!canModerate ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="shield-checkmark-outline"
              size={24}
              color="#8E8E93"
            />
            <ThemedText style={styles.emptyTitle}>Нет доступа</ThemedText>
            <ThemedText style={styles.emptyHint}>
              Этот экран доступен только ролям с правом подтверждения аккаунтов.
            </ThemedText>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {loadingModerationUsers && !users.length ? (
              <View style={styles.loadingState}>
                <ActivityIndicator size="small" color="#007AFF" />
                <ThemedText style={styles.loadingText}>
                  Загружаем пользователей
                </ThemedText>
              </View>
            ) : (
              users.map((item) => {
                const avatarUri = getAvatarUri(item.profile_photo_url);
                const status = item.status;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.userCard,
                      {
                        backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
                        borderColor: isDark
                          ? "rgba(255,255,255,0.06)"
                          : "rgba(0,0,0,0.06)",
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                      router.push({
                        pathname: "/inner_pages/userModerationDetails",
                        params: {
                          userId: item.id,
                          fullName: item.full_name || "",
                          email: item.email || "",
                          roleName: item.role?.display_name || "",
                          roleCode: item.role?.code || "",
                          companyName: item.company?.display_name || "",
                          companyCode: item.company?.code || "",
                          status: status || "",
                          avatarPath: item.profile_photo_url || "",
                          rating: String(item.rating ?? 0),
                          canSeeRating: canSeeRating ? "true" : "false",
                        },
                      } as never)
                    }
                  >
                    <View style={styles.userIdentity}>
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
                            {getInitials(item.full_name)}
                          </ThemedText>
                        </View>
                      )}

                      <View style={styles.userMeta}>
                        <ThemedText style={styles.userName}>
                          {item.full_name || "Без имени"}
                        </ThemedText>
                        <ThemedText style={styles.userSub}>
                          {item.role?.display_name || "Роль не указана"}
                        </ThemedText>
                        <ThemedText style={styles.userSub}>
                          {item.email || "Email не указан"}
                        </ThemedText>
                        {canSeeRating ? (
                          <ThemedText style={styles.userRating}>
                            Рейтинг: {item.rating ?? 0}
                          </ThemedText>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.userRight}>
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

                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#8E8E93"
                      />
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </ThemedView>
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
    alignItems: "center",
  },
  title: {
    paddingTop: 10,
    fontSize: 28,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 14,
    color: "#8E8E93",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    gap: 12,
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  userCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  userIdentity: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitials: {
    fontSize: 17,
    fontWeight: "800",
    color: "#007AFF",
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
  },
  userSub: {
    fontSize: 13,
    color: "#8E8E93",
  },
  userRating: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2575fc",
    marginTop: 2,
  },
  userRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
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
    color: "#dc3545",
  },
  emptyState: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyHint: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
    lineHeight: 21,
  },
});
