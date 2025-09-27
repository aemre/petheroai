// 🎨 PetHero AI - Centralized Theme System
// This file contains all design tokens for consistent theming across the app

import {Dimensions, Platform} from "react-native";

const {width, height} = Dimensions.get("window");

// 🎨 Color Palette
export const colors = {
  // Primary Colors
  // Primary Colors (Muted Blue-Gray)
  primary: {
    50: "#F8F9FB",
    100: "#F1F3F7",
    200: "#E4E8F0",
    300: "#CBD2E0",
    400: "#9BAAC7",
    500: "#5D688A", // Main primary (muted blue-gray)
    600: "#4A5570",
    700: "#3D4659",
    800: "#323846",
    900: "#2A2F3A",
  },

  // Secondary Colors (Soft Coral)
  secondary: {
    50: "#FEF9F9",
    100: "#FEF2F2",
    200: "#FCE5E5",
    300: "#F9CCCC",
    400: "#F7B8B8",
    500: "#F7A5A5", // Main secondary (soft coral)
    600: "#E58585",
    700: "#D16565",
    800: "#B54545",
    900: "#962E2E",
  },

  // Accent Colors (Warm Peach)
  accent: {
    50: "#FFFCF7",
    100: "#FFF8F0",
    200: "#FFF1E1",
    300: "#FFE8CC",
    400: "#FFE0B8",
    500: "#FFDBB6", // Main accent (warm peach)
    600: "#E6C4A3",
    700: "#CCAD90",
    800: "#B3967D",
    900: "#99806A",
  },

  // Neutral Colors (Warm Light)
  neutral: {
    50: "#FFF2EF", // Light cream background
    100: "#FEF0ED",
    200: "#FDEAE6",
    300: "#FBE0DA",
    400: "#F8D6CE",
    500: "#E6C4B8",
    600: "#D4B2A2",
    700: "#C2A08C",
    800: "#A08670",
    900: "#7E6C54",
  },

  // Gray Colors (complementing your warm palette)
  gray: {
    50: "#FFF2EF", // Using your cream color
    100: "#F8F5F2",
    200: "#E4E8F0", // Complementary to your blue-gray
    300: "#CBD2E0",
    400: "#9BAAC7",
    500: "#5D688A", // Your blue-gray
    600: "#4A5570",
    700: "#3D4659",
    800: "#323846",
    900: "#2A2F3A",
  },

  // Semantic Colors (using your palette)
  success: {
    50: "#ECFDF5",
    100: "#D1FAE5",
    200: "#A7F3D0",
    300: "#6EE7B7",
    400: "#34D399",
    500: "#059669", // Main success
    600: "#047857",
    700: "#065F46",
    800: "#064E3B",
    900: "#022C22",
  },

  warning: {
    50: "#FFFCF7",
    100: "#FFF8F0",
    200: "#FFF1E1",
    300: "#FFE8CC",
    400: "#FFE0B8",
    500: "#FFDBB6", // Your peach color
    600: "#E6C4A3",
    700: "#CCAD90",
    800: "#B3967D",
    900: "#99806A",
  },

  error: {
    50: "#FEF9F9",
    100: "#FEF2F2",
    200: "#FCE5E5",
    300: "#F9CCCC",
    400: "#F7B8B8",
    500: "#F7A5A5", // Your coral color
    600: "#E58585",
    700: "#D16565",
    800: "#B54545",
    900: "#962E2E",
  },

  // Special Colors
  white: "#FFFFFF",
  black: "#000000",
  transparent: "transparent",

  // Common shades
  gray333: "#333333",
  gray666: "#666666",
  gray999: "#999999",
  grayCCC: "#CCCCCC",

  // Your custom colors (direct access)
  customBlueGray: "#5D688A",
  customCoral: "#F7A5A5",
  customPeach: "#FFDBB6",
  customCream: "#FFF2EF",

  // Gradients (warm and elegant blends)
  gradients: {
    primary: ["#5D688A", "#9BAAC7", "#5D688A"], // blue-gray shades
    secondary: ["#F7A5A5", "#F7B8B8", "#F7A5A5"], // coral shades
    accent: ["#FFDBB6", "#FFE0B8", "#FFDBB6"], // peach shades
    sunset: ["#FFF2EF", "#FFDBB6", "#F7A5A5"], // cream to coral
    success: ["#D1FAE5", "#34D399", "#059669"], // elegant green
    error: ["#F7A5A5", "#E58585"], // coral error shades
    light: ["#FFF2EF", "#FFFCF7"], // light cream gradient
    disabled: ["#E6C4B8", "#D4B2A2"], // warm disabled state
  },
};

// 📝 Typography
export const typography = {
  // Font Families
  fonts: {
    light: "Oswald-Light",
    regular: "Oswald-Regular",
    medium: "Oswald-Medium",
    semibold: "Oswald-SemiBold",
    bold: "Oswald-SemiBold", // Using SemiBold as bold since we don't have Bold variant
  },

  // Font Sizes
  sizes: {
    xs: 10,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 28,
    "4xl": 32,
    "5xl": 36,
    "6xl": 48,
  },

  // Line Heights
  lineHeights: {
    xs: 14,
    sm: 16,
    base: 20,
    md: 22,
    lg: 24,
    xl: 28,
    "2xl": 32,
    "3xl": 36,
    "4xl": 40,
    "5xl": 44,
    "6xl": 56,
  },

  // Font Weights
  weights: {
    light: "300" as const,
    normal: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
    extrabold: "800" as const,
  },
};

// 📏 Spacing System
export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  11: 44,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
  28: 112,
  32: 128,
  36: 144,
  40: 160,
  44: 176,
  48: 192,
  52: 208,
  56: 224,
  60: 240,
  64: 256,
  72: 288,
  80: 320,
  96: 384,
};

// 🔲 Border Radius
export const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  base: 6,
  md: 8,
  lg: 12,
  xl: 16,
  "2xl": 20,
  "3xl": 24,
  "4xl": 28,
  full: 9999,
};

// 🌫️ Shadows
export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  "2xl": {
    shadowColor: colors.black,
    shadowOffset: {width: 0, height: 16},
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
};

// 📱 Device Dimensions
export const dimensions = {
  window: {
    width,
    height,
  },
  isSmallDevice: width < 375,
  isMediumDevice: width >= 375 && width < 414,
  isLargeDevice: width >= 414,
};

// 🎛️ Component Variants
export const components = {
  // Button variants
  button: {
    sizes: {
      sm: {
        paddingHorizontal: spacing[3],
        paddingVertical: spacing[2],
        fontSize: typography.sizes.sm,
        borderRadius: borderRadius.md,
        fontFamily: typography.fonts.medium,
      },
      md: {
        paddingHorizontal: spacing[4],
        paddingVertical: spacing[3],
        fontSize: typography.sizes.base,
        borderRadius: borderRadius.lg,
        fontFamily: typography.fonts.medium,
      },
      lg: {
        paddingHorizontal: spacing[6],
        paddingVertical: spacing[4],
        fontSize: typography.sizes.lg,
        borderRadius: borderRadius.xl,
        fontFamily: typography.fonts.semibold,
      },
    },
    variants: {
      primary: {
        backgroundColor: colors.primary[500],
        color: colors.white,
      },
      secondary: {
        backgroundColor: colors.secondary[500],
        color: colors.white,
      },
      outline: {
        backgroundColor: colors.transparent,
        borderWidth: 1,
        borderColor: colors.primary[500],
        color: colors.primary[500],
      },
      ghost: {
        backgroundColor: colors.transparent,
        color: colors.primary[500],
      },
    },
  },

  // Card variants
  card: {
    base: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing[4],
      ...shadows.base,
    },
    elevated: {
      backgroundColor: colors.white,
      borderRadius: borderRadius.xl,
      padding: spacing[6],
      ...shadows.lg,
    },
  },

  // Input variants
  input: {
    base: {
      borderWidth: 1,
      borderColor: colors.neutral[300],
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      fontSize: typography.sizes.base,
      backgroundColor: colors.white,
      fontFamily: typography.fonts.regular,
    },
    focused: {
      borderColor: colors.primary[500],
      ...shadows.sm,
    },
    error: {
      borderColor: colors.error[500],
    },
  },
};

// 🎨 Theme Object (Main Export)
export const theme = {
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  dimensions,
  components,
};

export default theme;

// 🔧 Helper Functions
export const createStyle = (styleObj: any) => styleObj;

export const getColor = (colorPath: string) => {
  const keys = colorPath.split(".");
  let result: any = colors;

  for (const key of keys) {
    result = result[key];
    if (result === undefined) {
      console.warn(`Color path "${colorPath}" not found`);
      return colors.neutral[500];
    }
  }

  return result;
};

// Helper function to get the correct Oswald font family based on weight
export const getFontFamily = (weight: keyof typeof typography.weights) => {
  switch (weight) {
    case "light":
      return typography.fonts.light;
    case "normal":
      return typography.fonts.regular;
    case "medium":
      return typography.fonts.medium;
    case "semibold":
    case "bold":
    case "extrabold":
      return typography.fonts.semibold;
    default:
      return typography.fonts.regular;
  }
};

export const getSpacing = (size: keyof typeof spacing) => spacing[size];

export const createGradient = (gradientName: keyof typeof colors.gradients) =>
  colors.gradients[gradientName];

// 🎨 Color Helper Functions
export const rgba = (color: string, opacity: number) => {
  // Convert hex to rgba
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

export const blackWithOpacity = (opacity: number) =>
  rgba(colors.black, opacity);
export const whiteWithOpacity = (opacity: number) =>
  rgba(colors.white, opacity);

// Common overlay colors
export const overlayLight = blackWithOpacity(0.5);
export const overlayMedium = blackWithOpacity(0.6);
export const overlayDark = blackWithOpacity(0.7);
export const overlayHeavy = blackWithOpacity(0.8);

// Common button background colors with opacity
export const primaryWithOpacity = (opacity: number) =>
  rgba(colors.primary[500], opacity);
export const successWithOpacity = (opacity: number) =>
  rgba(colors.success[500], opacity);
export const warningWithOpacity = (opacity: number) =>
  rgba(colors.warning[500], opacity);
export const errorWithOpacity = (opacity: number) =>
  rgba(colors.error[500], opacity);
