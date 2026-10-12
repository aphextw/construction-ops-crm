import { Sentry, setMonitoringUser } from "@/utils/monitoring";
import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { useCheckAuth } from "@/hooks/accessToken";

export const unstable_settings = {
  anchor: "(app)",
};

function RootLayout() {
  const colorScheme = useColorScheme();

  const { isAuth, loading: authLoading, user } = useCheckAuth();
  useEffect(() => {
    setMonitoringUser(isAuth ? user?.id : undefined);
  }, [isAuth, user?.id]);

  if (authLoading || isAuth === null) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Авторизованный пользователь */}
          <Stack.Protected guard={isAuth}>
            <Stack.Screen
              name="content"
              options={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />

            <Stack.Screen
              name="inner_pages"
              options={{
                headerShown: false,
                animation: "slide_from_right",
              }}
            />

            <Stack.Screen
              name="modal"
              options={{
                presentation: "modal",
                title: "Modal",
              }}
            />
          </Stack.Protected>

          {/* Неавторизованный пользователь */}
          <Stack.Protected guard={!isAuth}>
            <Stack.Screen
              name="(tabs)"
              options={{
                headerShown: false,
              }}
            />
          </Stack.Protected>
        </Stack>

        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
