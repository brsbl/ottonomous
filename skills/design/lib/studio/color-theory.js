/**
 * Color Theory Utilities
 * Vanilla JS module for color manipulation and accessibility calculations
 * No external dependencies - can be embedded directly in HTML
 */

/**
 * Convert hex color to HSL
 * @param {string} hex - Hex color string (with or without #)
 * @returns {{h: number, s: number, l: number}} HSL values (h: 0-360, s: 0-100, l: 0-100)
 */
function hexToHSL(hex) {
  // Remove # if present
  const cleanHex = hex.replace(/^#/, "");

  // Parse hex to RGB
  const r = Number.parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(cleanHex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

/**
 * Convert HSL to hex color
 * @param {number} h - Hue (0-360)
 * @param {number} s - Saturation (0-100)
 * @param {number} l - Lightness (0-100)
 * @returns {string} Hex color string with #
 */
function hslToHex(h, s, l) {
  // Normalize values
  const hue = ((h % 360) + 360) % 360;
  const sat = Math.max(0, Math.min(100, s)) / 100;
  const light = Math.max(0, Math.min(100, l)) / 100;

  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - c / 2;

  let r = 0;
  let g = 0;
  let b = 0;

  if (hue >= 0 && hue < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (hue >= 60 && hue < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (hue >= 120 && hue < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (hue >= 180 && hue < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (hue >= 240 && hue < 300) {
    r = x;
    g = 0;
    b = c;
  } else {
    r = c;
    g = 0;
    b = x;
  }

  const toHex = (n) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? `0${hex}` : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Generate a shade scale (50-950) from a base hex color
 * Uses HSL lightness manipulation
 * @param {string} baseHex - Base hex color
 * @returns {Object} Object with shade keys (50, 100, 200, ..., 900, 950) and hex values
 */
function generateShadeScale(baseHex) {
  const hsl = hexToHSL(baseHex);

  // Lightness values for each shade level
  // 50 is lightest, 950 is darkest
  const lightnessMap = {
    50: 97,
    100: 94,
    200: 86,
    300: 76,
    400: 62,
    500: 50,
    600: 42,
    700: 34,
    800: 26,
    900: 18,
    950: 10,
  };

  // Adjust saturation slightly for light and dark shades
  const getSaturation = (targetL) => {
    if (targetL > 80) {
      // Lighter shades: reduce saturation slightly
      return Math.max(10, hsl.s - (targetL - 80) * 0.5);
    }
    if (targetL < 30) {
      // Darker shades: increase saturation slightly for richness
      return Math.min(100, hsl.s + (30 - targetL) * 0.3);
    }
    return hsl.s;
  };

  const scale = {};
  for (const [shade, lightness] of Object.entries(lightnessMap)) {
    const adjustedSaturation = getSaturation(lightness);
    scale[shade] = hslToHex(hsl.h, adjustedSaturation, lightness);
  }

  return scale;
}

/**
 * Get complementary color (+180 degrees on color wheel)
 * @param {string} hex - Base hex color
 * @returns {string} Complementary hex color
 */
function getComplementary(hex) {
  const hsl = hexToHSL(hex);
  return hslToHex((hsl.h + 180) % 360, hsl.s, hsl.l);
}

/**
 * Get analogous colors (+/- 30 degrees on color wheel)
 * @param {string} hex - Base hex color
 * @returns {string[]} Array of [left, base, right] analogous colors
 */
function getAnalogous(hex) {
  const hsl = hexToHSL(hex);
  return [
    hslToHex((hsl.h - 30 + 360) % 360, hsl.s, hsl.l),
    hex.startsWith("#") ? hex : `#${hex}`,
    hslToHex((hsl.h + 30) % 360, hsl.s, hsl.l),
  ];
}

/**
 * Get triadic colors (+/- 120 degrees on color wheel)
 * @param {string} hex - Base hex color
 * @returns {string[]} Array of three triadic colors
 */
function getTriadic(hex) {
  const hsl = hexToHSL(hex);
  return [
    hex.startsWith("#") ? hex : `#${hex}`,
    hslToHex((hsl.h + 120) % 360, hsl.s, hsl.l),
    hslToHex((hsl.h + 240) % 360, hsl.s, hsl.l),
  ];
}

/**
 * Get split-complementary colors (+/- 150 degrees on color wheel)
 * @param {string} hex - Base hex color
 * @returns {string[]} Array of [base, split1, split2] colors
 */
function getSplitComplementary(hex) {
  const hsl = hexToHSL(hex);
  return [
    hex.startsWith("#") ? hex : `#${hex}`,
    hslToHex((hsl.h + 150) % 360, hsl.s, hsl.l),
    hslToHex((hsl.h + 210) % 360, hsl.s, hsl.l),
  ];
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 * @param {string} hex - Hex color string
 * @returns {number} Relative luminance (0-1)
 */
function getRelativeLuminance(hex) {
  const cleanHex = hex.replace(/^#/, "");

  const r = Number.parseInt(cleanHex.substring(0, 2), 16) / 255;
  const g = Number.parseInt(cleanHex.substring(2, 4), 16) / 255;
  const b = Number.parseInt(cleanHex.substring(4, 6), 16) / 255;

  const toLinear = (c) => {
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculate contrast ratio between two colors (WCAG formula)
 * @param {string} hex1 - First hex color
 * @param {string} hex2 - Second hex color
 * @returns {number} Contrast ratio (1-21)
 */
function getContrastRatio(hex1, hex2) {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check if color combination meets WCAG accessibility standards
 * @param {string} foreground - Foreground hex color
 * @param {string} background - Background hex color
 * @returns {{ratio: number, aa: boolean, aaLarge: boolean, aaa: boolean, aaaLarge: boolean}}
 */
function meetsWCAG(foreground, background) {
  const ratio = getContrastRatio(foreground, background);

  return {
    ratio: Math.round(ratio * 100) / 100,
    aa: ratio >= 4.5, // Normal text AA
    aaLarge: ratio >= 3, // Large text AA (14pt bold or 18pt)
    aaa: ratio >= 7, // Normal text AAA
    aaaLarge: ratio >= 4.5, // Large text AAA
  };
}

// Export for ES modules
export {
  hexToHSL,
  hslToHex,
  generateShadeScale,
  getComplementary,
  getAnalogous,
  getTriadic,
  getSplitComplementary,
  getRelativeLuminance,
  getContrastRatio,
  meetsWCAG,
};

// Also expose on window for direct HTML embedding
if (typeof window !== "undefined") {
  window.ColorTheory = {
    hexToHSL,
    hslToHex,
    generateShadeScale,
    getComplementary,
    getAnalogous,
    getTriadic,
    getSplitComplementary,
    getRelativeLuminance,
    getContrastRatio,
    meetsWCAG,
  };
}
