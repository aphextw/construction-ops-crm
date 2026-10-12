import {
  FlatList,
  Platform,
  StyleSheet,
  View,
  RefreshControl,
  TouchableOpacity,
  useColorScheme,
  TextInput,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  ScrollView,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { BottomSheet } from "react-native-sheet";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useDataUserStore } from "@/store/useStore";
import { ProjectForm } from "@/components/newProjectForm/newProjectForm";
import { useCreateProject } from "@/hooks/project/newProjectHook";
import {
  FontAwesome,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";
import { useCreateExpense } from "@/hooks/expenses/expenseAdd";

import SearchInput from "@/components/search_input/search_input";
import { useCheckAuth } from "@/hooks/accessToken";
import { api } from "@/hooks/api_client";
import { AuthInput } from "@/components/input/input";
import { Colors, Layout } from "@/constants/theme";
import {
  ScreenHeading,
  WorkspaceButton,
  EmptyState,
  LoadingRows,
  useWorkspaceTheme,
} from "@/components/ui/workspace";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { ProjectStatusBadge } from "@/components/project_stuff/projectStatusBadge";
import { PROJECT_STATUS_COLORS } from "@/constants/project-status";
import tapGestureHandler from "react-native-gesture-handler/src/web_hammer/TapGestureHandler";

const STORAGE_KEY = "projectsData";
const ALL_STATUSES_FILTER = "all";

const SORT_OPTIONS = {
  newest: "Новые",
  oldest: "Старые",
  name: "А-Я",
} as const;

type SortKey = keyof typeof SORT_OPTIONS;

const PROJECT_STATUS_META: Record<string, { label: string; color: string }> = {
  project_analysis: {
    label: "Анализ проекта",
    color: PROJECT_STATUS_COLORS.project_analysis.light,
  },
  preparing_material_list: {
    label: "Формирование списка",
    color: PROJECT_STATUS_COLORS.preparing_material_list.light,
  },
  preparing_work_schedule: {
    label: "Формирование графика",
    color: PROJECT_STATUS_COLORS.preparing_work_schedule.light,
  },
  preparing_contract: {
    label: "Подготовка договора",
    color: PROJECT_STATUS_COLORS.preparing_contract.light,
  },
  purchase_request: {
    label: "Заявка на закупку",
    color: PROJECT_STATUS_COLORS.purchase_request.light,
  },
  supply: {
    label: "В снабжении",
    color: PROJECT_STATUS_COLORS.supply.light,
  },
  delivery_confirmation: {
    label: "Поставка подтверждена",
    color: PROJECT_STATUS_COLORS.delivery_confirmation.light,
  },
};

export default function ConstructionSitesScreen() {
  const theme = useWorkspaceTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [projectLoadError, setProjectLoadError] = useState<string | null>(null);
  const bottomSheetRef = useRef<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUSES_FILTER);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  // const [shouldRefresh, setShouldRefresh] = useState<boolean>(false);
  const [user, setUser] = useState<Record<string, any>>({});
  const newProjectRef = useRef<boolean>(false);

  // const { createExpense, loadingAdd } = useCreateExpense();

  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const { createProject, loading } = useCreateProject();

  const setProjectToOpen = useDataUserStore((state) => state.setProjectToOpen);

  // const [projects, setProjects] = useState<any[]>([]);
  const setProjects = useDataUserStore((state) => state.setProjects);
  const projects = useDataUserStore((state) => state.projects);

  const pendingApproval = user?.status === "pending";

  // console.log(params);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        if (pendingApproval) {
          setProjects([]);
          await AsyncStorage.removeItem(STORAGE_KEY);
          return;
        }

        const saved = await AsyncStorage.getItem("projectsData");

        if (saved === null) {
          await fetchProjects();
        }

        if (saved) {
          const parsed = JSON.parse(saved);
          setProjects(parsed);
        }
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
      } finally {
        setLoadingProjects(false);
      }
    };

    loadProjects();
  }, [pendingApproval]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const saved = await AsyncStorage.getItem("user");

        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);

          if (parsed?.status === "pending") {
            setProjects([]);
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
      }
    };

    loadProjects();
  }, []);

  const refreshCurrentUser = async () => {
    try {
      const response = await api.get("api/v1/me");
      const freshUser = response?.user ?? response;
      setUser(freshUser);
      await AsyncStorage.setItem("user", JSON.stringify(freshUser));
      return freshUser;
    } catch (error) {
      console.error("Ошибка при обновлении профиля:", error);
      return null;
    }
  };

  const fetchProjects = async (options?: { force?: boolean }) => {
    setLoadingProjects(true);
    setProjectLoadError(null);
    try {
      if (pendingApproval && !options?.force) {
        setProjects([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }

      const token = await SecureStore.getItem("access_token");

      if (!token) {
        console.log("Нет токена");
        return;
      }

      const response = api.get("api/v1/projects");

      const data = await response;

      setProjects(data.projects);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data.projects));
    } catch (err) {
      setProjectLoadError("Проверьте подключение и попробуйте снова.");
      console.error(
        "Ошибка загрузки:",
        err instanceof Error ? err.message : err,
      );
    } finally {
      setLoadingProjects(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);

    try {
      const freshUser = await refreshCurrentUser();
      const isPending = freshUser?.status === "pending";

      if (isPending) {
        setProjects([]);
        await AsyncStorage.removeItem(STORAGE_KEY);
        return;
      }

      await fetchProjects({ force: true });
    } finally {
      setRefreshing(false);
    }
  }, [pendingApproval]);

  useEffect(() => {
    const shouldRefresh = params.shouldRefresh === "true";

    if (shouldRefresh) {
      onRefresh().finally(() => router.setParams({ shouldRefresh: undefined }));
    }
  }, [params.shouldRefresh]);

  const handleCreateNewProject = async (item: any) => {
    if (newProjectRef.current) return;

    newProjectRef.current = true;

    try {
      const success = await createProject(item);

      if (success) {
        bottomSheetRef.current?.hide();
        await fetchProjects();
      }
    } catch (error) {
      console.error("Ошибка создания проекта:", error);
    } finally {
      newProjectRef.current = false;
    }
  };

  const role = user?.role?.code;
  const canCreateProject = [
    "director",
    "deputy_director",
    "site_manager",
    "developer",
    "estimator_plus",
    "pto",
  ].includes(role || "");

  const normalizeSearch = (value: string) =>
    value.toLowerCase().replace(/\s+/g, " ").replace(/ё/g, "е").trim();

  const pluralize = (value: number, one: string, few: string, many: string) => {
    const abs = Math.abs(value) % 100;
    const last = abs % 10;

    if (abs > 10 && abs < 20) {
      return many;
    }

    if (last === 1) {
      return one;
    }

    if (last >= 2 && last <= 4) {
      return few;
    }

    return many;
  };

  const filteredProjects = useMemo(() => {
    const query = normalizeSearch(searchQuery);
    const nextProjects = projects.filter((project: any) => {
      const statusMatches =
        statusFilter === ALL_STATUSES_FILTER ||
        project?.status === statusFilter;

      if (!statusMatches) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = normalizeSearch(
        [
          project?.name,
          project?.number,
          project?.object_code,
          project?.project_code,
          PROJECT_STATUS_META[project?.status]?.label,
        ]
          .filter(Boolean)
          .join(" "),
      );

      return haystack.includes(query);
    });

    return [...nextProjects].sort((a: any, b: any) => {
      if (sortKey === "oldest") {
        return (
          new Date(a?.created_at).getTime() - new Date(b?.created_at).getTime()
        );
      }

      if (sortKey === "name") {
        return String(a?.name || "").localeCompare(String(b?.name || ""), "ru");
      }

      return (
        new Date(b?.created_at).getTime() - new Date(a?.created_at).getTime()
      );
    });
  }, [projects, searchQuery, statusFilter, sortKey]);

  const filterOptions = [
    {
      key: ALL_STATUSES_FILTER,
      label: "Все",
      color: "#8E8E93",
    },
    ...Object.entries(PROJECT_STATUS_META).map(([key, meta]) => ({
      key,
      label: meta.label,
      color: meta.color,
    })),
  ];

  const cycleSort = () => {
    setSortKey((current) => {
      if (current === "newest") return "oldest";
      if (current === "oldest") return "name";
      return "newest";
    });
  };

  const renderItem = ({ item }: any) => {
    const statusMeta = PROJECT_STATUS_META[item.status];
    const showFinance =
      !!role && !role.includes("pto") && !role.includes("estimator_plus");
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={`Открыть объект ${item.name}`}
        onPress={() => {
          setProjectToOpen(item);
          router.push({ pathname: "/inner_pages/projectPage" });
        }}
        // todo
        style={[
          styles.projectRow,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        activeOpacity={0.75}
      >
        <View style={styles.topRow}>
          <ThemedText
            style={[styles.projectNumber, { color: theme.secondary }]}
          >
            № {item.number}
            {item.object_code ? ` · ${item.object_code}` : ""}
          </ThemedText>
          <Ionicons name="chevron-forward" size={18} color={theme.secondary} />
        </View>
        <ThemedText style={styles.title}>{item.name}</ThemedText>
        {statusMeta ? (
          <ProjectStatusBadge status={item.status} label={statusMeta.label} />
        ) : null}
        <View style={[styles.projectFooter, { borderTopColor: theme.border }]}>
          <ThemedText
            style={[styles.projectNumber, { color: theme.secondary }]}
          >
            {item.material_sections?.length || 0}{" "}
            {pluralize(
              item.material_sections?.length || 0,
              "раздел",
              "раздела",
              "разделов",
            )}
          </ThemedText>
          {showFinance ? (
            <ThemedText style={styles.rowCost}>
              {(Number(item.total_materials_cost) || 0).toLocaleString(
                "ru-RU",
                { maximumFractionDigits: 0 },
              )}{" "}
              ₽
            </ThemedText>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top + 0,
        },
      ]}
    >
      <KeyboardAvoidingView style={styles.container}>
        <View style={{ paddingHorizontal: Layout.gutter }}>
          <ScreenHeading
            title="Объекты"
            action={
              !pendingApproval && canCreateProject ? (
                <TouchableOpacity
                  accessibilityLabel="Создать объект"
                  accessibilityRole="button"
                  onPress={() => bottomSheetRef.current?.show()}
                  style={[
                    styles.navAction,
                    {
                      backgroundColor: theme.surface,
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <FontAwesome6 name="plus" size={24} color={theme.primary} />
                </TouchableOpacity>
              ) : undefined
            }
          />
          {!pendingApproval ? (
            <>
              <View style={styles.topControlsRow}>
                <View style={styles.searchInputInline}>
                  <SearchInput
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Название, номер или шифр"
                    colorScheme={colorScheme}
                  />
                </View>
                <TouchableOpacity
                  onPress={cycleSort}
                  activeOpacity={0.8}
                  accessibilityRole="button"
                  accessibilityLabel={`Сортировка: ${SORT_OPTIONS[sortKey]}`}
                  accessibilityHint="Нажмите, чтобы выбрать следующий порядок сортировки"
                  style={[
                    styles.sortPillButton,
                    {
                      backgroundColor: theme.surface,
                      borderColor:
                        colorScheme === "dark"
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(0,0,0,0.08)",
                    },
                  ]}
                >
                  <Ionicons
                    name="swap-vertical"
                    size={16}
                    color={theme.secondary}
                  />
                  <ThemedText style={styles.sortPillText}>
                    {SORT_OPTIONS[sortKey]}
                  </ThemedText>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScroll}
                style={{ marginBottom: 10 }}
              >
                {filterOptions.map((option) => {
                  const selected = statusFilter === option.key;
                  const color =
                    PROJECT_STATUS_COLORS[option.key]?.[
                      colorScheme === "dark" ? "dark" : "light"
                    ] ?? option.color;

                  return (
                    <TouchableOpacity
                      key={option.key}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      activeOpacity={0.8}
                      onPress={() => setStatusFilter(option.key)}
                      style={[
                        styles.filterChip,
                        {
                          backgroundColor: selected
                            ? `${color}20`
                            : theme.surface,
                          borderColor: selected
                            ? `${color}55`
                            : colorScheme === "dark"
                              ? "rgba(255,255,255,0.08)"
                              : "rgba(0,0,0,0.08)",
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.filterChipText,
                          { color: selected ? color : theme.secondary },
                        ]}
                      >
                        {option.label}
                      </ThemedText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : null}
        </View>

        {pendingApproval ? (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.pendingScrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            <View
              style={[
                styles.pendingCard,
                {
                  backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
                  marginHorizontal: Layout.gutter,
                },
              ]}
            >
              <ThemedText style={styles.pendingTitle}>
                Аккаунт ожидает подтверждения
              </ThemedText>
              <ThemedText style={styles.pendingText}>
                Ваш аккаунт ещё не подтверждён администратором.
              </ThemedText>
              <WorkspaceButton
                title="Проверить статус"
                icon="refresh"
                disabled={refreshing}
                onPress={onRefresh}
                secondary
              />
            </View>
          </ScrollView>
        ) : projects.length === 0 ? (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            style={{ flex: 1 }}
          >
            {loadingProjects ? (
              <View style={{ paddingHorizontal: Layout.gutter }}>
                <LoadingRows />
              </View>
            ) : projectLoadError ? (
              <EmptyState
                title="Не удалось загрузить объекты"
                detail={projectLoadError}
                action={
                  <WorkspaceButton
                    title="Повторить"
                    icon="refresh"
                    secondary
                    onPress={onRefresh}
                  />
                }
              />
            ) : (
              <EmptyState
                title="Нет объектов"
                detail={
                  canCreateProject
                    ? "Создайте первый объект."
                    : "Здесь появятся объекты, к которым вам предоставлен доступ."
                }
              />
            )}
          </ScrollView>
        ) : (
          <FlatList
            data={filteredProjects}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            ListHeaderComponent={
              projectLoadError ? (
                <View style={{ gap: 8, paddingVertical: 12 }}>
                  <ThemedText style={{ fontSize: 14, color: theme.secondary }}>
                    Не удалось обновить объекты. Показаны сохранённые данные.
                  </ThemedText>

                  <WorkspaceButton
                    title="Повторить обновление"
                    secondary
                    icon="refresh"
                    disabled={refreshing}
                    onPress={onRefresh}
                  />
                </View>
              ) : null
            }
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{
              gap: 12,
              paddingBottom: 20,
              paddingHorizontal: Layout.gutter,
            }}
            ListEmptyComponent={
              <View
                style={[
                  styles.emptySearchState,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#1c1c1e" : "#fff",
                  },
                ]}
              >
                <ThemedText style={styles.emptySearchTitle}>
                  Ничего не найдено
                </ThemedText>

                <ThemedText style={styles.emptySearchText}>
                  Попробуй поиск по названию, номеру или шифру проекта.
                </ThemedText>
              </View>
            }
          />
        )}

        {!pendingApproval && canCreateProject && (
          <BottomSheet
            ref={bottomSheetRef}
            height={Platform.OS === "ios" ? 750 : 850}
            sheetStyle={{
              backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
            }}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ProjectForm
                onSubmit={(item) => handleCreateNewProject(item)}
                onClose={() => bottomSheetRef.current.hide()}
              />
            </TouchableWithoutFeedback>
          </BottomSheet>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  navAction: {
    borderWidth: 1,
    borderRadius: 10,
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  listToolbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  toolbarAction: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexShrink: 1,
  },
  toolbarLabel: { fontSize: 13, fontWeight: "500", flexShrink: 1 },
  projectRow: { borderRadius: 12, padding: 16, gap: 6 },
  projectFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingTop: 12,
    marginTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rowCost: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  container: { flex: 1 },

  button: {
    borderColor: "rgba(142,142,147,0.6)",
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    borderRadius: 25,
    borderWidth: 1,
    bottom: 10,
    height: 62,
    right: 15,
    width: 62,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  pendingCard: {
    marginTop: 16,
    borderRadius: 22,
    padding: 20,
    gap: 10,
  },
  pendingScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-start",
    paddingBottom: 24,
  },
  pendingTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  pendingText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#8E8E93",
  },
  emptySearchState: {
    marginTop: 16,
    borderRadius: 22,
    padding: 20,
    gap: 10,
  },
  emptySearchTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  emptySearchText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#8E8E93",
  },
  topControlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 12,
  },
  searchInputInline: {
    flex: 1,
  },
  controlsRow: {
    gap: 8,
    marginTop: -4,
    marginBottom: 10,
  },
  filterScroll: {
    gap: 10,
    paddingVertical: 5,
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
  sortPillButton: {
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 12,
  },
  sortPillText: {
    fontSize: 13,
    fontWeight: "700",
  },

  header: {
    fontSize: 24,
    fontWeight: "900",
    marginBottom: 16,
    letterSpacing: -0.2,
    color: "#747877",
  },

  card: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    gap: 10,
    elevation: 1,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  projectNumber: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },

  title: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "600",
  },

  objectCode: {
    fontSize: 13,
    color: "#8E8E93",
  },

  metaChipsRow: {
    marginTop: 6,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  metaChipText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
  },

  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 6,
  },

  date: {
    fontSize: 12,
    color: "#8E8E93",
  },

  cost: {
    fontSize: 18,
    fontWeight: "700",
    color: "#34C759",
  },
});
