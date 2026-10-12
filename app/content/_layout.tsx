import { Stack, Tabs } from "expo-router";
import React from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Colors } from "@/constants/theme";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme === "dark" ? "dark" : "light"];
  const insets = useSafeAreaInsets();

  const [user, setUser] = useState<Record<string, any>>({});

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const saved = await AsyncStorage.getItem("user");

        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
        }
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
      }
    };

    loadProjects();
  }, []);

  const role = user?.role?.code;

  return (
    <Tabs
      screenOptions={{
        tabBarLabelPosition: "below-icon",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          elevation: 0,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 56 + Math.max(insets.bottom, 8),
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.secondary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="listPage"
        options={{
          headerShown: false,
          tabBarLabel: "Объекты",
          tabBarIcon: ({ color }) => (
            <Ionicons name="folder-outline" size={26} color={color} />
            // <IconSymbol name="building.2" size={28} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          headerShown: false,
          href:
            role === "developer" ||
            role === "director" ||
            role === "deputy_director"
              ? "/content/analytics"
              : null,
          tabBarLabel: "Аналитика",
          tabBarIcon: ({ color }) => (
            <AntDesign name="bar-chart" size={25} color={color} />
            // <IconSymbol name="chart.bar" size={29} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="PTO_page"
        options={{
          headerShown: false,
          href:
            role === "developer" ||
            role?.includes("pto") ||
            role?.includes("estimator")
              ? "/content/PTO_page"
              : null,
          tabBarLabel: "Материалы",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="shippingbox" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          headerShown: false,
          tabBarLabel: "Профиль",
          tabBarIcon: ({ color }) => (
            <IconSymbol name="person.crop.circle" size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
