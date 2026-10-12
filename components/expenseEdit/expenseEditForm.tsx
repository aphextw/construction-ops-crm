import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "@/components/input/input";
import { useColorScheme } from "@/hooks/use-color-scheme";

type UpdateExpensePayload = {
  material_type?: string;
  quantity?: string;
  unit_price?: string;
  actual_unit_price?: string;
  due_at?: string;
  comment?: string;
};

type ExpenseData = {
  material_type: string;
  quantity: string;
  unit_price: string;
  actual_unit_price: string;
  due_at: string;
  comment: string;
};

type Props = {
  initialData: ExpenseData;
  onSubmit: (data: UpdateExpensePayload) => void;
  onClose: () => void;
  loading?: boolean;
};

const formatCurrency = (value: number) =>
  `${value.toLocaleString("ru-RU")} ₽`;

export function EditExpenseForm({
  initialData,
  onSubmit,
  onClose,
  loading,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [formData, setFormData] = useState<ExpenseData>(initialData);

  const total = useMemo(() => {
    const quantity = parseFloat(formData.quantity.replace(",", "."));
    const price = parseFloat(formData.unit_price.replace(",", "."));

    if (Number.isNaN(quantity) || Number.isNaN(price)) {
      return 0;
    }

    return quantity * price;
  }, [formData.quantity, formData.unit_price]);

  const handleChange = (field: keyof ExpenseData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!formData.material_type.trim()) {
      alert("Введите название материала");
      return;
    }

    const cleanData: UpdateExpensePayload = Object.fromEntries(
      Object.entries({
        material_type: formData.material_type.trim(),
        quantity: formData.quantity.trim(),
        unit_price: formData.unit_price.trim(),
        actual_unit_price: formData.actual_unit_price.trim(),
        due_at: formData.due_at.trim(),
        comment: formData.comment.trim(),
      }).filter(([_, value]) => value !== ""),
    ) as UpdateExpensePayload;

    onSubmit(cleanData);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.flex}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerText}>
            <ThemedText style={styles.title}>Редактировать материал</ThemedText>
            <ThemedText style={styles.subtitle}>
              Обнови название, цену и детали
            </ThemedText>
          </View>

          <TouchableOpacity
            onPress={onClose}
            style={[
              styles.closeBtn,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <ThemedText style={styles.close}>✕</ThemedText>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.surface,
            {
              backgroundColor: isDark ? "#141416" : "#ffffff",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(15,23,42,0.08)",
            },
          ]}
        >
          <View style={styles.field}>
            <ThemedText style={styles.label}>Название</ThemedText>
            <AuthInput
              darker={false}
              value={formData.material_type}
              onChangeText={(t) => handleChange("material_type", t)}
              placeholder="Название материала"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField]}>
              <ThemedText style={styles.label}>Количество</ThemedText>
              <AuthInput
                darker={false}
                value={formData.quantity}
                onChangeText={(t) => handleChange("quantity", t)}
                placeholder="1"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.field, styles.halfField]}>
              <ThemedText style={styles.label}>Цена за единицу</ThemedText>
              <AuthInput
                darker={false}
                value={formData.unit_price}
                onChangeText={(t) => handleChange("unit_price", t)}
                placeholder="0"
                keyboardType="numeric"
              />
            </View>
          </View>

          <View
            style={[
              styles.totalCard,
              {
                backgroundColor: isDark
                  ? "rgba(37,117,252,0.14)"
                  : "rgba(37,117,252,0.08)",
              },
            ]}
          >
            <ThemedText style={styles.totalLabel}>Плановая сумма</ThemedText>
            <ThemedText style={styles.totalValue}>
              {formatCurrency(total)}
            </ThemedText>
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Фактическая цена</ThemedText>
            <AuthInput
              darker={false}
              value={formData.actual_unit_price}
              onChangeText={(t) => handleChange("actual_unit_price", t)}
              placeholder="0"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <ThemedText style={styles.label}>Комментарий</ThemedText>
            <AuthInput
              darker={false}
              value={formData.comment}
              onChangeText={(t) => handleChange("comment", t)}
              placeholder="Примечание по расходу"
              multiline
              numberOfLines={4}
              style={styles.textareaWrap}
              inputStyle={styles.textareaInput}
            />
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.secondaryButton} onPress={onClose}>
            <ThemedText style={styles.secondaryText}>Отмена</ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              loading ? styles.primaryButtonDisabled : null,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <ThemedText style={styles.primaryText}>Сохранить</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 34,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerText: {
    flex: 1,
    paddingRight: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 15,
    color: "#8E8E93",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  close: {
    fontSize: 18,
    color: "#8E8E93",
  },
  surface: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    gap: 16,
  },
  field: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  totalCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
  },
  textareaWrap: {
    minHeight: 116,
    alignItems: "stretch",
  },
  textareaInput: {
    minHeight: 90,
    paddingTop: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    height: 56,
    borderRadius: 18,
    backgroundColor: "rgba(142,142,147,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButton: {
    flex: 1.2,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#2575fc",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.6,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
