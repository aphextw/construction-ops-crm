import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "../input/input";

type EditFieldPayload = {
  value: string;
  fieldName: string;
};

export function EditFieldForm({
  initialValue,
  fieldLabel,
  fieldPlaceholder = "Ввод...",
  onSubmit,
  onClose,
}: {
  initialValue: string;
  fieldLabel: string;
  fieldPlaceholder?: string;
  onSubmit: (data: EditFieldPayload) => void;
  onClose: () => void;
}) {
  const [value, setValue] = useState(initialValue);

  const colorScheme = useColorScheme();

  const handleSubmit = () => {
    if (!value.trim()) {
      alert(`Введите ${fieldLabel.toLowerCase()}`);
      return;
    }

    onSubmit({
      value: value.trim(),
      fieldName: fieldLabel,
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <View style={styles.container}>
        <View style={styles.card}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>Изменить раздел</ThemedText>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <ThemedText style={styles.close}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          <View style={styles.field}>
            <ThemedText style={styles.label}>{fieldLabel}</ThemedText>
            <AuthInput
              value={value}
              onChangeText={setValue}
              placeholder={fieldPlaceholder}
              style={styles.input}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.cancelBtn,
              {
                backgroundColor: colorScheme === "dark" ? "#151718" : "#f2f2f2",
              },
            ]}
            onPress={onClose}
          >
            <ThemedText
              style={[
                styles.cancelText,
                {
                  color: colorScheme === "dark" ? "#f2f2f2" : "#151718",
                },
              ]}
            >
              Отмена
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
            <ThemedText style={styles.saveText}>Сохранить</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    paddingBottom: 40,
  },
  card: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 32,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    gap: 13,
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 23,
    fontWeight: "700",
    letterSpacing: -0.5,
    flex: 1,
    paddingRight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    // opacity: 0.3,
    justifyContent: "center",
    alignItems: "center",
  },
  close: {
    fontSize: 22,
    color: "#666",
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e5e5",
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: "500",
    marginLeft: 4,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#e5e5e5",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    backgroundColor: "#fafafa",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
  cancelText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#666",
  },
  saveBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  saveText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
});
