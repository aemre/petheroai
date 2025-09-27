# 🎨 PetHero AI - Theme System Guide

## 📖 Overview

This guide explains how to use the centralized theme system in your PetHero AI app. The theme system provides consistent colors, typography, spacing, and components across your entire application.

## 🚀 Quick Start

### 1. Using the Theme Hook

```typescript
import {useTheme} from "../hooks/useTheme";

const MyComponent = () => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.primary[500],
      padding: theme.spacing[4],
      borderRadius: theme.borderRadius.lg,
      ...theme.shadows.md,
    },
    text: theme.createTextStyle("lg", "bold", "white"),
  });

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello Theme!</Text>
    </View>
  );
};
```

### 2. Direct Theme Import

```typescript
import {theme} from "../theme";

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary[500],
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
  },
});
```

## 🎨 Color System

### Color Palette

```typescript
// Primary colors (Purple)
theme.colors.primary[50]; // Lightest
theme.colors.primary[500]; // Main primary
theme.colors.primary[900]; // Darkest

// Secondary colors (Pink)
theme.colors.secondary[500];

// Accent colors (Blue)
theme.colors.accent[500];

// Semantic colors
theme.colors.success[500]; // Green
theme.colors.warning[500]; // Orange
theme.colors.error[500]; // Red

// Neutrals
theme.colors.neutral[100]; // Light gray
theme.colors.neutral[500]; // Medium gray
theme.colors.neutral[900]; // Dark gray
```

### Using Gradients

```typescript
import {LinearGradient} from "expo-linear-gradient";

<LinearGradient
  colors={theme.colors.gradients.primary}
  style={styles.container}
>
  {/* Your content */}
</LinearGradient>;
```

## 📝 Typography System

### Font Sizes

```typescript
const styles = StyleSheet.create({
  heading: {
    fontSize: theme.typography.sizes["2xl"], // 24px
    fontWeight: theme.typography.weights.bold,
    lineHeight: theme.typography.lineHeights["2xl"],
  },
  body: {
    fontSize: theme.typography.sizes.base, // 14px
    lineHeight: theme.typography.lineHeights.base,
  },
});
```

### Helper Function

```typescript
const theme = useTheme();

const textStyle = theme.createTextStyle("lg", "semibold", "primary.600");
```

## 📏 Spacing System

### Available Spacing

```typescript
theme.spacing[1]; // 4px
theme.spacing[2]; // 8px
theme.spacing[3]; // 12px
theme.spacing[4]; // 16px
theme.spacing[5]; // 20px
theme.spacing[6]; // 24px
// ... up to theme.spacing[96] // 384px
```

### Usage

```typescript
const styles = StyleSheet.create({
  container: {
    padding: theme.spacing[4],
    marginTop: theme.spacing[6],
    marginHorizontal: theme.spacing[5],
  },
});
```

## 🔲 Border Radius

```typescript
const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg, // 12px
  },
  button: {
    borderRadius: theme.borderRadius.full, // 9999px (pill)
  },
});
```

## 🌫️ Shadows

```typescript
const styles = StyleSheet.create({
  card: {
    ...theme.shadows.md, // Medium shadow
  },
  modal: {
    ...theme.shadows.xl, // Large shadow
  },
});

// Or with custom color
const customShadow = theme.createShadow("lg", theme.colors.primary[500]);
```

## 🧩 Component Styles

### Pre-built Component Styles

```typescript
const theme = useTheme();

// Button styles
const primaryButton = theme.createButtonStyle("primary", "lg");
const outlineButton = theme.createButtonStyle("outline", "md");

// Card styles
const basicCard = theme.createCardStyle("base");
const elevatedCard = theme.createCardStyle("elevated");

// Input styles
const normalInput = theme.createInputStyle("base");
const focusedInput = theme.createInputStyle("focused");
const errorInput = theme.createInputStyle("error");
```

## 📱 Responsive Design

```typescript
const theme = useTheme();

const responsivePadding = theme.getResponsiveValue({
  small: theme.spacing[2], // 8px on small devices
  medium: theme.spacing[4], // 16px on medium devices
  large: theme.spacing[6], // 24px on large devices
  default: theme.spacing[4], // 16px fallback
});
```

## 🛠️ Migration Scripts

### 1. Extract Existing Styles

```bash
node scripts/extract-styles.js
```

This will:

- Scan your entire codebase
- Extract all colors, font sizes, spacing values
- Generate a report with suggestions
- Create `extracted-styles.json` with findings

### 2. Preview Migration

```bash
node scripts/migrate-to-theme.js --dry-run
```

This will:

- Show what changes would be made
- Preview replacements
- No files will be modified

### 3. Apply Migration

```bash
node scripts/migrate-to-theme.js --apply
```

This will:

- Automatically replace hardcoded values with theme references
- Add theme imports where needed
- Modify your files

## 📚 Examples

### Before (Hardcoded)

```typescript
const styles = StyleSheet.create({
  container: {
    backgroundColor: "#8B5CF6",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    shadowColor: "#000000",
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
```

### After (Theme-based)

```typescript
import {useTheme} from "../hooks/useTheme";

const MyComponent = () => {
  const theme = useTheme();

  const styles = StyleSheet.create({
    container: {
      backgroundColor: theme.colors.primary[500],
      padding: theme.spacing[4],
      borderRadius: theme.borderRadius.lg,
      marginTop: theme.spacing[6],
      ...theme.shadows.md,
    },
    title: theme.createTextStyle("2xl", "bold", "white"),
  });

  // ... rest of component
};
```

### Using the ThemedButton Component

```typescript
import { ThemedButton } from '../components/ThemedButton';

<ThemedButton
  title="Save Changes"
  variant="primary"
  size="lg"
  onPress={handleSave}
  loading={isLoading}
/>

<ThemedButton
  title="Cancel"
  variant="outline"
  size="md"
  onPress={handleCancel}
/>
```

## 🎯 Best Practices

### 1. Always Use Theme Values

❌ **Don't:**

```typescript
backgroundColor: '#8B5CF6',
padding: 16,
fontSize: 18,
```

✅ **Do:**

```typescript
backgroundColor: theme.colors.primary[500],
padding: theme.spacing[4],
fontSize: theme.typography.sizes.lg,
```

### 2. Use Helper Functions

❌ **Don't:**

```typescript
fontSize: 18,
fontWeight: '600',
color: '#FFFFFF',
lineHeight: 24,
```

✅ **Do:**

```typescript
...theme.createTextStyle('lg', 'semibold', 'white'),
```

### 3. Consistent Component Patterns

❌ **Don't:**

```typescript
// Different button styles everywhere
backgroundColor: '#8B5CF6',
paddingHorizontal: 20,
paddingVertical: 12,
borderRadius: 8,
```

✅ **Do:**

```typescript
...theme.createButtonStyle('primary', 'md'),
```

### 4. Use Semantic Colors

❌ **Don't:**

```typescript
color: '#EF4444', // What does this color mean?
```

✅ **Do:**

```typescript
color: theme.colors.error[500], // Clear semantic meaning
```

## 🔧 Customization

### Extending the Theme

You can extend the theme by modifying `src/theme/index.ts`:

```typescript
// Add custom colors
export const colors = {
  ...colors,
  brand: {
    50: "#F0F9FF",
    500: "#0EA5E9",
    900: "#0C4A6E",
  },
};

// Add custom components
export const components = {
  ...components,
  modal: {
    base: {
      backgroundColor: colors.white,
      borderRadius: borderRadius["2xl"],
      padding: spacing[6],
      ...shadows.xl,
    },
  },
};
```

## 📦 Package Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "extract-styles": "node scripts/extract-styles.js",
    "migrate-theme": "node scripts/migrate-to-theme.js --dry-run",
    "apply-theme": "node scripts/migrate-to-theme.js --apply"
  }
}
```

## 🎉 Benefits

1. **Consistency**: All components use the same design system
2. **Maintainability**: Change colors/spacing in one place
3. **Developer Experience**: Autocomplete and type safety
4. **Performance**: Reusable style objects
5. **Scalability**: Easy to add new variants and components
6. **Dark Mode Ready**: Easy to implement theme switching

## 🔗 Next Steps

1. Run the extraction script to see your current styles
2. Review the theme values and customize as needed
3. Use the migration script to convert existing components
4. Start using the theme in new components
5. Create custom themed components for common patterns

Happy theming! 🎨✨
