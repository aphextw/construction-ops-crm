/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#0075de";
const tintColorDark = "#4c9eff";

export const Colors = {
  light: {
    blue: "#ffffff",
    dop_op: "#0e1117",
    dop: "#11181C",
    text: "#1C1C1E",
    background: "#F2F2F7",
    surface: "#FFFFFF",
    surfaceMuted: "#E5E5EA",
    border: "#C6C6C8",
    secondary: "#636366",
    primary: tintColorLight,
    success: "#16734A",
    warning: "#8A5700",
    danger: "#BE303F",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    blue: "#4c9eff",
    dop_op: "#e3e3e3",
    dop: "#f2f2f2",
    text: "#F2F2F7",
    background: "rgb(25, 25, 25)",
    surface: "rgba(32, 32, 32, 0.96)",
    surfaceMuted: "#252525",
    border: "#48484A",
    secondary: "#AEAEB2",
    primary: tintColorDark,
    success: "#75D6A6",
    warning: "#E7BA69",
    danger: "#FF8994",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const Layout = {
  gutter: 16,
  radius: 12,
  touchTarget: 48,
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
} as const;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: "system-ui",
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: "ui-serif",
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: "ui-rounded",
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded:
      "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
