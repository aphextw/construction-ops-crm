import React from "react";
import {
  ActivityIndicator,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import {
  ProjectMaterialImport,
  ProjectMaterialImportItem,
} from "@/hooks/expenses/useMaterialImport";

type MaterialImportDraftSheetProps = {
  colorScheme?: "dark" | "light" | null;
  materialImport: ProjectMaterialImport | null;
  items: ProjectMaterialImportItem[];
  loadingDraft?: boolean;
  parsingImport?: boolean;
  confirmingImport?: boolean;
  importError?: string | null;
  sectionName?: string | string[];
  onParse: () => void;
  onConfirm: () => void;
  onClose: () => void;
};

const getStatusLabel = (status?: ProjectMaterialImport["status"]) => {
  switch (status) {
    case "uploaded":
      return "Файл загружен";
    case "parsed":
      return "Черновик готов";
    case "confirmed":
      return "Добавлено в расходы";
    case "failed":
      return "Ошибка парсинга";
    default:
      return "Черновик";
  }
};

export function MaterialImportDraftSheet({
  colorScheme,
  materialImport,
  items,
  loadingDraft = false,
  parsingImport = false,
  confirmingImport = false,
  importError,
  sectionName,
  onParse,
  onConfirm,
  onClose,
}: MaterialImportDraftSheetProps) {
  const isDark = colorScheme === "dark";
  const canConfirm = !!items.length && materialImport?.status === "parsed";
  const canParse =
    !!materialImport &&
    materialImport.status !== "parsed" &&
    !parsingImport &&
    !confirmingImport;

  return (
    <View style={[styles.sheet, isDark && styles.sheetDark]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <ThemedText style={styles.title}>Черновик импорта</ThemedText>
          <ThemedText style={styles.subtitle}>
            {typeof sectionName === "string"
              ? `Раздел: ${sectionName}`
              : "Проверь строки перед добавлением в расходы"}
          </ThemedText>
        </View>

        <TouchableOpacity
          onPress={onClose}
          style={[
            styles.closeButton,
            {
              backgroundColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <Ionicons name="close" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
      >
        <View
          style={[
            styles.fileCard,
            {
              backgroundColor: isDark ? "#1c1c1e" : "#f8fafc",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.06)",
            },
          ]}
        >
          <View style={styles.fileHeader}>
            <View style={styles.fileIconWrap}>
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#007AFF"
              />
            </View>
            <View style={styles.fileMeta}>
              <ThemedText style={styles.fileName}>
                {materialImport?.original_filename || "Файл ещё не загружен"}
              </ThemedText>
              <ThemedText style={styles.fileStatus}>
                {getStatusLabel(materialImport?.status)}
              </ThemedText>
            </View>
          </View>

          {materialImport?.parse_error || importError ? (
            <View
              style={[
                styles.errorBox,
                {
                  backgroundColor: isDark
                    ? "rgba(255,59,48,0.12)"
                    : "rgba(255,59,48,0.08)",
                },
              ]}
            >
              <Ionicons name="alert-circle-outline" size={16} color="#FF3B30" />
              <ThemedText style={styles.errorText}>
                {materialImport?.parse_error || importError}
              </ThemedText>
            </View>
          ) : null}
        </View>

        <View style={styles.itemsHeader}>
          <ThemedText style={styles.itemsTitle}>
            Строки черновика ({items.length})
          </ThemedText>
        </View>

        {loadingDraft ? (
          <View style={styles.loadingState}>
            <ActivityIndicator
              size="small"
              color={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
            />
            <ThemedText style={styles.loadingText}>
              Загружаем черновик
            </ThemedText>
          </View>
        ) : items.length ? (
          <FlatList
            data={items}
            // nestedScrollEnabled
            // scrollEnabled
            // scrollEnabled={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.itemsList}
            renderItem={({ item }) => (
              <View
                style={[
                  styles.itemCard,
                  {
                    backgroundColor: isDark ? "#1c1c1e" : "#ffffff",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.05)",
                  },
                ]}
              >
                <View style={styles.itemTop}>
                  <ThemedText style={styles.itemName}>
                    {item.material_type}
                  </ThemedText>
                  <ThemedText style={styles.itemIndex}>
                    #{item.row_index}
                  </ThemedText>
                </View>
                <ThemedText style={styles.itemMeta}>
                  Кол-во: {item.quantity}
                </ThemedText>
                <ThemedText style={styles.itemMeta}>
                  Цена: {item.unit_price || "Не указана"}
                </ThemedText>
                <ThemedText style={styles.itemRaw}>{item.raw_row}</ThemedText>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="reader-outline" size={28} color="#8E8E93" />
            <ThemedText style={styles.emptyText}>
              Сначала распарси файл, чтобы увидеть строки черновика
            </ThemedText>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            backgroundColor: isDark ? "#000" : "#fff",
            borderTopColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.secondaryButton,
            {
              backgroundColor: isDark ? "#2c2c2e" : "#f3f4f6",
              opacity: canParse ? 1 : 0.55,
            },
          ]}
          disabled={!canParse}
          onPress={onParse}
        >
          {parsingImport ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "rgba(255,255,255)" : "rgba(0,0,0,0.06)"}
            />
          ) : (
            <>
              <Ionicons
                name="sparkles-outline"
                size={18}
                color={colorScheme === "dark" ? "#fff" : "#000"}
              />
              <ThemedText
                style={[
                  styles.secondaryButtonText,
                  { color: colorScheme === "dark" ? "#fff" : "#000" },
                ]}
              >
                Обработать
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.primaryButton, { opacity: canConfirm ? 1 : 0.55 }]}
          disabled={!canConfirm || confirmingImport}
          onPress={onConfirm}
        >
          {confirmingImport ? (
            <ActivityIndicator
              size="small"
              color={isDark ? "rgba(255,255,255)" : "rgba(0,0,0,0.06)"}
            />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={18}
                color="#fff"
              />
              <ThemedText style={styles.primaryButtonText}>
                Добавить в раздел
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: "#fff",
  },
  sheetDark: {
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#8E8E93",
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 14,
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  fileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fileIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,122,255,0.12)",
  },
  fileMeta: {
    flex: 1,
    minWidth: 0,
  },
  fileName: {
    fontSize: 15,
    fontWeight: "700",
  },
  fileStatus: {
    marginTop: 2,
    fontSize: 13,
    color: "#8E8E93",
  },
  errorBox: {
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: "#FF3B30",
  },
  itemsHeader: {
    marginTop: 2,
  },
  itemsTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  loadingState: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  itemsList: {
    gap: 10,
  },
  itemCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  itemTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  itemName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  itemIndex: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "700",
  },
  itemMeta: {
    fontSize: 13,
    color: "#8E8E93",
  },
  itemRaw: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 17,
    color: "#8E8E93",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    gap: 10,
  },
  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
    textAlign: "center",
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 22,
    flexDirection: "row",
    gap: 10,
    marginBottom: 70,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
  },
  primaryButton: {
    flex: 1.15,
    minHeight: 50,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
});
