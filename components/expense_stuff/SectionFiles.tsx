import {
  TouchableOpacity,
  StyleSheet,
  View,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
} from "react-native";
import { ThemedText } from "@/components/themed-text";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { FileList } from "@/components/project_stuff/fileUploader";
import { useDeleteSectionFile } from "@/hooks/section/SectionFileDelete";
import { Colors } from "@/constants/theme";

interface SectionFilesProps {
  files?: any[];
  loading?: boolean;
  onUpload?: any;
  onFilePress?: (item: any) => void;
  onRefresh?: () => Promise<void> | void;
  colorScheme?: "dark" | "light" | undefined | null;
  label?: string;
  emptyMessage?: string;
  params: any;
}

if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

export function SectionFiles({
  files = [],
  loading,
  onUpload,
  onFilePress,
  onRefresh,
  colorScheme,
  label,
  emptyMessage,
  params,
}: SectionFilesProps) {
  const [closed, setClosed] = useState(true);
  const { deleteSectionFile } = useDeleteSectionFile();

  const toggle = () => {
    LayoutAnimation.easeInEaseOut();
    setClosed((prev) => !prev);
  };

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
      await onRefresh?.();
    }
  };

  return (
    <View style={[styles.wrapper, { paddingBottom: closed ? 0 : 15 }]}>
      {/* HEADER */}
      <TouchableOpacity onPress={toggle} style={styles.header}>
        <ThemedText style={styles.sectionLabel}>{label || "Файлы"}</ThemedText>

        <Ionicons
          name={closed ? "chevron-down" : "chevron-up"}
          size={23}
          color="#8E8E93"
        />
      </TouchableOpacity>

      {/* CONTENT */}
      {!closed && (
        <View
          style={[
            styles.container,
            {
              backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
            },
          ]}
        >
          {loading ? (
            <ThemedText>Загрузка...</ThemedText>
          ) : (
            <FileList
              idsForSection={[params.projectId, params.sectionId]}
              typeOfList={"inSection"}
              files={files}
              onUpload={onUpload}
              onFilePress={onFilePress}
              showFileNames
              onFileLongPress={(file: any) =>
                Alert.alert(
                  file.display_name || file.original_filename || "Файл",
                  "Выберите действие",
                  [
                    {
                      text: "Удалить",
                      style: "destructive",
                      onPress: () => {
                        handleDeleteSectionFile(String(file.id));
                      },
                    },
                    { text: "Отмена", style: "cancel" },
                  ],
                )
              }
              emptyMessage={emptyMessage || "Файлы не прикреплены"}
            />
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 15,
    marginHorizontal: 21,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  sectionLabel: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.7,
  },

  container: {
    justifyContent: "center",
    paddingHorizontal: 16,
    alignItems: "center",
    borderRadius: 20,
    minHeight: 120,
    maxHeight: 250,
  },
});
