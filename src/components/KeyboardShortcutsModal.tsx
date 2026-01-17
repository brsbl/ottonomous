/**
 * KeyboardShortcutsModal component - displays all available keyboard shortcuts.
 * Shows a modal overlay with a list of shortcuts organized by category.
 */

import { useEffect, useCallback, useRef, useMemo } from 'react';
import { getModifierSymbol as _getModifierSymbol } from '../lib/shortcuts';

// Use variable to suppress unused import warning (used dynamically in shortcuts display)
const getModifierSymbol = _getModifierSymbol;

interface KeyboardShortcutsModalProps {
  /** Callback to close the modal */
  onClose: () => void;
  /** Mode to display shortcuts for: 'pkb' for Personal Knowledge Base, 'kanban' for Kanban board */
  mode?: 'pkb' | 'kanban';
}

/**
 * Keyboard shortcut definition for display
 */
interface Shortcut {
  keys: string[];
  description: string;
}

/**
 * Get shortcut categories based on mode.
 */
function getShortcutCategories(mode: 'pkb' | 'kanban'): { title: string; shortcuts: Shortcut[] }[] {
  const modKey = getModifierSymbol();

  if (mode === 'pkb') {
    return [
      {
        title: 'Notes',
        shortcuts: [
          { keys: [modKey, 'N'], description: 'Create new note' },
          { keys: [modKey, 'S'], description: 'Save current note' },
          { keys: [modKey, 'O'], description: 'Open quick switcher' },
          { keys: [modKey, 'P'], description: 'Open command palette' },
        ],
      },
      {
        title: 'Search',
        shortcuts: [
          { keys: [modKey, 'F'], description: 'Search in current note' },
          { keys: [modKey, 'Shift', 'F'], description: 'Global search across all notes' },
        ],
      },
      {
        title: 'Editing',
        shortcuts: [
          { keys: [modKey, 'Z'], description: 'Undo' },
          { keys: [modKey, 'Shift', 'Z'], description: 'Redo' },
          { keys: [modKey, 'B'], description: 'Bold text' },
          { keys: [modKey, 'I'], description: 'Italic text' },
        ],
      },
      {
        title: 'Navigation',
        shortcuts: [
          { keys: ['Escape'], description: 'Close modal / cancel' },
          { keys: ['?'], description: 'Show keyboard shortcuts' },
        ],
      },
    ];
  }

  // Kanban mode (legacy)
  return [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: ['\u2190', '\u2192'], description: 'Navigate between columns' },
        { keys: ['\u2191', '\u2193'], description: 'Navigate between cards' },
        { keys: ['Enter'], description: 'Open selected card' },
        { keys: ['Escape'], description: 'Close modal / deselect card' },
      ],
    },
    {
      title: 'Card Actions',
      shortcuts: [
        { keys: ['n'], description: 'New card in current column' },
        { keys: ['e'], description: 'Edit selected card' },
        { keys: ['d'], description: 'Delete selected card (with confirm)' },
        { keys: ['m'], description: 'Move card to next column' },
        { keys: ['Shift', 'm'], description: 'Move card to previous column' },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { keys: [modKey, 'Z'], description: 'Undo' },
        { keys: [modKey, 'Shift', 'Z'], description: 'Redo' },
        { keys: ['/'], description: 'Focus search' },
        { keys: ['?'], description: 'Show keyboard shortcuts' },
      ],
    },
  ];
}

/**
 * KeyboardShortcutsModal component that renders a modal with all shortcuts.
 */
export function KeyboardShortcutsModal({ onClose, mode = 'pkb' }: KeyboardShortcutsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Get shortcut categories based on mode
  const shortcutCategories = useMemo(() => getShortcutCategories(mode), [mode]);

  /**
   * Handle Escape key to close modal
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    },
    [onClose]
  );

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Add event listener for Escape key
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Focus trap - focus modal on mount
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  /**
   * Render a key badge
   */
  const renderKey = (key: string, index: number) => (
    <kbd
      key={index}
      className="inline-flex items-center justify-center min-w-[24px] px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded shadow-sm"
    >
      {key}
    </kbd>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70
        animate-backdrop-fade-in motion-reduce:animate-none"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto
          animate-modal-scale-in motion-reduce:animate-none
          transition-all duration-200 ease-out outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2
            id="shortcuts-modal-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 space-y-6">
          {shortcutCategories.map((category) => (
            <div key={category.title}>
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                {category.title}
              </h3>
              <div className="space-y-2">
                {category.shortcuts.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {shortcut.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center">
                          {renderKey(key, keyIndex)}
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-xs text-gray-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Press <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded">?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcutsModal;
