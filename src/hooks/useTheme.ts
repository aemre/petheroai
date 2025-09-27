/**
 * 🎨 useTheme Hook
 *
 * A convenient hook for accessing theme values in your components.
 * Provides helper functions and easy access to all theme properties.
 */

import {useMemo} from "react";
import {
  theme,
  getColor,
  getSpacing,
  createGradient,
  getFontFamily,
} from "../theme";

export const useTheme = () => {
  const themeHelpers = useMemo(
    () => ({
      // Direct theme access
      colors: theme.colors,
      typography: theme.typography,
      spacing: theme.spacing,
      borderRadius: theme.borderRadius,
      shadows: theme.shadows,
      dimensions: theme.dimensions,
      components: theme.components,

      // Helper functions
      getColor,
      getSpacing,
      createGradient,
      getFontFamily,

      // Common style creators
      createButtonStyle: (
        variant: "primary" | "secondary" | "outline" | "ghost" = "primary",
        size: "sm" | "md" | "lg" = "md"
      ) => ({
        ...theme.components.button.sizes[size],
        ...theme.components.button.variants[variant],
      }),

      createCardStyle: (variant: "base" | "elevated" = "base") => ({
        ...theme.components.card[variant],
      }),

      createInputStyle: (state: "base" | "focused" | "error" = "base") => ({
        ...theme.components.input.base,
        ...(state !== "base" ? theme.components.input[state] : {}),
      }),

      // Responsive helpers
      getResponsiveValue: <T>(values: {
        small?: T;
        medium?: T;
        large?: T;
        default: T;
      }) => {
        if (theme.dimensions.isSmallDevice && values.small) return values.small;
        if (theme.dimensions.isMediumDevice && values.medium)
          return values.medium;
        if (theme.dimensions.isLargeDevice && values.large) return values.large;
        return values.default;
      },

      // Color utilities
      getColorWithOpacity: (colorPath: string, opacity: number) => {
        const color = getColor(colorPath);
        if (color.startsWith("#")) {
          // Convert hex to rgba
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, ${opacity})`;
        }
        return color;
      },

      // Shadow utilities
      createShadow: (
        size: keyof typeof theme.shadows = "base",
        color?: string
      ) => ({
        ...theme.shadows[size],
        ...(color && {shadowColor: color}),
      }),

      // Typography utilities
      createTextStyle: (
        size: keyof typeof theme.typography.sizes,
        weight?: keyof typeof theme.typography.weights,
        color?: string
      ) => ({
        fontSize: theme.typography.sizes[size],
        lineHeight: theme.typography.lineHeights[size],
        fontFamily: weight
          ? getFontFamily(weight)
          : theme.typography.fonts.regular,
        ...(color && {color: getColor(color)}),
      }),

      // Layout utilities
      createFlexStyle: (
        direction: "row" | "column" = "column",
        justify:
          | "flex-start"
          | "center"
          | "flex-end"
          | "space-between"
          | "space-around" = "flex-start",
        align: "flex-start" | "center" | "flex-end" | "stretch" = "stretch"
      ) => ({
        flexDirection: direction,
        justifyContent: justify,
        alignItems: align,
      }),

      // Container utilities
      createContainer: (padding: keyof typeof theme.spacing = 4) => ({
        paddingHorizontal: theme.spacing[padding],
        paddingVertical: theme.spacing[padding],
      }),

      // Screen utilities
      createScreenStyle: (
        gradientName?: keyof typeof theme.colors.gradients
      ) => ({
        flex: 1,
        ...(gradientName && {
          // Note: You'll need to use LinearGradient component for actual gradients
          backgroundColor: theme.colors.gradients[gradientName][1], // Use middle color as fallback
        }),
      }),
    }),
    []
  );

  return themeHelpers;
};

export default useTheme;
