import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Bar, CartesianChart } from "victory-native";
import { LinearGradient, useFont, vec } from "@shopify/react-native-skia";
import { Inter_400Regular } from "@expo-google-fonts/inter";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Layout } from "@/constants/theme";
import { useGetProjects } from "@/hooks/getProjects";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useUsers } from "@/hooks/useUsers";
import { ScreenHeading, WorkspaceTabs, useWorkspaceTheme } from "@/components/ui/workspace";
import { BUDGET_MONTHS, useBudgetAnalytics } from "@/hooks/analytics/useBudgetAnalytics";

type TabId = "budget" | "employees";

type ProjectExpense = {
  id: string;
  line_total?: string;
  actual_line_total?: string | null;
  created_at?: string;
  paid_at?: string | null;
  updated_at?: string;
};

type ProjectParticipant = {
  id: string;
  full_name: string;
  email?: string;
  rating?: number;
  role?: {
    code?: string;
    display_name?: string;
  };
  last_activity_at?: string;
};

type ProjectWorker = {
  id: string;
  full_name: string;
  position?: string;
};

type AnalyticsProject = {
  id: string;
  name: string;
  created_at?: string;
  total_materials_cost?: string;
  planned_materials_cost?: string;
  actual_materials_cost?: string;
  material_expenses?: ProjectExpense[];
  participants?: ProjectParticipant[];
  workers?: ProjectWorker[];
};

type EmployeeSummary = {
  id: string;
  full_name: string;
  role_name: string;
  rating: number;
  projectsCount: number;
  last_activity_at?: string;
};

const formatCompactCurrency = (value: number) => {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(".0", "")} млн`;
  }

  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} тыс`;
  }

  return value.toLocaleString("ru-RU");
};

const formatDate = (value?: string) => {
  if (!value) {
    return "Нет активности";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Нет активности";
  }

  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
  });
};

export default function AnalyticsScreen() {
  const theme = useWorkspaceTheme();
  const [tab, setTab] = useState<TabId>("budget");
  const { getUsers } = useUsers();
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const { projects, loading, getProjects } = useGetProjects();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const font = useFont(Inter_400Regular, 12);
  const isDarkTheme = colorScheme === "dark";

  const segmentBg = isDarkTheme ? "#2c2c2e" : "#e5e5ea";
  const segmentActive = Colors[isDarkTheme ? "light" : "dark"].dop;
  const segmentInactiveText = isDarkTheme ? "#ebebf5" : "#11181C";

  const analyticsProjects = useMemo(
    () => (projects as AnalyticsProject[]) || [],
    [projects],
  );

  const { data: budgetData, totals: budgetTotals } = useBudgetAnalytics(analyticsProjects, new Date().getFullYear());

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await getUsers();
      if (res) {
        setUsers(res);
      }
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const maxSpend = useMemo(
    () => Math.max(...budgetData.map((d) => d.spend), 1),
    [budgetData],
  );

  const employeeAnalytics = useMemo(() => {
    if (!users?.length) {
      return {
        participants: [],
        roleBreakdown: [],
        totalParticipants: 0,
        totalWorkers: 0,
        averageRating: 0,
      };
    }

    const roleCountMap = new Map<string, number>();

    const participants: EmployeeSummary[] = users.map((user: any) => {
      const roleName = user.role?.display_name || "Без роли";

      roleCountMap.set(roleName, (roleCountMap.get(roleName) || 0) + 1);

      return {
        id: user.id,
        full_name: user.full_name,
        role_name: roleName,
        rating: user.rating || 0,
        projectsCount: user.projects_count || 0,
        last_activity_at: user.last_activity_at,
      };
    });

    const sortedParticipants = participants.sort((a, b) => {
      if (b.projectsCount !== a.projectsCount) {
        return b.projectsCount - a.projectsCount;
      }
      return b.rating - a.rating;
    });

    const roleBreakdown = [...roleCountMap.entries()]
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 4);

    const averageRating =
      participants.reduce((sum, u) => sum + u.rating, 0) / participants.length;

    const uniqueWorkers = new Map<string, ProjectWorker>();

    analyticsProjects.forEach((project) => {
      project.workers?.forEach((worker) => {
        if (!worker?.id) {
          return;
        }

        uniqueWorkers.set(worker.id, worker);
      });
    });

    return {
      participants: sortedParticipants,
      roleBreakdown,
      totalParticipants: participants.length,
      totalWorkers: uniqueWorkers.size,
      averageRating: Number.isFinite(averageRating) ? averageRating : 0,
    };
  }, [users, analyticsProjects]);

  const HandleRefresh = async () => {
    await Promise.all([getProjects(), fetchUsers()]);
  };

  // console.log(users.filter((user) => user.role.display_name === "Бригадир"));

  return (
    <ThemedView style={[styles.safe, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={HandleRefresh} />
        }
      >
        <ScreenHeading title="Аналитика" detail={`За ${new Date().getFullYear()} год`} />
        <WorkspaceTabs value={tab} onChange={setTab} options={[{ key: "budget", label: "Бюджет" }, { key: "employees", label: "Сотрудники" }]} />

        {tab === "budget" && (
          <View style={styles.section}>
            <View
              style={[
                styles.chartCard,
                {
                  backgroundColor: isDarkTheme ? "#1c1c1e" : "#fff",
                  borderColor: isDarkTheme ? "#3a3a3c" : "#e0e0e0",
                },
              ]}
            >
              <View style={styles.cardHeader}>
                <View>
                  <ThemedText style={styles.cardTitle}>
                    Оплаты по месяцам
                  </ThemedText>
                </View>
              </View>

              <View style={styles.chartInner}>
                {font ? (
                  <CartesianChart
                    data={budgetData}
                    xKey="monthIndex"
                    yKeys={["spend"]}
                    padding={10}
                    domain={{ y: [0, maxSpend * 1.08], x: [1, 12] }}
                    domainPadding={{ left: 26, right: 26, top: 12 }}
                    axisOptions={{
                      font,
                      tickCount: { x: 6, y: 4 },
                      labelColor: theme.secondary,
                      lineColor: theme.border,
                      formatXLabel: (value) => BUDGET_MONTHS[Number(value) - 1] ?? "",
                      formatYLabel: (value) => {
                        const v =
                          typeof value === "number" ? value : Number(value);
                        if (!Number.isFinite(v)) return "";
                        return v >= 1000
                          ? `${Math.round(v / 1000)} т`
                          : `${Math.round(v)}`;
                      },
                    }}
                  >
                    {({ points, chartBounds }) => (
                      <Bar
                        chartBounds={chartBounds}
                        points={points.spend}
                        barWidth={12}
                        color={theme.primary}
                        animate={{
                          type: "timing",
                          duration: 800,
                        }}
                        roundedCorners={{
                          topLeft: 4,
                          topRight: 4,
                        }}
                      />
                    )}
                  </CartesianChart>
                ) : (
                  <View style={styles.chartLoading}>
                    <ActivityIndicator size="small" color="#007AFF" />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.summaryGrid}>
              <MetricCard
                isDarkTheme={isDarkTheme}
                icon="wallet-outline"
                label="Оплачено за год"
                value={`${formatCompactCurrency(budgetTotals.spend)} ₽`}
              />
              <MetricCard
                isDarkTheme={isDarkTheme}
                icon="receipt-outline"
                label="План"
                value={`${formatCompactCurrency(budgetTotals.planned)} ₽`}
              />
              <MetricCard
                isDarkTheme={isDarkTheme}
                icon="briefcase-outline"
                label="Проектов"
                value={String(analyticsProjects.length)}
              />
            </View>
          </View>
        )}

        {tab === "employees" && (
          <View style={styles.section}>
            <View style={styles.summaryGrid}>
              <MetricCard
                isDarkTheme={isDarkTheme}
                icon="people-outline"
                label="Участников"
                value={String(employeeAnalytics.totalParticipants)}
              />
              <MetricCard
                isDarkTheme={isDarkTheme}
                icon="hammer-outline"
                label="Работников"
                value={String(employeeAnalytics.totalWorkers)}
              />
              <MetricCard
                isDarkTheme={isDarkTheme}
                icon="star-outline"
                label="Средний рейтинг"
                value={employeeAnalytics.averageRating.toFixed(1)}
              />
              <MetricCard
                isDarkTheme={isDarkTheme}
                icon="albums-outline"
                label="Активных проектов"
                value={String(analyticsProjects.length)}
              />
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDarkTheme ? "#1c1c1e" : "#fff",
                  borderColor: isDarkTheme ? "#3a3a3c" : "#e0e0e0",
                },
              ]}
            >
              <ThemedText style={styles.cardTitle}>Роли в проектах</ThemedText>
              <View style={styles.roleList}>
                {employeeAnalytics.roleBreakdown.length ? (
                  employeeAnalytics.roleBreakdown.map((item) => (
                    <View key={item.role} style={styles.roleRow}>
                      <ThemedText style={styles.roleName}>
                        {item.role}
                      </ThemedText>
                      <View style={styles.roleCountBadge}>
                        <ThemedText style={styles.roleCountText}>
                          {item.count}
                        </ThemedText>
                      </View>
                    </View>
                  ))
                ) : (
                  <ThemedText style={styles.hint}>
                    Пока нет данных по ролям участников.
                  </ThemedText>
                )}
              </View>
            </View>

            <View
              style={[
                styles.infoCard,
                {
                  backgroundColor: isDarkTheme ? "#1c1c1e" : "#fff",
                  borderColor: isDarkTheme ? "#3a3a3c" : "#e0e0e0",
                },
              ]}
            >
              <ThemedText style={styles.cardTitle}>
                Самые вовлечённые участники
              </ThemedText>

              <View style={styles.employeeList}>
                {employeeAnalytics.participants.length ? (
                  employeeAnalytics.participants.slice(0, 6).map((item) => (
                    <View key={item.id} style={styles.employeeRow}>
                      <View style={styles.employeeMeta}>
                        <ThemedText style={styles.employeeName}>
                          {item.full_name}
                        </ThemedText>
                        <ThemedText style={styles.employeeSub}>
                          {item.role_name} · {item.projectsCount} проект(ов)
                        </ThemedText>
                      </View>

                      <View style={styles.employeeRight}>
                        <ThemedText style={styles.employeeRating}>
                          {item.rating}
                        </ThemedText>
                        <ThemedText style={styles.employeeDate}>
                          {formatDate(item.last_activity_at)}
                        </ThemedText>
                      </View>
                    </View>
                  ))
                ) : (
                  <ThemedText style={styles.hint}>
                    Пока нет данных по участникам проектов.
                  </ThemedText>
                )}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

function MetricCard({
  isDarkTheme,
  icon,
  label,
  value,
}: {
  isDarkTheme: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        {
          backgroundColor: isDarkTheme ? "#1c1c1e" : "#fff",
          borderColor: isDarkTheme ? "#3a3a3c" : "#e0e0e0",
        },
      ]}
    >
      <ThemedText style={[styles.metricLabel, { flex: 1, color: isDarkTheme ? Colors.dark.secondary : Colors.light.secondary }]}>{label}</ThemedText>
      <ThemedText
        style={[styles.metricValue, { flexShrink: 1 }]}
        numberOfLines={0}
      >
        {value}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.gutter,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 20,
  },
  segmentWrap: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  segmentActive: {},
  segmentPressed: {
    opacity: 0.85,
  },
  segmentLabel: {
    fontSize: 16,
    fontWeight: "bold",
  },
  section: {
    gap: 14,
  },
  summaryGrid: {
    gap: 0,
    borderRadius: 12,
    overflow: "hidden",
  },
  metricCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    padding: 16,
    minHeight: 56,
    gap: 16,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(0,122,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  metricLabel: {
    fontSize: 17,
    color: "#8E8E93",
  },
  metricValue: {
    fontSize: 17,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  chartCard: {
    borderRadius: 12,
    overflow: "hidden",
    padding: 16,
  },
  cardHeader: {
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  hint: {
    opacity: 0.7,
    fontSize: 13,
    lineHeight: 20,
  },
  chartInner: {
    height: 280,
    width: "100%",
  },
  chartLoading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  infoCard: {
    borderRadius: 12,
    padding: 16,
  },
  roleList: {
    gap: 10,
    marginTop: 10,
  },
  roleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  roleName: {
    fontSize: 15,
    fontWeight: "600",
    flex: 1,
    paddingRight: 12,
  },
  roleCountBadge: {
    minWidth: 34,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,122,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  roleCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#007AFF",
  },
  employeeList: {
    gap: 12,
    marginTop: 10,
  },
  employeeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  employeeMeta: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  employeeName: {
    fontSize: 15,
    fontWeight: "700",
  },
  employeeSub: {
    fontSize: 13,
    color: "#8E8E93",
  },
  employeeRight: {
    alignItems: "flex-end",
    gap: 2,
  },
  employeeRating: {
    fontSize: 16,
    fontWeight: "800",
  },
  employeeDate: {
    fontSize: 12,
    color: "#8E8E93",
  },
});
