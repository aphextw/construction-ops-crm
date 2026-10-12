// components/ExpensePhotosGallery.tsx

import React, { useEffect, useState } from "react";
import {
  View,
  FlatList,
  Image,
  StyleSheet,
  useColorScheme,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { useExpensePhotos } from "@/hooks/expenses/expense_photo_download";
import { Modal, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDeleteExpensePhoto } from "@/hooks/expenses/expense_photo_delete";
import ZoomableImage from "@/components/expense_stuff/ZoomablePic";

type PhotoItem = {
  id: string;
  expense_id: string;
  expense_name?: string;
};

type ExpensePhotosGalleryProps = {
  expenses: any[];
  projectId: any;
  expenseId: any;
  onClose: () => void;
  onDelete: any;
};

export const ExpensePhotosGallery = ({
  expenses,
  projectId,
  onClose,
  expenseId,
  onDelete,
}: ExpensePhotosGalleryProps) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [photoUris, setPhotoUris] = useState<Record<string, string>>({});
  const [removedPhotoIds, setRemovedPhotoIds] = useState<
    Record<string, boolean>
  >({});
  const [missingPhotoIds, setMissingPhotoIds] = useState<
    Record<string, boolean>
  >({});
  const [loadingPhotos, setLoadingPhotos] = useState<Record<string, boolean>>(
    {},
  );
  const { getPhotoUri } = useExpensePhotos();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const insets = useSafeAreaInsets();
  const { deletePhoto, loadingMap } = useDeleteExpensePhoto();
  const [photoId, setPhotoId] = useState("");

  // Собираем все фото из всех расходов
  const allPhotos = React.useMemo(() => {
    const photos: Array<PhotoItem & { expense_id: string }> = [];

    expenses.forEach((expense) => {
      if (expense.photos?.length) {
        expense.photos.forEach((photo: any) => {
          photos.push({
            id: photo.id,
            expense_id: expense.id,
            expense_name: expense.material_type || "Без названия",
          });
        });
      }
    });

    return photos;
  }, [expenses]);

  const visiblePhotos = React.useMemo(
    () =>
      allPhotos.filter(
        (photo) => !missingPhotoIds[photo.id] && !removedPhotoIds[photo.id],
      ),
    [allPhotos, missingPhotoIds, removedPhotoIds],
  );

  const loadPhoto = async (photoId: string, expenseId: string) => {
    if (
      photoUris[photoId] ||
      loadingPhotos[photoId] ||
      missingPhotoIds[photoId]
    ) {
      return;
    }

    setLoadingPhotos((prev) => ({ ...prev, [photoId]: true }));

    try {
      const uri = await getPhotoUri(expenseId, projectId, photoId);

      if (uri) {
        setPhotoUris((prev) => ({ ...prev, [photoId]: uri }));
      } else {
        setMissingPhotoIds((prev) => ({ ...prev, [photoId]: true }));
      }
    } catch (error) {
      console.log("Error loading photo:", error);
    } finally {
      setLoadingPhotos((prev) => ({ ...prev, [photoId]: false }));
    }
  };

  const handleDelete = async () => {
    const success = await deletePhoto(expenseId, projectId, photoId);

    if (!success) {
      return;
    }

    const nextVisibleCount = visiblePhotos.filter(
      (photo) => photo.id !== photoId,
    ).length;

    setRemovedPhotoIds((prev) => ({ ...prev, [photoId]: true }));
    setPhotoUris((prev) => {
      const next = { ...prev };
      delete next[photoId];
      return next;
    });
    setSelectedPhoto(null);

    await onDelete(true);

    if (nextVisibleCount === 0) {
      onClose();
    }
  };

  useEffect(() => {
    allPhotos.forEach((photo) => {
      loadPhoto(photo.id, photo.expense_id);
    });
  }, [allPhotos]);

  const renderPhoto = ({
    item,
  }: {
    item: PhotoItem & { expense_id: string; expense_name?: string };
  }) => {
    const uri = photoUris[item.id];
    const isLoading = loadingPhotos[item.id];

    return (
      <View style={styles.photoContainer}>
        {isLoading || !uri ? (
          <View
            style={[
              styles.photoPlaceholder,
              isDark && styles.photoPlaceholderDark,
            ]}
          >
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              setPhotoId(item.id);
              setSelectedPhoto(uri);
            }}
          >
            <Image
              resizeMethod={"scale"}
              source={{ uri }}
              style={styles.photo}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* HEADER */}
      <View style={styles.header}>
        <ThemedText style={styles.title}>
          Фотографии ({visiblePhotos.length})
        </ThemedText>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeButton, isDark && styles.closeButtonDark]}
        >
          <Ionicons name="close" size={24} color={isDark ? "#fff" : "#000"} />
        </TouchableOpacity>
      </View>

      {/* PHOTOS GRID */}
      {visiblePhotos.length > 0 ? (
        <FlatList
          data={visiblePhotos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={64} color="#8E8E93" />
          <ThemedText style={styles.emptyText}>Нет фотографий</ThemedText>
        </View>
      )}

      <Modal visible={!!selectedPhoto} transparent animationType="fade">
        <View style={[styles.modalContainer, { paddingTop: insets.top }]}>
          <Pressable
            style={styles.modalBackground}
            onPress={() => setSelectedPhoto(null)}
          >
            <ZoomableImage uri={selectedPhoto!} />
            {/*<Image source={{ uri: selectedPhoto! }} style={styles.fullImage} />*/}
          </Pressable>

          {photoId ? (
            <View style={styles.photoNameWrap}>
              <ThemedText style={styles.photoNameText}>
                {visiblePhotos.find((photo) => photo.id === photoId)
                  ?.expense_name || "Без названия"}
              </ThemedText>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => {
              Alert.alert("Удалить фото?", "Это действие нельзя отменить", [
                { text: "Отмена", style: "cancel" },
                {
                  text: "Удалить",
                  style: "destructive",
                  onPress: () => {
                    handleDelete();
                  },
                },
              ]);
            }}
          >
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalClose}
            onPress={() => setSelectedPhoto(null)}
          >
            <Ionicons name="close" size={35} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const { width } = Dimensions.get("window");
const PHOTO_SIZE = (width - 48 - 8) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: 20,
  },
  containerDark: {
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBackground: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  fullImage: {
    width: "100%",
    height: "100%",
  },

  modalClose: {
    position: "absolute",
    top: 50,
    right: 20,
  },
  imageWrapper: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  deleteButton: {
    position: "absolute",
    bottom: 40,
    right: 20,

    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  photoNameWrap: {
    position: "absolute",
    bottom: 36,
    alignSelf: "center",
    maxWidth: "76%",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  photoNameText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
  },

  title: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonDark: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  grid: {
    paddingHorizontal: 24,
  },
  row: {
    gap: 8,
    marginBottom: 8,
  },
  photoContainer: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: 12,
    overflow: "hidden",
  },
  photo: {
    width: "100%",
    height: "100%",
  },
  photoPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f0f0f0",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPlaceholderDark: {
    backgroundColor: "#2c2c2e",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: "#8E8E93",
  },
});
