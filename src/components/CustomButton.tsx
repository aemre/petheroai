import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import {theme} from "../theme";

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: string;
}

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  style,
  textStyle,
  icon,
}: CustomButtonProps) {
  const buttonStyle = [
    styles.button,
    styles[variant],
    styles[`${size}Size`],
    disabled && styles.disabled,
    style,
  ];

  const buttonTextStyle = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    disabled && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      {icon && <Text style={styles.icon}>{icon}</Text>}
      <Text style={buttonTextStyle}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.lg,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primary: {
    backgroundColor: "#FF6B6B",
  },
  secondary: {
    backgroundColor: "#4ECDC4",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#FF6B6B",
  },
  smallSize: {
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
  },
  mediumSize: {
    paddingHorizontal: theme.spacing[5],
    paddingVertical: theme.spacing[3],
  },
  largeSize: {
    paddingHorizontal: theme.spacing[8],
    paddingVertical: theme.spacing[4],
  },
  disabled: {
    backgroundColor: "#ccc",
    elevation: 0,
    shadowOpacity: 0,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  primaryText: {
    color: theme.colors.white,
  },
  secondaryText: {
    color: theme.colors.white,
  },
  outlineText: {
    color: "#FF6B6B",
  },
  smallText: {
    fontSize: theme.typography.sizes.base,
  },
  mediumText: {
    fontSize: theme.typography.sizes.md,
  },
  largeText: {
    fontSize: theme.typography.sizes.lg,
  },
  disabledText: {
    color: "#999",
  },
  icon: {
    fontSize: theme.typography.sizes.lg,
    marginRight: theme.spacing[2],
  },
});
