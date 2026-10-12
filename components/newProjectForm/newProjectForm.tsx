import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "../input/input";
import { useColorScheme } from "@/hooks/use-color-scheme";

type ProjectFormData = {
  number: string;
  name: string;
  object_code: string;
  project_code: string;
  comment: string;
  total_materials_cost: string;
  material_expenses: any[];
  visible_roles: string[];
};

type Props = {
  initialData?: Partial<ProjectFormData>;
  onSubmit: (data: ProjectFormData) => void;
  onClose: () => void;
  isEditing?: boolean;
};

export function ProjectForm({
  initialData,
  onSubmit,
  onClose,
  isEditing = false,
}: Props) {
  const [formData, setFormData] = useState<ProjectFormData>({
    number: initialData?.number || "",
    name: initialData?.name || "",
    object_code: initialData?.object_code || "",
    project_code: initialData?.project_code || "",
    comment: initialData?.comment || "",
    total_materials_cost: initialData?.total_materials_cost || "",
    material_expenses: [],
    visible_roles: initialData?.visible_roles || [],
  });

  const handleChange = (field: keyof ProjectFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Введите название");
      return;
    }

    onSubmit(formData);
  };

  return (
    <ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.scrollContent}>
          {/* Заголовок */}
          <View style={styles.header}>
            <ThemedText style={styles.title}>
              {isEditing ? "Редактировать проект" : "Создать проект"}
            </ThemedText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeButtonText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Форма */}
          <View style={styles.form}>
            <AuthInput
              darker={false}
              value={formData.name}
              onChangeText={(text: any) => handleChange("name", text)}
              placeholder="Название проекта *"
            />

            <AuthInput
              darker={false}
              value={formData.object_code}
              onChangeText={(text: any) => handleChange("object_code", text)}
              placeholder="Шифр объекта *"
            />
          </View>

          {/* Кнопки действий */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <ThemedText style={styles.cancelButtonText}>Отмена</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.submitButton]}
              onPress={handleSubmit}
            >
              <ThemedText style={styles.submitButtonText}>
                {isEditing ? "Сохранить" : "Создать"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    // flex: 0,
    // backgroundColor: "red",
  },
  scrollContent: {
    padding: 20,
    paddingHorizontal: 28,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "600",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: "500",
  },
  form: {
    gap: 16,
  },
  textareaWrapper: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  textarea: {
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: "top",
  },

  roleButtonTextActive: {
    color: "#fff",
  },
  actions: {
    flexDirection: "row",
    paddingVertical: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
  },
  cancelButtonText: {
    color: "#000",
    fontSize: 17,
    fontWeight: "600",
    opacity: 0.8,
  },
  submitButton: {
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
  submitButtonText: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
});
