import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Text,
  Platform,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "../input/input";

type UpdateProjectPayload = {
  name: string;
  object_code: string;
  project_code: string;
  comment: string;
};

type ProjectData = {
  name: string;
  object_code: string;
  project_code: string;
  comment: string;
};

export function EditProjectForm({
  initialData,
  onSubmit,
  onClose,
  onDelete,
  colorScheme,
}: {
  initialData: ProjectData;
  onSubmit: (data: UpdateProjectPayload) => void;
  onClose: () => void;
  onDelete: () => void;
  colorScheme: any;
}) {
  const [formData, setFormData] = useState<ProjectData>(initialData);

  const handleChange = (field: keyof ProjectData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert("Введите название проекта");
      return;
    }

    const cleanData: UpdateProjectPayload = Object.fromEntries(
      Object.entries({
        name: formData.name.trim(),
        object_code: formData.object_code.trim(),
        project_code: formData.project_code.trim(),
        comment: formData.comment.trim(),
      }).filter(([_, value]) => value !== ""),
    ) as UpdateProjectPayload;

    onSubmit(cleanData);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Редактировать проект</ThemedText>

          <TouchableOpacity
            style={{
              paddingHorizontal: 10,
              padding: 5,
            }}
            onPress={onClose}
          >
            <ThemedText style={styles.close}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <View>
          <ThemedText>Название проекта</ThemedText>
          <AuthInput
            value={formData.name}
            onChangeText={(t) => handleChange("name", t)}
            placeholder="Название проекта"
          />
        </View>

        <View>
          <ThemedText>Код объекта</ThemedText>
          <AuthInput
            value={formData.object_code}
            onChangeText={(t) => handleChange("object_code", t)}
            placeholder="Код объекта"
          />
        </View>

        <View>
          <ThemedText>Код проекта</ThemedText>
          <AuthInput
            value={formData.project_code}
            onChangeText={(t) => handleChange("project_code", t)}
            placeholder="Код проекта"
          />
        </View>

        <View>
          <ThemedText>Комментарий</ThemedText>
          <AuthInput
            value={formData.comment}
            onChangeText={(t) => handleChange("comment", t)}
            placeholder="Комментарий"
          />
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.cancelBtn,
            {
              backgroundColor:
                colorScheme === "dark" ? "rgba(52,52,52, 1)" : "#f2f2f2",
            },
          ]}
          onPress={onClose}
        >
          <ThemedText
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: colorScheme === "dark" ? "#f2f2f2" : "#666",
            }}
          >
            Отмена
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit}>
          <ThemedText
            style={{
              fontSize: 17,
              fontWeight: "600",
              color: "#fff",
            }}
          >
            Сохранить
          </ThemedText>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[
          styles.deleteButton,
          {
            backgroundColor:
              colorScheme === "dark" ? "rgba(52,52,52, 1)" : "#f2f2f2",
            marginHorizontal: Platform.OS === "ios" ? 30 : 24,
          },
        ]}
        onPress={onDelete}
      >
        <Text
          style={{
            fontSize: 17,
            fontWeight: "600",
            color: colorScheme === "dark" ? "#ff4e4e" : "#ff1d1d",
          }}
        >
          Удалить
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 60,
  },

  header: {
    paddingTop: 20,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  close: {
    fontSize: 18,
    opacity: 0.6,
    fontWeight: "bold",
  },

  card: {
    paddingHorizontal: 20,
    paddingBottom: 35,

    borderRadius: 25,
    marginTop: 8,
    gap: 12,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
  },

  add: {
    fontSize: 14,
    color: "#666",
  },

  materialCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eee",
    gap: 10,
  },

  deleteButton: {
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",

    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
    minHeight: 54,
    flex: 1,
    gap: 8,
  },

  row: {
    flexDirection: "row",
    gap: 10,
  },

  textarea: {
    borderWidth: 2,
    borderColor: "#3352cf",
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    minHeight: 50,
  },

  delete: {
    color: "#ff3b30",
    fontSize: 13,
  },

  total: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#f5f5f5",
  },

  totalLabel: {
    fontSize: 16,
  },

  totalValue: {
    fontSize: 18,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    paddingHorizontal: 24,
    gap: 12,
  },

  cancelBtn: {
    flex: 1,
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
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
});
