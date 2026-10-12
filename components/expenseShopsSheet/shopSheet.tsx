import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { useCreateShop } from "@/hooks/expenses/shopCreate";
import { ShopDirectoryItem, useShops } from "@/hooks/expenses/shopHook";

type ShopSheetProps = {
  onSelect: (shop: ShopDirectoryItem) => Promise<void> | void;
  selectedShop?: string;
  colorScheme?: string | null;
};

export function ShopSheet({
  onSelect,
  selectedShop,
  colorScheme,
}: ShopSheetProps) {
  const isDark = colorScheme === "dark";
  const [newShopName, setNewShopName] = useState("");
  const [pendingShopId, setPendingShopId] = useState<string | null>(null);
  const { shops, loading, refreshShops } = useShops();
  const { createShop, creatingShop } = useCreateShop();

  const sortedShops = useMemo(() => {
    return [...shops].sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [shops]);

  const handleCreateShop = async () => {
    const trimmedName = newShopName.trim();

    if (!trimmedName) {
      Alert.alert("Новый магазин", "Введите название магазина");
      return;
    }

    const createdShop = await createShop(trimmedName);

    if (!createdShop?.name) {
      Alert.alert("Ошибка", "Не удалось создать магазин");
      return;
    }

    setNewShopName("");
    await refreshShops();
    setPendingShopId(createdShop.id);
    try {
      await onSelect(createdShop);
    } finally {
      setPendingShopId(null);
    }
  };

  return (
    <View style={styles.sheet}>
      <View style={styles.header}>
        <View>
          <ThemedText style={styles.title}>Магазины</ThemedText>
          <ThemedText style={styles.subtitle}>
            Выберите магазин или добавьте новый в справочник
          </ThemedText>
        </View>
      </View>

      <View
        style={[
          styles.createCard,
          {
            backgroundColor: isDark ? "#1c1c1e" : "#f8fafc",
            borderColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <ThemedText style={styles.createTitle}>Новый магазин</ThemedText>
        <View
          style={[
            styles.inputWrap,
            {
              backgroundColor: isDark ? "#2c2c2e" : "#ffffff",
              borderColor: isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          <Ionicons name="business-outline" size={18} color="#8E8E93" />
          <TextInput
            value={newShopName}
            onChangeText={setNewShopName}
            placeholder="Название магазина"
            placeholderTextColor="#8E8E93"
            style={[
              styles.input,
              {
                color: isDark ? "#fff" : "#111",
              },
            ]}
          />
        </View>

        <TouchableOpacity
          style={[styles.createButton, creatingShop && styles.createButtonBusy]}
          activeOpacity={0.85}
          disabled={creatingShop}
          onPress={handleCreateShop}
        >
          {creatingShop ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <ThemedText style={styles.createButtonText}>
                Добавить и выбрать
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="small" color="#007AFF" />
            <ThemedText style={styles.loadingText}>
              Загружаем магазины
            </ThemedText>
          </View>
        ) : (
          sortedShops.map((shop) => {
            const isSelected =
              selectedShop?.trim().toLowerCase() ===
              shop.name.trim().toLowerCase();
            const isBusy = pendingShopId === shop.id;

            return (
              <TouchableOpacity
                key={shop.id}
                onPress={async () => {
                  setPendingShopId(shop.id);
                  try {
                    await onSelect(shop);
                  } finally {
                    setPendingShopId(null);
                  }
                }}
                activeOpacity={0.82}
                disabled={isBusy}
                style={[
                  styles.shopItem,
                  {
                    backgroundColor: isDark ? "#1c1c1e" : "#f8fafc",
                    borderColor: isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(0,0,0,0.05)",
                  },
                  isSelected && styles.shopItemSelected,
                ]}
              >
                <View style={styles.shopMeta}>
                  <View style={styles.shopIconWrap}>
                    <Ionicons
                      name="business-outline"
                      size={16}
                      color={isSelected ? "#007AFF" : "#8E8E93"}
                    />
                  </View>
                  <ThemedText
                    style={[
                      styles.shopText,
                      isSelected && styles.shopTextSelected,
                    ]}
                  >
                    {shop.name}
                  </ThemedText>
                </View>

                {isBusy ? (
                  <ActivityIndicator size="small" color="#007AFF" />
                ) : isSelected ? (
                  <Ionicons name="checkmark-circle" size={20} color="#007AFF" />
                ) : (
                  <Ionicons name="chevron-forward" size={16} color="#8E8E93" />
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#8E8E93",
  },
  createCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 12,
    marginBottom: 14,
  },
  createTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  inputWrap: {
    minHeight: 50,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 13,
  },
  createButton: {
    minHeight: 48,
    borderRadius: 16,
    backgroundColor: "#007AFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  createButtonBusy: {
    opacity: 0.7,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: 10,
    paddingBottom: 16,
  },
  shopItem: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  shopItemSelected: {
    borderColor: "rgba(0,122,255,0.32)",
    backgroundColor: "rgba(0,122,255,0.10)",
  },
  shopMeta: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  shopIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(142,142,147,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  shopText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
  },
  shopTextSelected: {
    color: "#007AFF",
  },
  loadingState: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#8E8E93",
  },
});
