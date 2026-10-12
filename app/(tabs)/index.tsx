import { useState } from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  Text,
  useColorScheme,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuth } from "@/hooks/auth";
import { AuthInput } from "@/components/input/input";
import { Image } from "expo-image";
// import { useDataUserStore } from "../../store/useStore";
// import AsyncStorage from "@react-native-async-storage/async-storage";

export default function HomeScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const insets = useSafeAreaInsets();

  const { login, loading, error, setError } = useAuth();

  const colorScheme = useColorScheme();

  const handleLogin = async () => {
    if (email === "" || password === "") {
      setError("Введите пароль и логин");
      return;
    }

    const success = await login(email, password);

    if (!success) {
      setError("Неверный логин или пароль");
    }
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          backgroundColor: colorScheme === "dark" ? "#0f1012" : "#ffffff",
        },
      ]}
    >
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 12 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingTop: insets.top + 18,
              paddingHorizontal: Platform.OS === "ios" ? 20 : 14,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <Image
                source={require("../../assets/images/stu_logo_no_background.png")}
                style={styles.logo}
                contentFit="contain"
              />
            </View>

            <View style={styles.heroText}>
              <ThemedText style={styles.title}>Вход</ThemedText>
            </View>
          </View>

          <View style={styles.formBlock}>
            <View style={styles.form}>
              <AuthInput
                autoCorrect={false}
                darker={false}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
              />

              <AuthInput
                autoCorrect={false}
                darker={false}
                placeholder="Пароль"
                value={password}
                onChangeText={setPassword}
                secure
              />
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <TouchableOpacity
              style={[styles.button, { opacity: loading ? 0.5 : 1 }]}
              onPress={() => {
                handleLogin();
              }}
              disabled={loading}
            >
              <ThemedText style={styles.buttonText}>
                {loading ? "Загрузка" : "Войти"}
              </ThemedText>
            </TouchableOpacity>

            {/*<TouchableOpacity onPress={() => router.push("./registration")}>*/}
            {/*  <ThemedText style={styles.link}>*/}
            {/*    Нет аккаунта?{" "}*/}
            {/*    <Text style={styles.linkAccent}>Зарегистрироваться</Text>*/}
            {/*  </ThemedText>*/}
            {/*</TouchableOpacity>*/}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  keyboardWrap: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    justifyContent: "flex-start",
    gap: 28,
    paddingBottom: 24,
  },

  hero: {
    alignItems: "center",
    gap: 10,
    paddingTop: 34,
  },

  logoWrap: {
    width: 236,
    height: 236,
    alignItems: "center",
    justifyContent: "center",
  },

  logo: {
    width: "100%",
    height: "100%",
  },

  heroText: {
    alignItems: "center",
    paddingHorizontal: 18,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    textAlign: "center",
    lineHeight: 40,
  },

  errorText: {
    color: "#dc3545",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  formBlock: {
    gap: 18,
    marginTop: 8,
    marginBottom: Platform.OS === "ios" ? 12 : 8,
  },

  form: {
    gap: 14,
  },

  button: {
    height: 56,
    backgroundColor: "#0d6efd",
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  link: {
    textAlign: "center",
    opacity: 0.8,
    fontSize: 14,
    color: "#8E8E93",
  },

  linkAccent: {
    color: "#0d6efd",
    fontWeight: "700",
  },
});
