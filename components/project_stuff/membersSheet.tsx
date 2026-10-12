import React from "react";
import {
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { ThemedText } from "@/components/themed-text";

export default function WorkersSheet({
  workers = [],
  loading = false,
  onClose,
  onAdd,
  onDelete,
  saving = false,
  colorScheme = "light",
  workersSheetRef,
}: any) {
  const handleCallWorker = async (worker: any) => {
    const phone = String(worker?.phone || "").trim();

    if (!phone) {
      Alert.alert("Нет номера", "У этого работника не указан номер телефона.");
      return;
    }

    Alert.alert(
      "Позвонить работнику",
      `Вы хотите позвонить ${worker?.full_name || "этому работнику"}?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Позвонить",
          onPress: async () => {
            const telUrl = `tel:${phone.replace(/[^\d+]/g, "")}`;

            try {
              const supported = await Linking.canOpenURL(telUrl);

              if (!supported) {
                Alert.alert(
                  "Ошибка",
                  "Не удалось открыть звонок на этом устройстве.",
                );
                return;
              }

              await Linking.openURL(telUrl);
            } catch (error) {
              Alert.alert("Ошибка", "Не удалось начать звонок.");
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.discussionSheet}>
      <View style={styles.accessSheetHeader}>
        <ThemedText style={styles.accessSheetTitle}>
          Работники проекта
        </ThemedText>

        <TouchableOpacity
          style={[
            styles.accessCloseButton,
            {
              backgroundColor: colorScheme === "dark" ? "#2c2c2e" : "#f3f4f6",
            },
          ]}
          onPress={() => {
            onClose?.();
            workersSheetRef?.current?.hide?.();
          }}
        >
          <Ionicons name="close" size={18} color="#8E8E93" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.addSectionButton} onPress={onAdd}>
        <Feather name="plus" size={18} color="#007AFF" />
        <ThemedText style={styles.addSectionText}>Добавить</ThemedText>
      </TouchableOpacity>

      <ScrollView
        style={styles.discussionList}
        contentContainerStyle={styles.discussionListContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.accessLoading}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={styles.accessHint}>
              Загружаем работников
            </ThemedText>
          </View>
        ) : workers.length ? (
          workers.map((worker: any) => (
            <View
              key={worker.id}
              style={[
                styles.historyCard,
                {
                  backgroundColor:
                    colorScheme === "dark"
                      ? "rgba(255,255,255,0.04)"
                      : "#f8f9fb",
                },
              ]}
            >
              <View style={styles.historyHeader}>
                <TouchableOpacity
                  style={styles.workerCallArea}
                  activeOpacity={0.75}
                  onPress={() => handleCallWorker(worker)}
                >
                  <View style={styles.participantMeta}>
                    <ThemedText style={styles.accessUserName}>
                      {worker.full_name}
                    </ThemedText>

                    <ThemedText style={styles.accessUserSecondary}>
                      {worker.position || "Должность не указана"}
                    </ThemedText>

                    {worker.phone && (
                      <ThemedText style={styles.accessUserSecondary}>
                        {worker.phone}
                      </ThemedText>
                    )}
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.commentDeleteButton}
                  onPress={() => onDelete?.(worker)}
                  disabled={saving}
                >
                  <Ionicons name="trash-outline" size={16} color="#dc3545" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.accessEmpty}>
            <Ionicons name="hammer-outline" size={22} color="#8E8E93" />
            <ThemedText style={styles.accessHint}>
              Работники ещё не добавлены
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  accessSection: {
    marginBottom: 18,
    gap: 12,
  },
  accessSubtitle: {
    paddingHorizontal: 4,
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 2,
  },
  accessCard: {
    borderRadius: 20,
    elevation: 1,
    padding: 16,
    gap: 12,
  },
  accessLoading: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    gap: 10,
  },
  accessEmpty: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 22,
  },
  accessHint: {
    fontSize: 14,
    color: "#8E8E93",
  },
  accessRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
    alignItems: "flex-start",
    flexDirection: "row",
    paddingVertical: 10,
    gap: 12,
  },
  accessUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accessAvatar: {
    backgroundColor: "#eaf2ff",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    width: 40,
  },
  accessAvatarText: {
    fontWeight: "800",
    color: "#007AFF",
    fontSize: 14,
  },
  accessUserMeta: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  accessUserName: {
    fontWeight: "700",
    fontSize: 15,
  },
  accessUserSecondary: {
    color: "#8E8E93",
    fontSize: 13,
  },
  workerCallArea: {
    flex: 1,
  },
  accessBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
    gap: 6,
  },
  accessBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  accessBadgeBlue: {
    backgroundColor: "rgba(13,110,253,0.12)",
  },
  accessBadgeGreen: {
    backgroundColor: "rgba(25,135,84,0.12)",
  },
  accessBadgeText: {
    fontWeight: "600",
    color: "#8E8E93",
    fontSize: 12,
  },
  accessBadgeTextBlue: {
    color: "#0d6efd",
  },
  accessBadgeTextGreen: {
    color: "#198754",
  },
  accessSheet: {
    flex: 1,
  },
  accessSheetBody: {
    paddingHorizontal: 20,
    paddingTop: 18,
    flex: 1,
    gap: 16,
  },
  accessSheetContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    paddingTop: 18,
    gap: 16,
  },
  accessSheetHeader: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 12,
  },
  accessSheetTitle: {
    fontWeight: "800",
    fontSize: 24,
  },
  accessSheetSubtitle: {
    color: "#8E8E93",
    marginTop: 4,
    fontSize: 14,
  },
  accessCloseButton: {
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 18,
    height: 36,
    width: 36,
  },
  accessSearchBox: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    minHeight: 52,
    gap: 10,
  },
  accessSearchInput: {
    paddingVertical: 14,
    fontSize: 15,
    flex: 1,
  },
  userPickerList: {
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "transparent",
    borderRadius: 18,
    maxHeight: 300,
    minHeight: 180,
    borderWidth: 1,
  },
  userPickerSection: {
    gap: 10,
  },
  userPickerContent: {
    padding: 10,
    gap: 10,
  },
  userPickerCard: {
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  userPickerCardSelected: {
    backgroundColor: "rgba(0,122,255,0.04)",
    borderColor: "#007AFF",
  },
  userPickerMeta: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  userPickerEmpty: {
    justifyContent: "center",
    paddingHorizontal: 16,
    alignItems: "center",
    minHeight: 120,
  },
  accessPermissionCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  accessPermissionTitle: {
    fontWeight: "700",
    fontSize: 17,
  },
  permissionRow: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  permissionTitle: {
    fontWeight: "700",
    fontSize: 15,
  },
  permissionHint: {
    color: "#8E8E93",
    fontSize: 13,
    marginTop: 2,
  },
  permissionToggle: {
    backgroundColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    height: 28,
    width: 28,
  },
  permissionToggleActive: {
    backgroundColor: "#0d6efd",
  },
  permissionToggleActiveGreen: {
    backgroundColor: "#198754",
  },
  accessFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: "transparent",
    flexDirection: "column",
    paddingHorizontal: 20,
    paddingBottom: 6,
    paddingTop: 8,
    marginTop: 4,
    gap: 12,
  },
  accessDeleteButton: {
    backgroundColor: "rgba(220,53,69,0.08)",
    justifyContent: "center",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 15,
    minHeight: 50,
    gap: 8,
  },
  accessDeleteText: {
    fontWeight: "700",
    color: "#dc3545",
    fontSize: 14,
  },
  accessSaveButton: {
    backgroundColor: "#111111",
    justifyContent: "center",
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    minHeight: 52,
    width: "100%",
    gap: 8,
  },
  accessSaveText: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 15,
  },
  sectionsHeader: {
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
    flexDirection: "row",
    marginBottom: 12,
  },
  addSectionButton: {
    backgroundColor: "rgba(0, 122, 255, 0.1)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
    gap: 6,
  },
  statusBadge: {
    backgroundColor: "rgba(0,122,255,0.76)",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
  },

  statusButton: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignSelf: "center",
    paddingVertical: 15,
    marginVertical: 10,
    borderRadius: 18,
    gap: 10,
  },

  statusText: {
    fontWeight: "600",
    color: "#fff",
    fontSize: 19,
  },

  addSectionText: {
    fontWeight: "500",
    color: "#007AFF",
    fontSize: 14,
  },

  sectionsContainer: {
    marginBottom: 16,
    gap: 12,
  },

  sectionsTitle: {
    paddingHorizontal: 4,
    fontWeight: "900",
    marginBottom: 4,
    marginTop: 20,
    fontSize: 20,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    elevation: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
  },
  sectionName: {
    fontWeight: "600",
    fontSize: 17,
    flex: 1,
  },
  sectionStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sectionStat: {
    flex: 1,
    gap: 4,
  },
  sectionStatLabel: {
    fontSize: 13,
    opacity: 0.5,
  },
  sectionStatValue: {
    fontWeight: "700",
    fontSize: 20,
  },
  sectionCost: {
    color: "#6a9e2c",
  },

  sectionDivider: {
    backgroundColor: "rgba(0,0,0,0.1)",
    height: 30,
    width: 1,
  },

  scrollContent: {
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
    paddingBottom: 40,
  },
  header: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
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
  headerTitle: {
    fontWeight: "600",
    fontSize: 18,
  },

  codeContainer: {
    justifyContent: "space-between",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  projectCode: {
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
    fontSize: 14,
    opacity: 0.5,
  },
  mainCard: {
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 20,
    elevation: 1,
    padding: 20,
    // borderColor: "rgba(0,0,0,0.4)",
    // borderWidth: 1,
  },
  projectName: {
    letterSpacing: -0.5,
    fontWeight: "700",
    marginBottom: 16,
    lineHeight: 34,
    fontSize: 28,
  },
  divider: {
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 16,
    width: "100%",
    height: 1,
  },
  infoRow: {
    justifyContent: "space-between",
    flexDirection: "row",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontWeight: "500",
    fontSize: 14,
    opacity: 0.5,
  },
  infoValue: {
    fontWeight: "600",
    fontSize: 17,
  },
  inlineBlock: {
    gap: 8,
  },
  discussionButton: {
    justifyContent: "space-between",
    paddingHorizontal: 14,
    alignItems: "center",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 18,
  },
  discussionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  discussionIconWrap: {
    backgroundColor: "rgba(13,110,253,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 19,
    height: 38,
    width: 38,
  },
  discussionTextWrap: {
    flex: 1,
    gap: 2,
  },
  discussionTitle: {
    fontWeight: "600",
    fontSize: 16,
  },
  discussionSubtitle: {
    color: "#8E8E93",
    fontSize: 13,
  },
  dateRow: {
    gap: 8,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    opacity: 0.7,
  },
  statsContainer: {
    flexDirection: "row",
    marginVertical: 16,
    gap: 12,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 1,
    padding: 16,
    flex: 1,
    // borderColor: "rgba(0,0,0,0.4)",
    // borderWidth: 1,
  },
  statLabel: {
    fontWeight: "500",
    marginBottom: 8,
    fontSize: 16,
    opacity: 0.5,
  },
  statValue: {
    letterSpacing: -0.5,
    fontWeight: "700",
    fontSize: 24,
  },
  costValue: {
    color: "#6a9e2c",
    fontSize: 23,
  },
  commentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    elevation: 1,
    padding: 20,
  },
  commentLabel: {
    fontWeight: "500",
    marginBottom: 8,
    opacity: 0.5,
    fontSize: 14,
  },
  commentText: {
    lineHeight: 22,
    fontSize: 16,
  },
  discussionSheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
  },
  discussionComposer: {
    gap: 12,
    marginBottom: 16,
  },
  discussionInput: {
    backgroundColor: "rgba(142,142,147,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 18,
    minHeight: 96,
    fontSize: 15,
  },
  discussionSendButton: {
    backgroundColor: "#007AFF",
    justifyContent: "center",
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    height: 46,
    gap: 8,
  },
  discussionSendButtonDisabled: {
    opacity: 0.45,
  },
  discussionSendText: {
    fontWeight: "600",
    color: "#fff",
  },
  discussionList: {
    flex: 1,
  },
  discussionListContent: {
    // backgroundColor: "red",
    paddingBottom: 18,
    gap: 12,
  },
  discussionCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  discussionAvatar: {
    borderRadius: 22,
    height: 44,
    width: 44,
  },
  discussionAvatarFallback: {
    backgroundColor: "rgba(13,110,253,0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  discussionCardContent: {
    flex: 1,
    gap: 8,
  },
  discussionCardHeader: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  discussionHeaderActions: {
    alignItems: "flex-end",
    gap: 8,
  },
  discussionMeta: {
    flex: 1,
    gap: 2,
  },
  discussionDate: {
    color: "#8E8E93",
    marginTop: 2,
    fontSize: 12,
  },
  discussionBody: {
    lineHeight: 20,
    fontSize: 14,
  },
  commentDeleteButton: {
    backgroundColor: "rgba(220,53,69,0.08)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15,
    height: 30,
    width: 30,
  },
  historyCard: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  historyHeader: {
    justifyContent: "space-between",
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 12,
  },
  historyTitle: {
    fontWeight: "700",
    fontSize: 15,
    flex: 1,
  },
  historyMeta: {
    color: "#8E8E93",
    fontSize: 13,
  },
  participantCard: {
    flexDirection: "row",
    borderRadius: 18,
    padding: 14,
    gap: 12,
  },
  participantMeta: {
    minWidth: 0,
    flex: 1,
    gap: 2,
  },
  workerInput: {
    paddingHorizontal: 14,
    borderRadius: 14,
    minHeight: 48,
    fontSize: 15,
  },
});
