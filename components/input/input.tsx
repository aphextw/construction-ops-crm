import React, { useState } from "react";
import {
  TextInput,
  View,
  TouchableOpacity,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { Colors } from "@/constants/theme";

type AutoCapitalizeType = "none" | "sentences" | "words" | "characters";

type Props = {
  darker?: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secure?: boolean;
  style?: StyleProp<ViewStyle>;
  keyboardType?: "numeric" | "default" | "email-address" | "number-pad" | "phone-pad";
  inputStyle?: StyleProp<TextStyle>;
  autoCorrect?: boolean;
  spellCheck?: boolean;
  autoCapitalize?: AutoCapitalizeType;
  multiline?: boolean;
  numberOfLines?: number;
};

export function AuthInput({
  darker = false,
  value,
  onChangeText,
  placeholder,
  secure = false,
  keyboardType,
  autoCorrect = true,
  spellCheck,
  autoCapitalize,
  style,
  inputStyle,
  multiline = false,
  numberOfLines,
}: Props) {
  const [hidden, setHidden] = useState(secure);
  const colorScheme = useColorScheme();
  const [focused, setFocused] = useState(false);
  const theme = Colors[colorScheme === "dark" ? "dark" : "light"];
  const isTechnicalInput =
    secure ||
    keyboardType === "numeric" ||
    keyboardType === "number-pad" ||
    keyboardType === "phone-pad" ||
    keyboardType === "email-address";
  const resolvedAutoCapitalize =
    autoCapitalize ?? (isTechnicalInput ? "none" : multiline ? "sentences" : "words");
  const resolvedSpellCheck = spellCheck ?? (!isTechnicalInput && autoCorrect);

  return (
    <View
      style={[
        {
          position: "relative",
          justifyContent: "center",
          backgroundColor: darker ? theme.surface : theme.surfaceMuted,
          borderColor: focused ? theme.primary : "transparent",
        },
        styles.input,
        style,
      ]}
    >
      <TextInput
        value={value}
        accessibilityLabel={placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor={theme.primary}
        autoCorrect={autoCorrect}
        spellCheck={resolvedSpellCheck}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={hidden}
        autoCapitalize={resolvedAutoCapitalize}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={numberOfLines}
        textAlignVertical={multiline ? "top" : "center"}
        style={[
          {
            minHeight: 48,
            paddingRight: secure ? 44 : 14,
            fontWeight: "500",
            fontSize: 16,
            color: colorScheme === "dark" ? "#fff" : "#000",
          },
          inputStyle,
        ]}
        placeholderTextColor={theme.secondary}
      />

      {secure && (
        <TouchableOpacity
          onPress={() => setHidden((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={hidden ? "Показать пароль" : "Скрыть пароль"}
          hitSlop={12}
          style={{
            position: "absolute",
            right: 20,
            top: "50%",
            transform: [{ translateY: -12 }],
          }}
        >
          <Ionicons name={hidden ? "eye" : "eye-off"} size={22} color="#999" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: "600",
  },

  errorText: {
    color: "red",
    fontSize: 18,
    fontWeight: "bold",
  },

  form: {
    gap: 12,
  },

  input: {
    minHeight: 50,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 16,
  },

  button: {
    height: 48,
    backgroundColor: "#000",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  buttonText: {
    color: "#fff",
    fontWeight: "600",
  },

  link: {
    textAlign: "center",
    opacity: 0.7,
  },
});
