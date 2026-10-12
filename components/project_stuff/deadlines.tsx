import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { useColorScheme } from "react-native";
import { ThemedText } from "@/components/themed-text";
import DateTimePicker from "react-native-ui-datepicker";

type Props = {
  initialCompany?: string;
  initialSupplies?: string;
  onSubmit: (data: {
    company_deadline?: string;
    supplies_deadline?: string;
  }) => void;
};

export function DeadlinesForm({
  initialCompany = "",
  initialSupplies = "",
  onSubmit,
}: Props) {
  const colorScheme = useColorScheme();
  const isDarkTheme = colorScheme === "dark";

  const [company, setCompany] = useState(initialCompany);
  const [supplies, setSupplies] = useState(initialSupplies);

  // ✅ Синхронизация состояния с пропсами при изменении проекта
  useEffect(() => {
    setCompany(initialCompany);
  }, [initialCompany]);

  useEffect(() => {
    setSupplies(initialSupplies);
  }, [initialSupplies]);

  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [currentDeadline, setCurrentDeadline] = useState<
    "company" | "supplies"
  >("company");
  const [tempDate, setTempDate] = useState<Date | null>(null);

  const parseDateFromString = (dateString: string) => {
    if (!dateString) return new Date();
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const handleOpenDatePicker = (type: "company" | "supplies") => {
    setCurrentDeadline(type);
    const currentValue = type === "company" ? company : supplies;
    setTempDate(parseDateFromString(currentValue));
    setDatePickerVisible(true);
  };

  const handleDateConfirm = (date: any) => {
    const selectedDate = date.date;

    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const day = String(selectedDate.getDate()).padStart(2, "0");
    const hours = String(selectedDate.getHours()).padStart(2, "0");
    const minutes = String(selectedDate.getMinutes()).padStart(2, "0");
    const seconds = String(selectedDate.getSeconds()).padStart(2, "0");

    const timezoneOffset = -selectedDate.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset >= 0 ? "+" : "-";
    const timezoneStr = `${offsetSign}${String(offsetHours).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

    const isoString = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${timezoneStr}`;

    if (currentDeadline === "company") {
      setCompany(isoString);
    } else {
      setSupplies(isoString);
    }

    setDatePickerVisible(false);
  };

  const handleSubmit = () => {
    onSubmit({
      company_deadline: company || undefined,
      supplies_deadline: supplies || undefined,
    });
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return "Не выбрано";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Не выбрано";
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <View
      style={[
        styles.statCard,
        {
          backgroundColor: isDarkTheme ? "#1c1c1e" : "#fff",
        },
      ]}
    >
      <ThemedText>Сроки поставки материала на объектё</ThemedText>

      <TouchableOpacity
        onPress={() => handleOpenDatePicker("company")}
        style={[
          styles.dateButton,
          {
            backgroundColor: isDarkTheme ? "#2c2c2e" : "#f1f3f6",
            borderColor: isDarkTheme ? "#3a3a3c" : "#ddd",
          },
        ]}
      >
        <ThemedText
          style={[styles.dateButtonText, !company && styles.placeholderText]}
        >
          {formatDisplayDate(company) || "Выберите дату"}
        </ThemedText>
      </TouchableOpacity>

      <ThemedText>Срок окончания монтажных работ на объекте</ThemedText>

      <TouchableOpacity
        onPress={() => handleOpenDatePicker("supplies")}
        style={[
          styles.dateButton,
          {
            backgroundColor: isDarkTheme ? "#2c2c2e" : "#f1f3f6",
            borderColor: isDarkTheme ? "#3a3a3c" : "#ddd",
          },
        ]}
      >
        <ThemedText
          style={[styles.dateButtonText, !supplies && styles.placeholderText]}
        >
          {formatDisplayDate(supplies) || "Выберите дату"}
        </ThemedText>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSubmit} style={styles.button}>
        <ThemedText style={styles.buttonText}>Сохранить</ThemedText>
      </TouchableOpacity>

      <Modal visible={isDatePickerVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: isDarkTheme ? "#1c1c1e" : "#fff",
              },
            ]}
          >
            <DateTimePicker
              date={tempDate || new Date()}
              containerHeight={320}
              firstDayOfWeek={1}
              navigationPosition="right"
              mode="single"
              onChange={handleDateConfirm}
              locale="ru"
              showOutsideDays
              style={{
                backgroundColor: isDarkTheme ? "#1c1c1e" : "#fff",
                borderRadius: 12,
                padding: 5,
              }}
              styles={{
                today: {
                  backgroundColor: isDarkTheme ? "#2c2c2e" : "#f1f1f1",
                  borderRadius: 12,
                },
                selected: {
                  borderColor: "#3972ff",
                  backgroundColor: "#3972ff",
                  borderRadius: 15,
                  borderWidth: 2,
                },
                selected_label: { color: "#fff", fontWeight: "bold" },
                day_label: {
                  fontSize: 15,
                  color: isDarkTheme ? "#fff" : "#000",
                },
                weekday_label: {
                  fontSize: 17,
                  color: isDarkTheme ? "#9a9a9a" : "#666",
                },
                month_selector_label: {
                  marginLeft: 10,
                  fontSize: 20,
                  fontWeight: "bold",
                  color: isDarkTheme ? "#fff" : "#000",
                },
                year_selector_label: {
                  fontSize: 20,
                  fontWeight: "bold",
                  color: isDarkTheme ? "#fff" : "#000",
                },
                header: {
                  backgroundColor: isDarkTheme ? "#2c2c2e" : "#F1F3F6",
                  borderRadius: 12,
                  marginBottom: 10,
                },
                button_next: {
                  marginRight: 10,
                  backgroundColor: isDarkTheme ? "#3a3a3c" : "#fff",
                  borderRadius: 10,
                  padding: 10,
                },
                button_prev: {
                  backgroundColor: isDarkTheme ? "#3a3a3c" : "#fff",
                  borderRadius: 10,
                  padding: 10,
                },
              }}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setDatePickerVisible(false)}
              >
                <ThemedText style={styles.cancelButtonText}>Отмена</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={() => setDatePickerVisible(false)}
              >
                <ThemedText style={styles.confirmButtonText}>Готово</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  statCard: {
    borderRadius: 16,
    gap: 10,
  },
  button: {
    marginTop: 10,
    backgroundColor: "#111",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    justifyContent: "center",
  },
  dateButtonText: {
    fontSize: 16,
  },
  placeholderText: {
    opacity: 0.5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    borderRadius: 20,
    padding: 10,
    gap: 16,
    paddingBottom: 30,
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f2f2f2",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "700",
    fontSize: 18,
  },
  confirmButton: {
    backgroundColor: "#3972ff",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 18,
  },
});
