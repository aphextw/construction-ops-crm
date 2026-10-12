import { useState } from "react";
import { StyleSheet, TouchableOpacity, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "@/components/input/input";

type CreateSectionPayload = {
  number: string;
  subsection_name: string;
  part_number: string;
  part_name: string;
  section_code: string;
  volume: string;
};

interface CreateSectionFormProps {
  onSubmit: (
    payload: CreateSectionPayload,
    bigSectionId: string,
  ) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  bigSectionId: string;
}

export function CreateSectionForm({
  onSubmit,
  onClose,
  loading,
  bigSectionId,
}: CreateSectionFormProps) {
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<CreateSectionPayload>({
    number: "",
    subsection_name: "",
    part_number: "",
    part_name: "",
    section_code: "",
    volume: "",
  });

  const [error, setError] = useState("");

  const handleChange = (field: keyof CreateSectionPayload, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      number: "",
      subsection_name: "",
      part_number: "",
      part_name: "",
      section_code: "",
      volume: "",
    });

    setError("");
  };

  const handleSubmit = async () => {
    if (!form.number) {
      setError("Введите подраздел");
      return;
    }

    if (!form.subsection_name.trim()) {
      setError("Введите наименование подраздела");
      return;
    }

    if (!form.part_number) {
      setError("Введите часть");
      return;
    }

    if (!form.part_name.trim()) {
      setError("Введите наименование части");
      return;
    }

    if (!form.section_code.trim()) {
      setError("Введите шифр раздела");
      return;
    }

    if (!form.volume.trim()) {
      setError("Введите том");
      return;
    }

    setError("");

    await onSubmit(
      {
        number: form.number,
        subsection_name: form.subsection_name.trim(),
        part_number: form.part_number,
        part_name: form.part_name.trim(),
        section_code: form.section_code.trim(),
        volume: form.volume.trim(),
      },
      bigSectionId,
    );

    resetForm();
    onClose();
  };

  return (
    <View style={styles.wrapper}>
      <ThemedText style={styles.title}>Создать подраздел</ThemedText>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: 400 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.field}>
          <ThemedText style={styles.label}>Номер подраздела</ThemedText>

          <AuthInput
            placeholder="Ввод..."
            value={form.number}
            onChangeText={(value) => handleChange("number", value)}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Наименование подраздела</ThemedText>

          <AuthInput
            placeholder="Ввод..."
            value={form.subsection_name}
            onChangeText={(value) => handleChange("subsection_name", value)}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Номер части</ThemedText>

          <AuthInput
            placeholder="Ввод..."
            value={form.part_number}
            onChangeText={(value) => handleChange("part_number", value)}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Наименование части</ThemedText>

          <AuthInput
            placeholder="Ввод..."
            value={form.part_name}
            onChangeText={(value) => handleChange("part_name", value)}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Шифр раздела</ThemedText>

          <AuthInput
            placeholder="Ввод..."
            value={form.section_code}
            onChangeText={(value) => handleChange("section_code", value)}
          />
        </View>

        <View style={styles.field}>
          <ThemedText style={styles.label}>Том</ThemedText>

          <AuthInput
            placeholder="Ввод..."
            value={form.volume}
            onChangeText={(value) => handleChange("volume", value)}
          />
        </View>

        {error ? <ThemedText style={styles.error}>{error}</ThemedText> : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 20,
          },
        ]}
      >
        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
          >
            <ThemedText style={styles.cancelText}>Отмена</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.submitButton]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <ThemedText style={styles.submitText}>
              {loading ? "Создание..." : "Создать"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 10,
    paddingHorizontal: 20,
    gap: 16,
  },

  title: {
    textAlign: "left",
    fontWeight: "800",
    fontSize: 20,
    paddingLeft: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },

  field: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },

  error: {
    color: "#ff453a",
    fontSize: 14,
  },

  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 12,
    paddingHorizontal: 20,
    // backgroundColor: "#000",
  },

  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
  },

  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },

  cancelButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  submitButton: {
    backgroundColor: "#007AFF",
  },

  cancelText: {
    fontWeight: "500",
    color: "#FFF",
    fontSize: 16,
  },

  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
