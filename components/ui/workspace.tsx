import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemedText } from "@/components/themed-text";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { IconSymbol } from "@/components/ui/icon-symbol";

const symbols = {
  "chevron-back": "chevron.left",
  "chevron-forward": "chevron.right",
  "ellipsis-horizontal": "ellipsis",
  "receipt-outline": "list.bullet.rectangle",
  "layers-outline": "square.stack.3d.up",
  "chatbubbles-outline": "bubble.left.and.bubble.right",
  "time-outline": "clock",
  "key-outline": "key",
  "people-outline": "person.2",
  "arrow-forward": "arrow.right",
  add: "plus",
  refresh: "arrow.clockwise",
  "camera-outline": "camera",
  "log-out-outline": "rectangle.portrait.and.arrow.right",
  "chevron-down": "chevron.down",
  "chevron-up": "chevron.up",
} as const;

export function WorkspaceIcon({
  name,
  size = 21,
  color,
}: {
  name: React.ComponentProps<typeof Ionicons>["name"];
  size?: number;
  color: string;
}) {
  const symbol = symbols[name as keyof typeof symbols];
  return Platform.OS === "ios" && symbol ? (
    <IconSymbol name={symbol} size={size} color={color} />
  ) : (
    <Ionicons name={name} size={size} color={color} />
  );
}

export function useWorkspaceTheme() {
  return Colors[useColorScheme() === "dark" ? "dark" : "light"];
}

export function ScreenHeading({
  title,
  detail,
  action,
  compact = false,
}: {
  title: string;
  detail?: string;
  action?: React.ReactNode;
  compact?: boolean;
}) {
  const theme = useWorkspaceTheme();
  return (
    <View style={styles.heading}>
      <View style={styles.grow}>
        <ThemedText style={[styles.screenTitle, compact && styles.detailTitle]}>
          {title}
        </ThemedText>
        {detail ? (
          <ThemedText style={[styles.secondary, { color: theme.secondary }]}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

export function WorkspaceTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  const theme = useWorkspaceTheme();
  return (
    <View style={[styles.tabs, { backgroundColor: theme.surfaceMuted }]}>
      {options.map((option) => (
        <Pressable
          key={option.key}
          accessibilityRole="tab"
          accessibilityState={{ selected: option.key === value }}
          onPress={() => onChange(option.key)}
          style={({ pressed }) => [
            styles.tab,
            option.key === value && styles.selectedTab,
            {
              backgroundColor:
                option.key === value ? theme.surface : "transparent",
              opacity: pressed ? 0.6 : 1,
            },
          ]}
        >
          <ThemedText style={[styles.tabLabel, { color: theme.text }]}>
            {option.label}
            {option.count === undefined ? "" : ` ${option.count}`}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

export function ActionRow({
  icon,
  title,
  detail,
  value,
  onPress,
  destructive = false,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  detail?: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  const theme = useWorkspaceTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        {
          borderBottomColor: theme.border,
          backgroundColor: pressed ? theme.surfaceMuted : "transparent",
        },
      ]}
    >
      <WorkspaceIcon
        name={icon}
        size={21}
        color={destructive ? theme.danger : theme.primary}
      />
      <View style={styles.grow}>
        <ThemedText
          style={[styles.rowTitle, destructive && { color: theme.danger }]}
        >
          {title}
        </ThemedText>
        {detail ? (
          <ThemedText style={[styles.secondary, { color: theme.secondary }]}>
            {detail}
          </ThemedText>
        ) : null}
      </View>
      {value ? (
        <ThemedText style={[styles.rowValue, { color: theme.secondary }]}>
          {value}
        </ThemedText>
      ) : null}
      <WorkspaceIcon name="chevron-forward" size={13} color={theme.secondary} />
    </Pressable>
  );
}

export function EmptyState({
  title,
  detail,
  action,
}: {
  title: string;
  detail?: string;
  action?: React.ReactNode;
}) {
  const theme = useWorkspaceTheme();
  return (
    <View style={styles.empty}>
      <ThemedText style={styles.emptyTitle}>{title}</ThemedText>
      {detail ? (
        <ThemedText style={[styles.emptyDetail, { color: theme.secondary }]}>
          {detail}
        </ThemedText>
      ) : null}
      {action}
    </View>
  );
}

export function LoadingRows() {
  const theme = useWorkspaceTheme();
  return (
    <View
      accessibilityLabel="Загрузка"
      accessibilityState={{ busy: true }}
      style={{ gap: 12, paddingVertical: 12 }}
    >
      {[0, 1, 2].map((row) => (
        <View
          key={row}
          style={{
            padding: 16,
            borderRadius: 12,
            backgroundColor: theme.surface,
            gap: 10,
          }}
        >
          <View
            style={{
              height: 18,
              width: "65%",
              borderRadius: 5,
              backgroundColor: theme.surfaceMuted,
            }}
          />
          <View
            style={{
              height: 13,
              width: "40%",
              borderRadius: 4,
              backgroundColor: theme.surfaceMuted,
            }}
          />
        </View>
      ))}
    </View>
  );
}

export function WorkspaceButton({
  title,
  icon,
  onPress,
  disabled,
  secondary,
  style,
}: {
  title: string;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useWorkspaceTheme();
  const color = secondary ? theme.primary : "#FFFFFF";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: secondary
            ? theme.surfaceMuted
            : Colors.light.primary,
          opacity: disabled ? 0.45 : pressed ? 0.7 : 1,
        },
        style,
      ]}
    >
      {icon ? <WorkspaceIcon name={icon} size={19} color={color} /> : null}
      <ThemedText style={[styles.buttonLabel, { color }]}>{title}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grow: {
    minWidth: 0,
    flex: 1,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingTop: 16,
  },
  screenTitle: {
    fontSize: 32,
    lineHeight: 42,
    fontWeight: "700",
  },
  detailTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
  },
  secondary: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 3,
    shadowOpacity: 0.12,
  },
  tabLabel: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 56,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowTitle: { fontSize: 17, lineHeight: 23, fontWeight: "400" },
  rowValue: {
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    flexShrink: 1,
    maxWidth: "35%",
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "600",
    textAlign: "center",
  },
  emptyDetail: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 300,
  },
  button: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
});
