import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { PROJECT_STATUS_COLORS } from "@/constants/project-status";

export function ProjectStatusBadge({ status, label }: { status?: string; label: string }) {
  const appearance = useColorScheme() === "dark" ? "dark" : "light";
  const color = PROJECT_STATUS_COLORS[status ?? ""]?.[appearance] ?? "#8E8E93";
  return (
    <View style={[styles.badge, { backgroundColor: `${color}20` }]}>
      <ThemedText style={[styles.label, { color }]}>{label}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: "flex-start", maxWidth: "100%", borderRadius: 6, paddingHorizontal: 9, paddingVertical: 4 },
  label: { fontSize: 13, lineHeight: 19, fontWeight: "600" },
});
