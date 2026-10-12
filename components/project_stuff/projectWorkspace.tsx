import React from "react";
import { Alert, Platform, Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import {
  ActionRow,
  EmptyState,
  WorkspaceButton,
  WorkspaceTabs,
  WorkspaceIcon,
  useWorkspaceTheme,
} from "@/components/ui/workspace";
import { useProjectWorkspace } from "@/hooks/project/useProjectWorkspace";
import formatDisplayDate from "@/utils/formatDate";
import { ProjectStatusBadge } from "@/components/project_stuff/projectStatusBadge";

type Props = {
  project: Record<string, any>;
  role?: string;
  canManageUsers: boolean;
  workerCount: number;
  onBack: () => void;
  onMenu: () => void;
  onExpenses: () => void;
  onAccess: () => void;
  onWorkers: () => void;
  onDiscussion: () => void;
  onHistory: () => void;
  onAddSection: () => void;
  onTransition: (status: string) => void;
  canTransition: (from: string, to: string) => boolean;
  sections: React.ReactNode;
  deadlines: React.ReactNode;
};

export function ProjectWorkspace(props: Props) {
  const { project, role, canManageUsers } = props;
  const theme = useWorkspaceTheme();
  const {
    tab,
    setTab,
    stage,
    participants,
    editingDeadlines,
    setEditingDeadlines,
  } = useProjectWorkspace(project);
  const canViewFinance = !!role && !["pto", "estimator_plus"].includes(role);
  const canViewWorkers =
    !!role &&
    (role.includes("estimator") ||
      role.includes("dev") ||
      role.includes("director"));
  const canViewAccess = canManageUsers || !!role?.includes("estimator");
  const cost = Number(project.total_materials_cost) || 0;
  const expenseCount = project.material_expenses?.length ?? 0;
  const sectionCount = project.big_sections?.length ?? 0;
  const nextStage = stage?.next;

  const confirmTransition = () => {
    if (!nextStage) return;
    if (project.status === "project_analysis" && expenseCount === 0) {
      Alert.alert(
        "Добавьте расходы",
        "Перед формированием материалов в проекте должен быть хотя бы один расход.",
      );
      return;
    }
    Alert.alert(
      stage.action ?? "Изменить этап",
      "Этап проекта изменится для всех участников.",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Продолжить", onPress: () => props.onTransition(nextStage) },
      ],
    );
  };

  return (
    <View>
      {Platform.OS !== "ios" ? (
        <View style={styles.navigation}>
          <Pressable
            onPress={props.onBack}
            accessibilityRole="button"
            accessibilityLabel="Назад к объектам"
            style={styles.back}
          >
            <WorkspaceIcon
              name="chevron-back"
              size={23}
              color={theme.primary}
            />
            <ThemedText style={{ color: theme.primary, fontSize: 15 }}>
              Объекты
            </ThemedText>
          </Pressable>
          <Pressable
            onPress={props.onMenu}
            accessibilityRole="button"
            accessibilityLabel="Действия с объектом"
            style={styles.iconButton}
          >
            <WorkspaceIcon
              name="ellipsis-horizontal"
              size={23}
              color={theme.text}
            />
          </Pressable>
        </View>
      ) : null}
      <View style={styles.identity}>
        <ThemedText style={styles.name}>{project.name || "Объект"}</ThemedText>
        <View style={styles.metadata}>
          {project.number != null ? (
            <ThemedText style={[styles.secondary, { color: theme.secondary }]}>
              № {project.number}
            </ThemedText>
          ) : null}
          {project.object_code ? (
            <ThemedText style={[styles.secondary, { color: theme.secondary }]}>
              {project.object_code}
            </ThemedText>
          ) : null}
          <ProjectStatusBadge
            status={project.status}
            label={stage?.label ?? "Этап не указан"}
          />
        </View>
      </View>
      <WorkspaceTabs
        value={tab}
        onChange={setTab}
        options={[
          { key: "overview", label: "Обзор" },
          { key: "sections", label: "Разделы" },
          { key: "team", label: "Команда" },
        ]}
      />

      {tab === "overview" ? (
        <View style={styles.body}>
          {canViewFinance ? (
            <View>
              <ThemedText style={styles.sectionTitle}>
                Расходы проекта
              </ThemedText>
              <View style={styles.finance}>
                <ThemedText style={styles.amount}>
                  {cost.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽
                </ThemedText>
                <ThemedText
                  style={[styles.secondary, { color: theme.secondary }]}
                >
                  Всего расходов: {expenseCount}
                </ThemedText>
              </View>
              {/*<WorkspaceButton*/}
              {/*  title="Открыть расходы"*/}
              {/*  icon="receipt-outline"*/}
              {/*  onPress={props.onExpenses}*/}
              {/*  secondary*/}
              {/*/>*/}
            </View>
          ) : null}
          {project.company_deadline || project.supplies_deadline ? (
            <View>
              <ThemedText style={styles.sectionTitle}>Сроки</ThemedText>
              {project.company_deadline ? (
                <View
                  style={[styles.dataRow, { borderBottomColor: theme.border }]}
                >
                  <ThemedText
                    style={[styles.secondary, { color: theme.secondary }]}
                  >
                    Компания
                  </ThemedText>
                  <ThemedText style={styles.dataValue}>
                    {formatDisplayDate(project.company_deadline)}
                  </ThemedText>
                </View>
              ) : null}
              {project.supplies_deadline ? (
                <View
                  style={[styles.dataRow, { borderBottomColor: theme.border }]}
                >
                  <ThemedText
                    style={[styles.secondary, { color: theme.secondary }]}
                  >
                    Поставка
                  </ThemedText>
                  <ThemedText style={styles.dataValue}>
                    {formatDisplayDate(project.supplies_deadline)}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          ) : null}
          {props.deadlines ? (
            <View>
              <View style={[styles.group, { backgroundColor: theme.surface }]}>
                <ActionRow
                  icon="time-outline"
                  title={
                    editingDeadlines ? "Скрыть форму сроков" : "Изменить сроки"
                  }
                  onPress={() => setEditingDeadlines(!editingDeadlines)}
                />
              </View>
              {editingDeadlines ? (
                <View
                  style={{
                    padding: 16,
                    marginTop: 8,
                    backgroundColor: theme.surface,
                    borderRadius: 12,
                  }}
                >
                  {props.deadlines}
                </View>
              ) : null}
            </View>
          ) : null}
          {nextStage && props.canTransition(project.status, nextStage) ? (
            <WorkspaceButton
              title={stage.action ?? "Следующий этап"}
              icon="arrow-forward"
              onPress={confirmTransition}
            />
          ) : null}
          <View style={[styles.group, { backgroundColor: theme.surface }]}>
            {/*<ActionRow*/}
            {/*  icon="chatbubbles-outline"*/}
            {/*  title="Обсуждение"*/}
            {/*  onPress={props.onDiscussion}*/}
            {/*/>*/}
            <ActionRow
              icon="time-outline"
              title="История изменений"
              onPress={props.onHistory}
            />
          </View>
          {project.comment ? (
            <View>
              <ThemedText style={styles.sectionTitle}>Примечание</ThemedText>
              <ThemedText style={[styles.comment, { color: theme.secondary }]}>
                {project.comment}
              </ThemedText>
            </View>
          ) : null}
        </View>
      ) : null}

      {tab === "sections" ? (
        <View style={styles.body}>
          <WorkspaceButton
            title="Добавить раздел"
            icon="add"
            onPress={props.onAddSection}
          />
          {sectionCount ? (
            props.sections
          ) : (
            <EmptyState
              title="Разделов пока нет"
              detail="Создайте раздел, чтобы вести расходы и документы по подразделам."
            />
          )}
        </View>
      ) : null}

      {tab === "team" ? (
        <View style={styles.body}>
          <View style={[styles.group, { backgroundColor: theme.surface }]}>
            {canViewAccess ? (
              <ActionRow
                icon="key-outline"
                title="Участники и доступы"
                onPress={props.onAccess}
              />
            ) : null}
            {canViewWorkers ? (
              <ActionRow
                icon="people-outline"
                title="Работники"
                value={String(props.workerCount)}
                onPress={props.onWorkers}
              />
            ) : null}
          </View>
          <View>
            <ThemedText style={styles.sectionTitle}>
              Участники проекта
            </ThemedText>
            {participants.length ? (
              participants.map((participant: any) => (
                <View
                  key={participant.id}
                  style={[styles.person, { borderBottomColor: theme.border }]}
                >
                  <View
                    style={[
                      styles.avatar,
                      { backgroundColor: theme.surfaceMuted },
                    ]}
                  >
                    <ThemedText style={{ fontSize: 14, fontWeight: "600" }}>
                      {(participant.full_name || "?")
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((part: string) => part[0])
                        .join("")}
                    </ThemedText>
                  </View>
                  <View style={styles.grow}>
                    <ThemedText style={styles.personName}>
                      {participant.full_name || "Участник"}
                    </ThemedText>
                    {participant.role?.display_name ? (
                      <ThemedText
                        style={[styles.secondary, { color: theme.secondary }]}
                      >
                        {participant.role.display_name}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>
              ))
            ) : (
              <EmptyState title="Нет участников" />
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { borderRadius: 12, overflow: "hidden" },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 52,
  },
  back: {
    flexDirection: "row",
    gap: 2,
    minHeight: 48,
    alignItems: "center",
    paddingRight: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  identity: { paddingTop: 12, paddingBottom: 24, gap: 10 },
  name: { fontSize: 28, lineHeight: 34, fontWeight: "700" },
  metadata: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 12,
  },
  secondary: { fontSize: 13, lineHeight: 20 },
  body: { gap: 24, paddingBottom: 12 },
  sectionTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    marginBottom: 8,
  },
  finance: { paddingVertical: 8, gap: 4, marginBottom: 12 },
  amount: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  dataRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dataValue: { fontSize: 14, lineHeight: 20, fontWeight: "500" },
  comment: { fontSize: 15, lineHeight: 23 },
  person: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  grow: { flex: 1, minWidth: 0 },
  personName: { fontSize: 15, lineHeight: 22, fontWeight: "600" },
});
