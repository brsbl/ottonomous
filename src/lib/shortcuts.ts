/**
 * Keyboard shortcuts library for the Personal Knowledge Base application.
 * Provides a centralized registry for keyboard shortcuts with cross-platform support.
 */

// =============================================================================
// Platform Detection
// =============================================================================

/**
 * Detect if the current platform is macOS.
 * Uses navigator.platform with fallback to userAgentData.
 */
export const isMac = (): boolean => {
  if (typeof navigator === 'undefined') return false;

  // Modern API
  if ('userAgentData' in navigator && (navigator as Navigator & { userAgentData?: { platform: string } }).userAgentData) {
    return (navigator as Navigator & { userAgentData: { platform: string } }).userAgentData.platform === 'macOS';
  }

  // Fallback to platform
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
};

/**
 * Get the modifier key label for the current platform.
 * Returns 'Cmd' on Mac, 'Ctrl' on other platforms.
 */
export const getModifierKey = (): string => {
  return isMac() ? 'Cmd' : 'Ctrl';
};

/**
 * Get the modifier key symbol for display.
 * Returns the command symbol on Mac, 'Ctrl' on other platforms.
 */
export const getModifierSymbol = (): string => {
  return isMac() ? '\u2318' : 'Ctrl';
};

// =============================================================================
// Shortcut Types
// =============================================================================

/**
 * Modifier keys that can be combined with a base key.
 */
export interface ShortcutModifiers {
  /** Ctrl key (Windows/Linux) or Cmd key (Mac) */
  mod?: boolean;
  /** Shift key */
  shift?: boolean;
  /** Alt/Option key */
  alt?: boolean;
  /** Ctrl key specifically (even on Mac) */
  ctrl?: boolean;
}

/**
 * Definition of a keyboard shortcut.
 */
export interface ShortcutDefinition {
  /** The base key (lowercase, e.g., 'n', 'o', 'f') */
  key: string;
  /** Modifier keys */
  modifiers?: ShortcutModifiers;
  /** Human-readable description */
  description: string;
  /** Handler function when shortcut is triggered */
  handler: () => void;
  /** Whether to prevent default browser behavior (default: true) */
  preventDefault?: boolean;
  /** Whether shortcut is currently enabled (default: true) */
  enabled?: boolean;
}

/**
 * Registered shortcut with its unique ID.
 */
export interface RegisteredShortcut extends ShortcutDefinition {
  id: string;
}

/**
 * Shortcut display info for UI rendering.
 */
export interface ShortcutDisplayInfo {
  id: string;
  keys: string[];
  description: string;
}

// =============================================================================
// Shortcut Registry
// =============================================================================

/** Map of registered shortcuts by ID */
const shortcutRegistry = new Map<string, RegisteredShortcut>();

/** Whether the global keyboard listener is attached */
let isListenerAttached = false;

/**
 * Generate a unique ID for a shortcut based on its key combination.
 */
function generateShortcutId(keys: string, modifiers?: ShortcutModifiers): string {
  const parts: string[] = [];
  if (modifiers?.mod) parts.push('mod');
  if (modifiers?.ctrl) parts.push('ctrl');
  if (modifiers?.alt) parts.push('alt');
  if (modifiers?.shift) parts.push('shift');
  parts.push(keys.toLowerCase());
  return parts.join('+');
}

/**
 * Check if a keyboard event matches a shortcut definition.
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
  const { key, modifiers = {} } = shortcut;

  // Check if the key matches (case-insensitive)
  if (event.key.toLowerCase() !== key.toLowerCase()) {
    return false;
  }

  // Check modifier keys
  const modKeyPressed = event.metaKey || event.ctrlKey;
  const expectsMod = modifiers.mod ?? false;
  const expectsCtrl = modifiers.ctrl ?? false;
  const expectsAlt = modifiers.alt ?? false;
  const expectsShift = modifiers.shift ?? false;

  // On Mac, metaKey is Cmd, on other platforms use ctrlKey
  const modMatches = expectsMod ? modKeyPressed : !modKeyPressed || expectsCtrl;
  const ctrlMatches = expectsCtrl ? event.ctrlKey : expectsMod ? true : !event.ctrlKey;
  const altMatches = expectsAlt ? event.altKey : !event.altKey;
  const shiftMatches = expectsShift ? event.shiftKey : !event.shiftKey;

  // Special handling for mod key
  if (expectsMod) {
    const macMod = isMac() ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey;
    return macMod && altMatches && shiftMatches;
  }

  return modMatches && ctrlMatches && altMatches && shiftMatches;
}

/**
 * Check if the event target is an input element.
 */
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;

  const tagName = target.tagName.toUpperCase();
  return (
    tagName === 'INPUT' ||
    tagName === 'TEXTAREA' ||
    tagName === 'SELECT' ||
    target.isContentEditable
  );
}

/**
 * Global keyboard event handler.
 */
function handleKeyDown(event: KeyboardEvent): void {
  // Allow shortcuts with mod key even in input elements
  const modKeyPressed = event.metaKey || event.ctrlKey;

  // Skip if in input element and no modifier key pressed
  if (isInputElement(event.target) && !modKeyPressed) {
    return;
  }

  // Check all registered shortcuts
  for (const shortcut of shortcutRegistry.values()) {
    if (shortcut.enabled === false) continue;

    if (matchesShortcut(event, shortcut)) {
      // Don't trigger if in input unless it's a mod shortcut
      if (isInputElement(event.target) && !shortcut.modifiers?.mod) {
        continue;
      }

      if (shortcut.preventDefault !== false) {
        event.preventDefault();
      }
      shortcut.handler();
      return;
    }
  }
}

/**
 * Attach the global keyboard event listener.
 */
function attachListener(): void {
  if (isListenerAttached || typeof window === 'undefined') return;

  window.addEventListener('keydown', handleKeyDown);
  isListenerAttached = true;
}

/**
 * Detach the global keyboard event listener.
 */
function detachListener(): void {
  if (!isListenerAttached || typeof window === 'undefined') return;

  window.removeEventListener('keydown', handleKeyDown);
  isListenerAttached = false;
}

// =============================================================================
// Public API
// =============================================================================

/**
 * Register a keyboard shortcut.
 * @param shortcut - The shortcut definition
 * @returns The shortcut ID (can be used to unregister)
 */
export function registerShortcut(shortcut: ShortcutDefinition): string {
  const id = generateShortcutId(shortcut.key, shortcut.modifiers);

  const registered: RegisteredShortcut = {
    ...shortcut,
    id,
  };

  shortcutRegistry.set(id, registered);

  // Attach listener if not already attached
  attachListener();

  return id;
}

/**
 * Register multiple shortcuts at once.
 * @param shortcuts - Array of shortcut definitions
 * @returns Array of shortcut IDs
 */
export function registerShortcuts(shortcuts: ShortcutDefinition[]): string[] {
  return shortcuts.map(registerShortcut);
}

/**
 * Unregister a keyboard shortcut by ID.
 * @param id - The shortcut ID returned from registerShortcut
 */
export function unregisterShortcut(id: string): void {
  shortcutRegistry.delete(id);

  // Detach listener if no shortcuts left
  if (shortcutRegistry.size === 0) {
    detachListener();
  }
}

/**
 * Unregister multiple shortcuts by IDs.
 * @param ids - Array of shortcut IDs
 */
export function unregisterShortcuts(ids: string[]): void {
  ids.forEach(unregisterShortcut);
}

/**
 * Clear all registered shortcuts.
 */
export function clearAllShortcuts(): void {
  shortcutRegistry.clear();
  detachListener();
}

/**
 * Enable or disable a shortcut by ID.
 * @param id - The shortcut ID
 * @param enabled - Whether the shortcut should be enabled
 */
export function setShortcutEnabled(id: string, enabled: boolean): void {
  const shortcut = shortcutRegistry.get(id);
  if (shortcut) {
    shortcut.enabled = enabled;
  }
}

/**
 * Get all registered shortcuts for display.
 * @returns Array of shortcut display info
 */
export function getAllShortcuts(): ShortcutDisplayInfo[] {
  const modSymbol = getModifierSymbol();

  return Array.from(shortcutRegistry.values()).map((shortcut) => {
    const keys: string[] = [];

    if (shortcut.modifiers?.mod) keys.push(modSymbol);
    if (shortcut.modifiers?.ctrl && !shortcut.modifiers.mod) keys.push('Ctrl');
    if (shortcut.modifiers?.alt) keys.push(isMac() ? 'Option' : 'Alt');
    if (shortcut.modifiers?.shift) keys.push('Shift');
    keys.push(shortcut.key.toUpperCase());

    return {
      id: shortcut.id,
      keys,
      description: shortcut.description,
    };
  });
}

/**
 * Format a shortcut for display (e.g., "Cmd+N" or "Ctrl+N").
 * @param key - The base key
 * @param modifiers - The modifiers
 * @returns Formatted shortcut string
 */
export function formatShortcut(key: string, modifiers?: ShortcutModifiers): string {
  const parts: string[] = [];
  const modSymbol = getModifierSymbol();

  if (modifiers?.mod) parts.push(modSymbol);
  if (modifiers?.ctrl && !modifiers.mod) parts.push('Ctrl');
  if (modifiers?.alt) parts.push(isMac() ? '\u2325' : 'Alt');
  if (modifiers?.shift) parts.push('\u21E7');
  parts.push(key.toUpperCase());

  return parts.join(isMac() ? '' : '+');
}

// =============================================================================
// Predefined Shortcut Keys
// =============================================================================

/**
 * Common shortcut key definitions for the application.
 */
export const SHORTCUT_KEYS = {
  NEW_NOTE: { key: 'n', modifiers: { mod: true } },
  QUICK_SWITCHER: { key: 'o', modifiers: { mod: true } },
  COMMAND_PALETTE: { key: 'p', modifiers: { mod: true } },
  SEARCH_IN_NOTE: { key: 'f', modifiers: { mod: true } },
  GLOBAL_SEARCH: { key: 'f', modifiers: { mod: true, shift: true } },
  SAVE: { key: 's', modifiers: { mod: true } },
  UNDO: { key: 'z', modifiers: { mod: true } },
  REDO: { key: 'z', modifiers: { mod: true, shift: true } },
} as const;

export default {
  isMac,
  getModifierKey,
  getModifierSymbol,
  registerShortcut,
  registerShortcuts,
  unregisterShortcut,
  unregisterShortcuts,
  clearAllShortcuts,
  setShortcutEnabled,
  getAllShortcuts,
  formatShortcut,
  SHORTCUT_KEYS,
};
