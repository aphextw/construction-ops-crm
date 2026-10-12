// components/CreateSectionForm.tsx
import { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "@/components/input/input";
import { useCreateBigSection } from "@/hooks/project/createBigSectionHook";

interface CreateSectionFormProps {
  onSubmit: () => Promise<void>;
  onClose: () => void;
  loading?: boolean;
  projectId: string;
}

export function CreateBigSectionForm({
  onSubmit,
  projectId,
  onClose,
  loading,
}: CreateSectionFormProps) {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [error, setError] = useState("");
  const { createBigSection } = useCreateBigSection();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Введите название раздела");
      return;
    }
    if (!number) {
      setError("Введите номер раздела");
      return;
    }

    setError("");
    const result = await createBigSection(projectId, name, number);
    if (result) {
      await onSubmit();
      setName("");
      setNumber("");
      onClose();
    }
  };

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>Новый раздел</ThemedText>

      <AuthInput
        placeholder="Название раздела"
        value={name}
        onChangeText={setName}
        // autoFocus
      />

      <AuthInput
        placeholder="Номер раздела"
        value={number}
        onChangeText={setNumber}
        keyboardType="numeric"
        // autoFocus
      />

      {error && <ThemedText style={styles.error}>{error}</ThemedText>}

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
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  error: {
    color: "red",
    fontSize: 14,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
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
    fontSize: 16,
    fontWeight: "500",
    color: "#FFF",
  },
  submitText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
