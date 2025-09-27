# 🔄 Theme Migration Example

This document shows you how to migrate your existing components to use the theme system.

## 📋 Step-by-Step Migration Process

### Step 1: Identify Components to Migrate

Run the analysis to see what needs to be updated:

```bash
npm run extract-styles    # See what styles you currently use
npm run theme-preview     # See what would be changed
npm run theme-verbose     # Detailed preview with all changes
```

### Step 2: Manual Migration (Recommended Approach)

Instead of auto-migration, manually update components for better control:

#### Before (Hardcoded Styles)

```typescript
// ❌ Old way - hardcoded values
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
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#EC4899",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
});
```

#### After (Theme-based)

```typescript
// ✅ New way - theme-based
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
    button: {
      ...theme.createButtonStyle("secondary", "md"),
    },
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Themed Component</Text>
      <TouchableOpacity style={styles.button}>
        <Text>Click me</Text>
      </TouchableOpacity>
    </View>
  );
};
```

### Step 3: Use Pre-built Components

Instead of styling from scratch, use themed components:

```typescript
// ✅ Use themed components
import {ThemedButton} from "../components/ThemedButton";

<ThemedButton
  title="Save Changes"
  variant="primary"
  size="lg"
  onPress={handleSave}
  loading={isLoading}
/>;
```

## 🎨 Common Migration Patterns

### 1. Colors

```typescript
// ❌ Before
backgroundColor: '#8B5CF6',
color: '#FFFFFF',
borderColor: '#E5E5E5',

// ✅ After
backgroundColor: theme.colors.primary[500],
color: theme.colors.white,
borderColor: theme.colors.neutral[200],
```

### 2. Spacing

```typescript
// ❌ Before
padding: 16,
marginTop: 24,
marginHorizontal: 20,

// ✅ After
padding: theme.spacing[4],
marginTop: theme.spacing[6],
marginHorizontal: theme.spacing[5],
```

### 3. Typography

```typescript
// ❌ Before
fontSize: 18,
fontWeight: '600',
color: '#333333',
lineHeight: 24,

// ✅ After
...theme.createTextStyle('lg', 'semibold', 'neutral.700'),
```

### 4. Shadows

```typescript
// ❌ Before
shadowColor: '#000000',
shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.15,
shadowRadius: 6,
elevation: 4,

// ✅ After
...theme.shadows.md,
```

### 5. Border Radius

```typescript
// ❌ Before
borderRadius: 12,

// ✅ After
borderRadius: theme.borderRadius.lg,
```

## 🚀 Automated Migration (Optional)

If you want to auto-migrate (use with caution):

```bash
npm run theme-apply
```

**⚠️ Important:** Always backup your code before running auto-migration!

## 🧪 Testing After Migration

1. **Visual Testing**: Check that all components look the same
2. **Functionality Testing**: Ensure all interactions work
3. **Responsive Testing**: Test on different screen sizes
4. **Theme Consistency**: Verify consistent spacing and colors

## 📝 Migration Checklist

### For Each Component:

- [ ] Replace hardcoded colors with `theme.colors.*`
- [ ] Replace hardcoded spacing with `theme.spacing[*]`
- [ ] Replace hardcoded font sizes with `theme.typography.sizes.*`
- [ ] Replace hardcoded shadows with `theme.shadows.*`
- [ ] Replace hardcoded border radius with `theme.borderRadius.*`
- [ ] Add theme import: `import { useTheme } from '../hooks/useTheme'`
- [ ] Test component visually
- [ ] Test component functionality

### For the App:

- [ ] Migrate all screens
- [ ] Migrate all components
- [ ] Update navigation styles
- [ ] Test on iOS and Android
- [ ] Verify no visual regressions
- [ ] Update any remaining hardcoded values

## 🎯 Priority Order

1. **High Priority**: Core components (buttons, inputs, cards)
2. **Medium Priority**: Screen layouts and navigation
3. **Low Priority**: One-off styles and edge cases

## 💡 Tips

1. **Start Small**: Migrate one component at a time
2. **Test Frequently**: Check each migration before moving on
3. **Use Helpers**: Leverage theme helper functions
4. **Stay Consistent**: Use semantic color names (primary, secondary, etc.)
5. **Document Changes**: Note any custom values that don't fit the theme

## 🎉 Benefits After Migration

- ✅ **Consistency**: All components follow the same design system
- ✅ **Maintainability**: Change theme values in one place
- ✅ **Developer Experience**: Autocomplete and type safety
- ✅ **Performance**: Reusable style objects
- ✅ **Future-proof**: Easy to add dark mode, new themes
- ✅ **Scalability**: Easy to add new components and variants
