/**
 * 🎨 CustomButton (Themed Version)
 *
 * This is an example of how to migrate your existing CustomButton to use the theme system.
 * Compare this with the original CustomButton.tsx to see the differences.
 */

import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from "react-native";
import {useTheme} from "../hooks/useTheme";

interface CustomButtonProps {
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

export default function CustomButton({
  title,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
}: CustomButtonProps) {
  const theme = useTheme();

  // Create button style using theme
  const baseButtonStyle = theme.createButtonStyle(variant, size);

  // Create dynamic styles using theme values
  const dynamicStyles = StyleSheet.create({
    button: {
      ...baseButtonStyle,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      opacity: disabled || loading ? 0.6 : 1,
      ...theme.shadows.sm,
    },
    text: {
      color: baseButtonStyle.color,
      fontSize: baseButtonStyle.fontSize,
      fontFamily: theme.typography.fonts.semibold,
      marginLeft: icon ? theme.spacing[2] : 0,
    },
    loadingText: {
      marginLeft: theme.spacing[2],
    },
  });

  return (
    <TouchableOpacity
      style={[dynamicStyles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading && (
        <ActivityIndicator size="small" color={baseButtonStyle.color} />
      )}
      {!loading && icon}
      <Text
        style={[
          dynamicStyles.text,
          loading && dynamicStyles.loadingText,
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * 🎯 Benefits of this themed version:
 *
 * 1. ✅ Consistent colors from theme.colors
 * 2. ✅ Consistent spacing from theme.spacing
 * 3. ✅ Consistent typography from theme.typography
 * 4. ✅ Consistent shadows from theme.shadows
 * 5. ✅ Easy to maintain - change theme, update everywhere
 * 6. ✅ Type-safe theme values
 * 7. ✅ Responsive design ready
 * 8. ✅ Dark mode ready (when implemented)
 */
