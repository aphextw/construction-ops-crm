import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";

import { ThemedText } from "./themed-text";

type MaterialItem = {
  id: string;
  comment: string;
  created_at: string;
  line_total: string;
  material_type: string;
  photos: string[];
  quantity: string;
  unit_price: string;
  updated_at: string;
};

type MaterialCardProps = {
  item: MaterialItem;
  onPhotoPress?: (photo: string, index: number) => void;
  colorScheme?: "light" | "dark";
};

export function MaterialCard({
  item,
  onPhotoPress,
  colorScheme = "light",
}: MaterialCardProps) {
  const handlePhotoPress = (photo: string, index: number) => {
    if (onPhotoPress) {
      onPhotoPress(photo, index);
    }
  };

  return (
    <View
      style={[
        styles.materialCard,
        {
          backgroundColor: colorScheme === "dark" ? "#1c1c1e" : "#ffffff",
          borderColor:
            colorScheme === "dark"
              ? "rgba(255,255,255,0.1)"
              : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      {/* Заголовок с типом материала и количеством */}
      <View style={styles.materialHeader}>
        <ThemedText style={styles.materialType}>
          {item.material_type}
        </ThemedText>
        <View style={styles.quantityBadge}>
          <ThemedText style={styles.quantityText}>× {item.quantity}</ThemedText>
        </View>
      </View>

      {/* Информация о цене */}
      <View style={styles.priceContainer}>
        <View style={styles.priceRow}>
          <ThemedText style={styles.priceLabel}>Цена за единицу:</ThemedText>
          <ThemedText style={styles.priceValue}>{item.unit_price} ₽</ThemedText>
        </View>
        <View style={styles.priceRow}>
          <ThemedText style={styles.totalLabel}>Итого:</ThemedText>
          <ThemedText style={styles.totalValue}>{item.line_total} ₽</ThemedText>
        </View>
      </View>

      {/* Комментарий (если есть) */}
      {item.comment && (
        <View style={styles.commentSection}>
          <ThemedText style={styles.commentLabel}>Комментарий:</ThemedText>
          <ThemedText style={styles.commentText}>{item.comment}</ThemedText>
        </View>
      )}

      {/* Фото (если есть) */}
      {item.photos && item.photos.length > 0 && (
        <View style={styles.photosContainer}>
          <ThemedText style={styles.photosLabel}>
            Фото ({item.photos.length})
          </ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photosScroll}
            contentContainerStyle={styles.photosContent}
          >
            {item.photos.map((photo, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handlePhotoPress(photo, index)}
              >
                <Image
                  source={{ uri: photo }}
                  style={styles.photo}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Даты создания/обновления */}
      <View style={styles.datesContainer}>
        <View style={styles.dateItem}>
          <Ionicons name="time-outline" size={14} color="#999" />
          <ThemedText style={styles.dateText}>
            Создан: {new Date(item.created_at).toLocaleDateString("ru-RU")}
          </ThemedText>
        </View>
        {item.updated_at !== item.created_at && (
          <View style={styles.dateItem}>
            <Ionicons name="refresh-outline" size={14} color="#999" />
            <ThemedText style={styles.dateText}>
              Обновлен: {new Date(item.updated_at).toLocaleDateString("ru-RU")}
            </ThemedText>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  materialCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    gap: 12,
  },
  materialHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  materialType: {
    fontSize: 18,
    fontWeight: "600",
  },
  quantityBadge: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  quantityText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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
  priceLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  priceValue: {
    fontSize: 15,
    fontWeight: "500",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    opacity: 0.7,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2e7d32",
  },
  commentSection: {
    gap: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.08)",
  },
  commentLabel: {
    fontSize: 13,
    opacity: 0.5,
    fontWeight: "500",
  },
  commentText: {
    fontSize: 14,
    lineHeight: 20,
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
  photosContent: {
    paddingRight: 16,
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
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    opacity: 0.5,
  },
});
