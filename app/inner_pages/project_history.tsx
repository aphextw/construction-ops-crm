import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import {
  ProjectHistoryItem,
  useProjectHistory,
} from "@/hooks/project/useProjectHistory";
import {
  getProjectHistoryActionLabel,
  getProjectHistorySummaryLines,
} from "@/utils/projectHistory";

export default function ProjectHistoryPage() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ projectId?: string; projectName?: string }>();
  const [history, setHistory] = useState<ProjectHistoryItem[]>([]);

  const { loadingProjectHistory, listProjectHistory, projectHistoryError } =
    useProjectHistory();

  const formatHistoryDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const loadHistory = useCallback(async () => {
    if (!params.projectId) {
      return;
    }

    const items = await listProjectHistory(String(params.projectId));
    setHistory(items);
  }, [listProjectHistory, params.projectId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          backgroundColor: colorScheme === "dark" ? "#000" : "#f5f6f8",
        },
      ]}
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
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color={colorScheme === "dark" ? "#f2f2f2" : "#000"}
          />
        </TouchableOpacity>

        <View style={styles.headerText}>
          <ThemedText style={styles.title}>История проекта</ThemedText>
          {params.projectName ? (
            <ThemedText style={styles.subtitle}>{params.projectName}</ThemedText>
          ) : null}
        </View>

        <View style={styles.backButtonPlaceholder} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={loadingProjectHistory} onRefresh={loadHistory} />
        }
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {loadingProjectHistory && !history.length ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={styles.hint}>Загружаем историю проекта</ThemedText>
          </View>
        ) : projectHistoryError && !history.length ? (
          <View style={styles.centerState}>
            <Ionicons name="alert-circle-outline" size={22} color="#ff5a5f" />
            <ThemedText style={styles.hint}>{projectHistoryError}</ThemedText>
          </View>
        ) : history.length ? (
          history.map((item) => {
            const summaryLines = getProjectHistorySummaryLines(item);

            return (
              <View
                key={item.id}
                style={[
                  styles.historyCard,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1c1c1e" : "#fff",
                  },
                ]}
              >
                <View style={styles.historyHeader}>
                  <View style={styles.historyTitleWrap}>
                    <ThemedText style={styles.historyTitle}>
                      {getProjectHistoryActionLabel(item.action)}
                    </ThemedText>
                    <ThemedText style={styles.historyMeta}>
                      {item.changed_by?.full_name || "Системное изменение"}
                    </ThemedText>
                  </View>

                  <View style={styles.historyDateWrap}>
                    <Feather name="clock" size={14} color="#8E8E93" />
                    <ThemedText style={styles.historyDate}>
                      {formatHistoryDate(item.created_at)}
                    </ThemedText>
                  </View>
                </View>

                {summaryLines.length ? (
                  <View style={styles.historySummaryList}>
                    {summaryLines.map((line, index) => (
                      <ThemedText
                        key={`${item.id}-summary-${index}`}
                        style={styles.historySummaryText}
                      >
                        {line}
                      </ThemedText>
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })
        ) : (
          <View style={styles.centerState}>
            <Ionicons name="time-outline" size={22} color="#8E8E93" />
            <ThemedText style={styles.hint}>
              История изменений пока пуста
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerText: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8E8E93",
    textAlign: "center",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    gap: 12,
  },
  centerState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 40,
  },
  hint: {
    fontSize: 14,
    color: "#8E8E93",
  },
  historyCard: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
  },
  historyTitleWrap: {
    flex: 1,
    gap: 6,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  historyMeta: {
    fontSize: 13,
    color: "#8E8E93",
  },
  historyDateWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 150,
  },
  historyDate: {
    fontSize: 12,
    color: "#8E8E93",
    textAlign: "right",
  },
  historySummaryList: {
    gap: 10,
  },
  historySummaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
