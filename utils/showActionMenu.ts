import { ActionSheetIOS, Alert, Platform } from "react-native";

export function showActionMenu(title: string, options: { label: string; onPress: () => void }[]) {
  if (Platform.OS === "ios") {
    ActionSheetIOS.showActionSheetWithOptions({
      title,
      options: [...options.map((item) => item.label), "Отмена"],
      cancelButtonIndex: options.length,
    }, (index) => options[index]?.onPress());
  } else {
    Alert.alert(title, undefined, [...options.map((item) => ({ text: item.label, onPress: item.onPress })), { text: "Отмена", style: "cancel" }]);
  }
}
