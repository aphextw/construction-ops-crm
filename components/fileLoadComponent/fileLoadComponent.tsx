import {
  TouchableOpacity,
  StyleSheet,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface FileUploadProps {
  sectionName?: any;
  onUpload?: () => void;
  colorScheme?: "dark" | "light" | undefined | null;
  label?: string;
  title?: string;
  subtitle?: string;
}

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export function FileUpload({
  onUpload,
  colorScheme,
  label,
  title,
  subtitle,
}: FileUploadProps) {
  const [closed, setClosed] = useState(true);

  const toggle = () => {
    LayoutAnimation.easeInEaseOut();
    setClosed((prev) => !prev);
  };

  return (
    <View
      style={[
        styles.wrapper,
        {
          marginBottom: 0,
        },
      ]}
    >
      <TouchableOpacity onPress={toggle} style={styles.header}>
        <ThemedText style={styles.sectionLabel}>
          {label || "Прикреплённые файлы"}
        </ThemedText>

        <Ionicons
          name={closed ? "chevron-down" : "chevron-up"}
          size={23}
          color="#8E8E93"
        />
      </TouchableOpacity>

      {/* CONTENT */}
      {!closed && (
        <TouchableOpacity
          style={[
            styles.uploadCard,
            { backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff" },
          ]}
          onPress={onUpload}
          activeOpacity={0.7}
        >
          <View style={styles.plusCircle}>
            <Ionicons name="add" size={20} color="#007AFF" />
          </View>

          <ThemedText style={styles.uploadCardTitle}>
            {title || "Загрузите файл"}
          </ThemedText>

          <ThemedText style={styles.uploadCardSubtitle}>
            {subtitle || "PDF, DOC, XLS"}
          </ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 15,
    marginHorizontal: 21,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.7,
  },

  uploadCard: {
    borderRadius: 20,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderStyle: "dashed",
    gap: 4,
  },

  plusCircle: {
    width: 36,
    height: 36,
    borderRadius: 28,
    backgroundColor: "#007AFF15",
    alignItems: "center",
    justifyContent: "center",
  },

  uploadCardTitle: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },

  uploadCardSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
  },
});
