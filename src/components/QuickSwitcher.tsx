/**
 * QuickSwitcher component for rapidly navigating between notes.
 * Provides fuzzy search, keyboard navigation, and quick note creation.
 * Activated via keyboard shortcut (Cmd/Ctrl+K).
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { FileText, Plus, Clock, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import { createSearchIndex, searchNotes } from '../lib/search';
import { cn } from '../lib/utils';
import type { Note } from '../types';

interface QuickSwitcherProps {
  /** Whether the quick switcher modal is open */
  open: boolean;
  /** Callback to close the modal */
  onOpenChange: (open: boolean) => void;
}

interface QuickSwitcherItem {
  id: string;
  title: string;
  note?: Note;
  isCreateNew?: boolean;
  highlightedTitle?: string;
}

/**
 * Safe highlight renderer that creates React elements instead of using innerHTML.
 * Parses the highlighted title string and converts <mark> tags to React elements.
 */
function SafeHighlight({ html, className }: { html: string; className?: string }) {
  // Parse the highlighted string which contains <mark>...</mark> tags
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const markRegex = /<mark>([^<]*)<\/mark>/g;
  let match;

  while ((match = markRegex.exec(html)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(html.slice(lastIndex, match.index));
    }
    // Add the highlighted part as a styled span
    parts.push(
      <span key={match.index} className="bg-yellow-300/50 dark:bg-yellow-500/30 rounded-sm">
        {match[1]}
      </span>
    );
    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after last match
  if (lastIndex < html.length) {
    parts.push(html.slice(lastIndex));
  }

  return <span className={className}>{parts}</span>;
}

/**
 * QuickSwitcher provides fast note navigation with fuzzy search.
 * Features:
 * - Fuzzy search by title using Fuse.js
 * - Recent notes displayed when search is empty
 * - Keyboard navigation (up/down arrows)
 * - Enter to open selected note
 * - Esc to close
 * - Create new note option if no match found
 */
export function QuickSwitcher({ open, onOpenChange }: QuickSwitcherProps) {
  const { notes, setActiveNote, createNote } = useKnowledgeBase();

  // Local state
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Get recent notes sorted by updatedAt, limited to 8.
   */
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => {
        const dateA = new Date(a.updatedAt).getTime();
        const dateB = new Date(b.updatedAt).getTime();
        return dateB - dateA;
      })
      .slice(0, 8);
  }, [notes]);

  /**
   * Create search index for fuzzy matching.
   */
  const searchIndex = useMemo(() => {
    return createSearchIndex(notes);
  }, [notes]);

  /**
   * Compute items to display based on search query.
   */
  const items: QuickSwitcherItem[] = useMemo(() => {
    if (!query.trim()) {
      // Show recent notes when no query
      return recentNotes.map((note) => ({
        id: note.id,
        title: note.title,
        note,
      }));
    }

    // Perform fuzzy search
    const results = searchNotes(query, searchIndex);

    // Map search results to items
    const searchItems: QuickSwitcherItem[] = results.slice(0, 10).map((result) => ({
      id: result.note.id,
      title: result.note.title,
      note: result.note,
      highlightedTitle: result.highlightedTitle,
    }));

    // Add "Create new note" option if query doesn't exactly match any note
    const exactMatch = notes.some(
      (note) => note.title.toLowerCase() === query.toLowerCase()
    );

    if (!exactMatch && query.trim()) {
      searchItems.push({
        id: 'create-new',
        title: query.trim(),
        isCreateNew: true,
      });
    }

    return searchItems;
  }, [query, notes, recentNotes, searchIndex]);

  /**
   * Reset state when modal opens.
   */
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after a short delay for animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [open]);

  /**
   * Reset selected index when items change.
   */
  useEffect(() => {
    setSelectedIndex(0);
  }, [items.length]);

  /**
   * Scroll selected item into view.
   */
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  /**
   * Handle selecting an item (open note or create new).
   */
  const handleSelectItem = useCallback(
    async (item: QuickSwitcherItem) => {
      if (item.isCreateNew) {
        // Create a new note with the search query as title
        const newNote = await createNote({
          title: item.title,
          content: '',
          folderId: null,
          tags: [],
          isDaily: false,
        });
        setActiveNote(newNote.id);
      } else if (item.note) {
        setActiveNote(item.note.id);
      }
      onOpenChange(false);
    },
    [createNote, setActiveNote, onOpenChange]
  );

  /**
   * Handle keyboard navigation within the modal.
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : items.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (items.length > 0 && selectedIndex >= 0 && selectedIndex < items.length) {
            handleSelectItem(items[selectedIndex]);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onOpenChange(false);
          break;
      }
    },
    [items, selectedIndex, handleSelectItem, onOpenChange]
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 gap-0 max-w-lg overflow-hidden"
        onKeyDown={handleKeyDown}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Quick Switcher</DialogTitle>

        {/* Search input */}
        <div className="flex items-center border-b border-border px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search notes or create new..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 shadow-none h-12 text-base"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </div>

        {/* Results list */}
        <ScrollArea className="max-h-80">
          <div className="p-2" role="listbox" aria-label="Notes list">
            {/* Section header */}
            {!query.trim() && items.length > 0 && (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                Recent Notes
              </div>
            )}

            {/* Items */}
            {items.map((item, index) => (
              <button
                key={item.id}
                ref={(el) => (itemRefs.current[index] = el)}
                onClick={() => handleSelectItem(item)}
                onMouseEnter={() => setSelectedIndex(index)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left rounded-md',
                  'transition-colors cursor-pointer',
                  'focus:outline-none',
                  selectedIndex === index
                    ? 'bg-accent text-accent-foreground'
                    : 'hover:bg-accent/50'
                )}
                role="option"
                aria-selected={selectedIndex === index}
              >
                {item.isCreateNew ? (
                  <>
                    <Plus className="h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">
                      Create <span className="font-medium">"{item.title}"</span>
                    </span>
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {item.highlightedTitle ? (
                      <SafeHighlight
                        html={item.highlightedTitle}
                        className="text-sm truncate flex-1"
                      />
                    ) : (
                      <span className="text-sm truncate flex-1">{item.title}</span>
                    )}
                  </>
                )}
              </button>
            ))}

            {/* Empty state */}
            {items.length === 0 && !query.trim() && (
              <div className="px-3 py-8 text-center text-sm text-muted-foreground">
                No notes yet. Start typing to create one.
              </div>
            )}

            {items.length === 0 && query.trim() && (
              <div className="px-3 py-4">
                <button
                  onClick={() =>
                    handleSelectItem({
                      id: 'create-new',
                      title: query.trim(),
                      isCreateNew: true,
                    })
                  }
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 text-left rounded-md',
                    'transition-colors cursor-pointer',
                    'bg-accent text-accent-foreground'
                  )}
                >
                  <Plus className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm">
                    Create <span className="font-medium">"{query.trim()}"</span>
                  </span>
                </button>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Keyboard navigation hint */}
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center gap-4 bg-muted/30">
          <span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">↑</kbd>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded ml-1">↓</kbd>
            <span className="ml-1.5">navigate</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd>
            <span className="ml-1.5">open</span>
          </span>
          <span>
            <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd>
            <span className="ml-1.5">close</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default QuickSwitcher;
