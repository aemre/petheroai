#!/usr/bin/env node

/**
 * 🎨 Style Extraction Script
 *
 * This script scans your React Native app and extracts:
 * - Colors (hex, rgba, named colors)
 * - Font sizes
 * - Spacing values
 * - Border radius values
 *
 * Usage: node scripts/extract-styles.js
 */

const fs = require("fs");
const path = require("path");

// Configuration
const SRC_DIR = path.join(__dirname, "../src");
const OUTPUT_FILE = path.join(__dirname, "extracted-styles.json");

// Regular expressions for extraction
const PATTERNS = {
  colors: {
    hex: /#[0-9A-Fa-f]{3,8}/g,
    rgba: /rgba?\([^)]+\)/g,
    namedColors:
      /['"`](red|blue|green|yellow|purple|pink|orange|black|white|gray|grey)['"`]/g,
  },
  fontSize: /fontSize:\s*([0-9]+)/g,
  spacing: {
    margin: /margin[A-Za-z]*:\s*([0-9]+)/g,
    padding: /padding[A-Za-z]*:\s*([0-9]+)/g,
    width: /width:\s*([0-9]+)/g,
    height: /height:\s*([0-9]+)/g,
  },
  borderRadius: /borderRadius:\s*([0-9]+)/g,
  shadowRadius: /shadowRadius:\s*([0-9]+)/g,
  elevation: /elevation:\s*([0-9]+)/g,
};

// Storage for extracted values
const extracted = {
  colors: new Set(),
  fontSizes: new Set(),
  spacing: new Set(),
  borderRadius: new Set(),
  shadows: new Set(),
  files: [],
};

/**
 * Recursively scan directory for TypeScript/JavaScript files
 */
function scanDirectory(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules and other unwanted directories
      if (
        !["node_modules", ".git", "ios", "android", "__tests__"].includes(file)
      ) {
        scanDirectory(filePath);
      }
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      processFile(filePath);
    }
  }
}

/**
 * Process a single file and extract style values
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const relativePath = path.relative(SRC_DIR, filePath);

    const fileData = {
      path: relativePath,
      colors: [],
      fontSizes: [],
      spacing: [],
      borderRadius: [],
      shadows: [],
    };

    // Extract colors
    const hexColors = content.match(PATTERNS.colors.hex) || [];
    const rgbaColors = content.match(PATTERNS.colors.rgba) || [];
    const namedColors = content.match(PATTERNS.colors.namedColors) || [];

    [...hexColors, ...rgbaColors, ...namedColors].forEach((color) => {
      extracted.colors.add(color);
      fileData.colors.push(color);
    });

    // Extract font sizes
    let match;
    const fontSizePattern = new RegExp(PATTERNS.fontSize.source, "g");
    while ((match = fontSizePattern.exec(content)) !== null) {
      const size = parseInt(match[1]);
      extracted.fontSizes.add(size);
      fileData.fontSizes.push(size);
    }

    // Extract spacing values
    Object.entries(PATTERNS.spacing).forEach(([type, pattern]) => {
      const spacingPattern = new RegExp(pattern.source, "g");
      while ((match = spacingPattern.exec(content)) !== null) {
        const value = parseInt(match[1]);
        extracted.spacing.add(value);
        fileData.spacing.push({type, value});
      }
    });

    // Extract border radius
    const borderRadiusPattern = new RegExp(PATTERNS.borderRadius.source, "g");
    while ((match = borderRadiusPattern.exec(content)) !== null) {
      const value = parseInt(match[1]);
      extracted.borderRadius.add(value);
      fileData.borderRadius.push(value);
    }

    // Extract shadow values
    const shadowRadiusPattern = new RegExp(PATTERNS.shadowRadius.source, "g");
    while ((match = shadowRadiusPattern.exec(content)) !== null) {
      const value = parseInt(match[1]);
      extracted.shadows.add(value);
      fileData.shadows.push(value);
    }

    const elevationPattern = new RegExp(PATTERNS.elevation.source, "g");
    while ((match = elevationPattern.exec(content)) !== null) {
      const value = parseInt(match[1]);
      extracted.shadows.add(value);
      fileData.shadows.push(value);
    }

    // Only include files that have style values
    if (
      fileData.colors.length ||
      fileData.fontSizes.length ||
      fileData.spacing.length ||
      fileData.borderRadius.length ||
      fileData.shadows.length
    ) {
      extracted.files.push(fileData);
    }
  } catch (error) {
    console.warn(`Warning: Could not process ${filePath}:`, error.message);
  }
}

/**
 * Generate theme suggestions based on extracted values
 */
function generateThemeSuggestions() {
  const suggestions = {
    colors: {
      mostUsed: [...extracted.colors].slice(0, 20),
      unique: extracted.colors.size,
    },
    typography: {
      fontSizes: [...extracted.fontSizes].sort((a, b) => a - b),
      suggestions: {
        xs: Math.min(...extracted.fontSizes),
        sm: 12,
        base: 16,
        lg: 20,
        xl: 24,
        "2xl": Math.max(...extracted.fontSizes),
      },
    },
    spacing: {
      values: [...extracted.spacing].sort((a, b) => a - b),
      suggestions: generateSpacingScale([...extracted.spacing]),
    },
    borderRadius: {
      values: [...extracted.borderRadius].sort((a, b) => a - b),
      suggestions: {
        sm: 4,
        base: 8,
        lg: 12,
        xl: 16,
        "2xl": 20,
        full: 9999,
      },
    },
    shadows: {
      values: [...extracted.shadows].sort((a, b) => a - b),
    },
  };

  return suggestions;
}

/**
 * Generate a spacing scale based on extracted values
 */
function generateSpacingScale(values) {
  const sorted = values.sort((a, b) => a - b);
  const scale = {};

  // Generate a scale based on multiples of 4
  for (let i = 0; i <= 20; i++) {
    scale[i] = i * 4;
  }

  return scale;
}

/**
 * Generate migration suggestions for specific files
 */
function generateMigrationSuggestions() {
  const migrations = extracted.files.map((file) => {
    const suggestions = [];

    // Color migration suggestions
    file.colors.forEach((color) => {
      if (color.startsWith("#8B5CF6") || color.includes("139, 92, 246")) {
        suggestions.push({
          type: "color",
          from: color,
          to: "theme.colors.primary[500]",
          description: "Replace with primary color from theme",
        });
      }
    });

    // Font size suggestions
    file.fontSizes.forEach((size) => {
      const themeSize = getClosestThemeSize(size);
      if (themeSize) {
        suggestions.push({
          type: "fontSize",
          from: `fontSize: ${size}`,
          to: `fontSize: theme.typography.sizes.${themeSize}`,
          description: `Replace with theme font size (${size} -> ${themeSize})`,
        });
      }
    });

    return {
      file: file.path,
      suggestions,
    };
  });

  return migrations.filter((m) => m.suggestions.length > 0);
}

function getClosestThemeSize(size) {
  const themeSizes = {
    10: "xs",
    12: "sm",
    14: "base",
    16: "md",
    18: "lg",
    20: "xl",
    24: "2xl",
    28: "3xl",
    32: "4xl",
  };

  return themeSizes[size] || null;
}

/**
 * Main execution
 */
function main() {
  console.log("🎨 Extracting styles from your React Native app...\n");

  // Scan all files
  scanDirectory(SRC_DIR);

  // Generate suggestions
  const suggestions = generateThemeSuggestions();
  const migrations = generateMigrationSuggestions();

  // Prepare output
  const output = {
    summary: {
      filesProcessed: extracted.files.length,
      colorsFound: extracted.colors.size,
      fontSizesFound: extracted.fontSizes.size,
      spacingValuesFound: extracted.spacing.size,
      borderRadiusFound: extracted.borderRadius.size,
      shadowsFound: extracted.shadows.size,
    },
    extracted: {
      colors: [...extracted.colors],
      fontSizes: [...extracted.fontSizes].sort((a, b) => a - b),
      spacing: [...extracted.spacing].sort((a, b) => a - b),
      borderRadius: [...extracted.borderRadius].sort((a, b) => a - b),
      shadows: [...extracted.shadows].sort((a, b) => a - b),
    },
    suggestions,
    migrations,
    files: extracted.files,
  };

  // Write to file
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Print summary
  console.log("📊 Extraction Complete!");
  console.log("=".repeat(50));
  console.log(`📁 Files processed: ${output.summary.filesProcessed}`);
  console.log(`🎨 Colors found: ${output.summary.colorsFound}`);
  console.log(`📝 Font sizes: ${output.summary.fontSizesFound}`);
  console.log(`📏 Spacing values: ${output.summary.spacingValuesFound}`);
  console.log(`🔲 Border radius: ${output.summary.borderRadiusFound}`);
  console.log(`🌫️  Shadows: ${output.summary.shadowsFound}`);
  console.log(`\n📄 Results saved to: ${OUTPUT_FILE}`);

  // Show top colors
  if (output.extracted.colors.length > 0) {
    console.log("\n🎨 Most Used Colors:");
    output.extracted.colors.slice(0, 10).forEach((color) => {
      console.log(`   ${color}`);
    });
  }

  // Show font sizes
  if (output.extracted.fontSizes.length > 0) {
    console.log("\n📝 Font Sizes Found:");
    console.log(`   ${output.extracted.fontSizes.join(", ")}`);
  }

  console.log("\n✨ Next Steps:");
  console.log("1. Review the extracted-styles.json file");
  console.log("2. Update src/theme/index.ts with your preferred values");
  console.log("3. Run the migration script to update your components");
  console.log(
    '4. Import theme in your components: import { theme } from "../theme"'
  );
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  processFile,
  generateThemeSuggestions,
  generateMigrationSuggestions,
};
