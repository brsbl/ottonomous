/**
 * TagFilter component for filtering notes by tags in the sidebar.
 * Displays all available tags with note counts and selection state.
 */

import { useState, useMemo, useCallback } from 'react';
import { Hash, ChevronDown, ChevronRight, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import type { Tag } from '../types';

/**
 * Get contrasting text color for a background color.
 */
function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#1f2937' : '#ffffff';
}

interface TagFilterProps {
  /** Currently selected tag IDs for filtering */
  selectedTagIds: string[];
  /** Callback when tag selection changes */
  onTagSelectionChange: (tagIds: string[]) => void;
  /** Additional CSS classes */
  className?: string;
  /** Whether the section is collapsible (default: true) */
  collapsible?: boolean;
  /** Initial collapsed state */
  defaultCollapsed?: boolean;
}

/**
 * TagFilter component displays tags with selection for filtering notes.
 */
export function TagFilter({
  selectedTagIds,
  onTagSelectionChange,
  className,
  collapsible = true,
  defaultCollapsed = false,
}: TagFilterProps) {
  const { tags, notes } = useKnowledgeBase();
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  /**
   * Calculate note counts for each tag.
   */
  const tagNoteCounts = useMemo(() => {
    const counts = new Map<string, number>();
    notes.forEach((note) => {
      note.tags.forEach((tagId) => {
        counts.set(tagId, (counts.get(tagId) || 0) + 1);
      });
    });
    return counts;
  }, [notes]);

  /**
   * Sort tags by note count (descending) then alphabetically.
   */
  const sortedTags = useMemo(() => {
    return [...tags].sort((a, b) => {
      const countA = tagNoteCounts.get(a.id) || 0;
      const countB = tagNoteCounts.get(b.id) || 0;
      if (countB !== countA) return countB - countA;
      return a.name.localeCompare(b.name);
    });
  }, [tags, tagNoteCounts]);

  /**
   * Handle tag selection toggle.
   */
  const handleTagClick = useCallback(
    (tagId: string) => {
      if (selectedTagIds.includes(tagId)) {
        onTagSelectionChange(selectedTagIds.filter((id) => id !== tagId));
      } else {
        onTagSelectionChange([...selectedTagIds, tagId]);
      }
    },
    [selectedTagIds, onTagSelectionChange]
  );

  /**
   * Clear all selected tags.
   */
  const handleClearAll = useCallback(() => {
    onTagSelectionChange([]);
  }, [onTagSelectionChange]);

  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-1', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => collapsible && setIsCollapsed(!isCollapsed)}
          className={cn(
            'flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2',
            collapsible && 'hover:text-foreground transition-colors cursor-pointer'
          )}
        >
          {collapsible && (
            isCollapsed ? (
              <ChevronRight className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )
          )}
          <Hash className="h-3 w-3" />
          Tags
          {selectedTagIds.length > 0 && (
            <span className="ml-1 text-primary">({selectedTagIds.length})</span>
          )}
        </button>

        {/* Clear selection button */}
        {selectedTagIds.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className={cn(
              'text-xs text-muted-foreground hover:text-foreground',
              'px-2 py-0.5 rounded hover:bg-accent transition-colors'
            )}
            aria-label="Clear tag filter"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tag list */}
      {!isCollapsed && (
        <div className="flex flex-wrap gap-1.5 px-2 py-1">
          {sortedTags.map((tag) => {
            const noteCount = tagNoteCounts.get(tag.id) || 0;
            const isSelected = selectedTagIds.includes(tag.id);

            return (
              <TagBadge
                key={tag.id}
                tag={tag}
                noteCount={noteCount}
                isSelected={isSelected}
                onClick={() => handleTagClick(tag.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/**
 * Props for the TagBadge component.
 */
interface TagBadgeProps {
  tag: Tag;
  noteCount: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * Individual tag badge with selection state.
 */
function TagBadge({ tag, noteCount, isSelected, onClick }: TagBadgeProps) {
  const textColor = getContrastColor(tag.color);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        'transition-all duration-150',
        'hover:ring-2 hover:ring-offset-1 hover:ring-primary/50',
        isSelected && 'ring-2 ring-offset-1 ring-primary'
      )}
      style={{
        backgroundColor: isSelected ? tag.color : `${tag.color}33`,
        color: isSelected ? textColor : tag.color,
      }}
      aria-pressed={isSelected}
    >
      <Hash className="h-3 w-3" />
      {tag.name}
      {noteCount > 0 && (
        <span
          className={cn(
            'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px]',
            isSelected ? 'bg-black/10' : 'bg-current/10'
          )}
        >
          {noteCount}
        </span>
      )}
      {isSelected && (
        <X className="h-3 w-3 ml-0.5" aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * Hook for managing tag filter state.
 * Returns filtered notes based on selected tags.
 */
export function useTagFilter() {
  const { notes } = useKnowledgeBase();
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

  /**
   * Filter notes that have ALL selected tags (AND logic).
   */
  const filteredNotes = useMemo(() => {
    if (selectedTagIds.length === 0) return notes;

    return notes.filter((note) =>
      selectedTagIds.every((tagId) => note.tags.includes(tagId))
    );
  }, [notes, selectedTagIds]);

  /**
   * Filter notes that have ANY selected tag (OR logic).
   */
  const filteredNotesOr = useMemo(() => {
    if (selectedTagIds.length === 0) return notes;

    return notes.filter((note) =>
      selectedTagIds.some((tagId) => note.tags.includes(tagId))
    );
  }, [notes, selectedTagIds]);

  return {
    selectedTagIds,
    setSelectedTagIds,
    filteredNotes,
    filteredNotesOr,
    hasFilter: selectedTagIds.length > 0,
    clearFilter: () => setSelectedTagIds([]),
  };
}

export default TagFilter;
