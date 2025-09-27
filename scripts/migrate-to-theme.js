#!/usr/bin/env node

/**
 * 🔄 Theme Migration Script
 *
 * This script helps migrate your existing components to use the centralized theme system.
 * It can automatically replace hardcoded values with theme references.
 *
 * Usage:
 *   node scripts/migrate-to-theme.js --dry-run  (preview changes)
 *   node scripts/migrate-to-theme.js --apply    (apply changes)
 */

const fs = require("fs");
const path = require("path");

// Configuration
const SRC_DIR = path.join(__dirname, "../src");
const THEME_IMPORT = `import { theme } from '../theme';`;

// Common color mappings (you can expand this based on your app)
const COLOR_MAPPINGS = {
  "#8B5CF6": "theme.colors.primary[500]",
  "#A855F7": "theme.colors.primary[400]",
  "#7C3AED": "theme.colors.primary[600]",
  "#EC4899": "theme.colors.secondary[500]",
  "#F472B6": "theme.colors.secondary[400]",
  "#DB2777": "theme.colors.secondary[600]",
  "#3B82F6": "theme.colors.accent[500]",
  "#60A5FA": "theme.colors.accent[400]",
  "#2563EB": "theme.colors.accent[600]",
  "#FFFFFF": "theme.colors.white",
  "#000000": "theme.colors.black",
  "#F5F5F5": "theme.colors.neutral[100]",
  "#E5E5E5": "theme.colors.neutral[200]",
  "#D4D4D4": "theme.colors.neutral[300]",
  "#A3A3A3": "theme.colors.neutral[400]",
  "#737373": "theme.colors.neutral[500]",
  "#525252": "theme.colors.neutral[600]",
  "#404040": "theme.colors.neutral[700]",
  "#262626": "theme.colors.neutral[800]",
  "#22C55E": "theme.colors.success[500]",
  "#F59E0B": "theme.colors.warning[500]",
  "#EF4444": "theme.colors.error[500]",
};

// Font size mappings
const FONT_SIZE_MAPPINGS = {
  10: "theme.typography.sizes.xs",
  12: "theme.typography.sizes.sm",
  14: "theme.typography.sizes.base",
  16: "theme.typography.sizes.md",
  18: "theme.typography.sizes.lg",
  20: "theme.typography.sizes.xl",
  24: 'theme.typography.sizes["2xl"]',
  28: 'theme.typography.sizes["3xl"]',
  32: 'theme.typography.sizes["4xl"]',
  36: 'theme.typography.sizes["5xl"]',
  48: 'theme.typography.sizes["6xl"]',
};

// Spacing mappings (common values)
const SPACING_MAPPINGS = {
  4: "theme.spacing[1]",
  8: "theme.spacing[2]",
  12: "theme.spacing[3]",
  16: "theme.spacing[4]",
  20: "theme.spacing[5]",
  24: "theme.spacing[6]",
  28: "theme.spacing[7]",
  32: "theme.spacing[8]",
  40: "theme.spacing[10]",
  48: "theme.spacing[12]",
  64: "theme.spacing[16]",
  80: "theme.spacing[20]",
};

// Border radius mappings
const BORDER_RADIUS_MAPPINGS = {
  4: "theme.borderRadius.sm",
  6: "theme.borderRadius.base",
  8: "theme.borderRadius.md",
  12: "theme.borderRadius.lg",
  16: "theme.borderRadius.xl",
  20: 'theme.borderRadius["2xl"]',
  24: 'theme.borderRadius["3xl"]',
  9999: "theme.borderRadius.full",
};

/**
 * Migration patterns and their replacements
 */
const MIGRATION_PATTERNS = [
  // Colors
  {
    pattern:
      /(backgroundColor|color|borderColor|shadowColor):\s*['"`](#[0-9A-Fa-f]{6})['"`]/g,
    replacement: (match, property, color) => {
      const themeColor = COLOR_MAPPINGS[color.toUpperCase()];
      return themeColor ? `${property}: ${themeColor}` : match;
    },
    description: "Replace hex colors with theme colors",
  },

  // Font sizes
  {
    pattern: /fontSize:\s*(\d+)/g,
    replacement: (match, size) => {
      const themeSize = FONT_SIZE_MAPPINGS[parseInt(size)];
      return themeSize ? `fontSize: ${themeSize}` : match;
    },
    description: "Replace font sizes with theme typography",
  },

  // Spacing (margin, padding)
  {
    pattern:
      /(margin|padding|marginTop|marginBottom|marginLeft|marginRight|paddingTop|paddingBottom|paddingLeft|paddingRight|marginHorizontal|marginVertical|paddingHorizontal|paddingVertical):\s*(\d+)/g,
    replacement: (match, property, value) => {
      const themeSpacing = SPACING_MAPPINGS[parseInt(value)];
      return themeSpacing ? `${property}: ${themeSpacing}` : match;
    },
    description: "Replace spacing values with theme spacing",
  },

  // Border radius
  {
    pattern: /borderRadius:\s*(\d+)/g,
    replacement: (match, value) => {
      const themeBorderRadius = BORDER_RADIUS_MAPPINGS[parseInt(value)];
      return themeBorderRadius ? `borderRadius: ${themeBorderRadius}` : match;
    },
    description: "Replace border radius with theme border radius",
  },

  // RGBA colors (basic ones)
  {
    pattern: /rgba\(255,\s*255,\s*255,\s*([\d.]+)\)/g,
    replacement: (match, alpha) => {
      if (alpha === "1" || alpha === "1.0") return "theme.colors.white";
      return `theme.colors.white`; // You might want to create opacity variants
    },
    description: "Replace common RGBA colors",
  },
];

/**
 * Process a single file for migration
 */
function migrateFile(filePath, dryRun = true) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    let modifiedContent = content;
    let hasChanges = false;
    let changes = [];

    // Apply each migration pattern
    MIGRATION_PATTERNS.forEach(({pattern, replacement, description}) => {
      const originalContent = modifiedContent;

      if (typeof replacement === "function") {
        modifiedContent = modifiedContent.replace(pattern, (...args) => {
          const result = replacement(...args);
          if (result !== args[0]) {
            hasChanges = true;
            changes.push({
              description,
              from: args[0],
              to: result,
            });
          }
          return result;
        });
      } else {
        modifiedContent = modifiedContent.replace(pattern, replacement);
        if (modifiedContent !== originalContent) {
          hasChanges = true;
          changes.push({
            description,
            pattern: pattern.toString(),
          });
        }
      }
    });

    // Add theme import if needed and changes were made
    if (
      hasChanges &&
      !content.includes("from '../theme'") &&
      !content.includes('from "../theme"')
    ) {
      // Find the last import statement
      const importLines = content
        .split("\n")
        .filter((line) => line.trim().startsWith("import"));
      if (importLines.length > 0) {
        const lastImportIndex = content.lastIndexOf(
          importLines[importLines.length - 1]
        );
        const afterLastImport = content.indexOf("\n", lastImportIndex) + 1;
        modifiedContent =
          content.slice(0, afterLastImport) +
          THEME_IMPORT +
          "\n" +
          content.slice(afterLastImport);

        // Re-apply patterns to the new content
        MIGRATION_PATTERNS.forEach(({pattern, replacement}) => {
          if (typeof replacement === "function") {
            modifiedContent = modifiedContent.replace(pattern, replacement);
          } else {
            modifiedContent = modifiedContent.replace(pattern, replacement);
          }
        });
      }
    }

    // Write file if not dry run
    if (!dryRun && hasChanges) {
      fs.writeFileSync(filePath, modifiedContent);
    }

    return {
      filePath,
      hasChanges,
      changes,
      preview: hasChanges
        ? {
            before: content.split("\n").slice(0, 10).join("\n"),
            after: modifiedContent.split("\n").slice(0, 10).join("\n"),
          }
        : null,
    };
  } catch (error) {
    return {
      filePath,
      error: error.message,
    };
  }
}

/**
 * Recursively process all TypeScript/JavaScript files
 */
function processDirectory(dir, dryRun = true) {
  const results = [];

  function scanDir(currentDir) {
    const files = fs.readdirSync(currentDir);

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        // Skip unwanted directories
        if (
          ![
            "node_modules",
            ".git",
            "ios",
            "android",
            "__tests__",
            "scripts",
          ].includes(file)
        ) {
          scanDir(fullPath);
        }
      } else if (file.match(/\.(ts|tsx)$/) && !file.endsWith(".d.ts")) {
        // Skip the theme file itself
        if (!fullPath.includes("theme/index.ts")) {
          const result = migrateFile(fullPath, dryRun);
          results.push(result);
        }
      }
    }
  }

  scanDir(dir);
  return results;
}

/**
 * Main execution function
 */
function main() {
  const args = process.argv.slice(2);
  const dryRun = !args.includes("--apply");
  const verbose = args.includes("--verbose");

  console.log("🔄 Theme Migration Script");
  console.log("=".repeat(50));
  console.log(
    `Mode: ${dryRun ? "👀 DRY RUN (preview only)" : "✏️  APPLY CHANGES"}`
  );
  console.log("");

  // Process all files
  const results = processDirectory(SRC_DIR, dryRun);

  // Filter results
  const changedFiles = results.filter((r) => r.hasChanges);
  const errorFiles = results.filter((r) => r.error);

  // Print summary
  console.log("📊 Migration Summary:");
  console.log(`   Files processed: ${results.length}`);
  console.log(`   Files with changes: ${changedFiles.length}`);
  console.log(`   Files with errors: ${errorFiles.length}`);
  console.log("");

  // Show changed files
  if (changedFiles.length > 0) {
    console.log("📝 Files to be modified:");
    changedFiles.forEach((result) => {
      const relativePath = path.relative(SRC_DIR, result.filePath);
      console.log(`   ✏️  ${relativePath} (${result.changes.length} changes)`);

      if (verbose) {
        result.changes.forEach((change) => {
          console.log(`      - ${change.description}`);
          if (change.from && change.to) {
            console.log(`        ${change.from} → ${change.to}`);
          }
        });
        console.log("");
      }
    });
  }

  // Show errors
  if (errorFiles.length > 0) {
    console.log("❌ Files with errors:");
    errorFiles.forEach((result) => {
      const relativePath = path.relative(SRC_DIR, result.filePath);
      console.log(`   ${relativePath}: ${result.error}`);
    });
    console.log("");
  }

  // Show next steps
  if (dryRun && changedFiles.length > 0) {
    console.log("✨ Next Steps:");
    console.log("1. Review the changes above");
    console.log("2. Run with --apply to make the changes:");
    console.log("   node scripts/migrate-to-theme.js --apply");
    console.log("3. Test your app to ensure everything works");
    console.log("4. Update any remaining manual cases");
  } else if (!dryRun && changedFiles.length > 0) {
    console.log("✅ Migration complete!");
    console.log("   Remember to:");
    console.log("   1. Test your app thoroughly");
    console.log("   2. Check for any visual regressions");
    console.log("   3. Update remaining manual cases");
  } else if (changedFiles.length === 0) {
    console.log("✨ No changes needed - your app is already theme-ready!");
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  migrateFile,
  processDirectory,
  COLOR_MAPPINGS,
  FONT_SIZE_MAPPINGS,
  SPACING_MAPPINGS,
};
