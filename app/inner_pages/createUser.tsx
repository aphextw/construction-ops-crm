import { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Share, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import { AuthInput } from "@/components/input/input";
import { ThemedText } from "@/components/themed-text";
import { ActionRow, EmptyState, LoadingRows, WorkspaceButton, useWorkspaceTheme } from "@/components/ui/workspace";
import { Layout } from "@/constants/theme";
import { ROLE_OPTIONS } from "@/constants/authOptions";
import { useCreateUser } from "@/hooks/useCreateUser";
import { showActionMenu } from "@/utils/showActionMenu";

export default function CreateUserScreen() {
  const theme = useWorkspaceTheme();
  const [form, setForm] = useState({ full_name: "", email: "", role: "", phone: "" });
  const { checkingAccess, allowed, saving, error, created, createUser } = useCreateUser();
  const roleLabel = ROLE_OPTIONS.find((option) => option.code === form.role)?.label;
  const updateField = (field: keyof typeof form, value: string) => setForm((previous) => ({ ...previous, [field]: value }));

  const shareCredentials = async () => {
    if (!created?.password) return;
    try {
      await Share.share({ message: `СТУ\n${created.user.full_name}\nПочта: ${created.user.email}\nВременный пароль: ${created.password}` });
    } catch {
      Alert.alert("Не удалось передать данные", "Вы можете выделить и скопировать пароль.");
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={["bottom", "left", "right"]}>
      <Stack.Screen options={{ headerShown: true, title: created ? "Аккаунт создан" : "Новый пользователь", headerBackTitle: "Пользователи", headerTintColor: theme.primary, headerStyle: { backgroundColor: theme.background }, headerShadowVisible: false }} />
      <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={100}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {checkingAccess ? <LoadingRows /> : !allowed ? <EmptyState title="Нет доступа" /> : created ? (
            <>
              <ThemedText style={styles.title}>{created.user.full_name}</ThemedText>
              <ThemedText selectable style={styles.value}>{created.user.email}</ThemedText>
              <ThemedText style={[styles.label, { color: theme.secondary }]}>{created.user.role?.display_name || roleLabel}</ThemedText>
              <View style={[styles.credentials, { backgroundColor: theme.surface }]}>
                <ThemedText style={[styles.label, { color: theme.secondary }]}>Временный пароль</ThemedText>
                {created.password ? <ThemedText selectable style={styles.password}>{created.password}</ThemedText> : <ThemedText>Аккаунт создан, но сервер не вернул пароль. Не создавайте его повторно.</ThemedText>}
              </View>
              {created.user.status === "pending" ? <ThemedText style={{ color: theme.secondary }}>Аккаунт ожидает подтверждения.</ThemedText> : null}
              {created.password ? <WorkspaceButton title="Передать данные" icon="share-outline" onPress={shareCredentials} /> : null}
              <WorkspaceButton title="Готово" secondary onPress={() => router.back()} />
            </>
          ) : (
            <>
              <View style={styles.field}>
                <ThemedText style={styles.label}>Имя и фамилия</ThemedText>
                <AuthInput value={form.full_name} onChangeText={(value) => updateField("full_name", value)} placeholder="Имя и фамилия" />
              </View>
              <View style={styles.field}>
                <ThemedText style={styles.label}>Почта</ThemedText>
                <AuthInput value={form.email} onChangeText={(value) => updateField("email", value)} placeholder="name@example.ru" keyboardType="email-address" autoCorrect={false} />
              </View>
              <View style={[styles.role, { backgroundColor: theme.surface }]}>
                <ActionRow icon="person-outline" title="Роль" value={roleLabel || "Выбрать"} onPress={() => showActionMenu("Роль пользователя", ROLE_OPTIONS.map((option) => ({ label: option.label, onPress: () => updateField("role", option.code) })))} />
              </View>
              <View style={styles.field}>
                <ThemedText style={styles.label}>Телефон (необязательно)</ThemedText>
                <AuthInput value={form.phone} onChangeText={(value) => updateField("phone", value)} placeholder="+7" keyboardType="phone-pad" autoCorrect={false} autoCapitalize="none" />
              </View>
              {error ? <ThemedText accessibilityRole="alert" style={{ color: theme.danger }}>{error}</ThemedText> : null}
              <WorkspaceButton title={saving ? "Создание…" : "Создать аккаунт"} icon="add" disabled={saving || !form.full_name.trim() || !form.email.trim() || !form.role} onPress={() => createUser(form)} />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: Layout.gutter, paddingTop: 24, paddingBottom: 32, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 15, lineHeight: 21 },
  value: { fontSize: 17, lineHeight: 24 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: "600" },
  role: { borderRadius: 8, overflow: "hidden" },
  credentials: { padding: 16, borderRadius: 8, gap: 8 },
  password: { fontSize: 24, lineHeight: 32, fontWeight: "600" },
});
