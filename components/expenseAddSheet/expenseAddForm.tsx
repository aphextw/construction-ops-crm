import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { AuthInput } from "@/components/input/input";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type { MaterialCatalogItem } from "@/hooks/materials/useMaterials";

type NewExpensePayload = {
  material_type: string;
  quantity: string;
  unit_price: string;
  comment?: string;
  section_id: string;
};

type Props = {
  sectionId: any;
  sectionName: any;
  onSubmit: (data: NewExpensePayload) => void;
  onClose: () => void;
  materials?: MaterialCatalogItem[];
  loadingMaterials?: boolean;
  materialsError?: string | null;
  projectStatus: any;
};

const formatCurrency = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;

export function AddExpenseForm({
  sectionId,
  sectionName,
  onSubmit,
  onClose,
  materials = [],
  loadingMaterials = false,
  materialsError = null,
  projectStatus = "",
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [showMaterialPicker, setShowMaterialPicker] = useState(false);

  const [formData, setFormData] = useState({
    material_type: "",
    quantity: "1",
    unit_price: "",
    comment: "",
  });

  const total = useMemo(() => {
    const quantity = parseFloat(formData.quantity.replace(",", "."));
    const price = parseFloat(formData.unit_price.replace(",", "."));

    if (Number.isNaN(quantity) || Number.isNaN(price)) {
      return 0;
    }

    return quantity * price;
  }, [formData.quantity, formData.unit_price]);

  const filteredMaterials = useMemo(() => {
    const query = formData.material_type.trim().toLowerCase();
    const source = Array.isArray(materials) ? materials : [];

    if (!query) {
      return source.slice(0, 8);
    }

    return source
      .filter((item) =>
        [
          item.name,
          item.value,
          item.measurements,
          item.unit?.display_name,
          item.unit?.code,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      )
      .slice(0, 8);
  }, [formData.material_type, materials]);

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectMaterial = (material: MaterialCatalogItem) => {
    setFormData((prev) => ({
      ...prev,
      material_type: material.name,
      quantity: material.measurements || prev.quantity,
    }));
    setShowMaterialPicker(false);
  };

  const handleSubmit = () => {
    if (!formData.material_type.trim()) {
      alert("Введите название материала");
      return;
    }

    if (!formData.quantity.trim() || parseFloat(formData.quantity) <= 0) {
      alert("Введите корректное количество");
      return;
    }

    const cleanData: NewExpensePayload = {
      material_type: formData.material_type.trim(),
      quantity: formData.quantity.trim(),
      unit_price: formData.unit_price.trim() || "0",
      comment: formData.comment.trim() || "",
      section_id: sectionId,
    };

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
            <ThemedText style={styles.title}>Новый материал</ThemedText>
            <ThemedText style={styles.subtitle}>{sectionName}</ThemedText>
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
              value={formData.material_type}
              onChangeText={(t) => {
                handleChange("material_type", t);
                setShowMaterialPicker(true);
              }}
              placeholder="Например, кабель ВВГ 3x2.5"
              darker={false}
            />

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setShowMaterialPicker((prev) => !prev)}
              style={[
                styles.directoryToggle,
                {
                  backgroundColor: isDark
                    ? "rgba(37,117,252,0.12)"
                    : "rgba(37,117,252,0.08)",
                },
              ]}
            >
              <View style={styles.directoryToggleLeft}>
                <MaterialCommunityIcons
                  name="format-list-bulleted"
                  size={17}
                  color="#2575fc"
                />
                <ThemedText style={styles.directoryToggleText}>
                  Выбрать из материалов
                </ThemedText>
              </View>

              <Ionicons
                name={showMaterialPicker ? "chevron-up" : "chevron-down"}
                size={17}
                color="#2575fc"
              />
            </TouchableOpacity>

            {showMaterialPicker ? (
              <View style={styles.materialPicker}>
                {loadingMaterials ? (
                  <View style={styles.materialEmpty}>
                    <ThemedText style={styles.materialEmptyText}>
                      Загружаем материалы
                    </ThemedText>
                  </View>
                ) : materialsError ? (
                  <View style={styles.materialEmpty}>
                    <ThemedText style={styles.materialEmptyText}>
                      {materialsError}
                    </ThemedText>
                  </View>
                ) : filteredMaterials.length ? (
                  filteredMaterials.map((material) => (
                    <TouchableOpacity
                      key={material.id}
                      activeOpacity={0.85}
                      onPress={() => handleSelectMaterial(material)}
                      style={[
                        styles.materialOption,
                        {
                          backgroundColor: isDark ? "#1c1c1e" : "#fff",
                          borderColor: isDark
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(15,23,42,0.08)",
                        },
                      ]}
                    >
                      <View style={styles.materialOptionIcon}>
                        <MaterialCommunityIcons
                          name="pipe"
                          size={17}
                          color="#2575fc"
                        />
                      </View>

                      <View style={styles.materialOptionText}>
                        <ThemedText style={styles.materialOptionTitle}>
                          {material.name}
                        </ThemedText>
                        <ThemedText style={styles.materialOptionSubtitle}>
                          {[
                            material.value,
                            material.measurements,
                            material.unit?.display_name || material.unit?.code,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </ThemedText>
                      </View>

                      <Ionicons
                        name="add-circle-outline"
                        size={20}
                        color="#2575fc"
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.materialEmpty}>
                    <ThemedText style={styles.materialEmptyText}>
                      {materials.length
                        ? "В справочнике ничего не найдено"
                        : "Справочник материалов пока пуст"}
                    </ThemedText>
                  </View>
                )}
              </View>
            ) : null}
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.halfField, { maxWidth: "49%" }]}>
              <ThemedText style={styles.label}>Количество</ThemedText>
              <AuthInput
                value={formData.quantity}
                onChangeText={(t) => handleChange("quantity", t)}
                placeholder="1"
                keyboardType="numeric"
                darker={false}
              />
            </View>

            {!["project_analysis", "preparing_work_schedule"].includes(
              projectStatus,
            ) && (
              <View style={[styles.field, styles.halfField]}>
                <ThemedText style={styles.label}>Цена за единицу</ThemedText>
                <AuthInput
                  value={formData.unit_price}
                  onChangeText={(t) => handleChange("unit_price", t)}
                  placeholder="0"
                  keyboardType="numeric"
                  darker={false}
                />
              </View>
            )}
          </View>

          {!["project_analysis", "preparing_work_schedule"].includes(
            projectStatus,
          ) && (
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
              <ThemedText style={styles.totalLabel}>Итого</ThemedText>
              <ThemedText style={styles.totalValue}>
                {formatCurrency(total)}
              </ThemedText>
            </View>
          )}

          <View style={styles.field}>
            <ThemedText style={styles.label}>Комментарий</ThemedText>
            <AuthInput
              value={formData.comment}
              onChangeText={(t) => handleChange("comment", t)}
              placeholder="Детали, срок, поставщик"
              darker={false}
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

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit}>
            <ThemedText style={styles.primaryText}>Добавить</ThemedText>
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
  directoryToggle: {
    marginTop: 2,
    minHeight: 44,
    borderRadius: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  directoryToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  directoryToggleText: {
    color: "#2575fc",
    fontSize: 14,
    fontWeight: "700",
  },
  materialPicker: {
    gap: 8,
  },
  materialOption: {
    minHeight: 64,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  materialOptionIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(37,117,252,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  materialOptionText: {
    flex: 1,
    gap: 2,
  },
  materialOptionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  materialOptionSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
  },
  materialEmpty: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: "rgba(142,142,147,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  materialEmptyText: {
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
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
