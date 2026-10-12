import { Stack, Tabs } from "expo-router";
import React from "react";

import { useColorScheme } from "@/hooks/use-color-scheme";
import Ionicons from "@expo/vector-icons/Ionicons";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack>
      <Stack.Screen
        name="projectPage"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="expensesPage"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="pdf_viewer"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="access_page"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="project_history"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="usersModeration"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="organized_files"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="userModerationDetails"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
