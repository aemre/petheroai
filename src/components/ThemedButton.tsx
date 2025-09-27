/**
 * 🎨 ThemedButton Component
 *
 * An example component showing how to use the theme system effectively.
 * This replaces hardcoded styles with theme-based styling.
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import {useTheme} from "../hooks/useTheme";

interface ThemedButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export const ThemedButton: React.FC<ThemedButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}) => {
  const theme = useTheme();

  // Create button style using theme
  const buttonStyle = theme.createButtonStyle(variant, size);

  // Create dynamic styles
  const dynamicStyles = StyleSheet.create({
    button: {
      ...buttonStyle,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      opacity: disabled || loading ? 0.6 : 1,
      ...theme.shadows.sm,
    },
    text: {
      color: buttonStyle.color,
      fontSize: buttonStyle.fontSize,
      fontWeight: theme.typography.weights.semibold,
      marginLeft: icon ? theme.spacing[2] : 0,
    },
  });

  return (
    <TouchableOpacity
      style={[dynamicStyles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={buttonStyle.color} />
      ) : (
        <>
          {icon}
          <Text style={[dynamicStyles.text, textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

export default ThemedButton;
