import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ExpenseHistoryItem } from "@/hooks/expenses/useExpenseHistory";
import { API_URL } from "@/hooks/api_client";

type ActionHistorySheetProps = {
  visible: boolean;
  onClose: () => void;
  loading?: any;
  expenseName?: string;
  history?: ExpenseHistoryItem[];
  participants?: Array<{
    id: string;
    full_name?: string;
    rating?: number;
    profile_photo_url?: string | null;
    role?: {
      code?: string;
      display_name?: string;
    };
  }>;
  onRateParticipant?: (
    expenseId: string,
    participantId: string,
    value: -1 | 1,
  ) => void;
  ratingParticipantId?: string | null;
  expenseReactionMap?: Record<string, -1 | 1>;
  projectId?: string;
  expenseId?: string;
  viewerRoleCode?: string;
};

const FIELD_LABELS: Record<string, string> = {
  material_type: "Название",
  quantity: "Количество",
  unit_price: "Плановая цена",
  actual_unit_price: "Фактическая цена",
  comment: "Комментарий",
  shop: "Магазин",
  due_at: "Срок",
  is_paid: "Оплата",
  photos: "Фотографии",
};

const HIDDEN_HISTORY_FIELDS = new Set([
  "id",
  "project_id",
  "expense_id",
  "section_id",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "paid_by",
  "paid_at",
  "key_words",
  "photos",
  "type",
]);

const NON_RATEABLE_ROLE_CODES = new Set([
  "director",
  "deputy_director",
  "developer",
  "inzhkom_b_manager",
]);

const ROLES_ALLOWED_TO_RATE = new Set([
  "director",
  "deputy_director",
  "developer",
  "inzhkom_b_manager",
]);

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case "created":
      return "add-circle-outline";
    case "created_from_import":
      return "document-text-outline";
    case "updated":
      return "create-outline";
    case "paid_status_changed":
      return "checkmark-circle-outline";
    case "photo_uploaded":
      return "image-outline";
    case "photo_deleted":
      return "trash-outline";
    case "deleted":
      return "close-circle-outline";
    default:
      return "time-outline";
  }
};

const getActionColor = (actionType: string) => {
  switch (actionType) {
    case "created":
      return "#34C759";
    case "created_from_import":
      return "#5AC8FA";
    case "updated":
      return "#007AFF";
    case "paid_status_changed":
      return "#34C759";
    case "photo_uploaded":
      return "#0d6efd";
    case "photo_deleted":
      return "#FF9500";
    case "deleted":
      return "#FF3B30";
    default:
      return "#8E8E93";
  }
};

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case "created":
      return "Создание";
    case "created_from_import":
      return "Импорт";
    case "updated":
      return "Изменение";
    case "paid_status_changed":
      return "Статус оплаты";
    case "photo_uploaded":
      return "Фото добавлено";
    case "photo_deleted":
      return "Фото удалено";
    case "deleted":
      return "Расход удалён";
    default:
      return "История";
  }
};

const normalizeValue = (value: any) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return value;
};

const formatMoney = (value: any) => {
  const numeric = Number(value);

  if (!Number.isFinite(numeric)) {
    return String(value);
  }

  return `${numeric.toLocaleString("ru-RU")} ₽`;
};

const formatDateValue = (value: any) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
};

const formatPhotoCount = (value: any) => {
  if (!Array.isArray(value)) {
    return "0 фото";
  }

  const count = value.length;
  return `${count} фото`;
};

const formatFieldValue = (field: string, value: any) => {
  const normalizedValue = normalizeValue(value);

  if (normalizedValue === null) {
    return "Не указано";
  }

  if (field === "unit_price" || field === "actual_unit_price") {
    return formatMoney(normalizedValue);
  }

  if (field === "due_at") {
    return formatDateValue(normalizedValue);
  }

  if (field === "is_paid") {
    return normalizedValue ? "Оплачен" : "Не оплачен";
  }

  if (field === "photos") {
    return formatPhotoCount(normalizedValue);
  }

  if (Array.isArray(normalizedValue)) {
    return normalizedValue.join(", ");
  }

  return String(normalizedValue);
};

const getChangedKeys = (item: ExpenseHistoryItem) => {
  const before = item.before || {};
  const after = item.after || {};

  if (item.action === "photo_uploaded" || item.action === "photo_deleted") {
    return [];
  }

  return Object.keys({ ...before, ...after }).filter((key) => {
    if (HIDDEN_HISTORY_FIELDS.has(key)) {
      return false;
    }

    return JSON.stringify(before?.[key]) !== JSON.stringify(after?.[key]);
  });
};

const buildHeadline = (item: ExpenseHistoryItem) => {
  const before = item.before || {};
  const after = item.after || {};

  switch (item.action) {
    case "created":
      return `Создан расход "${after?.material_type || "без названия"}"`;
    case "created_from_import":
      return `Расход "${after?.material_type || "без названия"}" добавлен из импорта`;
    case "photo_uploaded":
      return "Добавил фото к расходу";
    case "photo_deleted":
      return "Удалил фото у расхода";
    case "deleted":
      return `Удалил расход "${before?.material_type || "без названия"}"`;
    case "paid_status_changed":
      return after?.is_paid
        ? "Отметил расход как оплаченный"
        : "Снял отметку оплаты";
    default:
      return "Изменил данные расхода";
  }
};

const buildChangeRows = (item: ExpenseHistoryItem) => {
  const before = item.before || {};
  const after = item.after || {};
  const changedKeys = getChangedKeys(item);

  return changedKeys.map((key) => ({
    key,
    label: FIELD_LABELS[key] || key,
    beforeRaw: normalizeValue(before?.[key]),
    afterRaw: normalizeValue(after?.[key]),
    beforeValue: formatFieldValue(key, before?.[key]),
    afterValue: formatFieldValue(key, after?.[key]),
  }));
};

const buildChangedSummaryLines = (item: ExpenseHistoryItem) => {
  if (item.action === "created") {
    return [];
  }

  return buildChangeRows(item).map((row) => {
    if (row.beforeRaw === null && row.afterRaw !== null) {
      return row.key === "material_type"
        ? `Добавлено: ${row.afterValue}`
        : `Добавлено ${row.label.toLowerCase()}: ${row.afterValue}`;
    }

    if (row.beforeRaw !== null && row.afterRaw === null) {
      return row.key === "material_type"
        ? `Удалено: ${row.beforeValue}`
        : `Удалено ${row.label.toLowerCase()}: ${row.beforeValue}`;
    }

    return row.key === "material_type"
      ? `Изменено: ${row.afterValue}`
      : `Изменено ${row.label.toLowerCase()}: ${row.afterValue}`;
  });
};

const getAvatarUri = (avatarPath?: string | null) => {
  if (!avatarPath) {
    return null;
  }

  if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
    return avatarPath;
  }

  return `${API_URL.replace(/\/$/, "")}${avatarPath}`;
};

const buildBeforeSummary = (item: ExpenseHistoryItem) => {
  const changeRows = buildChangeRows(item);

  if (!changeRows.length) {
    return null;
  }

  const primaryRow = changeRows[0];
  return primaryRow.key === "material_type"
    ? primaryRow.beforeValue
    : `${primaryRow.label}: ${primaryRow.beforeValue}`;
};

const buildDescription = (item: ExpenseHistoryItem) => {
  if (item.action === "photo_uploaded") {
    return "Фото добавлено в карточку расхода и сохранено в истории.";
  }

  if (item.action === "photo_deleted") {
    return "Фото удалено из карточки расхода.";
  }

  if (item.action === "deleted") {
    return "Расход был удалён из проекта.";
  }

  return "";
};

export const ActionHistorySheet = ({
  visible,
  onClose,
  loading = false,
  expenseName,
  history = [],
  participants = [],
  onRateParticipant,
  ratingParticipantId,
  expenseReactionMap = {},
  projectId,
  expenseId,
  viewerRoleCode,
}: ActionHistorySheetProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const insets = useSafeAreaInsets();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const currentDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    const targetDay = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const diffDays = Math.round(
      (currentDay.getTime() - targetDay.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffDays === 0) return "Сегодня";
    if (diffDays === 1) return "Вчера";
    if (diffDays > 1 && diffDays < 7) return `${diffDays} дн. назад`;

    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderActionItem = ({ item }: { item: ExpenseHistoryItem }) => {
    const actionColor = getActionColor(item.action);
    const beforeSummary = buildBeforeSummary(item);
    const changedSummaryLines = buildChangedSummaryLines(item);
    const description = buildDescription(item);
    const participant = participants.find(
      (participantItem) => participantItem.id === item.changed_by?.id,
    );
    const avatarUri = getAvatarUri(participant?.profile_photo_url);
    const participantRoleCode = participant?.role?.code || "";
    const isNonRateableRole = NON_RATEABLE_ROLE_CODES.has(participantRoleCode);
    const viewerCanSeeRating =
      !!viewerRoleCode && ROLES_ALLOWED_TO_RATE.has(viewerRoleCode);
    const participantRating =
      !isNonRateableRole && typeof participant?.rating === "number"
        ? participant.rating
        : null;
    const viewerCanRate = viewerCanSeeRating;

    const canRate =
      !!item.changed_by?.id &&
      !!onRateParticipant &&
      !isNonRateableRole &&
      viewerCanRate;

    const ratingBusy = ratingParticipantId === item.changed_by?.id;

    const reactionKey =
      projectId && expenseId && item.changed_by?.id
        ? `${projectId}:${expenseId}:${item.changed_by.id}`
        : "";
    const selectedReaction = reactionKey ? expenseReactionMap[reactionKey] : 0;

    return (
      <View style={[styles.actionCard, isDark && styles.actionCardDark]}>
        <View style={styles.actionHeader}>
          <View style={styles.userInfo}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatar}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, isDark && styles.avatarDark]}>
                <ThemedText style={styles.avatarText}>
                  {(item.changed_by?.full_name || "S").charAt(0).toUpperCase()}
                </ThemedText>
              </View>
            )}

            <View style={styles.userMeta}>
              <ThemedText style={styles.userName}>
                {item.changed_by?.full_name || "Системное действие"}
              </ThemedText>
              {participant?.role?.display_name ? (
                <ThemedText style={styles.userRole}>
                  {participant.role.display_name}
                </ThemedText>
              ) : null}
              {viewerCanSeeRating && participantRating !== null ? (
                <ThemedText style={styles.userRating}>
                  Рейтинг: {participantRating.toLocaleString("ru-RU")}
                </ThemedText>
              ) : null}
            </View>
          </View>

          <View
            style={[
              styles.actionBadge,
              { backgroundColor: `${actionColor}20` },
            ]}
          >
            <Ionicons
              name={getActionIcon(item.action)}
              size={14}
              color={actionColor}
            />
            <ThemedText style={[styles.actionText, { color: actionColor }]}>
              {getActionLabel(item.action)}
            </ThemedText>
          </View>
        </View>

        <View style={styles.messageBlock}>
          <ThemedText style={styles.actionHeadline}>
            {buildHeadline(item)}
          </ThemedText>
          {description ? (
            <ThemedText style={styles.actionDescription}>
              {description}
            </ThemedText>
          ) : null}
          {changedSummaryLines.length ? (
            <View style={styles.summaryList}>
              {changedSummaryLines.map((line, index) => (
                <ThemedText
                  key={`${item.id}-summary-${index}`}
                  style={styles.summaryLine}
                >
                  {line}
                </ThemedText>
              ))}
            </View>
          ) : null}
        </View>

        {beforeSummary ? (
          <View
            style={[
              styles.replyCard,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f6eef4",
                borderLeftColor: actionColor,
              },
            ]}
          >
            <ThemedText style={[styles.replyTitle, { color: actionColor }]}>
              Исходные данные
            </ThemedText>
            <ThemedText style={styles.replyText}>{beforeSummary}</ThemedText>
          </View>
        ) : null}

        <View style={styles.actionFooter}>
          <View style={styles.dateContainer}>
            <Ionicons name="time-outline" size={14} color="#8E8E93" />
            <ThemedText style={styles.date}>
              {formatDate(item.created_at)} в {formatTime(item.created_at)}
            </ThemedText>
          </View>

          <View style={styles.footerRight}>
            {canRate ? (
              <View style={styles.ratingActions}>
                <TouchableOpacity
                  disabled={ratingBusy}
                  onPress={() =>
                    onRateParticipant?.(
                      expenseId || item.expense_id,
                      item.changed_by!.id,
                      1,
                    )
                  }
                  style={[
                    styles.rateButton,
                    {
                      backgroundColor:
                        selectedReaction === 1
                          ? "#34C759"
                          : isDark
                            ? "rgba(52,199,89,0.14)"
                            : "rgba(52,199,89,0.1)",
                      opacity: ratingBusy ? 0.55 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="thumbs-up-outline"
                    size={15}
                    color={selectedReaction === 1 ? "#fff" : "#34C759"}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={ratingBusy}
                  onPress={() =>
                    onRateParticipant?.(
                      expenseId || item.expense_id,
                      item.changed_by!.id,
                      -1,
                    )
                  }
                  style={[
                    styles.rateButton,
                    {
                      backgroundColor:
                        selectedReaction === -1
                          ? "#FF3B30"
                          : isDark
                            ? "rgba(255,59,48,0.14)"
                            : "rgba(255,59,48,0.1)",
                      opacity: ratingBusy ? 0.55 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name="thumbs-down-outline"
                    size={15}
                    color={selectedReaction === -1 ? "#fff" : "#FF3B30"}
                  />
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: insets.bottom },
            isDark && styles.sheetContainerDark,
          ]}
        >
          <View style={styles.header}>
            <View style={styles.indicator} />
            <ThemedText style={styles.title}>История действий</ThemedText>
            {expenseName ? (
              <ThemedText style={styles.subtitle}>{expenseName}</ThemedText>
            ) : null}
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          <View style={styles.contentArea}>
            {loading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color="#007AFF" />
                <ThemedText style={styles.date}>Загружаем историю</ThemedText>
              </View>
            ) : (
              <FlatList
                data={history}
                keyExtractor={(item) => item.id}
                renderItem={renderActionItem}
                style={styles.list}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={[
                  styles.listContent,
                  history.length === 0 && styles.listContentEmpty,
                ]}
                ListEmptyComponent={
                  <View style={styles.emptyWrap}>
                    <Ionicons name="time-outline" size={22} color="#8E8E93" />
                    <ThemedText style={styles.date}>
                      История для этого расхода пока пуста
                    </ThemedText>
                  </View>
                }
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get("window");
const SHEET_WIDTH = width - 20;

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    height: "88%",
    // width: SHEET_WIDTH,
    // alignSelf: "center",
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 12,
    overflow: "hidden",
  },
  sheetContainerDark: {
    backgroundColor: "#000",
  },
  header: {
    alignItems: "center",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(142, 142, 147, 0.2)",
    position: "relative",
  },
  indicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#8E8E93",
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#8E8E93",
  },
  closeButton: {
    position: "absolute",
    right: 16,
    top: 0,
    padding: 4,
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    paddingTop: 12,
    gap: 12,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  actionCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionCardDark: {
    backgroundColor: "#1c1c1e",
    shadowOpacity: 0,
  },
  actionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  userInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userMeta: {
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#f2f2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarDark: {
    backgroundColor: "#2c2c2e",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "600",
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
  },
  userRole: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  userRating: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 4,
    fontWeight: "600",
  },
  actionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: "600",
  },
  messageBlock: {
    gap: 6,
  },
  actionHeadline: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  actionDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  summaryList: {
    gap: 4,
    marginTop: 2,
  },
  summaryLine: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  replyCard: {
    borderLeftWidth: 4,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    gap: 4,
  },
  replyTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  replyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
    gap: 12,
  },
  footerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  date: {
    fontSize: 12,
    color: "#8E8E93",
  },
  ratingActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rateButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingWrap: {
    flex: 1,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
});
