import * as Haptics from "expo-haptics";
import { TouchableOpacity, Text, StyleSheet } from "react-native";

import { ButtonProps } from "@/types/type";

// Glass tint palette per variant — semi-transparent fills + accent border
const GLASS_STYLES: Record<
  string,
  { bg: string; border: string; shadow: string }
> = {
  primary: {
    bg: "rgba(255,255,255,0.13)",
    border: "rgba(255,255,255,0.32)",
    shadow: "#ffffff",
  },
  secondary: {
    bg: "rgba(18,18,18,0.55)",
    border: "rgba(255,255,255,0.10)",
    shadow: "#000000",
  },
  danger: {
    bg: "rgba(220,38,38,0.20)",
    border: "rgba(220,38,38,0.50)",
    shadow: "#dc2626",
  },
  success: {
    bg: "rgba(34,197,94,0.18)",
    border: "rgba(34,197,94,0.42)",
    shadow: "#22c55e",
  },
  outline: {
    bg: "rgba(255,255,255,0.05)",
    border: "rgba(255,255,255,0.20)",
    shadow: "#ffffff",
  },
};

const getTextColor = (variant: ButtonProps["textVariant"]): string => {
  switch (variant) {
    case "primary":
      return "#000";
    case "secondary":
      return "#fff";
    case "danger":
      return "#fff";
    case "success":
      return "#fff";
    default:
      return "#fff";
  }
};

const CustomButton = ({
  onPress,
  title,
  bgVariant = "primary",
  textVariant = "default",
  IconLeft,
  IconRight,
  className,
  ...props
}: ButtonProps) => {
  const handlePress = (e: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (onPress) onPress(e);
  };

  const glass = GLASS_STYLES[bgVariant ?? "primary"] ?? GLASS_STYLES.primary;
  const textColor = getTextColor(textVariant);

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.72}
      style={[
        styles.button,
        {
          backgroundColor: glass.bg,
          borderColor: glass.border,
          shadowColor: glass.shadow,
        },
      ]}
      {...props}
    >
      {IconLeft && <IconLeft />}
      <Text style={[styles.label, { color: textColor }]}>{title}</Text>
      {IconRight && <IconRight />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: "100%",
    height: 60,
    borderRadius: 24,
    paddingHorizontal: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  label: {
    fontSize: 18,
    fontFamily: "Jakarta-ExtraBold",
    letterSpacing: -0.3,
  },
});

export default CustomButton;
