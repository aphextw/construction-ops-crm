import {
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  StyleSheet,
  Platform,
  View,
  RefreshControl,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  AntDesign,
  Feather,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

import { EditProjectForm } from "@/components/ProjectEdit/projectEditForm";
import { CreateSectionForm } from "../../components/newSectionAdd";
import { BottomSheet } from "react-native-sheet";

import { useDataUserStore } from "@/store/useStore";
import { router, Stack } from "expo-router";

import { useCreateMaterialSection } from "../../hooks/newSectionHook";
import { useUpdateStatus } from "@/hooks/project/statusProjectUpdate";
import { useUpdateProject } from "@/hooks/editProjectHook";
import { useDeleteProject } from "@/hooks/project/ProjectDelete";
import { useGetProject } from "@/hooks/projectRefresh";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { DeadlinesForm } from "@/components/project_stuff/deadlines";
import { useUpdateDeadlines } from "@/hooks/project/projectDeadlinsHook";
import formatDisplayDate from "@/utils/formatDate";
// import * as DocumentPicker from "expo-document-picker";
// import { FileList } from "@/components/project_stuff/fileUploader";
// import { useUploadProjectFile } from "@/hooks/project/fileUploadHook";
import {
  ProjectUserAccess,
  useProjectUserAccess,
} from "@/hooks/project/useProjectUserAccess";
import { AppUser, useUsers } from "@/hooks/useUsers";
import {
  ProjectComment,
  useProjectComments,
} from "@/hooks/project/useProjectComments";
import { api, API_URL } from "@/hooks/api_client";
import {
  ProjectWorkerItem,
  WorkerCatalogItem,
  useProjectWorkers,
} from "@/hooks/project/useProjectWorkers";
import WorkersSheet from "@/components/project_stuff/membersSheet";
import ParticipantsSheet from "@/components/project_stuff/participants";
import * as SecureStore from "expo-secure-store";
import { BigSectionsList } from "@/components/project_stuff/big_section";
import { CreateBigSectionForm } from "@/components/project_stuff/big_section_form";
import EditWorkerModal from "@/components/uniComp/edit_workers_modal";
import { Colors, Layout } from "@/constants/theme";
import { ProjectWorkspace } from "@/components/project_stuff/projectWorkspace";
import { WorkspaceIcon, useWorkspaceTheme } from "@/components/ui/workspace";

export default function ProjectPage() {
  const workspaceTheme = useWorkspaceTheme();
  type ProjectParticipantAccessItem = {
    id: string;
    user: AppUser;
    can_view: boolean;
    can_edit: boolean;
    access_source: "system" | "role" | "direct";
  };

  const [user, setUser] = useState<Record<string, any>>({});
  const bottomSheetRef = useRef<any>(null);
  const sectionAddRef = useRef<any>(null);
  const bigSectionAddRef = useRef<any>(null);
  const discussionSheetRef = useRef<any>(null);
  const participantsSheetRef = useRef<any>(null);
  const workersSheetRef = useRef<any>(null);
  const workerFormSheetRef = useRef<any>(null);
  const [projectUserAccess, setProjectUserAccess] = useState<
    ProjectUserAccess[]
  >([]);
  const [editWorkerModal, setEditWorkerModal] = useState(false);
  const [editWorkerId, setEditWorkerId] = useState({});
  const [bigSectionId, setBigSectionId] = useState<string>("");
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  // const [userSearchQuery, setUserSearchQuery] = useState("");

  const [projectComments, setProjectComments] = useState<ProjectComment[]>([]);
  const [projectParticipantsAccess, setProjectParticipantsAccess] = useState<
    ProjectParticipantAccessItem[]
  >([]);
  const [projectWorkers, setProjectWorkers] = useState<ProjectWorkerItem[]>([]);
  const [discussionAvatarVersion, setDiscussionAvatarVersion] = useState(() =>
    Date.now(),
  );
  const [workerSearchQuery, setWorkerSearchQuery] = useState("");
  const [workerCatalog, setWorkerCatalog] = useState<WorkerCatalogItem[]>([]);
  const [selectedWorker, setSelectedWorker] =
    useState<WorkerCatalogItem | null>(null);
  const [workerForm, setWorkerForm] = useState({
    full_name: "",
    phone: "",
    position: "",
  });
  const [discussionBody, setDiscussionBody] = useState("");

  const { updateDeadlines } = useUpdateDeadlines();
  const { createSection } = useCreateMaterialSection();
  const { deleteProject, loading } = useDeleteProject();
  const { updateProject } = useUpdateProject();
  const {
    loadingProjectComments,
    sendingProjectComment,
    deletingProjectComment,
    listProjectComments,
    addProjectComment,
    deleteProjectComment,
  } = useProjectComments();
  const {
    loadingProjectWorkers,
    savingProjectWorker,
    loadingWorkersCatalog,
    searchWorkersCatalog,
    deleteProjectWorker,
    listProjectWorkers,
    addProjectWorker,
    deleteWorker,
    updateWorker,
  } = useProjectWorkers();
  const { loadingUserAccess, listUserAccess } = useProjectUserAccess();
  const { loadingUsers, getUsers } = useUsers();

  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const { getProject, refreshing } = useGetProject();
  const { updateStatus } = useUpdateStatus();

  const setProjects = useDataUserStore((state) => state.setProjects);
  const projectToOpen = useDataUserStore((state) => state.projectToOpen);
  const setProjectToOpen = useDataUserStore((state) => state.setProjectToOpen);
  const setSectionToOpen = useDataUserStore((state) => state.setSectionToOpen);
  const setExpensesToOpen = useDataUserStore(
    (state) => state.setExpensesToOpen,
  );

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const saved = await AsyncStorage.getItem("user");

        if (saved) {
          const parsed = JSON.parse(saved);
          setUser(parsed);
        }
      } catch (error) {
        console.error("Ошибка при загрузке проектов:", error);
      }
    };

    loadProjects();
  }, []);

  const role = user?.role?.code;

  const pendingApproval = user?.status === "pending";

  const canManageProjectUsers = [
    "director",
    "deputy_director",
    "developer",
    "pto",
    "estimator_plus",
  ].includes(role);

  useEffect(() => {
    if (!canManageProjectUsers || !projectToOpen?.id) {
      return;
    }

    hydrateProjectAccess();
  }, [canManageProjectUsers, projectToOpen?.id]);

  const hydrateProjectAccess = async () => {
    const [accessList, usersList] = await Promise.all([
      listUserAccess(projectToOpen.id),
      getUsers(),
    ]);

    setProjectUserAccess(accessList);
    setAvailableUsers(usersList);
  };

  const openWorkersSheet = async () => {
    workersSheetRef.current?.show();
    const workers = await listProjectWorkers(projectData.id);
    setProjectWorkers(workers);
  };

  const openWorkerFormSheet = async () => {
    setSelectedWorker(null);
    setWorkerSearchQuery("");
    setWorkerSearchQuery("");
    setWorkerForm({
      full_name: "",
      phone: "",
      position: "",
    });
    workersSheetRef.current?.hide();
    setTimeout(async () => {
      workerFormSheetRef.current?.show();
      const workers = await searchWorkersCatalog();
      setWorkerCatalog(workers);
    }, 1000);
  };

  const canTransition = (from: string, to: string) => {
    // DEV / полный доступ
    if (
      [
        "developer",
        "director",
        "deputy_director",
        "inzhkom_b_manager",
      ].includes(role)
    ) {
      return true;
    }

    // PTO / Estimator Plus
    if (["pto", "estimator_plus"].includes(role)) {
      return from === "project_analysis" && to === "preparing_material_list";
    }

    // Brigadier
    if (role === "brigadier") {
      return (
        (from === "project_analysis" && to === "preparing_material_list") ||
        (from === "preparing_material_list" &&
          to === "preparing_work_schedule") ||
        (from === "preparing_contract" && to === "purchase_request")
      );
    }

    // Director (частичный, но уже покрыт выше, можно оставить)
    if (role === "director") {
      return from === "preparing_work_schedule" && to === "preparing_contract";
    }

    // Buyer
    if (role === "material_buyer") {
      return (
        (from === "purchase_request" && to === "supply") ||
        (from === "supply" && to === "delivery_confirmation")
      );
    }

    return false;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCost = (cost: string) => {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      minimumFractionDigits: 0,
    }).format(parseFloat(cost));
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const projectData = projectToOpen;

  const handleRefresh = async () => {
    if (!refreshing) {
      const updatedProject = await getProject(projectData.id);
      if (updatedProject) {
        setProjectToOpen(updatedProject);
        if (canManageProjectUsers) {
          await hydrateProjectAccess();
        }
      }
    }
  };

  const handleDelete = async () => {
    const success = await deleteProject(projectData.id);
    if (success) {
      bottomSheetRef.current.hide();
      router.push({
        pathname: "/content/listPage",
        params: { shouldRefresh: "true" },
      });
    }
  };

  const handleDeadlines = async (item: any) => {
    const update = await updateDeadlines(projectData.id, item);
    if (update) {
      bottomSheetRef.current.hide();
      handleRefresh();
    }
  };

  const handleSubmitEditSheet = async (cleanData: any) => {
    const update = await updateProject(projectData.id, cleanData);
    if (update) {
      bottomSheetRef.current.hide();
      handleRefresh();
    }
  };

  const handleUpdateStatus = async (item: any) => {
    const update = await updateStatus(projectData.id, item);
    if (update) {
      handleRefresh();
    }
  };

  const handleCreateSection = async (item: any, bigSectionId: string) => {
    const result = await createSection(projectData.id, item, bigSectionId);
    if (result) {
      handleRefresh();
    }
  };

  const getAvatarUri = (
    avatarPath?: string | null,
    version?: number | string,
  ) => {
    if (!avatarPath) {
      return null;
    }

    if (avatarPath.startsWith("http://") || avatarPath.startsWith("https://")) {
      if (!version) {
        return avatarPath;
      }

      const separator = avatarPath.includes("?") ? "&" : "?";
      return `${avatarPath}${separator}v=${version}`;
    }

    const baseUrl = `${API_URL.replace(/\/$/, "")}${avatarPath}`;

    if (!version) {
      return baseUrl;
    }

    return `${baseUrl}?v=${version}`;
  };

  const openDiscussionSheet = async () => {
    discussionSheetRef.current?.show();
    const comments = await listProjectComments(projectData.id);
    setDiscussionAvatarVersion(Date.now());
    setProjectComments(comments);
  };

  const openHistoryScreen = () => {
    router.push({
      pathname: "/inner_pages/project_history",
      params: {
        projectId: projectData.id,
        projectName: projectData.name,
      },
    });
  };

  const handleSendProjectComment = async () => {
    const trimmedBody = discussionBody.trim();

    if (!trimmedBody) {
      return;
    }

    const comment = await addProjectComment(projectData.id, trimmedBody);

    // console.log(comment);

    if (!comment) {
      return;
    }

    setDiscussionAvatarVersion(Date.now());
    setProjectComments((prev) => [comment, ...prev]);
    setDiscussionBody("");
  };

  const handleDeleteProjectComment = (comment: ProjectComment) => {
    Alert.alert(
      "Удалить комментарий",
      "Комментарий будет удалён из обсуждения.",
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const deleted = await deleteProjectComment(
              projectData.id,
              comment.id,
            );

            if (!deleted) {
              return;
            }

            setProjectComments((prev) =>
              prev.filter((item) => item.id !== comment.id),
            );
          },
        },
      ],
    );
  };

  const handleWorkerSearch = async (value: string) => {
    setWorkerSearchQuery(value);
    const workers = await searchWorkersCatalog(value);
    setWorkerCatalog(workers);
  };

  const handleSaveProjectWorker = async () => {
    const payload = selectedWorker?.id
      ? { worker_id: selectedWorker.id }
      : {
          full_name: workerForm.full_name.trim(),
          phone: workerForm.phone.trim() || undefined,
          position: workerForm.position.trim() || undefined,
        };

    if (!selectedWorker?.id && !workerForm.full_name.trim()) {
      Alert.alert(
        "Введите имя",
        "Укажите имя работника или выберите его из списка.",
      );
      return;
    }

    const worker = await addProjectWorker(projectData.id, payload);
    if (!worker) {
      return;
    }

    workerFormSheetRef.current?.hide();
    const workers = await listProjectWorkers(projectData.id);
    setProjectWorkers(workers);
  };

  const handleDeleteWorker = async (workerId: string) => {
    if (!workerId) {
      Alert.alert("Ошибка", "Работник не выбран");
      return;
    }

    Alert.alert(
      "Удалить работника",
      "Вы уверены, что хотите удалить работника?",
      [
        {
          text: "Отмена",
          style: "cancel",
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const deletedWorker = await deleteWorker(workerId);

            if (!deletedWorker) {
              Alert.alert("Ошибка", "Не удалось удалить работника");
              return;
            }

            setProjectWorkers((prev: any[]) =>
              prev.filter(
                (worker) =>
                  worker.id !== workerId && worker.worker_id !== workerId,
              ),
            );

            const refreshedWorkers =
              await searchWorkersCatalog(workerSearchQuery);

            setWorkerCatalog(refreshedWorkers);
          },
        },
      ],
    );
  };

  const handleUpdateWorker = async (item: any, itemId: any) => {
    if (!itemId?.id) {
      Alert.alert("Ошибка", "Работник не выбран");
      return;
    }

    if (!item.full_name.trim()) {
      Alert.alert("Ошибка", "Введите ФИО работника");
      return;
    }

    const updatedWorker = await updateWorker(itemId.id, {
      full_name: item.full_name.trim(),
      position: item.position.trim(),
      phone: item.phone.trim(),
    });

    if (!updatedWorker) {
      Alert.alert("Ошибка", "Не удалось обновить работника");
      return;
    }

    setProjectWorkers((prev: any[]) =>
      prev.map((worker) => {
        const workerMatchId = worker.worker_id || worker.id;

        if (workerMatchId !== itemId.id) {
          return worker;
        }

        return {
          ...worker,
          full_name: updatedWorker.full_name ?? item.full_name.trim(),
          position: updatedWorker.position ?? item.position.trim(),
          phone: updatedWorker.phone ?? item.phone.trim(),
        };
      }),
    );

    const refreshedWorkers = await searchWorkersCatalog(workerSearchQuery);

    setWorkerCatalog(refreshedWorkers);

    setSelectedWorker(null);
  };

  const handleDeleteProjectWorker = (worker: ProjectWorkerItem) => {
    Alert.alert("Убрать работника", `Удалить ${worker.full_name} из проекта?`, [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          const result = await deleteProjectWorker(
            projectData.id,
            worker.worker_id,
          );
          if (!result) {
            return;
          }

          const workers = await listProjectWorkers(projectData.id);
          setProjectWorkers(workers);
        },
      },
    ]);
  };

  const fetchProjects = async () => {
    try {
      if (pendingApproval) {
        setProjects([]);
        await AsyncStorage.removeItem("projectsData");
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

      await AsyncStorage.setItem("projectsData", JSON.stringify(data.projects));
    } catch (err) {
      console.error(
        "Ошибка загрузки:",
        err instanceof Error ? err.message : err,
      );
    }
  };

  // todo не удалять!!
  // const filteredUsers = availableUsers.filter((item) => {
  //   const isActive = item.status === "active";
  //   const matchesSearch =
  //     !userSearchQuery.trim() ||
  //     item.full_name
  //       ?.toLowerCase()
  //       .includes(userSearchQuery.trim().toLowerCase()) ||
  //     item.email?.toLowerCase().includes(userSearchQuery.trim().toLowerCase());
  //
  //   return isActive && matchesSearch;
  // });

  const getInitials = (fullName?: string) => {
    if (!fullName) {
      return "U";
    }

    return fullName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");
  };

  // console.log(projectData.material_sections[0].files);

  const openProjectMenu = () => {
    Alert.alert(
      projectData.name || "Проект",
      `Создан: ${formatDate(projectData.created_at)}\nОбновлён: ${formatDate(projectData.updated_at)}`,
      [
        {
          text: "Изменить проект",
          onPress: () => bottomSheetRef.current?.show(),
        },
        {
          text: "История изменений",
          onPress: () => openHistoryScreen(),
        },
        { text: "Закрыть", style: "cancel" },
      ],
    );
  };

  const capitalize = (text: any) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: Platform.OS === "ios" ? 0 : insets.top,
        },
      ]}
    >
      <Stack.Screen
        options={{
          headerShown: Platform.OS === "ios",
          title: "Объект",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: workspaceTheme.background },
          headerTintColor: workspaceTheme.primary,
          headerTitleStyle: { color: workspaceTheme.text },
          headerLeft: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Назад к объектам"
              hitSlop={6}
              onPress={() => {
                fetchProjects();
                router.back();
              }}
              style={styles.navigationBack}
            >
              <WorkspaceIcon
                name="chevron-back"
                size={19}
                color={workspaceTheme.primary}
              />

              <ThemedText
                numberOfLines={1}
                style={[
                  styles.navigationBackLabel,
                  { color: workspaceTheme.primary },
                ]}
              >
                Назад
              </ThemedText>
            </TouchableOpacity>
          ),

          headerRight: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Действия с объектом"
              hitSlop={6}
              onPress={openProjectMenu}
              style={styles.navigationMenu}
            >
              <WorkspaceIcon
                name="ellipsis-horizontal"
                size={20}
                color={workspaceTheme.primary}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <ProjectWorkspace
          project={projectData}
          role={role}
          canManageUsers={canManageProjectUsers}
          workerCount={projectWorkers.length}
          onBack={() => {
            fetchProjects();
            router.back();
          }}
          onMenu={openProjectMenu}
          onExpenses={() => {
            setExpensesToOpen(projectData.material_expenses || []);
            router.push({
              pathname: "/inner_pages/expensesPage",
              params: {
                projectId: projectData.id,
                projectStatus: projectData.status,
              },
            });
          }}
          onAccess={() =>
            router.push({
              pathname: "/inner_pages/access_page" as never,
              params: {
                projectId: projectData.id,
                projectStatus: projectData.status,
              } as never,
            })
          }
          onWorkers={openWorkersSheet}
          onDiscussion={openDiscussionSheet}
          onHistory={openHistoryScreen}
          onAddSection={() => bigSectionAddRef.current?.show()}
          onTransition={handleUpdateStatus}
          canTransition={canTransition}
          deadlines={
            role?.includes("brigadier") ||
            (role?.includes("dev") &&
              projectData.status === "preparing_work_schedule") ? (
              <DeadlinesForm
                initialCompany={projectData.company_deadline}
                initialSupplies={projectData.supplies_deadline}
                onSubmit={handleDeadlines}
              />
            ) : null
          }
          sections={
            <BigSectionsList
              bigSections={projectData.big_sections}
              projectId={projectData.id}
              projectStatus={projectData.status}
              role={role}
              formatCost={formatCost}
              capitalize={capitalize}
              onAdd={(item) => {
                setBigSectionId(item.id);
                sectionAddRef.current?.show();
              }}
            />
          }
        />
        <BottomSheet
          ref={bottomSheetRef}
          height={Platform.OS === "ios" ? 750 : 850}
          borderRadius={25}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
          }}
        >
          <EditProjectForm
            colorScheme={colorScheme}
            onSubmit={(cleanData) => handleSubmitEditSheet(cleanData)}
            onClose={() => bottomSheetRef.current.hide()}
            initialData={projectData}
            onDelete={() =>
              Alert.alert("Подтверждение", "Вы уверены?", [
                { text: "Отмена", style: "cancel" },
                {
                  text: "Удалить",
                  onPress: () => handleDelete(),
                },
              ])
            }
          />
        </BottomSheet>

        <BottomSheet
          ref={bigSectionAddRef}
          borderRadius={25}
          height={650}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
          }}
        >
          <CreateBigSectionForm
            projectId={projectData.id}
            onSubmit={handleRefresh}
            onClose={() => bigSectionAddRef.current.hide()}
            loading={loading}
          />
        </BottomSheet>
        <BottomSheet
          ref={sectionAddRef}
          borderRadius={25}
          height={760}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#1c1c1c" : "#fff",
          }}
        >
          <CreateSectionForm
            onSubmit={(name, bigSectionId) =>
              handleCreateSection(name, bigSectionId)
            }
            onClose={() => sectionAddRef.current.hide()}
            loading={loading}
            bigSectionId={bigSectionId}
          />
        </BottomSheet>

        <BottomSheet
          ref={discussionSheetRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 760 : 860}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
          }}
        >
          <View style={styles.discussionSheet}>
            <View style={styles.accessSheetHeader}>
              <View>
                <ThemedText style={styles.accessSheetTitle}>
                  Обсуждение проекта
                </ThemedText>
              </View>

              <TouchableOpacity
                style={styles.accessCloseButton}
                onPress={() => discussionSheetRef.current?.hide()}
              >
                <Ionicons name="close" size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            <View style={styles.discussionComposer}>
              <TextInput
                value={discussionBody}
                onChangeText={setDiscussionBody}
                placeholder="Написать комментарий"
                placeholderTextColor="#8E8E93"
                autoCorrect
                spellCheck
                autoCapitalize="sentences"
                multiline
                textAlignVertical="top"
                style={[
                  styles.discussionInput,
                  { color: colorScheme === "dark" ? "#fff" : "#111" },
                ]}
              />

              <TouchableOpacity
                style={[
                  styles.discussionSendButton,
                  (!discussionBody.trim() || sendingProjectComment) &&
                    styles.discussionSendButtonDisabled,
                ]}
                disabled={!discussionBody.trim() || sendingProjectComment}
                onPress={handleSendProjectComment}
              >
                {sendingProjectComment ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="paper-plane-outline"
                      size={16}
                      color="#fff"
                    />
                    <ThemedText style={styles.discussionSendText}>
                      Отправить
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.discussionListContent}
              contentContainerStyle={styles.discussionList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {loadingProjectComments ? (
                <View style={styles.accessLoading}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <ThemedText style={styles.accessHint}>
                    Загружаем комментарии
                  </ThemedText>
                </View>
              ) : projectComments.length ? (
                projectComments.map((comment) => {
                  const avatarUri = getAvatarUri(
                    comment.author.profile_photo_url,
                    comment.author.id === user?.id
                      ? discussionAvatarVersion
                      : undefined,
                  );

                  return (
                    <View
                      key={comment.id}
                      style={[
                        styles.discussionCard,
                        {
                          backgroundColor:
                            colorScheme === "dark"
                              ? "rgba(255,255,255,0.04)"
                              : "#f8f9fb",
                        },
                      ]}
                    >
                      {avatarUri ? (
                        <Image
                          source={{ uri: avatarUri }}
                          style={styles.discussionAvatar}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View
                          style={[
                            styles.discussionAvatar,
                            styles.discussionAvatarFallback,
                          ]}
                        >
                          <ThemedText style={styles.accessAvatarText}>
                            {getInitials(comment.author.full_name)}
                          </ThemedText>
                        </View>
                      )}

                      <View style={styles.discussionCardContent}>
                        <View style={styles.discussionCardHeader}>
                          <View style={styles.discussionMeta}>
                            <ThemedText style={styles.accessUserName}>
                              {comment.author.full_name}
                            </ThemedText>
                            <ThemedText style={styles.accessUserSecondary}>
                              {comment.author.role?.display_name ||
                                "Роль не указана"}
                            </ThemedText>
                          </View>
                          <View style={styles.discussionHeaderActions}>
                            <ThemedText style={styles.discussionDate}>
                              {formatCommentDate(comment.created_at)}
                            </ThemedText>
                            <TouchableOpacity
                              onPress={() =>
                                handleDeleteProjectComment(comment)
                              }
                              disabled={deletingProjectComment}
                              style={styles.commentDeleteButton}
                            >
                              <Ionicons
                                name="trash-outline"
                                size={16}
                                color="#dc3545"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>

                        <ThemedText style={styles.discussionBody}>
                          {comment.body}
                        </ThemedText>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={styles.accessEmpty}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={22}
                    color="#8E8E93"
                  />
                  <ThemedText style={styles.accessHint}>
                    Пока нет комментариев в обсуждении
                  </ThemedText>
                </View>
              )}
            </ScrollView>
          </View>
        </BottomSheet>

        <BottomSheet
          ref={participantsSheetRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 760 : 860}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
          }}
        >
          <ParticipantsSheet
            participants={projectParticipantsAccess}
            loading={loadingUserAccess}
            onClose={() => participantsSheetRef.current?.hide()}
            participantsSheetRef={participantsSheetRef}
            colorScheme={colorScheme}
            getAvatarUri={getAvatarUri}
            getInitials={getInitials}
          />
        </BottomSheet>

        <BottomSheet
          ref={workersSheetRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 760 : 820}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#131313" : "#fff",
          }}
        >
          <WorkersSheet
            workers={projectWorkers}
            loading={loadingProjectWorkers}
            saving={savingProjectWorker}
            onAdd={openWorkerFormSheet}
            onDelete={handleDeleteProjectWorker}
            onClose={() => workersSheetRef.current?.hide()}
            workersSheetRef={workersSheetRef}
            colorScheme={colorScheme}
            styles={styles}
          />
        </BottomSheet>

        <BottomSheet
          ref={workerFormSheetRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 760 : 860}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
          }}
        >
          <View style={styles.accessSheet}>
            <View style={styles.accessSheetBody}>
              <View style={styles.accessSheetHeader}>
                <View>
                  <ThemedText style={styles.accessSheetTitle}>
                    Добавить работника
                  </ThemedText>
                </View>

                <TouchableOpacity
                  style={[
                    styles.accessCloseButton,
                    {
                      backgroundColor:
                        colorScheme === "dark" ? "#2c2c2e" : "#f3f4f6",
                    },
                  ]}
                  onPress={() => workerFormSheetRef.current?.hide()}
                >
                  <Ionicons name="close" size={18} color="#8E8E93" />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.accessSearchBox,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#2c2c2e" : "#f3f4f6",
                  },
                ]}
              >
                <Ionicons name="search" size={18} color="#8E8E93" />
                <TextInput
                  value={workerSearchQuery}
                  onChangeText={handleWorkerSearch}
                  placeholder="Поиск работника"
                  placeholderTextColor="#8E8E93"
                  style={[
                    styles.accessSearchInput,
                    { color: colorScheme === "dark" ? "#fff" : "#111" },
                  ]}
                />
              </View>

              <View
                style={[
                  styles.accessPermissionCard,
                  {
                    backgroundColor:
                      colorScheme === "dark" ? "#232326" : "#f3f4f6",
                  },
                ]}
              >
                <ThemedText style={styles.accessPermissionTitle}>
                  Новый работник
                </ThemedText>

                <TextInput
                  value={workerForm.full_name}
                  onChangeText={(value) =>
                    setWorkerForm((prev) => ({ ...prev, full_name: value }))
                  }
                  placeholder="ФИО"
                  placeholderTextColor="#8E8E93"
                  autoCorrect
                  spellCheck
                  autoCapitalize="words"
                  style={[
                    styles.workerInput,
                    {
                      color: colorScheme === "dark" ? "#fff" : "#111",
                      backgroundColor:
                        colorScheme === "dark" ? "#2c2c2e" : "#fff",
                    },
                  ]}
                />
                <TextInput
                  value={workerForm.position}
                  onChangeText={(value) =>
                    setWorkerForm((prev) => ({ ...prev, position: value }))
                  }
                  placeholder="Должность"
                  placeholderTextColor="#8E8E93"
                  autoCorrect
                  spellCheck
                  autoCapitalize="words"
                  style={[
                    styles.workerInput,
                    {
                      color: colorScheme === "dark" ? "#fff" : "#111",
                      backgroundColor:
                        colorScheme === "dark" ? "#2c2c2e" : "#fff",
                    },
                  ]}
                />
                <TextInput
                  value={workerForm.phone}
                  onChangeText={(value) =>
                    setWorkerForm((prev) => ({ ...prev, phone: value }))
                  }
                  placeholder="Телефон"
                  placeholderTextColor="#8E8E93"
                  style={[
                    styles.workerInput,
                    {
                      color: colorScheme === "dark" ? "#fff" : "#111",
                      backgroundColor:
                        colorScheme === "dark" ? "#2c2c2e" : "#fff",
                    },
                  ]}
                />
              </View>

              <ScrollView
                style={styles.userPickerList}
                contentContainerStyle={styles.userPickerContent}
                showsVerticalScrollIndicator
                keyboardShouldPersistTaps="handled"
              >
                {loadingWorkersCatalog ? (
                  <View style={styles.accessLoading}>
                    <ActivityIndicator size="small" color="#007AFF" />
                    <ThemedText style={styles.accessHint}>
                      Ищем работников
                    </ThemedText>
                  </View>
                ) : (
                  workerCatalog.map((item) => {
                    const isSelected = selectedWorker?.id === item.id;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.userPickerCard,
                          {
                            borderColor:
                              colorScheme === "dark"
                                ? "rgba(255,255,255,0.08)"
                                : "rgba(0,0,0,0.08)",
                            backgroundColor:
                              colorScheme === "dark" ? "#232326" : "#fff",
                          },
                          isSelected && styles.userPickerCardSelected,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          setSelectedWorker(item);
                          setWorkerForm({
                            full_name: item.full_name || "",
                            phone: item.phone || "",
                            position: item.position || "",
                          });
                        }}
                      >
                        <View style={styles.accessAvatar}>
                          <ThemedText style={styles.accessAvatarText}>
                            {getInitials(item.full_name)}
                          </ThemedText>
                        </View>

                        <View style={styles.userPickerMeta}>
                          <ThemedText style={styles.accessUserName}>
                            {item.full_name}
                          </ThemedText>
                          <View
                            style={{
                              flexDirection: "row",
                            }}
                          >
                            {item.phone ? (
                              <ThemedText style={styles.accessUserSecondary}>
                                {item.phone} |
                              </ThemedText>
                            ) : null}
                            <ThemedText style={styles.accessUserSecondary}>
                              {" "}
                              {item.position || ""}
                            </ThemedText>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={{
                            padding: 6,
                            paddingHorizontal: 8,
                          }}
                          onPress={() => (
                            setEditWorkerModal(true),
                            setEditWorkerId(item)
                          )}
                        >
                          <AntDesign name="edit" size={24} color="#bbb" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={{
                            padding: 6,
                            paddingHorizontal: 8,
                          }}
                          onPress={() => handleDeleteWorker(item.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#dc3545"
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            </View>

            <View
              style={[
                styles.accessFooter,
                {
                  borderTopColor:
                    colorScheme === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                  backgroundColor:
                    colorScheme === "dark" ? "#1c1c1e" : "transparent",
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.accessSaveButton,
                  { marginBottom: insets.bottom },
                ]}
                disabled={savingProjectWorker}
                onPress={handleSaveProjectWorker}
              >
                {savingProjectWorker ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#fff"
                    />
                    <ThemedText style={styles.accessSaveText}>
                      Добавить
                    </ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </BottomSheet>

        {/*// todo*/}
        <EditWorkerModal
          visible={editWorkerModal}
          onClose={() => (setEditWorkerModal(false), setEditWorkerId(""))}
          onSave={(item: any) => handleUpdateWorker(item, editWorkerId)}
          selectedWorker={editWorkerId}
          saving={savingProjectWorker}
          colorScheme={colorScheme as "light" | "dark"}
        />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  navigationBack: {
    height: 32,
    paddingLeft: 4,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  navigationBackLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: "400",
    includeFontPadding: false,
  },
  navigationMenu: {
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    alignSelf: "center",
    marginLeft: 8,
  },
  container: {
    flex: 1,
  },
  accessSection: {
    marginBottom: 18,
    gap: 12,
  },
  accessSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#8E8E93",
    paddingHorizontal: 4,
  },
  accessCard: {
    borderRadius: 20,
    padding: 16,
    gap: 12,
    elevation: 1,
  },
  accessLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
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
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  accessUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  accessAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eaf2ff",
  },
  accessAvatarText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#007AFF",
  },
  accessUserMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  accessUserName: {
    fontSize: 15,
    fontWeight: "700",
  },
  accessUserSecondary: {
    fontSize: 13,
    color: "#8E8E93",
  },
  accessBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  accessBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#f3f4f6",
  },
  accessBadgeBlue: {
    backgroundColor: "rgba(13,110,253,0.12)",
  },
  accessBadgeGreen: {
    backgroundColor: "rgba(25,135,84,0.12)",
  },
  accessBadgeText: {
    fontSize: 12,
    color: "#8E8E93",
    fontWeight: "600",
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
    paddingHorizontal: 14,
    paddingBottom: 12,
    paddingTop: 7,
    flex: 1,
    gap: 6,
  },
  accessSheetContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 24,
    gap: 16,
  },
  accessSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 2,
  },
  accessSheetTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  accessSheetSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#8E8E93",
  },
  accessCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3f4f6",
  },
  accessSearchBox: {
    minHeight: 47,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  accessSearchInput: {
    paddingVertical: 14,
    fontSize: 15,
    flex: 1,
  },
  userPickerList: {
    borderRadius: 18,
    marginVertical: 10,
    borderWidth: 1,
    flex: 1,
    minHeight: 0,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "transparent",
  },
  userPickerSection: {
    flex: 1,
    minHeight: 0,
    gap: 10,
  },
  userPickerContent: {
    padding: 10,
    gap: 10,
  },
  userPickerCard: {
    // backgroundColor: "red",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  userPickerCardSelected: {
    borderColor: "#007AFF",
    backgroundColor: "rgba(0,122,255,0.04)",
  },
  userPickerMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  userPickerEmpty: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  accessPermissionCard: {
    borderRadius: 20,
    backgroundColor: "#f8fafc",
    padding: 16,
    gap: 14,
  },
  accessPermissionTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  permissionRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  permissionTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  permissionHint: {
    fontSize: 13,
    color: "#8E8E93",
    marginTop: 2,
  },
  permissionToggle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  permissionToggleActive: {
    backgroundColor: "#0d6efd",
  },
  permissionToggleActiveGreen: {
    backgroundColor: "#198754",
  },
  accessFooter: {
    flexDirection: "column",
    gap: 12,
    marginBottom: 18,
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(0,0,0,0.08)",
    backgroundColor: "transparent",
  },
  accessDeleteButton: {
    minHeight: 50,
    borderRadius: 15,
    paddingHorizontal: 16,
    backgroundColor: "rgba(220,53,69,0.08)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  accessDeleteText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#dc3545",
  },
  accessSaveButton: {
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 18,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
  },
  accessSaveText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  sectionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  addSectionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(60,124,227,0.13)",
  },
  statusBadge: {
    backgroundColor: "rgba(0,122,255,0.76)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    alignSelf: "flex-start",
  },

  statusButton: {
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    flexDirection: "row",
    paddingVertical: 15,
    marginBottom: 10,
    borderRadius: 16,
    gap: 10,
  },

  statusText: {
    color: "#fff",
    fontSize: 19,
    fontWeight: "600",
  },

  addSectionText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007AFF",
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
    // elevation: 1,
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
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
    height: 20,
    width: 1,
  },
  scrollContent: {
    paddingHorizontal: Layout.gutter,
    paddingBottom: 40,
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
  headerTitle: {
    fontWeight: "600",
    fontSize: 18,
  },

  codeContainer: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
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
    borderColor: "rgba(113,113,113,0.17)",
    borderWidth: 1,
    backgroundColor: "#fff",
    marginBottom: 16,
    borderRadius: 18,
    // elevation: 1,
    padding: 20,
  },
  statCard: {
    borderColor: "rgba(113,113,113,0.17)",
    borderWidth: 1,
    backgroundColor: "#fff",
    borderRadius: 16,
    // elevation: 1,
    padding: 16,
    flex: 1,
  },
  projectName: {
    letterSpacing: -0.5,
    fontWeight: "700",
    // marginBottom: 16,
    lineHeight: 34,
    fontSize: 28,
  },
  divider: {
    backgroundColor: "rgba(113,113,113,0.40)",
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
  objectCodeItem: {
    marginBottom: 10,
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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  discussionButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  discussionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(13,110,253,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  discussionTextWrap: {
    flex: 1,
    gap: 2,
  },
  discussionTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  discussionSubtitle: {
    fontSize: 13,
    color: "#8E8E93",
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
    marginBottom: 16,
    gap: 12,
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
    opacity: 0.5,
    fontSize: 14,
  },
  commentText: {
    marginBottom: 12,
    lineHeight: 22,
    fontSize: 16,
  },
  discussionSheet: {
    flex: 1,
    paddingHorizontal: 20,
  },
  discussionComposer: {
    gap: 12,
    marginBottom: 16,
  },
  discussionInput: {
    minHeight: 96,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "rgba(142,142,147,0.12)",
    fontSize: 15,
  },
  discussionSendButton: {
    height: 46,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  discussionSendButtonDisabled: {
    opacity: 0.45,
  },
  discussionSendText: {
    color: "#fff",
    fontWeight: "600",
  },
  discussionList: {
    flex: 1,
  },
  discussionListContent: {
    paddingBottom: 18,
    gap: 12,
  },
  discussionCard: {
    borderRadius: 18,
    padding: 10,
    flexDirection: "row",
    marginBottom: 10,
    gap: 12,
  },
  discussionAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  discussionAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(13,110,253,0.12)",
  },
  discussionCardContent: {
    flex: 1,
  },
  discussionCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  discussionHeaderActions: {
    alignItems: "flex-end",
    gap: 6,
  },
  discussionMeta: {
    flex: 1,
    gap: 1,
  },
  discussionDate: {
    fontSize: 12,
    color: "#8E8E93",
    marginTop: 2,
  },
  discussionBody: {
    fontSize: 14,
    lineHeight: 20,
  },
  commentDeleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(220,53,69,0.08)",
  },
  historyCard: {
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
  },
  historyTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  historyMeta: {
    fontSize: 13,
    color: "#8E8E93",
  },
  historySummaryList: {
    gap: 4,
    marginTop: 4,
  },
  historySummaryText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
  },
  participantCard: {
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    gap: 12,
  },
  participantMeta: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  workerInput: {
    minHeight: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
