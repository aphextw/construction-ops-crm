import {
  Modal,
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";

interface EditWorkerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: any;
  //     (data: {
  //   full_name: string;
  //   position: string;
  //   phone: string;
  // }) => Promise<void>;
  selectedWorker: any;
  saving: boolean;
  colorScheme: "light" | "dark";
}

export default function EditWorkerModal({
  visible,
  onClose,
  onSave,
  selectedWorker,
  saving,
  colorScheme,
}: EditWorkerModalProps) {
  const [workerForm, setWorkerForm] = useState({
    full_name: "",
    position: "",
    phone: "",
  });

  useEffect(() => {
    if (selectedWorker) {
      setWorkerForm({
        full_name: selectedWorker?.full_name || "",
        position: selectedWorker?.position || "",
        phone: selectedWorker?.phone || "",
      });
    } else {
      setWorkerForm({
        full_name: "",
        position: "",
        phone: "",
      });
    }
  }, [selectedWorker, visible]);

  const handleSave = async () => {
    await onSave(workerForm);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>
              Редактировать работника
            </ThemedText>

            <TouchableOpacity style={styles.modalCloseButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            <View
              style={[
                styles.modalField,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2c2c2e" : "#f3f4f6",
                },
              ]}
            >
              <TextInput
                value={workerForm.full_name}
                onChangeText={(value) =>
                  setWorkerForm((prev: any) => ({
                    ...prev,
                    full_name: value,
                  }))
                }
                placeholder="Введите ФИО"
                placeholderTextColor="#8E8E93"
                style={[
                  styles.modalInput,
                  {
                    color: colorScheme === "dark" ? "#fff" : "#111",
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.modalField,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2c2c2e" : "#f3f4f6",
                },
              ]}
            >
              <TextInput
                value={workerForm.position}
                onChangeText={(value) =>
                  setWorkerForm((prev: any) => ({
                    ...prev,
                    position: value,
                  }))
                }
                placeholder="Введите должность"
                placeholderTextColor="#8E8E93"
                style={[
                  styles.modalInput,
                  {
                    color: colorScheme === "dark" ? "#fff" : "#111",
                  },
                ]}
              />
            </View>

            <View
              style={[
                styles.modalField,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2c2c2e" : "#f3f4f6",
                },
              ]}
            >
              <TextInput
                value={workerForm.phone}
                onChangeText={(value) =>
                  setWorkerForm((prev: any) => ({
                    ...prev,
                    phone: value,
                  }))
                }
                placeholder="Введите номер телефона"
                placeholderTextColor="#8E8E93"
                keyboardType="phone-pad"
                style={[
                  styles.modalInput,
                  {
                    color: colorScheme === "dark" ? "#fff" : "#111",
                  },
                ]}
              />
            </View>
          </View>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalCancelButton,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#2c2c2e" : "#f3f4f6",
                },
              ]}
              onPress={onClose}
            >
              <ThemedText
                style={[
                  styles.modalButtonText,
                  { color: colorScheme === "dark" ? "#fff" : "#111" },
                ]}
              >
                Отмена
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.modalSaveButton,
                saving && styles.modalButtonDisabled,
              ]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ThemedText style={styles.modalSaveButtonText}>
                  Сохранить
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: {
    padding: 20,
    gap: 16,
  },
  modalField: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modalInput: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  modalFooter: {
    flexDirection: "row",
    gap: 12,
    padding: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButton: {
    backgroundColor: "#f3f4f6",
  },
  modalSaveButton: {
    backgroundColor: "#007AFF",
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
});
