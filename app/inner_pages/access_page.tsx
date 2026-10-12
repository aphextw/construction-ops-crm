// app/inner_pages/access_page.tsx

import {
  TouchableOpacity,
  useColorScheme,
  ScrollView,
  StyleSheet,
  Platform,
  View,
  Alert,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  RefreshControl,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Feather, Ionicons } from "@expo/vector-icons";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { BottomSheet } from "react-native-sheet";
import { useLocalSearchParams, router } from "expo-router";
import {
  ProjectUserAccess,
  useProjectUserAccess,
} from "@/hooks/project/useProjectUserAccess";
import { AppUser, useUsers } from "@/hooks/useUsers";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "@/hooks/api_client";
import { useDataUserStore } from "@/store/useStore";
import { useGetProject } from "@/hooks/projectRefresh";

type ProjectParticipantAccessItem = {
  id: string;
  user: AppUser;
  can_view: boolean;
  can_edit: boolean;
  access_source: "system" | "role" | "direct";
};

export default function AccessPage() {
  const [availableUsers, setAvailableUsers] = useState<AppUser[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<Record<string, any>>({});
  const accessSheetRef = useRef<any>(null);

  const { projectId } = useLocalSearchParams<{
    projectId: string;
    projectStatus: string;
  }>();
  const projectToOpen = useDataUserStore((state) => state.projectToOpen);
  const setProjectToOpen = useDataUserStore((state) => state.setProjectToOpen);
  const { getProject } = useGetProject();

  const [projectUserAccess, setProjectUserAccess] = useState<
    ProjectUserAccess[]
  >([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [selectedProjectUser, setSelectedProjectUser] =
    useState<AppUser | null>(null);
  const [editingAccess, setEditingAccess] = useState<ProjectUserAccess | null>(
    null,
  );
  const [accessForm, setAccessForm] = useState({
    can_view: true,
    can_edit: false,
  });

  const [projectParticipantsAccess, setProjectParticipantsAccess] = useState<
    ProjectParticipantAccessItem[]
  >([]);
  const [activeTab, setActiveTab] = useState<"access" | "participants">(
    "access",
  );

  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();

  const {
    loadingUserAccess,
    savingUserAccess,
    listUserAccess,
    addUserAccess,
    updateUserAccess,
    deleteUserAccess,
  } = useProjectUserAccess();
  const { loadingUsers, getUsers } = useUsers();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const saved = await AsyncStorage.getItem("user");
        if (saved) {
          setUser(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Ошибка при загрузке пользователя:", error);
      }
    };
    loadUser();
  }, []);

  const role = user?.role?.code;
  const canManageProjectUsers = [
    "director",
    "deputy_director",
    "developer",
    "pto",
    "estimator_plus",
  ].includes(role);
  const projectData: any = projectToOpen;

  useEffect(() => {
    if (!canManageProjectUsers || !projectId) {
      return;
    }
    hydrateProjectAccess();
  }, [canManageProjectUsers, projectId]);

  useEffect(() => {
    if (
      !projectId ||
      (projectToOpen && String(projectToOpen.id) === String(projectId))
    ) {
      return;
    }

    const hydrateProject = async () => {
      const freshProject = await getProject(projectId);

      if (freshProject) {
        setProjectToOpen(freshProject);
      }
    };

    hydrateProject();
  }, [getProject, projectId, projectToOpen, setProjectToOpen]);

  const hydrateProjectAccess = async () => {
    const [accessList, usersList] = await Promise.all([
      listUserAccess(projectId),
      getUsers(),
    ]);
    setProjectUserAccess(accessList);
    setAvailableUsers(usersList);
  };

  const openCreateAccessSheet = () => {
    setEditingAccess(null);
    setSelectedProjectUser(null);
    setUserSearchQuery("");
    setAccessForm({
      can_view: true,
      can_edit: false,
    });
    accessSheetRef.current?.show();
  };

  const openEditAccessSheet = (access: ProjectUserAccess) => {
    setEditingAccess(access);
    setSelectedProjectUser(access.user as AppUser);
    setUserSearchQuery(access.user.full_name || access.user.email || "");
    setAccessForm({
      can_view: access.can_view,
      can_edit: access.can_edit,
    });
    accessSheetRef.current?.show();
  };

  const handleToggleAccess = (field: "can_view" | "can_edit") => {
    setAccessForm((prev) => {
      if (field === "can_edit") {
        const nextCanEdit = !prev.can_edit;
        return {
          can_view: nextCanEdit ? true : prev.can_view,
          can_edit: nextCanEdit,
        };
      }
      const nextCanView = !prev.can_view;
      return {
        can_view: nextCanView,
        can_edit: nextCanView ? prev.can_edit : false,
      };
    });
  };

  const handleSaveUserAccess = async () => {
    if (!selectedProjectUser?.id) {
      Alert.alert("Выберите пользователя", "Сначала выберите пользователя.");
      return;
    }

    const payload = {
      user_id: selectedProjectUser.id,
      can_view: accessForm.can_view,
      can_edit: accessForm.can_edit,
    };

    const result = editingAccess
      ? await updateUserAccess(projectId, editingAccess.id, payload)
      : await addUserAccess(projectId, payload);

    if (!result) {
      return;
    }

    await hydrateProjectAccess();
    accessSheetRef.current?.hide();
  };

  const handleDeleteUserAccess = async (access: ProjectUserAccess) => {
    Alert.alert(
      "Убрать доступ",
      `Удалить доступ пользователя ${access.user.full_name}?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            const result = await deleteUserAccess(projectId, access.id);
            if (!result) {
              return;
            }
            await hydrateProjectAccess();
            accessSheetRef.current?.hide();
          },
        },
      ],
    );
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

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      if (activeTab === "access") {
        await hydrateProjectAccess();
      }

      if (activeTab === "participants") {
        await openParticipantsSheet();
      }
    } catch (e) {
      console.error("Ошибка при обновлении:", e);
    } finally {
      setRefreshing(false);
    }
  };

  const filteredUsers = availableUsers.filter((item) => {
    const isActive = item.status === "active";
    const matchesSearch =
      !userSearchQuery.trim() ||
      item.full_name
        ?.toLowerCase()
        .includes(userSearchQuery.trim().toLowerCase()) ||
      item.email?.toLowerCase().includes(userSearchQuery.trim().toLowerCase());
    return isActive && matchesSearch;
  });

  const openParticipantsSheet = async () => {
    const usersList = availableUsers.length ? availableUsers : await getUsers();
    if (!availableUsers.length) {
      setAvailableUsers(usersList);
    }

    const activeUsers = (usersList || []).filter(
      (item: AppUser) => item.status === "active",
    );

    const projectAccessRules = projectData?.access || [];
    const directUserAccessRules = projectUserAccess.length
      ? projectUserAccess
      : projectData?.user_access || [];
    const visibleRoleCodes = new Set(
      (projectData?.visible_roles || [])
        .map((roleItem: any) =>
          typeof roleItem === "string" ? roleItem : roleItem?.code,
        )
        .filter(Boolean),
    );
    const systemEditRoles = new Set([
      "director",
      "deputy_director",
      "developer",
    ]);
    const systemViewRoles = new Set([
      "director",
      "deputy_director",
      "developer",
      "estimator_plus",
    ]);

    const participantsMap = new Map<string, ProjectParticipantAccessItem>();
    const backendParticipants = projectData?.participants || [];

    backendParticipants.forEach((participant: any) => {
      if (!participant?.id) {
        return;
      }

      participantsMap.set(participant.id, {
        id: participant.id,
        user: participant,
        can_view: true,
        can_edit: false,
        access_source: "role",
      });
    });

    activeUsers.forEach((item: AppUser) => {
      const userId = item.id;
      const userRoleCode = item.role?.code;
      const userCompanyCode = item.company?.code;

      const current =
        participantsMap.get(userId) ||
        ({
          id: userId,
          user: item,
          can_view: false,
          can_edit: false,
          access_source: "direct",
        } satisfies ProjectParticipantAccessItem);

      if (
        userCompanyCode === "tsk_stu" &&
        userRoleCode &&
        systemViewRoles.has(userRoleCode)
      ) {
        current.can_view = true;
        current.can_edit =
          current.can_edit || systemEditRoles.has(userRoleCode);
        current.access_source = "system";
      }

      projectAccessRules.forEach((rule: any) => {
        if (
          rule?.company?.code === userCompanyCode &&
          rule?.role?.code === userRoleCode
        ) {
          current.can_view = current.can_view || !!rule.can_view;
          current.can_edit = current.can_edit || !!rule.can_edit;
          if (current.access_source !== "system") {
            current.access_source = "role";
          }
        }
      });

      directUserAccessRules.forEach((rule: any) => {
        if (rule?.user?.id === userId) {
          current.can_view = current.can_view || !!rule.can_view;
          current.can_edit = current.can_edit || !!rule.can_edit;
          if (current.access_source !== "system") {
            current.access_source = "direct";
          }
        }
      });

      if (userRoleCode && visibleRoleCodes.has(userRoleCode)) {
        current.can_view = true;
        if (
          current.access_source !== "system" &&
          current.access_source !== "direct"
        ) {
          current.access_source = "role";
        }
      }

      if (current.can_view || current.can_edit) {
        participantsMap.set(userId, current);
      }
    });

    setProjectParticipantsAccess(
      [...participantsMap.values()].sort((a, b) =>
        a.user.full_name.localeCompare(b.user.full_name, "ru"),
      ),
    );
  };

  return (
    <ThemedView
      style={[
        styles.container,
        {
          paddingTop: insets.top,
        },
      ]}
    >
      {/* Header */}
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
        <ThemedText style={styles.headerTitle}>Доступ к проекту</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Вкладки */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "participants" && styles.tabActive,
            ]}
            onPress={() => {
              setActiveTab("participants");
              openParticipantsSheet();
            }}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "participants" && styles.tabTextActive,
              ]}
            >
              Участники
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "access" && styles.tabActive]}
            onPress={() => setActiveTab("access")}
          >
            <ThemedText
              style={[
                styles.tabText,
                activeTab === "access" && styles.tabTextActive,
              ]}
            >
              Доступ
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Участники */}
        {activeTab === "participants" && (
          <View
            style={[
              styles.accessCard,
              {
                backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
              },
            ]}
          >
            {loadingUserAccess ? (
              <View style={styles.accessLoading}>
                <ActivityIndicator size="small" color="#007AFF" />
                <ThemedText style={styles.accessHint}>
                  Загружаем участников
                </ThemedText>
              </View>
            ) : projectParticipantsAccess.length ? (
              projectParticipantsAccess.map((participant) => (
                <View key={participant.id} style={styles.accessRow}>
                  <View style={styles.accessUserInfo}>
                    {getAvatarUri(participant.user.profile_photo_url) ? (
                      <Image
                        source={{
                          uri: getAvatarUri(
                            participant.user.profile_photo_url,
                          )!,
                        }}
                        style={styles.accessAvatar}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                    ) : (
                      <View style={styles.accessAvatar}>
                        <ThemedText style={styles.accessAvatarText}>
                          {getInitials(participant.user.full_name)}
                        </ThemedText>
                      </View>
                    )}

                    <View style={styles.accessUserMeta}>
                      <ThemedText style={styles.accessUserName}>
                        {participant.user.full_name}
                      </ThemedText>
                      <ThemedText style={styles.accessUserSecondary}>
                        {participant.user.role?.display_name ||
                          "Роль не указана"}
                      </ThemedText>
                      <ThemedText style={styles.accessUserSecondary}>
                        {participant.user.email}
                      </ThemedText>

                      <View style={styles.accessBadges}>
                        <View
                          style={[
                            styles.accessBadge,
                            participant.can_view && styles.accessBadgeBlue,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.accessBadgeText,
                              participant.can_view &&
                                styles.accessBadgeTextBlue,
                            ]}
                          >
                            Просмотр
                          </ThemedText>
                        </View>
                        <View
                          style={[
                            styles.accessBadge,
                            participant.can_edit && styles.accessBadgeGreen,
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.accessBadgeText,
                              participant.can_edit &&
                                styles.accessBadgeTextGreen,
                            ]}
                          >
                            Редактирование
                          </ThemedText>
                        </View>
                        {/*<View style={styles.accessBadge}>*/}
                        {/*  <ThemedText style={styles.accessBadgeText}>*/}
                        {/*    {participant.access_source === "system"*/}
                        {/*      ? "Система"*/}
                        {/*      : participant.access_source === "role"*/}
                        {/*        ? "Роль"*/}
                        {/*        : "Прямой"}*/}
                        {/*  </ThemedText>*/}
                        {/*</View>*/}
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.accessEmpty}>
                <Ionicons name="people-outline" size={22} color="#8E8E93" />
                <ThemedText style={styles.accessHint}>
                  Участники не найдены
                </ThemedText>
              </View>
            )}
          </View>
        )}

        {/* Доступы */}
        {activeTab === "access" && (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <ThemedText style={styles.sectionTitle}>
                  Права для пользователей
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={openCreateAccessSheet}
              >
                <Feather name="user-plus" size={18} color="#007AFF" />
                <ThemedText style={styles.addButtonText}>Добавить</ThemedText>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.accessCard,
                {
                  backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
                },
              ]}
            >
              {loadingUserAccess || loadingUsers ? (
                <View style={styles.accessLoading}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <ThemedText style={styles.accessHint}>
                    Загружаем доступы
                  </ThemedText>
                </View>
              ) : projectUserAccess.length ? (
                projectUserAccess.map((access) => (
                  <TouchableOpacity
                    key={access.id}
                    style={styles.accessRow}
                    activeOpacity={0.8}
                    onPress={() => openEditAccessSheet(access)}
                  >
                    <View style={styles.accessUserInfo}>
                      {getAvatarUri(access.user.profile_photo_url) ? (
                        <Image
                          source={{
                            uri: getAvatarUri(access.user.profile_photo_url)!,
                          }}
                          style={styles.accessAvatar}
                          contentFit="cover"
                          cachePolicy="memory-disk"
                        />
                      ) : (
                        <View style={styles.accessAvatar}>
                          <ThemedText style={styles.accessAvatarText}>
                            {getInitials(access.user.full_name)}
                          </ThemedText>
                        </View>
                      )}

                      <View style={styles.accessUserMeta}>
                        <ThemedText style={styles.accessUserName}>
                          {access.user.full_name}
                        </ThemedText>
                        <ThemedText style={styles.accessUserSecondary}>
                          {access.user.role?.display_name || "Роль не указана"}
                        </ThemedText>
                        <ThemedText style={styles.accessUserSecondary}>
                          {access.user.email}
                        </ThemedText>

                        <View style={styles.accessBadges}>
                          <View
                            style={[
                              styles.accessBadge,
                              access.can_view && styles.accessBadgeBlue,
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.accessBadgeText,
                                access.can_view && styles.accessBadgeTextBlue,
                              ]}
                            >
                              Просмотр
                            </ThemedText>
                          </View>

                          <View
                            style={[
                              styles.accessBadge,
                              access.can_edit && styles.accessBadgeGreen,
                            ]}
                          >
                            <ThemedText
                              style={[
                                styles.accessBadgeText,
                                access.can_edit && styles.accessBadgeTextGreen,
                              ]}
                            >
                              Редактирование
                            </ThemedText>
                          </View>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.accessEmpty}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={22}
                    color="#8E8E93"
                  />
                  <ThemedText style={styles.accessHint}>
                    Персональные доступы ещё не выданы
                  </ThemedText>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>

      {/* BottomSheet для создания/редактирования доступа */}
      <BottomSheet
        ref={accessSheetRef}
        borderRadius={25}
        height={Platform.OS === "ios" ? 800 : 860}
        sheetStyle={{
          backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#fff",
        }}
      >
        <View style={styles.accessSheet}>
          <View style={styles.accessSheetBody}>
            <View style={styles.accessSheetHeader}>
              <View>
                <ThemedText style={styles.accessSheetTitle}>
                  {editingAccess ? "Изменить доступ" : "Добавить в проект"}
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
                onPress={() => accessSheetRef.current?.hide()}
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
                value={userSearchQuery}
                onChangeText={setUserSearchQuery}
                placeholder="Имя или email"
                placeholderTextColor="#8E8E93"
                style={[
                  styles.accessSearchInput,
                  { color: colorScheme === "dark" ? "#fff" : "#111" },
                ]}
              />
            </View>

            <View style={styles.userPickerSection}>
              <ScrollView
                style={styles.userPickerList}
                contentContainerStyle={styles.userPickerContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {filteredUsers.length ? (
                  filteredUsers.map((item) => {
                    const isSelected = selectedProjectUser?.id === item.id;

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
                        onPress={() => setSelectedProjectUser(item)}
                      >
                        {getAvatarUri(item.profile_photo_url) ? (
                          <Image
                            source={{
                              uri: getAvatarUri(item.profile_photo_url)!,
                            }}
                            style={styles.accessAvatar}
                            contentFit="cover"
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <View style={styles.accessAvatar}>
                            <ThemedText style={styles.accessAvatarText}>
                              {getInitials(item.full_name)}
                            </ThemedText>
                          </View>
                        )}

                        <View style={styles.userPickerMeta}>
                          <ThemedText style={styles.accessUserName}>
                            {item.full_name}
                          </ThemedText>
                          <ThemedText style={styles.accessUserSecondary}>
                            {item.role?.display_name || "Роль не указана"}
                          </ThemedText>
                          <ThemedText style={styles.accessUserSecondary}>
                            {item.email}
                          </ThemedText>
                        </View>

                        {isSelected && (
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#007AFF"
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={styles.userPickerEmpty}>
                    <ThemedText style={styles.accessHint}>
                      Пользователи не найдены
                    </ThemedText>
                  </View>
                )}
              </ScrollView>
            </View>

            <View
              style={[
                styles.accessPermissionCard,
                {
                  backgroundColor:
                    colorScheme === "dark" ? "#232326" : "#f8fafc",
                },
              ]}
            >
              <ThemedText style={styles.accessPermissionTitle}>
                Права доступа
              </ThemedText>

              <TouchableOpacity
                style={styles.permissionRow}
                onPress={() => handleToggleAccess("can_view")}
                activeOpacity={0.8}
              >
                <View>
                  <ThemedText style={styles.permissionTitle}>
                    Просмотр
                  </ThemedText>
                  <ThemedText style={styles.permissionHint}>
                    Пользователь увидит проект и его разделы
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.permissionToggle,
                    accessForm.can_view && styles.permissionToggleActive,
                  ]}
                >
                  {accessForm.can_view && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.permissionRow}
                onPress={() => handleToggleAccess("can_edit")}
                activeOpacity={0.8}
              >
                <View>
                  <ThemedText style={styles.permissionTitle}>
                    Редактирование
                  </ThemedText>
                  <ThemedText style={styles.permissionHint}>
                    Пользователь сможет менять данные проекта
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.permissionToggle,
                    accessForm.can_edit && styles.permissionToggleActiveGreen,
                  ]}
                >
                  {accessForm.can_edit && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
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
            {editingAccess ? (
              <TouchableOpacity
                style={styles.accessDeleteButton}
                disabled={savingUserAccess}
                onPress={() => handleDeleteUserAccess(editingAccess)}
              >
                <Ionicons name="trash-outline" size={18} color="#dc3545" />
                <ThemedText style={styles.accessDeleteText}>
                  Удалить доступ
                </ThemedText>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.accessSaveButton}
              disabled={savingUserAccess}
              onPress={handleSaveUserAccess}
            >
              {savingUserAccess ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#fff"
                  />
                  <ThemedText style={styles.accessSaveText}>
                    {editingAccess ? "Сохранить" : "Выдать доступ"}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </BottomSheet>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
    paddingBottom: 40,
  },
  header: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
    marginBottom: 20,
    paddingHorizontal: Platform.OS === "ios" ? 20 : 16,
  },
  backButton: {
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

  // Вкладки
  tabsContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
    borderRadius: 14,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 12,
  },
  tabActive: {
    backgroundColor: "#fff",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#8E8E93",
  },
  tabTextActive: {
    color: "#007AFF",
  },

  sectionHeader: {
    flexDirection: "column",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontWeight: "900",
    fontSize: 20,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(0, 122, 255, 0.1)",
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#007AFF",
  },
  accessCard: {
    paddingHorizontal: 16,
    paddingVertical: 3,
    borderRadius: 20,
    elevation: 1,
    gap: 12,
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

  // BottomSheet стили
  accessSheet: {
    flex: 1,
  },
  accessSheetBody: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 6,
  },
  accessSheetHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  accessSheetTitle: {
    fontSize: 24,
    fontWeight: "800",
  },
  accessCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  accessSearchBox: {
    minHeight: 47,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    gap: 10,
  },
  accessSearchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 14,
  },
  userPickerSection: {
    flex: 1,
    minHeight: 0,
    gap: 10,
  },
  userPickerList: {
    flex: 1,
    minHeight: 0,
    borderRadius: 18,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    backgroundColor: "transparent",
  },
  userPickerContent: {
    gap: 10,
    padding: 10,
  },
  userPickerCard: {
    borderRadius: 18,
    borderWidth: 1,
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
});
