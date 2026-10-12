import Pdf from "react-native-pdf";
import {
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  View,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useDownloadProjectFile } from "@/hooks/project/fileGetHook";

function isImage(url: string, fileName?: string) {
  const ext = (fileName || url).toLowerCase();
  return (
    ext.includes(".png") ||
    ext.includes(".jpg") ||
    ext.includes(".jpeg") ||
    ext.includes(".webp") ||
    ext.includes(".heic")
  );
}

function isPdf(url: string, fileName?: string) {
  const ext = (fileName || url).toLowerCase();
  return ext.includes(".pdf");
}

function getShareMeta(fileName?: string) {
  const lower = (fileName || "").toLowerCase();

  if (lower.endsWith(".docx")) {
    return {
      UTI: "org.openxmlformats.wordprocessingml.document",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      label: "Word",
    };
  }

  if (lower.endsWith(".doc")) {
    return {
      UTI: "com.microsoft.word.doc",
      mimeType: "application/msword",
      label: "Word",
    };
  }

  if (lower.endsWith(".xlsx")) {
    return {
      UTI: "org.openxmlformats.spreadsheetml.sheet",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      label: "Excel",
    };
  }

  if (lower.endsWith(".xls")) {
    return {
      UTI: "com.microsoft.excel.xls",
      mimeType: "application/vnd.ms-excel",
      label: "Excel",
    };
  }

  return {
    UTI: "public.data",
    mimeType: "application/octet-stream",
    label: "файл",
  };
}

export default function PdfViewer() {
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharePromptShown, setSharePromptShown] = useState(false);

  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const { downloadFile } = useDownloadProjectFile();

  const file_data = JSON.parse(params.file as any);
  const projectId = params?.projectId;
  const sectionId = params?.sectionId;
  const expenseId = params?.expenseId;

  const fileName =
    file_data.display_name || file_data.original_filename || "file";

  const handleDownload = async () => {
    try {
      setLoading(true);

      const res = await downloadFile(
        projectId,
        file_data.id,
        fileName,
        // @ts-ignore
        sectionId,
        expenseId,
      );

      if (res) {
        setFileUri(res);
      }
    } catch (e) {
      console.log("DOWNLOAD SCREEN ERROR:", e);
    } finally {
      setLoading(false);
    }
  };

  const getSharingModule = () => {
    try {
      return require("expo-sharing");
    } catch (error) {
      console.log("Sharing module unavailable:", error);
      return null;
    }
  };

  const openWithSystemShare = async (uri: string, currentFileName: string) => {
    const Sharing = getSharingModule();
    const { label, ...shareMeta } = getShareMeta(currentFileName);

    if (!Sharing || !(await Sharing.isAvailableAsync())) {
      Alert.alert(
        "Файл загружен",
        `${label}-файл сохранён в память приложения. Открытие через системное меню сейчас недоступно в этом билде.`,
      );
      return;
    }

    await Sharing.shareAsync(uri, shareMeta);
  };

  useEffect(() => {
    handleDownload();
  }, []);

  useEffect(() => {
    const openShare = async () => {
      if (!fileUri || loading || sharePromptShown) {
        return;
      }

      if (isPdf(fileUri, fileName) || isImage(fileUri, fileName)) {
        return;
      }

      setSharePromptShown(true);

      try {
        await openWithSystemShare(fileUri, fileName);
      } catch (error) {
        console.log("SHARE FILE ERROR:", error);
        Alert.alert("Ошибка", "Не удалось открыть файл");
      }
    };

    openShare();
  }, [fileUri, fileName, loading, sharePromptShown]);

  const renderContent = () => {
    if (!fileUri) return null;

    // IMAGE
    if (isImage(fileUri, fileName)) {
      return (
        <Image
          source={{ uri: fileUri }}
          style={styles.image}
          resizeMode="contain"
        />
      );
    }

    // PDF
    if (isPdf(fileUri, fileName)) {
      return (
        <Pdf
          enableDoubleTapZoom
          source={{ uri: fileUri, cache: true }}
          style={styles.pdf}
          enablePaging={false}
          horizontal={false}
          spacing={10}
        />
      );
    }

    // fallback
    const { label } = getShareMeta(fileName);

    return (
      <View style={styles.fallback}>
        <Ionicons name="document-outline" size={40} color="#8E8E93" />
        <ThemedText style={styles.fallbackTitle}>
          {label}-файл загружен
        </ThemedText>
        <ThemedText style={styles.fallbackText}>
          Если окно не открылось автоматически, нажми ниже.
        </ThemedText>
        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.openButton}
          onPress={async () => {
            try {
              await openWithSystemShare(fileUri, fileName);
            } catch (error) {
              console.log("MANUAL SHARE FILE ERROR:", error);
              Alert.alert("Ошибка", "Не удалось открыть файл");
            }
          }}
        >
          <ThemedText style={styles.openButtonText}>Открыть файл</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={[styles.container, { marginTop: insets.top + 10 }]}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color="#007AFF" />
      </TouchableOpacity>

      {loading && (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      )}

      {!loading && renderContent()}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  image: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  fallback: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },

  fallbackTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
  },

  fallbackText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.7,
    textAlign: "center",
  },

  openButton: {
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#0d6efd",
  },

  openButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },

  loader: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
    zIndex: 10,
  },

  backButton: {
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    borderRadius: 20,
    height: 40,
    width: 40,
    left: 10,
    top: 10,
    zIndex: 20,
  },
});
