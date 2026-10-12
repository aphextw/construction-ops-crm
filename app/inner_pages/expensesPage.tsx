import {
  TouchableOpacity,
  useColorScheme,
  StyleSheet,
  Platform,
  FlatList,
  View,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack, useLocalSearchParams } from "expo-router";
import {
  FontAwesome,
  FontAwesome5,
  FontAwesome6,
  Ionicons,
} from "@expo/vector-icons";
import Feather from "@expo/vector-icons/Feather";
import { BottomSheet } from "react-native-sheet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image } from "expo-image";

import { AddExpenseForm } from "@/components/expenseAddSheet/expenseAddForm";
import { EditExpenseForm } from "@/components/expenseEdit/expenseEditForm";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";

import { useDeleteExpense } from "@/hooks/expenses/expenseDelete";
import { useUpdateExpense } from "@/hooks/expenses/expenseEdit";
import { useCreateExpense } from "@/hooks/expenses/expenseAdd";
import { useGetProject } from "@/hooks/projectRefresh";
import { useDataUserStore } from "@/store/useStore";
import { FileUpload } from "@/components/fileLoadComponent/fileLoadComponent";
import { useToggleExpensePaid } from "@/hooks/expenses/expense_is_paid";
import { ShopSheet } from "@/components/expenseShopsSheet/shopSheet";
import { useUploadExpensePhoto } from "@/hooks/expenses/expense_photo_hook";
import * as DocumentPicker from "expo-document-picker";
import ImagePicker from "react-native-image-crop-picker";
import { useExpensePhotos } from "@/hooks/expenses/expense_photo_download";
import { ShopDirectoryItem } from "@/hooks/expenses/shopHook";
import { ExpensePhotosGallery } from "@/components/expense_stuff/photos_sheet";
import { Colors, Layout } from "@/constants/theme";
import { ActionHistorySheet } from "@/components/penaltiesForm/penaltiesForm";
import {
  ExpenseHistoryItem,
  useExpenseHistory,
} from "@/hooks/expenses/useExpenseHistory";
import { useProjectParticipantRating } from "@/hooks/project/useProjectParticipantRating";
import {
  ProjectMaterialImport,
  ProjectMaterialImportItem,
  useMaterialImport,
} from "@/hooks/expenses/useMaterialImport";
import { MaterialImportDraftSheet } from "@/components/expenseImportSheet/materialImportDraftSheet";
import { EditFieldForm } from "@/components/expense_stuff/SectionEditSheet";
import { useUpdateSection } from "@/hooks/section/SectionEdit";
import { useDeleteSection } from "@/hooks/section/SectionDelete";
import { useUploadSectionFile } from "@/hooks/section/SectionFileUpload";
import { SectionFiles } from "@/components/expense_stuff/SectionFiles";
import background from "react-native-keyboard-controller/src/components/KeyboardToolbar/compound/components/Background";
import { FileList } from "@/components/project_stuff/fileUploader";
import { useUploadExpenseFile } from "@/hooks/expenses/expenseFIleUpload";
import { useMaterialSectionDocument } from "@/hooks/expenses_additional/WordFileCreate";
import { useMaterials } from "@/hooks/materials/useMaterials";
import { useExpenseFileDownload } from "@/hooks/expenses/expenseFileDownload";
import { useDeleteExpenseFile } from "@/hooks/expenses/expenseFileDelete";
import { ScreenHeading, WorkspaceTabs, WorkspaceButton, WorkspaceIcon, useWorkspaceTheme } from "@/components/ui/workspace";

const EXPENSE_RATING_STATE_KEY = "expense_rating_state_v1";

export default function ExpensesPage() {
  const workspaceTheme = useWorkspaceTheme();
  const [expenseTab, setExpenseTab] = useState<"expenses" | "documents" | "details">("expenses");
  const PAGE_SIZE = 10;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [refreshingAll, setRefreshing] = useState(false);
  const addExpenseShopRef = useRef<any>(null);
  const bottomSheetRef = useRef<any>(null);
  const editRef = useRef<any>(null);
  const editSectionRef = useRef<any>(null);
  const photosRef = useRef<any>(null);
  const importDraftRef = useRef<any>(null);
  const [photoUris, setPhotoUris] = useState<Record<string, string>>({});
  const [missingPhotoIds, setMissingPhotoIds] = useState<
    Record<string, boolean>
  >({});
  const [historyVisible, setHistoryVisible] = useState(false);
  const [historyExpenseName, setHistoryExpenseName] = useState("");
  const [expenseHistory, setExpenseHistory] = useState<ExpenseHistoryItem[]>(
    [],
  );
  const [currentMaterialImport, setCurrentMaterialImport] =
    useState<ProjectMaterialImport | null>(null);
  const [materialImportItems, setMaterialImportItems] = useState<
    ProjectMaterialImportItem[]
  >([]);
  const [expenseReactionMap, setExpenseReactionMap] = useState<
    Record<string, -1 | 1>
  >({});
  const [viewerRoleCode, setViewerRoleCode] = useState("");
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [currentExpenseForShop, setCurrentExpenseForShop] = useState<any>(null);

  const { downloadDocument } = useMaterialSectionDocument();

  const setProjectToOpen = useDataUserStore((state) => state.setProjectToOpen);
  const projectToOpen = useDataUserStore((state) => state.projectToOpen);
  const sectionToOpen = useDataUserStore((state) => state.sectionToOpen);
  const setSectionToOpen = useDataUserStore((state) => state.setSectionToOpen);
  const params = useLocalSearchParams();

  const { downloadFile } = useExpenseFileDownload();
  const { uploadSecFile, loadingSecFile } = useUploadSectionFile();
  const { loadingExpenseHistory, getExpenseHistory } = useExpenseHistory();
  const { updateSection } = useUpdateSection();
  const { getProject, projectDataRefresh, refreshing } = useGetProject();
  const { uploadExpFile } = useUploadExpenseFile();
  const { togglePaid, loadingToggle } = useToggleExpensePaid();
  const { deleteExpense, loadingDelete } = useDeleteExpense();
  const { updateExpense, loadingUpdate } = useUpdateExpense();
  const { deleteSection } = useDeleteSection();
  const { createExpense, loadingAdd } = useCreateExpense();
  const { getPhotoUri, loadingMap } = useExpensePhotos();
  const { materials, loadingMaterials, materialsError, getMaterials } =
    useMaterials();
  const { uploadPhoto } = useUploadExpensePhoto();
  const { deleteExpenseFile } = useDeleteExpenseFile();
  const { ratingParticipantId, rateParticipant } =
    useProjectParticipantRating();
  const {
    uploadingImport,
    loadingImportDraft,
    parsingImport,
    confirmingImport,
    materialImportError,
    uploadImport,
    getImportDraft,
    parseImport,
    addImportToExpenses,
  } = useMaterialImport();

  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const expensesToOpen = useDataUserStore((state) => state.expensesToOpen);
  const setExpensesToOpen = useDataUserStore(
    (state) => state.setExpensesToOpen,
  );

  const projectParticipants = projectToOpen?.participants || [];

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [expensesToOpen]);

  const visibleExpenses = expensesToOpen.slice(0, visibleCount);

  useEffect(() => {
    const hydrateExpenseReactions = async () => {
      try {
        const saved = await AsyncStorage.getItem(EXPENSE_RATING_STATE_KEY);

        if (!saved) {
          return;
        }

        setExpenseReactionMap(JSON.parse(saved));
      } catch (error) {
        console.log("expense reaction hydrate error", error);
      }
    };

    hydrateExpenseReactions();
  }, []);

  useEffect(() => {
    const hydrateViewerRole = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        setViewerRoleCode(parsedUser?.role?.code || "");
      } catch (error) {
        console.log("viewer role hydrate error", error);
      }
    };

    hydrateViewerRole();
  }, []);

  // const pendingApproval = params.pendingApproval;

  const loadPhoto = async (photoId: string, expenseId: string) => {
    // если уже есть — не качаем повторно
    if (photoUris[photoId] || missingPhotoIds[photoId])
      return photoUris[photoId];

    const uri = await getPhotoUri(expenseId, params.projectId, photoId);

    if (uri) {
      setPhotoUris((prev) => ({
        ...prev,
        [photoId]: uri,
      }));
    } else {
      setMissingPhotoIds((prev) => ({
        ...prev,
        [photoId]: true,
      }));
    }

    return uri;
  };

  useEffect(() => {
    if (!expensesToOpen?.length) return;

    expensesToOpen.forEach((expense: any) => {
      expense.photos?.forEach((photo: any) => {
        loadPhoto(photo.id, expense.id);
      });
    });
  }, [expensesToOpen]);

  useEffect(() => {
    getMaterials();
  }, [getMaterials]);

  const projectStatus = params.projectStatus;
  const getVisibleExpenses = (materialExpenses: any[] = []) => {
    if (!params.sectionId) {
      return materialExpenses;
    }

    return materialExpenses.filter(
      (expense: any) => expense.section_id === params.sectionId,
    );
  };

  // const fetchProjects = async () => {
  //   try {
  //     if (pendingApproval) {
  //       setProjects([]);
  //       await AsyncStorage.removeItem("projectsData");
  //       return;
  //     }
  //
  //     const token = await SecureStore.getItem("access_token");
  //
  //     if (!token) {
  //       console.log("Нет токена");
  //       return;
  //     }
  //
  //     const response = api.get("api/v1/projects");
  //
  //     const data = await response;
  //
  //     setProjects(data.projects);
  //
  //     await AsyncStorage.setItem("projectsData", JSON.stringify(data.projects));
  //   } catch (err) {
  //     console.error(
  //       "Ошибка загрузки:",
  //       err instanceof Error ? err.message : err,
  //     );
  //   }
  // };

  const handleRefresh = async () => {
    const updatedProject = await getProject(params.projectId);
    if (updatedProject) {
      const filteredExpenses = getVisibleExpenses(
        updatedProject.material_expenses,
      );
      const refreshedSection = (updatedProject.material_sections || []).find(
        (section: any) => section.id === params.sectionId,
      );

      // await fetchProjects();
      setProjectToOpen(updatedProject);
      if (refreshedSection) {
        setSectionToOpen(refreshedSection);
      }
      setExpensesToOpen(filteredExpenses);
    }
  };

  const sectoinName: any = params.sectionName;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await handleRefresh();
    setRefreshing(false);
  }, []);

  const handleUpdateShop = async (shop: ShopDirectoryItem) => {
    if (!loadingUpdate && currentExpenseForShop) {
      const res = await updateExpense(
        params.projectId,
        currentExpenseForShop.id,
        { shop: shop.name },
      );

      if (res) {
        addExpenseShopRef.current.hide();

        handleRefresh();
      }
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!loadingDelete) {
      const success = await deleteExpense(params.projectId, expenseId);

      // console.log(success);

      if (success) {
        bottomSheetRef.current.hide();

        const updatedProject = await getProject(params.projectId);
        if (updatedProject) {
          const filteredExpenses = getVisibleExpenses(
            updatedProject.material_expenses,
          );

          setProjectToOpen(updatedProject);
          setExpensesToOpen(filteredExpenses);
        }
      }
    }
  };

  const handleUpdateExpense = async (data: any) => {
    if (!loadingUpdate && selectedExpense) {
      const res = await updateExpense(
        params.projectId,
        selectedExpense.id,
        data,
      );

      if (res) {
        editRef.current.hide();

        handleRefresh();
      }
    }
  };

  const pickAndUploadForExpense = async (expenseId: string) => {
    const MAX_PHOTO_SIZE_BYTES = 30 * 1024 * 1024;

    try {
      const image = await ImagePicker.openPicker({
        cropping: true,
        width: 300,
        height: 400,
        freeStyleCropEnabled: true,
        compressImageQuality: 0.8,
        mediaType: "photo",
      });

      if (image.size && image.size > MAX_PHOTO_SIZE_BYTES) {
        Alert.alert("Файл слишком большой", "Фото должно быть до 30 МБ");
        return;
      }

      const file = {
        uri: image.path,
        name: image.filename || `photo_${Date.now()}.jpg`,
        type: image.mime || "image/jpeg",
      };

      const res = await uploadPhoto(expenseId, params.projectId, file);

      if (res) {
        handleRefresh();
      }
    } catch (e: any) {
      if (e?.code === "E_PICKER_CANCELLED") {
        return;
      }

      console.log("Upload error:", e);
      Alert.alert("Ошибка", "Не удалось выбрать или загрузить фото");
    }
  };

  const handleAddExpense = async (item: any) => {
    if (!loadingAdd) {
      const newExpenseInfo = await createExpense(item, params.projectId);

      if (newExpenseInfo) {
        bottomSheetRef.current.hide();

        const updatedProject = await getProject(params.projectId);
        if (updatedProject) {
          const filteredExpenses = getVisibleExpenses(
            updatedProject.material_expenses,
          );

          setProjectToOpen(updatedProject);
          setExpensesToOpen(filteredExpenses);
        }
      }
    }
  };

  const handleTogglePaid = async (item: any) => {
    if (loadingToggle) return;

    const res = await togglePaid(params.projectId, item.id, item.is_paid);

    if (res) {
      const updatedProject = await getProject(params.projectId);

      if (updatedProject) {
        const filteredExpenses = getVisibleExpenses(
          updatedProject.material_expenses,
        );

        setProjectToOpen(updatedProject);
        setExpensesToOpen(filteredExpenses);
      }
    }
  };

  const pickAndUploadSectionImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      const file = {
        uri: asset.uri,
        name: asset.name ?? "file",
        type: asset.mimeType ?? "application/octet-stream",
      };

      const uploadedImport = await uploadImport(
        params.projectId as string,
        file,
      );

      if (uploadedImport) {
        setCurrentMaterialImport(uploadedImport);
        setMaterialImportItems([]);
        importDraftRef.current?.show();

        const draft = await getImportDraft(
          params.projectId as string,
          uploadedImport.id,
        );

        if (draft) {
          setCurrentMaterialImport(draft.material_import);
          setMaterialImportItems(draft.items);
        }
      }
    } catch (e) {
      console.log("Upload error:", e);
    }
  };

  const handleParseMaterialImport = async () => {
    if (!currentMaterialImport) {
      return;
    }

    await parseImport(params.projectId as string, currentMaterialImport.id);

    const draft = await getImportDraft(
      params.projectId as string,
      currentMaterialImport.id,
    );

    if (draft) {
      setCurrentMaterialImport(draft.material_import);
      setMaterialImportItems(draft.items);
    }
  };

  const handleConfirmMaterialImport = async () => {
    if (!currentMaterialImport || !params.sectionId) {
      return;
    }

    const result = await addImportToExpenses(
      params.projectId as string,
      currentMaterialImport.id,
      params.sectionId as string,
    );

    if (result?.project) {
      const visibleExpenses = getVisibleExpenses(
        result.project.material_expenses,
      );
      setProjectToOpen(result.project);
      setExpensesToOpen(visibleExpenses);
      importDraftRef.current?.hide();
      setCurrentMaterialImport(null);
      setMaterialImportItems([]);
      Alert.alert("Готово", "Черновик добавлен в расходы раздела");
    }
  };

  const capitalize = (text: any) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  const getExpenseAuthorsLabel = (item: any) => {
    const authors = [
      item.created_by?.full_name,
      item.updated_by?.full_name,
    ].filter(Boolean);

    const uniqueAuthors = [...new Set(authors)];

    if (!uniqueAuthors.length) {
      return "Авторы: не указаны";
    }

    return "Авторы";
  };

  const confirmDeleteExpense = (expenseId: string) => {
    Alert.alert("Подтверждение", "Вы уверены?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => handleDeleteExpense(expenseId),
      },
    ]);
  };

  const openExpenseHistory = async (item: any) => {
    setSelectedExpense(item);
    setHistoryExpenseName(capitalize(item.material_type) || "История расхода");
    setHistoryVisible(true);

    const history = await getExpenseHistory(
      params.projectId as string,
      item.id,
    );
    setExpenseHistory(history);
  };

  const openExpenseMenu = (item: any) => {
    Alert.alert(
      "Расход " + capitalize(item.material_type) || "Расход",
      "Выберите действие",
      [
        {
          text: "Изменить",
          onPress: () => {
            setSelectedExpense(item);
            editRef.current.show();
          },
        },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => confirmDeleteExpense(item.id),
        },
        { text: "Отмена", style: "cancel" },
      ],
    );
  };

  const persistExpenseReactionMap = async (nextMap: Record<string, -1 | 1>) => {
    setExpenseReactionMap(nextMap);
    await AsyncStorage.setItem(
      EXPENSE_RATING_STATE_KEY,
      JSON.stringify(nextMap),
    );
  };

  const handleRateParticipant = async (
    expenseId: string,
    participantId: string,
    value: -1 | 1,
  ) => {
    const reactionKey = `${params.projectId}:${expenseId}:${participantId}`;
    const currentValue = expenseReactionMap[reactionKey];
    const nextValue = currentValue === value ? 0 : value;

    const response = await rateParticipant(
      params.projectId as string,
      participantId,
      nextValue as -1 | 0 | 1,
    );

    if (response?.project) {
      setProjectToOpen(response.project);

      const nextMap = { ...expenseReactionMap };

      if (nextValue === 0) {
        delete nextMap[reactionKey];
      } else {
        nextMap[reactionKey] = nextValue;
      }

      await persistExpenseReactionMap(nextMap);
    }
  };

  const handlePhotoDeleteRefresh = async (success: boolean) => {
    if (success) {
      handleRefresh();
    }
  };

  const handleEditSection = async (value: any) => {
    const success = await updateSection(
      params.projectId,
      params.sectionId,
      value,
    );
    if (success) {
      editSectionRef.current?.hide();
      handleRefresh();
    }
  };

  const handleDeleteSection = async () => {
    const success = await deleteSection(params.projectId, params.sectionId);
    if (success) {
      handleRefresh();
      router.back();
    }
  };

  const pickAndUploadExp = async (itemId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      const file = {
        uri: asset.uri,
        name: asset.name ?? "file",
        type: asset.mimeType ?? "application/octet-stream",
      };

      const res = await uploadExpFile(
        params.projectId,
        itemId,
        "document",
        file,
      );

      if (res) {
        handleRefresh();
      }
    } catch (e) {
      console.log("Upload error:", e);
    }
  };

  const pickAndUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];

      const file = {
        uri: asset.uri,
        name: asset.name ?? "file",
        type: asset.mimeType ?? "application/octet-stream",
      };

      const res = await uploadSecFile(
        params.projectId,
        sectionData.id,
        "document",
        file,
      );

      if (res) {
        handleRefresh();
      }
    } catch (e) {
      console.log("Upload error:", e);
    }
  };

  const sectionData = useMemo(() => {
    if (sectionToOpen && !Array.isArray(sectionToOpen) && sectionToOpen.id) {
      return sectionToOpen;
    }

    if (!params.sectionId) {
      return null;
    }

    return (projectToOpen?.material_sections || []).find(
      (section: any) => section.id === params.sectionId,
    );
  }, [params.sectionId, projectToOpen?.material_sections, sectionToOpen]);

  const handleReadFile = async (item: any) => {
    router.push({
      pathname: "/inner_pages/pdf_viewer",
      params: {
        file: JSON.stringify(item),
        projectId: params.projectId,
        sectionId: params.sectionId,
      },
    });
  };

  const deleteExpenseFileFunc = async (itemId: string, file: any) => {
    const res = await deleteExpenseFile(itemId, params.projectId, file.id);
    if (res) {
      handleRefresh();
    }
  };

  const renderItem = ({ item }: any) => {
    const total = parseFloat(item.line_total) || 0;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const quantity = parseFloat(item.quantity) || 0;

    const isDarkTheme = colorScheme === "dark";

    return (
      <View style={[styles.card, colorScheme === "dark" && styles.cardDark]}>
        {/* TOP ROW */}
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            {/* Оплачено */}
            {item.is_paid && (
              <View style={styles.paidBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#34C759" />
                <ThemedText style={styles.paidText}>Оплачено</ThemedText>
              </View>
            )}

            {/* TITLE */}
            <ThemedText
              style={[
                styles.title,
                { fontSize: 17, lineHeight: 23 },
              ]}
            >
              {capitalize(item.material_type)}
            </ThemedText>

            {/* SHOP */}
            {projectStatus !== "project_analysis" && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setCurrentExpenseForShop(item);
                  addExpenseShopRef.current.show();
                }}
                style={styles.shopChip}
              >
                <Ionicons name="business" size={14} color="#007AFF" />
                <ThemedText style={styles.shopText}>
                  {item.shop || "Магазин не выбран"}
                </ThemedText>
                <Ionicons name="chevron-down" size={12} color="#007AFF" />
              </TouchableOpacity>
            )}
          </View>

          {/* ACTIONS */}
          {params.sectionName && (
            <View style={styles.actions}>
              <TouchableOpacity
                onPress={() => openExpenseMenu(item)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor:
                      colorScheme === "dark"
                        ? "rgba(255,255,255,0.05)"
                        : "#f2f2f2",
                  },
                ]}
              >
                <WorkspaceIcon name="ellipsis-horizontal" size={21} color={workspaceTheme.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        {/* TOTAL */}
        <View style={{}}>
          <ThemedText style={styles.total}>
            {total.toLocaleString("ru-RU")} ₽
          </ThemedText>
        </View>
        {/* SUB */}
        {projectStatus !== "project_analysis" && (
          <ThemedText style={styles.sub}>
            {quantity} × {unitPrice.toLocaleString("ru-RU")} ₽
          </ThemedText>
        )}
        {/* COMMENT */}
        {item.comment && (
          <ThemedText numberOfLines={2} style={styles.comment}>
            {item.comment}
          </ThemedText>
        )}
        {/* ФОТО */}
        {!["project_analysis", "preparing_work_schedule"].includes(
          projectStatus as string,
        ) && (
          <>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                onPress={() => pickAndUploadForExpense(item.id)}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Добавить фото расхода"
                style={styles.fileUploadButton}
              >
                <WorkspaceIcon name="camera-outline" size={21} color={workspaceTheme.primary} />
              </TouchableOpacity>

              {item.photos.length !== 0 &&
                (() => {
                  const reversedPhotos = [...item.photos]
                    .reverse()
                    .filter((photo: any) => !missingPhotoIds[photo.id]);
                  const visiblePhotos = reversedPhotos.slice(0, 3);
                  const remainingCount =
                    reversedPhotos.length - visiblePhotos.length;

                  if (!visiblePhotos.length) {
                    return null;
                  }

                  return (
                    <TouchableOpacity
                      style={{ flexDirection: "row", gap: 10 }}
                      onPress={() => {
                        setSelectedExpense(item);
                        photosRef.current.show();
                      }}
                    >
                      {visiblePhotos.map((photo: any, index: number) => {
                        const uri = photoUris[photo.id];
                        const isLast = index === visiblePhotos.length - 1;

                        return (
                          <View
                            key={photo.id}
                            style={{
                              backgroundColor: "#f0f0f0",
                              justifyContent: "center",
                              overflow: "hidden",
                              borderRadius: 8,
                              height: 60,
                              width: 60,
                            }}
                          >
                            {uri ? (
                              <Image
                                source={{ uri }}
                                style={{ width: "100%", height: "100%" }}
                                contentFit="cover"
                              />
                            ) : (
                              <ActivityIndicator size="small" />
                            )}

                            {remainingCount > 0 && isLast && (
                              <View
                                style={{
                                  backgroundColor: "rgba(0,0,0,0.5)",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  position: "absolute",
                                  bottom: 0,
                                  right: 0,
                                  left: 0,
                                  top: 0,
                                }}
                              >
                                <ThemedText
                                  style={{ color: "#fff", fontWeight: "600" }}
                                >
                                  +{remainingCount}
                                </ThemedText>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </TouchableOpacity>
                  );
                })()}
            </View>
            <View style={styles.divider} />
          </>
        )}

        {!["project_analysis", "preparing_work_schedule"].includes(
          projectStatus as string,
        ) && (
          <FileList
            typeOfList={"inExpense"}
            onUpload={() => pickAndUploadExp(item.id)}
            showFileNames
            files={item.files}
            ids={[params.projectId, item.id]}
            onFilePress={(file) => downloadFile(file.url, file.content_type)}
            onFileLongPress={(file) => deleteExpenseFileFunc(item.id, file)}
          />
        )}

        <View style={styles.divider} />
        {/* FOOTER */}
        <View style={styles.footer}>
          <View style={styles.footerMetaGroup}>
            <TouchableOpacity
              onPress={() => {
                openExpenseHistory(item);
              }}
              style={[
                styles.creatorChip,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Авторы и история расхода"
            >
              <WorkspaceIcon name="people-outline" size={18} color={workspaceTheme.primary} />
              <ThemedText style={[styles.sub, { color: workspaceTheme.primary }]}>
                {getExpenseAuthorsLabel(item)}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <ThemedText style={styles.sub}>
              {new Date(item.created_at).toLocaleDateString("ru-RU")}
            </ThemedText>
          </View>
        </View>
        {params.sectionName &&
          projectStatus !== "project_analysis" &&
          projectStatus !== "preparing_material_list" &&
          projectStatus !== "preparing_contract" &&
          projectStatus !== "preparing_work_schedule" && (
            <TouchableOpacity
              disabled={loadingToggle}
              // onPress={() => handleTogglePaid(item)}
              onPress={() => {
                const total = parseFloat(item.line_total) || 0;
                const hasPhotos = item.photos?.length > 0;

                if (total <= 0 && !hasPhotos) {
                  Alert.alert(
                    "Недостаточно данных",
                    "Перед оплатой укажите стоимость и приложите фото.",
                  );
                  return;
                }

                if (total <= 0) {
                  Alert.alert(
                    "Не указана стоимость",
                    "Перед оплатой укажите стоимость расхода.",
                  );
                  return;
                }

                if (!hasPhotos) {
                  Alert.alert("Нет фото", "Перед оплатой приложите фото.");
                  return;
                }

                handleTogglePaid(item);
              }}
              style={[
                styles.paidBadge,
                {
                  alignSelf: "flex-end",
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  opacity: loadingToggle ? 0.5 : 1,
                },
              ]}
            >
              <ThemedText style={{ fontSize: 17 }}>{item.is_paid ? "Отменить оплату" : "Отметить оплату"}</ThemedText>
              <Ionicons
                name={item.is_paid ? "close-circle" : "checkmark-circle"}
                size={26}
                color={item.is_paid ? "#ec4848" : "#34C759"}
              />
            </TouchableOpacity>
          )}
      </View>
    );
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
      <Stack.Screen options={{
        headerShown: Platform.OS === "ios",
        title: "Расходы",
        headerBackTitle: "Объект",
        headerShadowVisible: false,
        headerStyle: { backgroundColor: workspaceTheme.background },
        headerTintColor: workspaceTheme.primary,
        headerTitleStyle: { color: workspaceTheme.text },
        headerRight: () => params.sectionName ? <TouchableOpacity accessibilityLabel="Изменить или удалить подраздел" onPress={() => Alert.alert("Подраздел", undefined, [{ text: "Изменить", onPress: () => editSectionRef.current?.show() }, { text: "Удалить", style: "destructive", onPress: handleDeleteSection }, { text: "Отмена", style: "cancel" }])} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><WorkspaceIcon name="ellipsis-horizontal" size={22} color={workspaceTheme.primary} /></TouchableOpacity> : undefined,
      }} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl refreshing={refreshingAll} onRefresh={onRefresh} />
        }
      >
        <View
          style={[
            styles.header,
            { paddingHorizontal: Layout.gutter, display: Platform.OS === "ios" ? "none" : "flex" },
          ]}
        >
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

          {params.sectionName ? (
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
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(
                  "Раздел " + capitalize(sectoinName),
                  "Выберите действие",
                  [
                    {
                      text: "Изменить",
                      onPress: () => {
                        editSectionRef.current.show();
                      },
                    },
                    {
                      text: "Удалить",
                      style: "destructive",
                      onPress: handleDeleteSection,
                    },
                    { text: "Отмена", style: "cancel" },
                  ],
                )
              }
            >
              <Feather
                style={{ left: 0 }}
                name="more-vertical"
                size={22}
                color={colorScheme === "dark" ? "#f2f2f2" : "#000"}
              />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
        </View>

        <View style={{ paddingHorizontal: Layout.gutter }}>
          <ScreenHeading compact title={params.sectionName ? capitalize(sectoinName) : "Расходы"} detail={projectToOpen?.name}
            action={params.sectionName ? <TouchableOpacity onPress={() => bottomSheetRef.current?.show()} accessibilityLabel="Добавить расход" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}><WorkspaceIcon name="add" size={24} color={workspaceTheme.primary} /></TouchableOpacity> : undefined} />
          {params.sectionName ? <WorkspaceTabs value={expenseTab} onChange={setExpenseTab} options={[{ key: "expenses", label: "Расходы" }, { key: "documents", label: "Документы" }, { key: "details", label: "Реквизиты" }]} /> : null}
        </View>

        {params.sectionName && expenseTab === "details" && (
          <>
            <View
              style={[
                styles.sectionInfoCard,
                {
                  marginHorizontal: Layout.gutter,
                  backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
                },
              ]}
            >
              <View style={styles.sectionInfoHeader}>
                <View style={styles.sectionInfoTitleContainer}>
                  <ThemedText style={styles.sectionInfoTitle}>
                    {capitalize(params.name || "Раздел")}
                  </ThemedText>

                  {!!params.section_code && (
                    <View style={styles.sectionCodeBadge}>
                      <ThemedText style={styles.sectionCodeText}>
                        {params.section_code}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.sectionInfoGrid}>
                <View style={styles.sectionInfoItem}>
                  <ThemedText style={styles.sectionInfoLabel}>
                    Номер раздела
                  </ThemedText>

                  <ThemedText style={styles.sectionInfoValue}>
                    {params.number || "—"}
                  </ThemedText>
                </View>

                <View style={styles.sectionInfoItem}>
                  <ThemedText style={styles.sectionInfoLabel}>
                    Номер части
                  </ThemedText>

                  <ThemedText style={styles.sectionInfoValue}>
                    {params.part_number || "—"}
                  </ThemedText>
                </View>

                <View style={styles.sectionInfoItem}>
                  <ThemedText style={styles.sectionInfoLabel}>
                    Наименование части
                  </ThemedText>

                  <ThemedText style={styles.sectionInfoValue}>
                    {params.part_name || "—"}
                  </ThemedText>
                </View>

                <View style={styles.sectionInfoItem}>
                  <ThemedText style={styles.sectionInfoLabel}>Том</ThemedText>

                  <ThemedText style={styles.sectionInfoValue}>
                    {params.volume || "—"}
                  </ThemedText>
                </View>
              </View>
            </View>

          </>
        )}

        {params.sectionName && expenseTab === "documents" && (
          <>
            <View style={{ marginHorizontal: Layout.gutter, marginBottom: 20 }}>
              <WorkspaceButton title="Экспорт в Word" icon="receipt-outline" secondary onPress={() => params.sectionId ? downloadDocument(params.projectId, String(params.sectionId)) : Alert.alert("Не удалось определить раздел")} />
            </View>
            <FileUpload
              onUpload={pickAndUploadSectionImport}
              sectionName={params.sectionName}
              colorScheme={colorScheme}
              label="Импорт расходов"
              title="Загрузить расходы из файла"
              subtitle="PDF, XLSX, DOCX"
            />

            <SectionFiles
              files={sectionData?.files || []}
              loading={loadingSecFile}
              onUpload={pickAndUpload}
              onRefresh={handleRefresh}
              onFilePress={handleReadFile}
              colorScheme={colorScheme}
              params={params}
            />
          </>
        )}

        {(!params.sectionName || expenseTab === "expenses") && <>
        <View
          style={[
            styles.scrollContent,
            {
              paddingHorizontal: Layout.gutter,
              marginTop: 10,
            },
          ]}
        >
          {visibleExpenses.length ? (
            visibleExpenses.map((item: any, index: any) => (
              <View key={item.id || index}>{renderItem({ item })}</View>
            ))
          ) : (
            <View
              style={[
                styles.emptyExpensesCard,
                {
                  backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
                },
              ]}
            >
              <ThemedText style={styles.emptyExpensesTitle}>
                Нет расходов
              </ThemedText>
              <ThemedText style={styles.emptyExpensesText}>
                Здесь пока ничего нет. Добавь первый расход, и он появится в
                списке.
              </ThemedText>
            </View>
          )}
        </View>

        {visibleCount < expensesToOpen.length && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            style={[
              styles.loadMoreButton,
              {
                backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
                marginHorizontal: Layout.gutter,
              },
            ]}
          >
            <ThemedText style={styles.loadMoreText}>Загрузить еще</ThemedText>
          </TouchableOpacity>
        )}
        </>}

        <BottomSheet
          borderRadius={25}
          ref={addExpenseShopRef}
          // onOpenStart={}
          height={Platform.OS === "ios" ? 750 : 850}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          }}
        >
          <ShopSheet
            onSelect={handleUpdateShop}
            colorScheme={colorScheme}
            selectedShop={currentExpenseForShop?.shop}
          />
        </BottomSheet>

        <BottomSheet
          ref={bottomSheetRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 750 : 850}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          }}
        >
          <AddExpenseForm
            sectionId={params.sectionId}
            onSubmit={(item) => handleAddExpense(item)}
            onClose={() => {
              bottomSheetRef.current.hide();
            }}
            sectionName={params.sectionName}
            materials={materials}
            loadingMaterials={loadingMaterials}
            materialsError={materialsError}
            projectStatus={projectStatus}
          />
        </BottomSheet>

        <BottomSheet
          ref={editRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 750 : 850}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          }}
        >
          {selectedExpense && (
            <EditExpenseForm
              loading={loadingUpdate}
              initialData={{
                material_type: selectedExpense.material_type || "",
                quantity: selectedExpense.quantity || "",
                unit_price: selectedExpense.unit_price || "",
                actual_unit_price: selectedExpense.actual_unit_price || "",
                due_at: selectedExpense.due_at || "",
                comment: selectedExpense.comment || "",
              }}
              onSubmit={handleUpdateExpense}
              onClose={() => editRef.current.hide()}
            />
          )}
        </BottomSheet>

        <BottomSheet
          ref={photosRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 750 : 850}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          }}
        >
          <ExpensePhotosGallery
            expenses={expensesToOpen}
            projectId={params.projectId}
            expenseId={selectedExpense ? selectedExpense.id : ""}
            onClose={() => photosRef.current?.hide()}
            onDelete={handlePhotoDeleteRefresh}
          />
        </BottomSheet>

        <BottomSheet
          ref={importDraftRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 760 : 860}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          }}
        >
          <MaterialImportDraftSheet
            colorScheme={colorScheme}
            materialImport={currentMaterialImport}
            items={materialImportItems}
            loadingDraft={loadingImportDraft || uploadingImport}
            parsingImport={parsingImport}
            confirmingImport={confirmingImport}
            importError={materialImportError}
            sectionName={params.sectionName}
            onParse={handleParseMaterialImport}
            onConfirm={handleConfirmMaterialImport}
            onClose={() => importDraftRef.current?.hide()}
          />
        </BottomSheet>

        <BottomSheet
          ref={editSectionRef}
          borderRadius={25}
          height={Platform.OS === "ios" ? 750 : 850}
          sheetStyle={{
            backgroundColor: colorScheme === "dark" ? "#000" : "#fff",
          }}
        >
          <EditFieldForm
            initialValue={sectoinName}
            fieldLabel="Название"
            fieldPlaceholder="Введите название..."
            onSubmit={({ value }) => {
              handleEditSection(value);
            }}
            onClose={() => {
              editSectionRef.current.hide();
            }}
          />
        </BottomSheet>

        <ActionHistorySheet
          visible={historyVisible}
          onClose={() => setHistoryVisible(false)}
          loading={loadingExpenseHistory}
          expenseName={historyExpenseName}
          history={expenseHistory}
          participants={projectParticipants}
          onRateParticipant={handleRateParticipant}
          ratingParticipantId={ratingParticipantId}
          expenseReactionMap={expenseReactionMap}
          projectId={params.projectId as string}
          expenseId={selectedExpense?.id}
          viewerRoleCode={viewerRoleCode}
        />
      </ScrollView>

    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  sectionInfoCard: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 14,
    gap: 18,
  },

  sectionInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  sectionInfoTitleContainer: {
    flex: 1,
    gap: 10,
  },

  sectionInfoTitle: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 34,
  },

  sectionCodeBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,122,255,0.12)",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  sectionCodeText: {
    color: "#007AFF",
    fontSize: 13,
    fontWeight: "700",
  },

  sectionInfoGrid: {
    gap: 14,
  },

  sectionInfoItem: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 4,
  },

  sectionInfoLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "500",
  },

  sectionInfoValue: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
  },

  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(120,120,128,0.16)",
  },

  costsContainer: {
    flexDirection: "row",
    gap: 12,
  },

  costCard: {
    flex: 1,
    backgroundColor: "rgba(120,120,128,0.08)",
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },

  costLabel: {
    fontSize: 13,
    color: "#8E8E93",
    fontWeight: "600",
  },

  costValue: {
    fontSize: 18,
    fontWeight: "700",
  },

  totalCostCard: {
    backgroundColor: "rgba(0,122,255,0.10)",
    borderRadius: 20,
    padding: 18,
    gap: 6,
  },

  totalCostLabel: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },

  totalCostValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#007AFF",
    letterSpacing: -0.5,
  },

  statsRow: {
    flexDirection: "row",
    gap: 10,
  },

  statBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: "rgba(120,120,128,0.08)",
  },

  statBadgeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chip: {
    minHeight: 38,
    borderRadius: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(142,142,147,0.2)",
    borderColor: "rgba(142,142,147,0.4)",
  },
  loadMoreButton: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 100,
  },

  createCard: {
    gap: 10,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: "#fff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  loadMoreText: {
    fontSize: 16,
    fontWeight: "600",
  },

  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    backgroundColor: "#34C75915",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 6,
  },

  fileUploadButton: {
    backgroundColor: '"rgba(13,110,253,0.12)"',
    borderColor: '"rgba(13,110,253,0.8)"',
    justifyContent: "center",
    paddingHorizontal: 12,
    alignItems: "center",
    paddingVertical: 8,
    overflow: "hidden",
    borderRadius: 16,
    borderWidth: 1,
    height: 60,
    width: 60,
    gap: 6,
  },

  fileUploadText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0d6efd",
  },

  paidText: {
    fontSize: 11,
    color: "#34C759",
    fontWeight: "500",
  },

  actions: {
    flexDirection: "row",
    gap: 8,
  },

  iconBtn: {
    padding: 8,
    borderRadius: 10,
  },
  shopButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  emptyExpensesCard: {
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 22,
    gap: 8,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
  },
  emptyExpensesTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  emptyExpensesText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#8E8E93",
  },
  card: {
    gap: 10,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  metaRow: {
    marginTop: 14,
    marginBottom: 6,
  },

  priceValue: {
    fontSize: 35,
    fontWeight: "800",
  },

  commentText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },

  footer: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
  },
  footerMetaGroup: {
    flex: 1,
  },
  creatorChip: {
    minHeight: 44,
    paddingVertical: 9,
    paddingRight: 9,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },

  cardDark: {
    backgroundColor: "#1c1c1e",
  },

  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  title: {
    fontSize: 22,
    fontWeight: "600",
  },

  shopChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,122,255,0.1)",
    alignSelf: "flex-start",
    marginBottom: 16,
    marginTop: 11,
  },

  shopText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#007AFF",
  },

  menuBtn: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },

  total: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
    // backgroundColor: "red",
    marginBottom: 2,
  },

  sub: {
    fontSize: 15,
    color: "#8E8E93",
  },

  comment: {
    fontSize: 15,
    color: "#8E8E93",
    marginBottom: 12,
  },

  divider: {
    backgroundColor: "rgba(113,113,113,0.40)",
    height: 1,
  },

  userRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  userText: {
    fontSize: 14,
    color: "#8E8E93",
  },

  rateText: {
    fontSize: 14,
    color: "#007AFF",
  },

  metaText: {
    fontSize: 13,
    color: "#8E8E93",
  },
  button: {
    borderColor: "rgba(142,142,147,0.6)",
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    borderRadius: 25,
    borderWidth: 1,
    bottom: 50,
    height: 62,
    right: 15,
    width: 62,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },
  materialCard: {
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  materialCardDark: {
    backgroundColor: "#1c1c1e",
    shadowColor: "#fff",
    shadowOpacity: 0.02,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  typeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#007AFF15",
    alignItems: "center",
    justifyContent: "center",
  },
  typeIconText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#007AFF",
  },
  cardHeaderContent: {
    flex: 1,
    gap: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  materialType: {
    fontSize: 19,
    fontWeight: "600",
    flex: 1,
  },
  quantityPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    marginBottom: 9,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 4,
  },
  quantityPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#007AFF",
  },
  priceGridDark: {
    backgroundColor: "#2c2c2e",
  },
  priceGridItem: {
    flex: 1,
    alignItems: "center",
  },
  priceGridDivider: {
    width: 1,
    backgroundColor: "#e5e5e5",
    marginHorizontal: 8,
  },
  priceGridLabel: {
    fontSize: 12,
    color: "#8E8E93",
    marginBottom: 4,
  },
  priceGridValue: {
    fontSize: 20,
    fontWeight: "600",
  },
  totalGridValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#007AFF",
  },
  commentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f2f2f2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  commentChipText: {
    fontSize: 13,
    color: "#666",
    flex: 1,
  },
  footerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPlaceholder: {
    width: 40,
    height: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  codeContainer: {
    marginBottom: 16,
  },
  projectCode: {
    fontSize: 14,
    fontWeight: "600",
    opacity: 0.5,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  mainCard: {
    marginBottom: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.4)",
  },
  projectName: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 34,
    marginBottom: 16,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoItem: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 17,
    fontWeight: "600",
  },

  commentCard: {
    borderRadius: 20,
    padding: 20,
  },
  commentLabel: {
    fontSize: 14,
    opacity: 0.5,
    fontWeight: "500",
    marginBottom: 8,
  },

  materialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  quantityBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  priceContainer: {
    gap: 8,
    paddingTop: 4,
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.7,
  },

  commentSection: {
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },

  photosContainer: {
    gap: 8,
  },
  photosLabel: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: "500",
  },
  photosScroll: {
    flexDirection: "row",
  },
  photo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  datesContainer: {
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
});
