import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { BottomSheet } from "react-native-sheet";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { AuthInput } from "@/components/input/input";
import { useMaterials } from "@/hooks/materials/useMaterials";
import { useMaterialSets } from "@/hooks/materials/useMaterialSets";
import { ScreenHeading, WorkspaceTabs, WorkspaceButton, EmptyState, LoadingRows } from "@/components/ui/workspace";
import SearchInput from "@/components/search_input/search_input";
import { Layout } from "@/constants/theme";

const pluralize = (count, one, few, many) => {
  const abs = Math.abs(count) % 100;
  const mod = abs % 10;

  if (abs > 10 && abs < 20) return many;
  if (mod > 1 && mod < 5) return few;
  if (mod === 1) return one;
  return many;
};

const getMaterialValueLabel = (item) =>
  item?.valueLabel || item?.value || "Параметр";

const getMaterialUnitLabel = (item) =>
  typeof item?.unit === "string"
    ? item.unit
    : item?.unit?.display_name || item?.unit?.code || "";

export default function PTO_page() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const sheetRef = useRef(null);

  const {
    materials,
    units,
    loadingMaterials,
    loadingUnits,
    savingMaterial,
    deletingMaterial,
    materialActionError,
    materialsError,
    unitsError,
    getMaterials,
    getMeasurementUnits,
    createMaterial,
    updateMaterial,
    deleteMaterial,
  } = useMaterials();
  const {
    sets,
    loadingSets,
    savingSet,
    deletingSet,
    setActionError,
    setsError,
    getMaterialSets,
    createSetWithItems,
    updateSetWithItems,
    removeMaterialSet,
  } = useMaterialSets();
  const [mode, setMode] = useState("materials");
  const [search, setSearch] = useState("");
  const [sheetSearch, setSheetSearch] = useState("");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState([]);
  const [expandedSetIds, setExpandedSetIds] = useState([]);
  const [editingItemId, setEditingItemId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    valueLabel: "",
    unit: "",
    measurements: "",
  });

  useEffect(() => {
    getMaterials();
    getMeasurementUnits();
    getMaterialSets();
  }, [getMaterials, getMeasurementUnits, getMaterialSets]);

  useEffect(() => {
    if (!units.length) return;

    const hasSelectedUnit = units.some((unit) => unit.id === form.unit);
    if (!form.unit || !hasSelectedUnit) {
      setForm((prev) => ({ ...prev, unit: units[0].id }));
    }
  }, [form.unit, units]);

  const isMaterialsMode = mode === "materials";

  const filteredMaterials = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return materials;

    return materials.filter((item) =>
      [
        item.name,
        getMaterialValueLabel(item),
        item.measurements,
        getMaterialUnitLabel(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [materials, search]);

  const filteredSets = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sets;

    return sets.filter((item) =>
      [item.name, ...item.set_items.map((entry) => entry.name)]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [sets, search]);

  const availableMaterialsForSet = useMemo(() => {
    const query = sheetSearch.trim().toLowerCase();
    if (!query) return materials;

    return materials.filter((item) =>
      [
        item.name,
        getMaterialValueLabel(item),
        item.measurements,
        getMaterialUnitLabel(item),
      ]
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [materials, sheetSearch]);

  const selectedMaterials = useMemo(
    () => materials.filter((item) => selectedMaterialIds.includes(item.id)),
    [materials, selectedMaterialIds],
  );

  const activeData = isMaterialsMode ? filteredMaterials : filteredSets;

  const resetForm = () => {
    setForm({
      name: "",
      valueLabel: "",
      unit: units[0]?.id || "",
      measurements: "",
    });
    setSheetSearch("");
    setSelectedMaterialIds([]);
    setEditingItemId(null);
  };

  const closeSheet = () => {
    sheetRef.current?.hide();
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    sheetRef.current?.show();
  };

  const toggleMaterialSelection = (materialId) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId],
    );
  };

  const openEditMaterial = (item) => {
    setEditingItemId(item.id);
    setForm({
      name: item.name || "",
      valueLabel: getMaterialValueLabel(item),
      unit: item.unit?.id || "",
      measurements: item.measurements || "",
    });
    setSheetSearch("");
    setSelectedMaterialIds([]);
    sheetRef.current?.show();
  };

  const openEditSet = (item) => {
    setEditingItemId(item.id);
    setForm({
      name: item.name || "",
      valueLabel: "",
      unit: units[0]?.id || "",
      measurements: "",
    });
    setSheetSearch("");
    setSelectedMaterialIds(
      item.set_items?.map((entry) => entry.material_id) || [],
    );
    sheetRef.current?.show();
  };

  const handleDeleteMaterial = async (materialId) => {
    const success = await deleteMaterial(materialId);
    if (!success) return;
    await getMaterialSets();
  };

  const handleDeleteSet = async (setId) => {
    const success = await removeMaterialSet(setId);
    if (!success) {
      Alert.alert("Ошибка", setActionError || "Не удалось удалить комплект");
      return;
    }
    setExpandedSetIds((prev) => prev.filter((id) => id !== setId));
  };

  const toggleSetExpanded = (setId) => {
    setExpandedSetIds((prev) =>
      prev.includes(setId)
        ? prev.filter((id) => id !== setId)
        : [...prev, setId],
    );
  };

  const saveItem = async () => {
    if (!form.name.trim()) return;

    if (isMaterialsMode) {
      const normalizedMeasurement = form.measurements.trim().replace(",", ".");
      const numericMeasurement = Number.parseFloat(normalizedMeasurement);

      if (!form.valueLabel.trim()) {
        Alert.alert("Ошибка", "Укажи параметр материала");
        return;
      }

      if (loadingUnits) {
        Alert.alert("Подожди", "Справочник единиц измерения ещё загружается");
        return;
      }

      if (unitsError) {
        Alert.alert("Ошибка", unitsError);
        return;
      }

      if (!units.length) {
        Alert.alert("Ошибка", "Справочник единиц измерения пока пуст");
        return;
      }

      if (!form.unit || !units.some((unit) => unit.id === form.unit)) {
        Alert.alert("Ошибка", "Выбери единицу измерения из справочника");
        return;
      }

      if (
        !normalizedMeasurement ||
        Number.isNaN(numericMeasurement) ||
        numericMeasurement <= 0
      ) {
        Alert.alert("Ошибка", "Укажи корректное значение больше нуля");
        return;
      }

      const payload = {
        name: form.name.trim(),
        value: form.valueLabel.trim(),
        unit_id: form.unit,
        measurements: normalizedMeasurement,
      };
      const savedMaterial = editingItemId
        ? await updateMaterial(editingItemId, payload)
        : await createMaterial(payload);

      if (!savedMaterial) {
        Alert.alert(
          "Ошибка",
          materialActionError || "Не удалось сохранить материал",
        );
        return;
      }

      if (editingItemId) {
        await getMaterialSets();
      }
    } else {
      if (!selectedMaterialIds.length) return;
      const setItemsPayload = selectedMaterials.map((item, index) => ({
        material_id: item.id,
        measurements: item.measurements,
        sort_order: index,
      }));

      const existingSet = editingItemId
        ? sets.find((item) => item.id === editingItemId)
        : null;

      const savedSet = existingSet
        ? await updateSetWithItems(
            existingSet,
            form.name.trim(),
            setItemsPayload,
          )
        : await createSetWithItems(form.name.trim(), setItemsPayload);

      if (!savedSet) {
        Alert.alert(
          "Ошибка",
          setActionError || "Не удалось сохранить комплект",
        );
        return;
      }
    }

    closeSheet();
  };

  const renderMaterial = ({ item }) => (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: isDark ? "#1c1c1e" : "#fff",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(15,23,42,0.08)",
        },
      ]}
    >
      <View style={styles.itemCardTop}>
        <View style={styles.itemBadge}>
          <MaterialCommunityIcons name="pipe" size={18} color="#2575fc" />
        </View>

        <View style={styles.itemMain}>
          <ThemedText style={styles.itemTitle}>{item.name}</ThemedText>
          <ThemedText style={styles.itemSubtitle}>
            {getMaterialValueLabel(item)}: {item.measurements}{" "}
            {getMaterialUnitLabel(item)}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.itemMenuButton}
          onPress={() =>
            Alert.alert(item.name, "Выберите действие", [
              { text: "Изменить", onPress: () => openEditMaterial(item) },
              {
                text: "Удалить",
                style: "destructive",
                onPress: () => handleDeleteMaterial(item.id),
              },
              { text: "Отмена", style: "cancel" },
            ])
          }
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSet = ({ item }) => (
    <View
      style={[
        styles.itemCard,
        {
          backgroundColor: isDark ? "#1c1c1e" : "#fff",
          borderColor: isDark
            ? "rgba(255,255,255,0.08)"
            : "rgba(15,23,42,0.08)",
        },
      ]}
    >
      <View style={styles.itemCardTop}>
        <View style={styles.itemBadge}>
          <MaterialCommunityIcons
            name="archive-outline"
            size={18}
            color="#2575fc"
          />
        </View>

        <View style={styles.itemMain}>
          <ThemedText style={styles.itemTitle}>{item.name}</ThemedText>
          <ThemedText style={styles.itemSubtitle}>
            {item.set_items.length}{" "}
            {pluralize(
              item.set_items.length,
              "материал",
              "материала",
              "материалов",
            )}
          </ThemedText>
        </View>

        <TouchableOpacity
          style={styles.itemMenuButton}
          onPress={() =>
            Alert.alert(item.name, "Выберите действие", [
              { text: "Изменить комплект", onPress: () => openEditSet(item) },
              {
                text: "Удалить комплект",
                style: "destructive",
                onPress: () => handleDeleteSet(item.id),
              },
              { text: "Отмена", style: "cancel" },
            ])
          }
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      {item.set_items.length ? (
        <>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => toggleSetExpanded(item.id)}
            style={styles.expandButton}
          >
            <ThemedText style={styles.expandButtonText}>
              {expandedSetIds.includes(item.id) ? "Скрыть состав" : "Состав"}
            </ThemedText>
            <Ionicons
              name={
                expandedSetIds.includes(item.id) ? "chevron-up" : "chevron-down"
              }
              size={16}
              color="#2575fc"
            />
          </TouchableOpacity>

          {expandedSetIds.includes(item.id) ? (
            <View style={styles.previewStack}>
              {item.set_items.map((entry, index) => (
                <ThemedText
                  key={`${item.id}-${index}`}
                  style={styles.previewText}
                >
                  {entry.name}
                </ThemedText>
              ))}
            </View>
          ) : null}
        </>
      ) : null}
    </View>
  );

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <ScreenHeading title="Материалы" />
      <WorkspaceTabs value={mode} onChange={setMode} options={[{ key: "materials", label: "Материалы" }, { key: "sets", label: "Комплекты" }]} />
      <View style={{ marginBottom: 16 }}>
        <SearchInput value={search} onChangeText={setSearch} colorScheme={colorScheme} placeholder={isMaterialsMode ? "Поиск материалов" : "Поиск комплектов"} />
      </View>

      <FlatList
        data={activeData}
        keyExtractor={(item) => item.id}
        renderItem={isMaterialsMode ? renderMaterial : renderSet}
        contentContainerStyle={styles.listContent}
        refreshing={isMaterialsMode ? loadingMaterials : loadingSets}
        onRefresh={isMaterialsMode ? getMaterials : getMaterialSets}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          (isMaterialsMode ? loadingMaterials : loadingSets) ? <LoadingRows /> :
          (isMaterialsMode ? materialsError : setsError) ? (
            <EmptyState title="Не удалось загрузить данные" detail={isMaterialsMode ? materialsError : setsError}
              action={<WorkspaceButton title="Повторить" icon="refresh" secondary onPress={isMaterialsMode ? getMaterials : getMaterialSets} />} />
          ) : search.trim() ? <EmptyState title="Ничего не найдено" detail="Попробуйте другое название." /> :
          <EmptyState title={isMaterialsMode ? "Материалов пока нет" : "Комплектов пока нет"} />
        }
      />

      <TouchableOpacity
        onPress={openCreate}
        style={[
          styles.button,
          {
            marginBottom: 12,
          },
        ]}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={20} color="#fff" />
        <ThemedText style={styles.buttonText}>
          {isMaterialsMode ? "Добавить материал" : "Добавить комплект"}
        </ThemedText>
      </TouchableOpacity>

      <BottomSheet
        ref={sheetRef}
        borderRadius={28}
        height={Platform.OS === "ios" ? 720 : 800}
        sheetStyle={{
          backgroundColor: isDark ? "#000" : "#fff",
        }}
      >
        <View style={styles.sheetContent}>
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderText}>
              <ThemedText style={styles.sheetTitle}>
                {editingItemId
                  ? isMaterialsMode
                    ? "Изменить материал"
                    : "Изменить комплект"
                  : isMaterialsMode
                    ? "Новый материал"
                    : "Новый комплект"}
              </ThemedText>
              <ThemedText style={styles.sheetSubtitle}>
                {isMaterialsMode
                  ? "Сохрани типовую позицию для дальнейшей работы"
                  : "Собери комплект из уже созданных материалов"}
              </ThemedText>
            </View>

            <TouchableOpacity
              onPress={closeSheet}
              style={[
                styles.sheetClose,
                {
                  backgroundColor: isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(15,23,42,0.06)",
                },
              ]}
            >
              <ThemedText style={styles.sheetCloseText}>✕</ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetFields}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.field}>
              <ThemedText style={styles.fieldLabel}>Название</ThemedText>
              <AuthInput
                darker={false}
                value={form.name}
                onChangeText={(t) => setForm((prev) => ({ ...prev, name: t }))}
                placeholder={
                  isMaterialsMode
                    ? "Например, труба оцинкованная"
                    : "Например, комплект для электрики"
                }
              />
            </View>

            {isMaterialsMode ? (
              <>
                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Параметр</ThemedText>
                  <AuthInput
                    darker={false}
                    value={form.valueLabel}
                    onChangeText={(t) =>
                      setForm((prev) => ({ ...prev, valueLabel: t }))
                    }
                    placeholder="Например, диаметр"
                  />
                </View>

                <View style={styles.row}>
                  <View style={[styles.field, styles.flexField]}>
                    <ThemedText style={styles.fieldLabel}>Значение</ThemedText>
                    <AuthInput
                      darker={false}
                      value={form.measurements}
                      onChangeText={(t) =>
                        setForm((prev) => ({ ...prev, measurements: t }))
                      }
                      placeholder="Например, 25"
                    />
                  </View>
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>Единица</ThemedText>
                  {loadingUnits ? (
                    <View style={styles.unitHintCard}>
                      <ThemedText style={styles.unitHintText}>
                        Загружаем единицы измерения...
                      </ThemedText>
                    </View>
                  ) : unitsError ? (
                    <View style={styles.unitHintCard}>
                      <ThemedText style={styles.unitHintErrorText}>
                        {unitsError}
                      </ThemedText>
                    </View>
                  ) : !units.length ? (
                    <View style={styles.unitHintCard}>
                      <ThemedText style={styles.unitHintText}>
                        Справочник единиц измерения пока пуст
                      </ThemedText>
                    </View>
                  ) : (
                    <View style={styles.unitRow}>
                      {units.map((unit) => {
                        const active = form.unit === unit.id;

                        return (
                          <TouchableOpacity
                            key={unit.id}
                            onPress={() =>
                              setForm((prev) => ({ ...prev, unit: unit.id }))
                            }
                            style={[
                              styles.unitChip,
                              active ? styles.unitChipActive : null,
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.unitChipText,
                                active ? styles.unitChipTextActive : null,
                              ]}
                            >
                              {unit.display_name}
                            </ThemedText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.selectionSummary,
                    {
                      backgroundColor: isDark
                        ? "rgba(37,117,252,0.12)"
                        : "rgba(37,117,252,0.08)",
                    },
                  ]}
                >
                  <ThemedText style={styles.selectionSummaryTitle}>
                    Выбрано материалов
                  </ThemedText>
                  <ThemedText style={styles.selectionSummaryValue}>
                    {selectedMaterialIds.length}
                  </ThemedText>
                </View>

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>
                    Поиск материалов
                  </ThemedText>
                  <AuthInput
                    darker={false}
                    value={sheetSearch}
                    onChangeText={setSheetSearch}
                    placeholder="Начни вводить название"
                  />
                </View>

                {selectedMaterials.length ? (
                  <View style={styles.field}>
                    <ThemedText style={styles.fieldLabel}>Выбрано</ThemedText>
                    <View style={styles.selectedList}>
                      {selectedMaterials.map((item) => (
                        <View key={item.id} style={styles.selectedChip}>
                          <ThemedText style={styles.selectedChipText}>
                            {item.name}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                <View style={styles.field}>
                  <ThemedText style={styles.fieldLabel}>
                    Доступные материалы
                  </ThemedText>

                  <View style={styles.materialPickerList}>
                    {availableMaterialsForSet.length ? (
                      availableMaterialsForSet.map((item) => {
                        const selected = selectedMaterialIds.includes(item.id);

                        return (
                          <TouchableOpacity
                            key={item.id}
                            activeOpacity={0.85}
                            onPress={() => toggleMaterialSelection(item.id)}
                            style={[
                              styles.materialPickerItem,
                              selected
                                ? styles.materialPickerItemSelected
                                : null,
                              {
                                backgroundColor: isDark ? "#1c1c1e" : "#fff",
                                borderColor: selected
                                  ? "rgba(37,117,252,0.5)"
                                  : isDark
                                    ? "rgba(255,255,255,0.08)"
                                    : "rgba(15,23,42,0.08)",
                              },
                            ]}
                          >
                            <View style={styles.materialPickerMain}>
                              <ThemedText style={styles.materialPickerTitle}>
                                {item.name}
                              </ThemedText>
                              <ThemedText style={styles.materialPickerSubtitle}>
                                {getMaterialValueLabel(item)}:{" "}
                                {item.measurements} {getMaterialUnitLabel(item)}
                              </ThemedText>
                            </View>

                            <View
                              style={[
                                styles.materialPickerCheck,
                                selected
                                  ? styles.materialPickerCheckSelected
                                  : null,
                              ]}
                            >
                              {selected ? (
                                <Ionicons
                                  name="checkmark"
                                  size={16}
                                  color="#2575fc"
                                />
                              ) : null}
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={styles.materialPickerEmpty}>
                        <ThemedText style={styles.materialPickerEmptyText}>
                          Ничего не найдено
                        </ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.sheetActions}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={closeSheet}
            >
              <ThemedText style={styles.secondaryButtonText}>Отмена</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.primaryButton,
                (!isMaterialsMode && !selectedMaterialIds.length) ||
                savingMaterial ||
                savingSet ||
                deletingMaterial ||
                deletingSet ||
                (isMaterialsMode && loadingUnits)
                  ? styles.primaryButtonDisabled
                  : null,
              ]}
              onPress={saveItem}
              disabled={
                (!isMaterialsMode && !selectedMaterialIds.length) ||
                savingMaterial ||
                savingSet ||
                deletingMaterial ||
                deletingSet ||
                (isMaterialsMode && loadingUnits)
              }
            >
              <ThemedText style={styles.primaryButtonText}>
                {loadingUnits
                  ? "Грузим единицы"
                  : savingMaterial || savingSet
                    ? "Сохраняем"
                    : "Сохранить"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: Layout.gutter,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 36,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 4,
    marginBottom: 14,
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    height: 44,
    borderRadius: 14,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
  },
  segmentTextActive: {
    color: "#2575fc",
  },
  searchWrap: {
    marginBottom: 14,
  },
  searchBox: {
    minHeight: 60,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingLeft: 16,
    paddingRight: 10,
  },
  searchInputWrap: {
    flex: 1,
  },
  searchInputShell: {
    minHeight: 48,
    backgroundColor: "transparent",
    paddingHorizontal: 0,
    borderRadius: 0,
  },
  searchInput: {
    minHeight: 48,
    paddingRight: 0,
  },
  listContent: {
    paddingBottom: 20,
    gap: 4,
  },
  itemCard: {
    borderRadius: 12,
    borderWidth: 0,
    padding: 16,
    marginBottom: 8,
  },
  itemCardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  itemBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  itemMain: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 22,
  },
  itemSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#8E8E93",
  },
  itemMenuButton: {
    width: 44,
    height: 44,
    borderRadius: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  expandButton: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(142,142,147,0.18)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  expandButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2575fc",
  },
  previewStack: {
    marginTop: 12,
    gap: 6,
  },
  previewText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  emptyState: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    alignItems: "center",
    marginTop: 8,
  },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(37,117,252,0.12)",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
    textAlign: "center",
  },
  button: {
    minHeight: 50,
    borderRadius: 12,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 28,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  sheetHeaderText: {
    flex: 1,
    paddingRight: 14,
  },
  sheetTitle: {
    fontSize: 28,
    fontWeight: "700",
    lineHeight: 32,
  },
  sheetSubtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  sheetClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCloseText: {
    fontSize: 18,
    color: "#8E8E93",
  },
  sheetFields: {
    gap: 14,
    paddingBottom: 16,
  },
  field: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  flexField: {
    flex: 1,
  },
  unitRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  unitHintCard: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "rgba(142,142,147,0.12)",
  },
  unitHintText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  unitHintErrorText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#ff5a5f",
  },
  unitChip: {
    minWidth: 56,
    height: 42,
    borderRadius: 14,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(142,142,147,0.14)",
  },
  unitChipActive: {
    backgroundColor: "rgba(37,117,252,0.14)",
  },
  unitChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  unitChipTextActive: {
    color: "#2575fc",
  },
  selectionSummary: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectionSummaryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#8E8E93",
  },
  selectionSummaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2575fc",
  },
  selectedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "rgba(37,117,252,0.12)",
  },
  selectedChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2575fc",
  },
  materialPickerList: {
    gap: 10,
  },
  materialPickerItem: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  materialPickerItemSelected: {
    backgroundColor: "rgba(37,117,252,0.08)",
  },
  materialPickerMain: {
    flex: 1,
    minWidth: 0,
  },
  materialPickerTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  materialPickerSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8E8E93",
  },
  materialPickerCheck: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(142,142,147,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  materialPickerCheckSelected: {
    borderColor: "rgba(37,117,252,0.5)",
    backgroundColor: "rgba(37,117,252,0.12)",
  },
  materialPickerEmpty: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    backgroundColor: "rgba(142,142,147,0.08)",
  },
  materialPickerEmptyText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  sheetActions: {
    flexDirection: "row",
    gap: 12,
    paddingTop: 18,
  },
  secondaryButton: {
    flex: 1,
    height: 54,
    borderRadius: 18,
    backgroundColor: "rgba(142,142,147,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  primaryButton: {
    flex: 1.25,
    height: 54,
    borderRadius: 18,
    backgroundColor: "#2575fc",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});
