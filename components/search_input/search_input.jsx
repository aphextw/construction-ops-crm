import { StyleSheet, View, TextInput, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Colors } from "@/constants/theme";
import { IconSymbol } from "@/components/ui/icon-symbol";

const SearchInput = ({ value, onChangeText, colorScheme, containerStyle = null, placeholder = "Поиск" }) => {
  const [focused, setFocused] = useState(false);
  const theme = Colors[colorScheme === "dark" ? "dark" : "light"];
  // const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.searchContainer,
        containerStyle,
        { backgroundColor: theme.surfaceMuted },
      ]}
    >
      <IconSymbol name="magnifyingglass" size={18} color={theme.secondary} />
      <TextInput
        style={[
          styles.searchInput,
          { color: colorScheme === "dark" ? "#fff" : "#1a1a1a" },
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.secondary}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        value={value}
        onChangeText={onChangeText}
        // onFocus={() => setIsFocused(true)}
        // onBlur={() => setIsFocused(false)}
      />
      {value?.length > 0 && (
        <TouchableOpacity
          onPress={() => onChangeText("")}
          accessibilityLabel="Очистить поиск"
          accessibilityRole="button"
          style={styles.searchClear}
        >
          <IconSymbol name="xmark.circle.fill" size={18} color={theme.secondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 3,
    gap: 10,
  },
  searchContainerFocused: {
    backgroundColor: "#fff",
    borderColor: "#007AFF",
    shadowColor: "#007AFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },

  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1a1a1a",
    paddingVertical: 0,
    margin: 0,
    height: 40,
  },
  searchClear: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default SearchInput;
