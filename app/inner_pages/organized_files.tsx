import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  SectionList,
  useColorScheme,
  Platform,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import {
  Feather,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useDataUserStore } from "@/store/useStore";
import { ThemedView } from "@/components/themed-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeleteSectionFile } from "@/hooks/section/SectionFileDelete";
import { useDeleteExpenseFile } from "@/hooks/expenses/expenseFileDelete";
import { useProjectExpensesRefresh } from "@/hooks/project/RefreshProjectHook";

type FileItem = {
  id: string | number;
  name?: string;
  display_name?: string;
  original_filename?: string;
  filename?: string;
  file_name?: string;
  url?: string;
  type?: string;
  content_type?: string;
  created_at?: string;
};

type SortType = "az" | "new";

type Props = {
  files: FileItem[];
  onFilePress?: (file: FileItem) => void;
};

const FILE_TYPE_META = {
  pdf: {
    label: "PDF",
    color: "#dc3545",
    icon: "file-pdf",
  },
  excel: {
    label: "Excel",
    color: "#198754",
    icon: "file-excel",
  },
  word: {
    label: "Word",
    color: "#0d6efd",
    icon: "file-word",
  },
  image: {
    label: "Изображения",
    color: "#6f42c1",
    icon: "file-image",
  },
  archive: {
    label: "Архивы",
    color: "#fd7e14",
    icon: "file-zipper",
  },
  other: {
    label: "Прочее",
    color: "#6c757d",
    icon: "file",
  },
};

export default function ProjectFilesScreen() {
  const { deleteSectionFile } = useDeleteSectionFile();
  const { deleteExpenseFile } = useDeleteExpenseFile();

  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const projectId = params.projectId;
  const expenseId = params.expenseId;
  const typeOfList = params.typeOfList;

  const { refreshing, refreshProjectExpenses } = useProjectExpensesRefresh({
    projectId: String(params.projectId),
    sectionId: params.sectionId ? String(params.sectionId) : undefined,
  });

  const storeFiles = useDataUserStore((state) => state.filesToOpen);

  const [files, setFiles] = useState<FileItem[]>(storeFiles || []);

  useEffect(() => {
    setFiles(storeFiles || []);
  }, [storeFiles]);

  const isDark = colorScheme === "dark";

  const onFilePress = (file: any) => {
    router.push({
      pathname: "/inner_pages/pdf_viewer",
      params: {
        file: JSON.stringify(file),
        projectId: projectId,
        expenseId: expenseId,
      },
    });
  };

  const [sortMap, setSortMap] = useState<Record<string, SortType>>({
    pdf: "new",
    excel: "new",
    word: "new",
    image: "new",
    archive: "new",
    other: "new",
  });

  const handleDeleteSectionFile = async (fileId: string) => {
    if (!params?.projectId || !params?.sectionId) {
      Alert.alert("Ошибка", "Не удалось определить раздел для удаления файла");
      return;
    }

    const res = await deleteSectionFile(
      params.projectId,
      params.sectionId,
      fileId,
    );

    if (res) {
      setFiles((prev) =>
        prev.filter((file) => String(file.id) !== String(fileId)),
      );
    }
  };

  const deleteExpenseFileFunc = async (
    expenseId: string,
    file: FileItem,
    fileId: string,
  ) => {
    if (!params?.projectId) {
      Alert.alert("Ошибка", "Не удалось определить проект");
      return;
    }

    const res = await deleteExpenseFile(
      expenseId,
      params.projectId,
      fileId,
      getFileLabel(file),
    );

    if (res) {
      setFiles((prev) =>
        prev.filter((item) => String(item.id) !== String(fileId)),
      );
    }
  };

  const handleLongPress = (file: FileItem) => {
    if (typeOfList === "noDelete") {
      Alert.alert("Удаление недоступно", "Этот файл нельзя удалить");
      return;
    }

    if (typeOfList === "inExpense") {
      deleteExpenseFileFunc(String(expenseId), file, String(file.id));

      return;
    }

    if (typeOfList === "inSection") {
      Alert.alert("Удалить файл?", "Файл будет удалён из раздела", [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            handleDeleteSectionFile(String(file.id));
          },
        },
      ]);
      return;
    }

    // fallback на случай неизвестного typeOfList
    Alert.alert("Удалить файл?", "Вы уверены?", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive" },
    ]);
  };

  const groupedFiles = useMemo(() => {
    const groups: Record<string, FileItem[]> = {
      pdf: [],
      excel: [],
      word: [],
      image: [],
      archive: [],
      other: [],
    };

    files.forEach((file: any) => {
      const type = getFileType(file);

      groups[type].push(file);
    });

    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([key, items]) => {
        const sortType = sortMap[key];

        const sorted = [...items].sort((a, b) => {
          if (sortType === "az") {
            return getFileLabel(a).localeCompare(getFileLabel(b));
          }

          return (
            new Date(b.created_at || 0).getTime() -
            new Date(a.created_at || 0).getTime()
          );
        });

        return {
          key,
          title: FILE_TYPE_META[key as keyof typeof FILE_TYPE_META].label,
          color: FILE_TYPE_META[key as keyof typeof FILE_TYPE_META].color,
          icon: FILE_TYPE_META[key as keyof typeof FILE_TYPE_META].icon,
          data: sorted,
        };
      });
  }, [files, sortMap]);

  const toggleSort = (key: string) => {
    setSortMap((prev) => ({
      ...prev,
      [key]: prev[key] === "az" ? "new" : "az",
    }));
  };

  return (
    <ThemedView
      style={{
        flex: 1,
        paddingTop: insets.top,
        paddingHorizontal: Platform.OS === "ios" ? 20 : 14,
      }}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor:
                colorScheme === "dark"
                  ? "rgba(242,242,242,0.04)"
                  : "rgba(0,0,0,0.04)",
            },
          ]}
          onPress={() => {
            refreshProjectExpenses();
            router.back();
          }}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colorScheme === "dark" ? "#f2f2f2" : "#000"}
          />
        </TouchableOpacity>
        {/*<ThemedText style={styles.headerTitle}>Проекты</ThemedText>*/}
      </View>
      <SectionList
        sections={groupedFiles}
        keyExtractor={(item) => String(item.id)}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.content}
        renderSectionHeader={({ section }) => {
          const selectedSort = sortMap[section.key];

          return (
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleWrapper}>
                <View
                  style={[
                    styles.sectionIcon,
                    {
                      backgroundColor: `${section.color}20`,
                    },
                  ]}
                >
                  <FontAwesome6
                    name={section.icon as any}
                    size={16}
                    color={section.color}
                  />
                </View>

                <View>
                  <ThemedText style={styles.sectionTitle}>
                    {section.title}
                  </ThemedText>

                  <ThemedText
                    style={[
                      styles.sectionCount,
                      isDark && styles.sectionCountDark,
                    ]}
                  >
                    {section.data.length} файлов
                  </ThemedText>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleSort(section.key)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor:
                      selectedSort === "az"
                        ? `${section.color}20`
                        : isDark
                          ? "#1c1c1e"
                          : "#fff",

                    borderColor:
                      selectedSort === "az"
                        ? `${section.color}55`
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterChipText,
                    {
                      color:
                        selectedSort === "az"
                          ? section.color
                          : isDark
                            ? "#fff"
                            : "#333",
                    },
                  ]}
                >
                  {selectedSort === "az" ? "A → Я" : "Новые"}
                </ThemedText>
              </TouchableOpacity>
            </View>
          );
        }}
        renderItem={({ item }) => {
          const type = getFileType(item);

          const meta = FILE_TYPE_META[type as keyof typeof FILE_TYPE_META];

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onLongPress={() => handleLongPress(item)}
              onPress={() => onFilePress(item)}
              style={[
                styles.fileCard,
                {
                  backgroundColor: isDark ? "#1c1c1e" : "#fff",
                  borderColor: isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              <View
                style={[
                  styles.fileIconWrapper,
                  {
                    backgroundColor: `${meta.color}18`,
                  },
                ]}
              >
                <FontAwesome6
                  name={meta.icon as any}
                  size={24}
                  color={meta.color}
                />
              </View>

              <View style={styles.fileInfo}>
                <ThemedText numberOfLines={1} style={styles.fileName}>
                  {getFileLabel(item)}
                </ThemedText>

                <ThemedText
                  style={[styles.fileMeta, isDark && styles.fileMetaDark]}
                >
                  {meta.label}
                </ThemedText>
              </View>

              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={isDark ? "#666" : "#999"}
              />
            </TouchableOpacity>
          );
        }}
      />
    </ThemedView>
  );
}

function getFileLabel(file: FileItem) {
  return (
    file.display_name ||
    file.original_filename ||
    file.filename ||
    file.file_name ||
    file.name ||
    "Файл"
  );
}

function getFileType(file: FileItem) {
  const type = (file.type || file.content_type || "").toLowerCase();

  if (type.includes("pdf")) return "pdf";

  if (type.includes("excel") || type.includes("sheet")) return "excel";

  if (type.includes("word") || type.includes("document")) return "word";

  if (type.includes("image")) return "image";

  if (type.includes("zip") || type.includes("rar")) return "archive";

  return "other";
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingBottom: 40,
    gap: 18,
  },

  sectionHeader: {
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  header: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    height: 40,
    width: 40,
  },

  sectionTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },

  sectionCount: {
    marginTop: 2,
    fontSize: 12,
    color: "#666",
  },

  sectionCountDark: {
    color: "#888",
  },

  fileCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  fileIconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  fileInfo: {
    flex: 1,
    marginLeft: 14,
  },

  fileName: {
    fontSize: 15,
    fontWeight: "700",
  },

  fileMeta: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },

  fileMetaDark: {
    color: "#888",
  },

  filterChip: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  filterChipText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
