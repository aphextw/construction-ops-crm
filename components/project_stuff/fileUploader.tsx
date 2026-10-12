import React, { useMemo, useState } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { router } from "expo-router";
import { file } from "@babel/types";
import { useDataUserStore } from "@/store/useStore";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FileItem = any;
//   id: string | number;
//   name?: string;
//   display_name?: string;
//   original_filename?: string;
//   filename?: string;
//   file_name?: string;
//   url?: string;
//   type?: string;
//   content_type?: string;
// };

type FileListProps = {
  files?: FileItem[];
  onUpload: () => void;
  onFilePress?: (file: FileItem) => void;
  onFileLongPress?: (file: FileItem) => void;
  showFileNames?: boolean;
  maxHeight?: number;
  title?: boolean;
  emptyMessage?: string;
  ids?: any;
  idsForSection?: any;
  typeOfList?: string;
};

export function FileList({
  files = [],
  onUpload,
  onFilePress,
  onFileLongPress,
  showFileNames = false,
  emptyMessage = "Нет файлов",
  title,
  maxHeight,
  ids,
  idsForSection,
  typeOfList = "noDelete",
}: FileListProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const setFilesToOpen = useDataUserStore((state) => state.setFilesToOpen);

  const handleToggleExpand = () => {
    setFilesToOpen(files);

    if (typeOfList === "inSection") {
      router.push({
        pathname: "../inner_pages/organized_files",
        params: {
          projectId: idsForSection?.[0],
          sectionId: idsForSection?.[1],
          typeOfList: typeOfList,
        },
      });
    }

    if (typeOfList === "inExpense") {
      router.push({
        pathname: "../inner_pages/organized_files",
        params: {
          projectId: ids?.[0],
          expenseId: ids?.[1],
          typeOfList: typeOfList,
        },
      });
    }

    if (typeOfList === "noDelete") {
      router.push({
        pathname: "../inner_pages/organized_files",
        params: {
          projectId: ids?.[0],
          typeOfList: typeOfList,
        },
      });
    }
  };

  const [expanded, setExpanded] = useState(false);

  const getFileLabel = (file: FileItem) =>
    file.display_name ||
    file.original_filename ||
    file.filename ||
    file.file_name ||
    file.name ||
    "Файл";

  const handleFilePress = (file: FileItem) => {
    if (onFilePress) {
      onFilePress(file);
    } else {
      console.log("File pressed:", file);
    }
  };

  const visibleFiles = useMemo(() => {
    if (expanded) return files;
    return files.slice(0, 2);
  }, [expanded, files]);

  const uploadButtonStyle = [styles.fileButton, styles.uploadButton];

  const fileButtonStyle = [styles.fileButton, isDark && styles.fileButtonDark];

  const fileNameStyle = [styles.fileName, isDark && styles.fileNameDark];

  const emptyTextStyle = [styles.emptyText, isDark && styles.emptyTextDark];

  return (
    // @ts-ignore
    <View style={[styles.container, maxHeight && { maxHeight }]}>
      {title && <ThemedText style={styles.title}>Проект</ThemedText>}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Upload */}
        <TouchableOpacity
          onPress={onUpload}
          activeOpacity={0.7}
          style={uploadButtonStyle}
        >
          <MaterialCommunityIcons
            name="file-plus-outline"
            size={32}
            color="rgba(13,110,253,0.9)"
          />

          {showFileNames && (
            <ThemedText style={styles.uploadText}>Добавить</ThemedText>
          )}
        </TouchableOpacity>

        {/* Files */}
        {visibleFiles.map((file) => (
          <TouchableOpacity
            key={String(file.id)}
            onPress={() => handleFilePress(file)}
            onLongPress={() => onFileLongPress?.(file)}
            activeOpacity={0.7}
            style={fileButtonStyle}
          >
            <FontAwesome6
              name={getFileIcon(file.type || file.content_type)}
              size={30}
              color={isDark ? "#8E8E93" : "#A9A9A9"}
            />

            {showFileNames && (
              <ThemedText numberOfLines={1} style={fileNameStyle}>
                {getFileLabel(file)}
              </ThemedText>
            )}
          </TouchableOpacity>
        ))}

        {/* Show all button */}
        {files.length > 2 && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleToggleExpand}
            style={[styles.showMoreButton, isDark && styles.showMoreButtonDark]}
          >
            <MaterialCommunityIcons
              name={expanded ? "chevron-left" : "dots-horizontal"}
              size={24}
              color={isDark ? "#fff" : "#333"}
            />

            <ThemedText
              style={[styles.showMoreText, isDark && styles.showMoreTextDark]}
            >
              {`Все (${files.length - 2})`}
            </ThemedText>
          </TouchableOpacity>
        )}

        {/* Empty */}
        {files.length === 0 && !showFileNames && (
          <View style={styles.emptyContainer}>
            <ThemedText style={emptyTextStyle}>{emptyMessage}</ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getFileIcon(type?: string): keyof typeof FontAwesome6.glyphMap {
  if (!type) return "file";

  const lowerType = type.toLowerCase();

  if (lowerType.includes("pdf")) return "file-pdf";

  if (lowerType.includes("image")) return "file-image";

  if (lowerType.includes("word") || lowerType.includes("document"))
    return "file-word";

  if (lowerType.includes("excel") || lowerType.includes("sheet"))
    return "file-excel";

  if (lowerType.includes("zip") || lowerType.includes("rar"))
    return "file-zipper";

  return "file";
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },

  title: {
    fontSize: 16,
    fontWeight: "600",
    opacity: 0.8,
    marginBottom: 10,
  },

  scrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 2,
  },

  fileButton: {
    justifyContent: "center",
    alignItems: "center",
    height: 78,
    width: 72,
    padding: 6,
    borderColor: "rgba(113,113,113,0.58)",
    borderRadius: 14,
    borderWidth: 1.5,
  },

  fileButtonDark: {
    borderColor: "#3A3A3C",
    backgroundColor: "#1C1C1E",
  },

  uploadButton: {
    borderColor: "rgba(13,110,253,0.4)",
    backgroundColor: "rgba(13,110,253,0.08)",
  },

  uploadText: {
    fontSize: 11,
    color: "rgba(13,110,253,0.9)",
    fontWeight: "500",
    marginTop: 4,
  },

  fileName: {
    fontSize: 11,
    fontWeight: "500",
    marginTop: 6,
  },

  fileNameDark: {
    color: "#fff",
  },

  showMoreButton: {
    height: 78,
    minWidth: 72,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },

  showMoreButtonDark: {
    backgroundColor: "#1C1C1E",
    borderColor: "#3A3A3C",
  },

  showMoreText: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "600",
    color: "#333",
  },

  showMoreTextDark: {
    color: "#fff",
  },

  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },

  emptyText: {
    fontSize: 14,
    color: "#8E8E93",
  },

  emptyTextDark: {
    color: "#98989D",
  },
});
