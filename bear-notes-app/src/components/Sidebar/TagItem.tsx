/**
 * TagItem Component
 * Renders a single tag in the sidebar tree with interactions
 */

import { useState, useCallback } from 'react';
import type { TagTreeNode } from '../../types';

/**
 * Props for TagItem component
 */
interface TagItemProps {
  /** The tag tree node to render */
  node: TagTreeNode;
  /** Depth level for indentation (0 = root) */
  depth?: number;
  /** Currently selected tag path */
  selectedTag?: string | null;
  /** Callback when tag is clicked to filter notes */
  onTagSelect: (tagPath: string) => void;
  /** Callback to toggle pin status */
  onTogglePin?: (tagPath: string, isPinned: boolean) => void;
}

/**
 * Chevron icon component for expand/collapse
 */
function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg
      className={`w-4 h-4 transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Pin icon component
 */
function PinIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      className="w-3.5 h-3.5"
      fill={filled ? 'currentColor' : 'none'}
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );
}

/**
 * TagItem renders a tag with:
 * - Click to filter notes
 * - Expand/collapse for nested tags
 * - Note count badge
 * - Pin/unpin toggle
 * - Visual states (hover, selected, pinned)
 *
 * @example
 * ```tsx
 * <TagItem
 *   node={tagNode}
 *   depth={0}
 *   selectedTag={selectedTag}
 *   onTagSelect={(path) => setSelectedTag(path)}
 *   onTogglePin={(path, pinned) => handleTogglePin(path, pinned)}
 * />
 * ```
 */
export function TagItem({
  node,
  depth = 0,
  selectedTag,
  onTagSelect,
  onTogglePin,
}: TagItemProps) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedTag === node.fullPath;

  // Handle tag click to filter notes
  const handleTagClick = useCallback(() => {
    onTagSelect(node.fullPath);
  }, [node.fullPath, onTagSelect]);

  // Handle expand/collapse toggle
  const handleToggleExpand = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => !prev);
  }, []);

  // Handle pin toggle
  const handlePinToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onTogglePin?.(node.fullPath, !node.isPinned);
    },
    [node.fullPath, node.isPinned, onTogglePin]
  );

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleTagClick();
      } else if (e.key === 'ArrowRight' && hasChildren && !expanded) {
        e.preventDefault();
        setExpanded(true);
      } else if (e.key === 'ArrowLeft' && hasChildren && expanded) {
        e.preventDefault();
        setExpanded(false);
      }
    },
    [handleTagClick, hasChildren, expanded]
  );

  // Calculate padding based on depth (16px base + 16px per level)
  const paddingLeft = 16 + depth * 16;

  return (
    <li
      role="treeitem"
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={isSelected}
      tabIndex={0}
      onClick={handleTagClick}
      onKeyDown={handleKeyDown}
      className={`
        group flex items-center gap-1 py-1.5 pr-2 cursor-pointer
        transition-colors duration-150 rounded-md mx-1 list-none
        ${isSelected ? 'theme-bg-tertiary' : 'hover:theme-bg-tertiary'}
        ${node.isPinned ? 'theme-text-accent' : 'theme-text-primary'}
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
      `}
      style={{ paddingLeft: `${paddingLeft}px` }}
      aria-label={`${node.name}, ${node.noteCount} notes${node.isPinned ? ', pinned' : ''}`}
    >
      <div className="flex items-center gap-1 flex-1 min-w-0">
        {/* Expand/collapse button */}
        <button
          type="button"
          className={`
            flex-shrink-0 w-5 h-5 flex items-center justify-center
            rounded theme-text-secondary hover:theme-text-primary
            ${hasChildren ? 'visible' : 'invisible'}
          `}
          onClick={handleToggleExpand}
          tabIndex={-1}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          <ChevronIcon expanded={expanded} />
        </button>

        {/* Tag name */}
        <span className="flex-1 truncate text-sm"># {node.name}</span>

        {/* Pin button (visible on hover or when pinned) */}
        <button
          type="button"
          className={`
            flex-shrink-0 p-1 rounded theme-text-secondary
            hover:theme-text-accent transition-opacity duration-150
            ${node.isPinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
          onClick={handlePinToggle}
          tabIndex={-1}
          aria-label={node.isPinned ? 'Unpin tag' : 'Pin tag'}
          title={node.isPinned ? 'Unpin tag' : 'Pin tag'}
        >
          <PinIcon filled={node.isPinned} />
        </button>

        {/* Note count badge */}
        <span
          className="flex-shrink-0 text-xs theme-text-secondary min-w-[20px] text-right"
          aria-label={`${node.noteCount} notes`}
        >
          {node.noteCount}
        </span>
      </div>

      {/* Nested children */}
      {hasChildren && expanded && (
        <ul role="group" className="list-none p-0 m-0">
          {node.children.map((child) => (
            <TagItem
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selectedTag={selectedTag}
              onTagSelect={onTagSelect}
              onTogglePin={onTogglePin}
            />
          ))}
        </ul>
      )}
    </li>
  );
}
