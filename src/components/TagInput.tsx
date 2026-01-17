/**
 * TagInput component for managing note tags with inline #tag creation.
 * Features autocomplete, inline creation, and colored tag badges.
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { X, Hash, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import type { Tag } from '../types';

/**
 * Predefined colors for tags with accessible contrast.
 */
export const TAG_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#22c55e', // Green
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#64748b', // Slate
] as const;

/**
 * Get a random color from the predefined palette.
 */
export function getRandomTagColor(): string {
  return TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
}

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

interface TagInputProps {
  /** Current note ID to manage tags for */
  noteId: string;
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text for the input */
  placeholder?: string;
}

/**
 * TagInput component with inline tag creation and autocomplete.
 */
export function TagInput({
  noteId,
  className,
  placeholder = 'Add tags...',
}: TagInputProps) {
  const {
    tags: allTags,
    notes,
    createTag,
    addTagToNote,
    removeTagFromNote,
    getTagById,
  } = useKnowledgeBase();

  const [inputValue, setInputValue] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get current note
  const currentNote = useMemo(
    () => notes.find((n) => n.id === noteId),
    [notes, noteId]
  );

  // Get tags attached to current note
  const noteTags = useMemo(() => {
    if (!currentNote) return [];
    return currentNote.tags
      .map((tagId) => getTagById(tagId))
      .filter((tag): tag is Tag => tag !== undefined);
  }, [currentNote, getTagById]);

  // Filter tags for autocomplete (exclude already added tags)
  const filteredTags = useMemo(() => {
    const searchTerm = inputValue.replace(/^#/, '').toLowerCase();
    const noteTagIds = new Set(currentNote?.tags || []);

    return allTags.filter(
      (tag) =>
        !noteTagIds.has(tag.id) &&
        tag.name.toLowerCase().includes(searchTerm)
    );
  }, [allTags, inputValue, currentNote]);

  // Check if input matches any existing tag exactly
  const exactMatch = useMemo(() => {
    const searchTerm = inputValue.replace(/^#/, '').toLowerCase().trim();
    return allTags.find((tag) => tag.name.toLowerCase() === searchTerm);
  }, [allTags, inputValue]);

  // Show "Create new tag" option if no exact match and input has content
  const showCreateOption = useMemo(() => {
    const searchTerm = inputValue.replace(/^#/, '').trim();
    return searchTerm.length > 0 && !exactMatch;
  }, [inputValue, exactMatch]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset highlighted index when filtered results change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredTags.length, showCreateOption]);

  /**
   * Handle adding an existing tag to the note.
   */
  const handleAddTag = useCallback(
    async (tag: Tag) => {
      await addTagToNote(noteId, tag.id);
      setInputValue('');
      setIsOpen(false);
      inputRef.current?.focus();
    },
    [noteId, addTagToNote]
  );

  /**
   * Handle creating and adding a new tag.
   */
  const handleCreateAndAddTag = useCallback(async () => {
    const tagName = inputValue.replace(/^#/, '').trim();
    if (!tagName) return;

    // Check if tag already exists
    const existingTag = allTags.find(
      (t) => t.name.toLowerCase() === tagName.toLowerCase()
    );

    if (existingTag) {
      await addTagToNote(noteId, existingTag.id);
    } else {
      const newTag = await createTag({
        name: tagName,
        color: getRandomTagColor(),
      });
      await addTagToNote(noteId, newTag.id);
    }

    setInputValue('');
    setIsOpen(false);
    inputRef.current?.focus();
  }, [inputValue, allTags, noteId, createTag, addTagToNote]);

  /**
   * Handle removing a tag from the note.
   */
  const handleRemoveTag = useCallback(
    async (tagId: string) => {
      await removeTagFromNote(noteId, tagId);
    },
    [noteId, removeTagFromNote]
  );

  /**
   * Handle keyboard navigation.
   */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalOptions = filteredTags.length + (showCreateOption ? 1 : 0);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % totalOptions);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
          break;
        case 'Enter':
          e.preventDefault();
          if (showCreateOption && highlightedIndex === 0) {
            handleCreateAndAddTag();
          } else {
            const tagIndex = showCreateOption
              ? highlightedIndex - 1
              : highlightedIndex;
            if (filteredTags[tagIndex]) {
              handleAddTag(filteredTags[tagIndex]);
            }
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
        case 'Backspace':
          if (inputValue === '' && noteTags.length > 0) {
            // Remove last tag when backspace on empty input
            const lastTag = noteTags[noteTags.length - 1];
            handleRemoveTag(lastTag.id);
          }
          break;
      }
    },
    [
      filteredTags,
      showCreateOption,
      highlightedIndex,
      handleAddTag,
      handleCreateAndAddTag,
      handleRemoveTag,
      inputValue,
      noteTags,
    ]
  );

  /**
   * Handle input change with #tag detection.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setIsOpen(true);

    // Auto-detect #tag pattern and trigger autocomplete
    if (value.startsWith('#')) {
      setIsOpen(true);
    }
  };

  return (
    <div className={cn('relative', className)}>
      {/* Tag badges and input container */}
      <div
        className={cn(
          'flex flex-wrap items-center gap-1.5 p-2',
          'bg-background border border-input rounded-md',
          'focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2',
          'min-h-[40px]'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {/* Existing tag badges */}
        {noteTags.map((tag) => (
          <span
            key={tag.id}
            className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
              'transition-opacity hover:opacity-80'
            )}
            style={{
              backgroundColor: tag.color,
              color: getContrastColor(tag.color),
            }}
          >
            <Hash className="h-3 w-3" />
            {tag.name}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveTag(tag.id);
              }}
              className="ml-0.5 hover:bg-black/10 rounded-full p-0.5"
              aria-label={`Remove ${tag.name} tag`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={noteTags.length === 0 ? placeholder : ''}
          className={cn(
            'flex-1 min-w-[120px] bg-transparent border-none outline-none',
            'text-sm placeholder:text-muted-foreground'
          )}
          aria-autocomplete="list"
          aria-expanded={isOpen}
        />
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && (showCreateOption || filteredTags.length > 0) && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-50 mt-1 w-full',
            'bg-popover border border-border rounded-md shadow-lg',
            'max-h-60 overflow-auto'
          )}
        >
          {/* Create new tag option */}
          {showCreateOption && (
            <button
              type="button"
              onClick={handleCreateAndAddTag}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                'hover:bg-accent hover:text-accent-foreground',
                highlightedIndex === 0 && 'bg-accent text-accent-foreground'
              )}
            >
              <Plus className="h-4 w-4" />
              Create tag &quot;{inputValue.replace(/^#/, '')}&quot;
            </button>
          )}

          {/* Existing tags */}
          {filteredTags.map((tag, index) => {
            const optionIndex = showCreateOption ? index + 1 : index;
            return (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleAddTag(tag)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm text-left',
                  'hover:bg-accent hover:text-accent-foreground',
                  highlightedIndex === optionIndex &&
                    'bg-accent text-accent-foreground'
                )}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <Hash className="h-3 w-3 text-muted-foreground" />
                {tag.name}
              </button>
            );
          })}

          {/* Empty state */}
          {!showCreateOption && filteredTags.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No matching tags
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default TagInput;
