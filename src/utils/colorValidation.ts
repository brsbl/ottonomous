/**
 * Color validation utilities for sanitizing user-provided colors.
 * Prevents XSS attacks via malicious color values in inline styles.
 */

/**
 * Regex pattern for valid hex colors (#RGB, #RRGGBB, #RRGGBBAA)
 */
const HEX_COLOR_REGEX = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{8})$/;

/**
 * Regex pattern for valid RGB/RGBA colors
 */
const RGB_COLOR_REGEX = /^rgba?\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;

/**
 * Regex pattern for valid HSL/HSLA colors
 */
const HSL_COLOR_REGEX = /^hsla?\(\s*\d{1,3}\s*,\s*\d{1,3}%\s*,\s*\d{1,3}%\s*(,\s*(0|1|0?\.\d+))?\s*\)$/;

/**
 * List of valid CSS named colors (subset of common colors)
 */
const NAMED_COLORS = new Set([
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown',
  'black', 'white', 'gray', 'grey', 'cyan', 'magenta', 'lime', 'indigo',
  'violet', 'coral', 'salmon', 'teal', 'navy', 'maroon', 'olive', 'aqua',
  'fuchsia', 'silver', 'gold', 'crimson', 'darkblue', 'darkgreen', 'darkred',
  'lightblue', 'lightgreen', 'lightgray', 'lightgrey', 'transparent'
]);

/**
 * Default fallback color when validation fails
 */
const DEFAULT_COLOR = '#808080';

/**
 * Validates and sanitizes a color value.
 * Returns the color if valid, or a safe default color if invalid.
 *
 * @param color - The color string to validate
 * @param fallback - Optional fallback color (must be a valid hex color)
 * @returns A safe, validated color string
 */
export function sanitizeColor(color: string | undefined | null, fallback: string = DEFAULT_COLOR): string {
  if (!color || typeof color !== 'string') {
    return fallback;
  }

  const trimmedColor = color.trim().toLowerCase();

  // Check hex colors
  if (HEX_COLOR_REGEX.test(color.trim())) {
    return color.trim();
  }

  // Check RGB/RGBA colors
  if (RGB_COLOR_REGEX.test(trimmedColor)) {
    return trimmedColor;
  }

  // Check HSL/HSLA colors
  if (HSL_COLOR_REGEX.test(trimmedColor)) {
    return trimmedColor;
  }

  // Check named colors
  if (NAMED_COLORS.has(trimmedColor)) {
    return trimmedColor;
  }

  // Invalid color - return fallback
  return fallback;
}

/**
 * Checks if a color value is valid without sanitizing.
 *
 * @param color - The color string to validate
 * @returns True if the color is valid, false otherwise
 */
export function isValidColor(color: string | undefined | null): boolean {
  if (!color || typeof color !== 'string') {
    return false;
  }

  const trimmedColor = color.trim().toLowerCase();

  return (
    HEX_COLOR_REGEX.test(color.trim()) ||
    RGB_COLOR_REGEX.test(trimmedColor) ||
    HSL_COLOR_REGEX.test(trimmedColor) ||
    NAMED_COLORS.has(trimmedColor)
  );
}
