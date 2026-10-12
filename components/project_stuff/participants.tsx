import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { ThemedText } from "@/components/themed-text";

export default function ParticipantsSheet({
  participants = [],
  loading = false,
  onClose,
  colorScheme = "light",
  getAvatarUri,
  getInitials,
  participantsSheetRef,
}: any) {
  const isDark = colorScheme === "dark";

  return (
    <View
      style={{ flex: 1 }}
      // behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Участники проекта</ThemedText>

          <TouchableOpacity
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
              },
            ]}
            onPress={() => {
              onClose?.();
              participantsSheetRef?.current?.hide?.();
            }}
          >
            <Ionicons name="close" size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={styles.hint}>Загружаем участников</ThemedText>
          </View>
        ) : participants.length ? (
          participants.map((access: any) => {
            const avatarUri = getAvatarUri?.(access.user?.profile_photo_url);

            return (
              <View
                key={access.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.05)"
                      : "#f8f9fb",
                  },
                ]}
              >
                {/* AVATAR */}
                {avatarUri ? (
                  <Image
                    source={{ uri: avatarUri }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <ThemedText style={styles.avatarText}>
                      {getInitials?.(access.user?.full_name)}
                    </ThemedText>
                  </View>
                )}

                {/* META */}
                <View style={styles.meta}>
                  <ThemedText style={styles.name}>
                    {access.user?.full_name}
                  </ThemedText>

                  <ThemedText style={styles.secondary}>
                    {access.user?.role?.display_name || "Роль не указана"}
                  </ThemedText>

                  <ThemedText style={styles.secondary}>
                    {access.user?.email}
                  </ThemedText>

                  <View style={styles.badges}>
                    <View
                      style={[
                        styles.badge,
                        access.can_view && styles.badgeBlue,
                      ]}
                    >
                      <ThemedText style={styles.badgeText}>Просмотр</ThemedText>
                    </View>

                    <View
                      style={[
                        styles.badge,
                        access.can_edit && styles.badgeGreen,
                      ]}
                    >
                      <ThemedText style={styles.badgeText}>
                        Редактирование
                      </ThemedText>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.center}>
            <Ionicons name="people-outline" size={22} color="#8E8E93" />
            <ThemedText style={styles.hint}>Нет участников</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 14,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "800",
  },

  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  center: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },

  hint: {
    fontSize: 14,
    color: "#8E8E93",
  },

  card: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 18,
  },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },

  avatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13,110,253,0.12)",
  },

  avatarText: {
    fontWeight: "800",
    color: "#007AFF",
  },

  meta: {
    flex: 1,
    gap: 2,
  },

  name: {
    fontSize: 15,
    fontWeight: "700",
  },

  secondary: {
    fontSize: 13,
    color: "#8E8E93",
  },

  badges: {
    flexDirection: "row",
    gap: 6,
    marginTop: 6,
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#eee",
  },

  badgeBlue: {
    backgroundColor: "rgba(13,110,253,0.12)",
  },

  badgeGreen: {
    backgroundColor: "rgba(25,135,84,0.12)",
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
