/**
 * Sidebar Component
 * Main sidebar container with tag navigation, collapsible design
 */

import { useState, useCallback } from 'react';
import { useAppStore } from '../../store/appStore';
import { TagTree } from './TagTree';

/**
 * Props for Sidebar component
 */
interface SidebarProps {
  /** Callback when a tag is selected */
  onTagSelect?: (tagPath: string | null) => void;
}

/**
 * Menu/hamburger icon for toggle button
 */
function MenuIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

/**
 * Close/X icon for toggle button when expanded
 */
function CloseIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

/**
 * Sidebar provides:
 * - 240px width container (from CSS variable --sidebar-width)
 * - Toggle visibility via settings.sidebarVisible
 * - Header with app name and toggle button
 * - TagTree component for tag navigation
 * - Smooth collapse/expand animation
 *
 * @example
 * ```tsx
 * function App() {
 *   const [selectedTag, setSelectedTag] = useState<string | null>(null);
 *
 *   return (
 *     <div className="flex h-screen">
 *       <Sidebar onTagSelect={setSelectedTag} />
 *       <main>Content filtered by {selectedTag}</main>
 *     </div>
 *   );
 * }
 * ```
 */
export function Sidebar({ onTagSelect }: SidebarProps) {
  const settings = useAppStore((state) => state.settings);
  const updateSettings = useAppStore((state) => state.updateSettings);

  // Local state for selected tag (can be lifted to parent via onTagSelect)
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Toggle sidebar visibility
  const handleToggle = useCallback(() => {
    updateSettings({ sidebarVisible: !settings.sidebarVisible });
  }, [settings.sidebarVisible, updateSettings]);

  // Handle tag selection - update local state and notify parent
  const handleTagSelect = useCallback(
    (tagPath: string | null) => {
      setSelectedTag(tagPath);
      onTagSelect?.(tagPath);
    },
    [onTagSelect]
  );

  // Handle keyboard shortcut for toggle (Cmd/Ctrl + \)
  // Note: This would typically be handled at a higher level with a global keydown listener

  return (
    <>
      {/* Collapsed state toggle button (shown when sidebar is hidden) */}
      {!settings.sidebarVisible && (
        <button
          type="button"
          className="
            fixed top-4 left-4 z-50
            p-2 rounded-lg theme-bg-secondary
            theme-text-primary hover:theme-bg-tertiary
            transition-colors duration-150
            shadow-md
          "
          onClick={handleToggle}
          aria-label="Open sidebar"
          title="Open sidebar (Cmd+\\)"
        >
          <MenuIcon />
        </button>
      )}

      {/* Sidebar container */}
      <aside
        className={`
          flex-shrink-0 h-full theme-bg-secondary
          flex flex-col border-r
          transition-all duration-200 ease-in-out
          ${settings.sidebarVisible ? 'translate-x-0' : '-translate-x-full absolute'}
        `}
        style={{
          width: 'var(--sidebar-width, 240px)',
          borderColor: 'var(--bg-tertiary)',
        }}
        aria-hidden={!settings.sidebarVisible}
        aria-label="Sidebar navigation"
      >
        {/* Header */}
        <header
          className="
            flex-shrink-0 flex items-center justify-between
            px-4 py-3 border-b
          "
          style={{ borderColor: 'var(--bg-tertiary)' }}
        >
          <h1 className="text-lg font-semibold theme-text-primary">
            Notes
          </h1>
          <button
            type="button"
            className="
              p-1.5 rounded-md theme-text-secondary
              hover:theme-bg-tertiary hover:theme-text-primary
              transition-colors duration-150
            "
            onClick={handleToggle}
            aria-label="Close sidebar"
            title="Close sidebar (Cmd+\\)"
          >
            <CloseIcon />
          </button>
        </header>

        {/* Tag tree content */}
        <div className="flex-1 overflow-hidden">
          <TagTree selectedTag={selectedTag} onTagSelect={handleTagSelect} />
        </div>

        {/* Footer with settings/help (placeholder for future) */}
        <footer
          className="
            flex-shrink-0 px-4 py-3 border-t
            theme-text-secondary text-xs
          "
          style={{ borderColor: 'var(--bg-tertiary)' }}
        >
          <span>Bear Notes</span>
        </footer>
      </aside>
    </>
  );
}
