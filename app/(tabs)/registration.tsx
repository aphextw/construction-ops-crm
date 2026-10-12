import { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { AuthInput } from "@/components/input/input";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRegistration } from "@/hooks/useRegistration";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RegistrationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    company_code: "tsk_stu",
  });

  const { register, loading, error, setError } = useRegistration();

  const formIsValid = useMemo(() => {
    return (
      form.full_name.trim().length > 1 &&
      form.email.trim().length > 3 &&
      form.password.length >= 8
    );
  }, [form]);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!form.full_name.trim()) {
      setError("Введите имя и фамилию");
      return;
    }

    if (form.email.trim().length <= 3) {
      setError("Введите корректный email");
      return;
    }

    if (form.password.length < 8) {
      setError("Пароль должен быть не короче 8 символов");
      return;
    }

    const result = await register({
      full_name: form.full_name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      company_code: form.company_code,
    });

    if (!result.success) {
      return;
    }

    Alert.alert(
      "Заявка отправлена",
      "Аккаунт создан. После входа роль назначат при подтверждении заявки.",
      [
        {
          text: "Продолжить",
          onPress: () => router.replace("/content/listPage"),
        },
      ],
    );
  };

  return (
    <ThemedView
      style={[
        styles.screen,
        {
          paddingTop: insets.top + 8,
          backgroundColor: isDark ? "#111214" : "#ffffff",
        },
      ]}
    >
      <View
        style={[
          styles.header,
          { paddingHorizontal: Platform.OS === "ios" ? 20 : 16 },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.headerButton,
            { backgroundColor: isDark ? "#202226" : "#f3f4f6" },
          ]}
          activeOpacity={0.8}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-back"
            size={22}
            color={isDark ? "#fff" : "#111"}
          />
        </TouchableOpacity>

        <ThemedText style={styles.headerTitle}>Регистрация</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: insets.bottom + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroBlock}>
            <ThemedText style={styles.heroTitle}>Новый аккаунт</ThemedText>
          </View>

          <View
            style={[
              styles.sectionCard,
              {
                backgroundColor: isDark ? "#1b1d21" : "#ffffff",
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              },
            ]}
          >
            <ThemedText style={styles.sectionTitle}>Данные</ThemedText>

            <View style={styles.formGroup}>
              <AuthInput
                darker={false}
                placeholder="Имя и фамилия"
                value={form.full_name}
                onChangeText={(value) => updateField("full_name", value)}
              />
              <AuthInput
                darker={false}
                placeholder="Email"
                value={form.email}
                onChangeText={(value) => updateField("email", value)}
              />
              <AuthInput
                darker={false}
                placeholder="Пароль не короче 8 символов"
                value={form.password}
                onChangeText={(value) => updateField("password", value)}
                secure
              />
            </View>
          </View>

          {error ? <ThemedText style={styles.errorText}>{error}</ThemedText> : null}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { opacity: loading || !formIsValid ? 0.5 : 1 },
            ]}
            disabled={loading || !formIsValid}
            onPress={handleSubmit}
          >
            <ThemedText style={styles.submitButtonText}>
              {loading ? "Создание..." : "Создать аккаунт"}
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
    gap: 16,
  },
  heroBlock: {
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  sectionCard: {
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    gap: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  formGroup: {
    gap: 12,
  },
  errorText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 4,
  },
  submitButton: {
    minHeight: 54,
    borderRadius: 18,
    backgroundColor: "#0d6efd",
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
