/**
 * SearchResults component for displaying instant search results.
 * Shows title, highlighted content snippet, and folder path.
 * Supports click to open and keyboard navigation.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { FileText, FolderOpen } from 'lucide-react';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import { cn } from '@/lib/utils';

/**
 * SearchResults displays the search results from the knowledge base store.
 * Renders each result with highlighted title, content snippet, and folder path.
 */
export function SearchResults() {
  const {
    fuseSearchResults,
    searchQuery,
    folders,
    setActiveNote,
    clearSearch,
  } = useKnowledgeBase();

  // Selected index for keyboard navigation
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  // Ref for scrolling selected item into view
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  /**
   * Get folder path for a note by folder ID.
   */
  const getFolderPath = useCallback(
    (folderId: string | null): string => {
      if (!folderId) return 'Root';

      const buildPath = (id: string): string => {
        const folder = folders.find((f) => f.id === id);
        if (!folder) return '';
        const parentPath = folder.parentId ? buildPath(folder.parentId) : '';
        return parentPath ? `${parentPath} / ${folder.name}` : folder.name;
      };

      return buildPath(folderId) || 'Root';
    },
    [folders]
  );

  /**
   * Handle selecting a result (click or keyboard).
   */
  const handleSelectResult = useCallback(
    (noteId: string) => {
      setActiveNote(noteId);
      clearSearch();
    },
    [setActiveNote, clearSearch]
  );

  /**
   * Handle keyboard navigation.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (fuseSearchResults.length === 0) return;

      // Ignore if focus is on an input that's not the search input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev < fuseSearchResults.length - 1 ? prev + 1 : 0;
            return next;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => {
            const next = prev > 0 ? prev - 1 : fuseSearchResults.length - 1;
            return next;
          });
          break;
        case 'Enter':
          event.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < fuseSearchResults.length) {
            handleSelectResult(fuseSearchResults[selectedIndex].note.id);
          } else if (fuseSearchResults.length > 0) {
            // If no selection, select first result
            handleSelectResult(fuseSearchResults[0].note.id);
          }
          break;
        case 'Escape':
          event.preventDefault();
          clearSearch();
          break;
      }
    },
    [fuseSearchResults, selectedIndex, handleSelectResult, clearSearch]
  );

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(fuseSearchResults.length > 0 ? 0 : -1);
  }, [fuseSearchResults]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && itemRefs.current[selectedIndex]) {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  // Add keyboard event listener
  useEffect(() => {
    if (searchQuery && fuseSearchResults.length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [searchQuery, fuseSearchResults.length, handleKeyDown]);

  // Don't render if no search query or no results
  if (!searchQuery || fuseSearchResults.length === 0) {
    return null;
  }

  return (
    <div
      ref={resultsContainerRef}
      className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto rounded-md border border-border bg-popover shadow-lg"
      role="listbox"
      aria-label="Search results"
    >
      <div className="p-1">
        {fuseSearchResults.map((result, index) => {
          const { note, highlightedTitle, highlightedContent } = result;
          const folderPath = getFolderPath(note.folderId);

          return (
            <button
              key={note.id}
              ref={(el) => (itemRefs.current[index] = el)}
              onClick={() => handleSelectResult(note.id)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                'w-full flex flex-col items-start gap-1 px-3 py-2 text-left rounded-md',
                'transition-colors cursor-pointer',
                'focus:outline-none',
                selectedIndex === index
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              )}
              role="option"
              aria-selected={selectedIndex === index}
            >
              {/* Title with icon */}
              <div className="flex items-center gap-2 w-full">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span
                  className="font-medium text-sm truncate flex-1"
                  dangerouslySetInnerHTML={{ __html: highlightedTitle }}
                />
              </div>

              {/* Content snippet */}
              {highlightedContent && (
                <p
                  className="text-xs text-muted-foreground line-clamp-2 pl-6 w-full"
                  dangerouslySetInnerHTML={{ __html: highlightedContent }}
                />
              )}

              {/* Folder path */}
              <div className="flex items-center gap-1 pl-6 text-xs text-muted-foreground/70">
                <FolderOpen className="h-3 w-3" />
                <span className="truncate">{folderPath}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Keyboard navigation hint */}
      <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground flex items-center gap-4">
        <span>
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">↑</kbd>
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded ml-1">↓</kbd>
          <span className="ml-1.5">to navigate</span>
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Enter</kbd>
          <span className="ml-1.5">to open</span>
        </span>
        <span>
          <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded">Esc</kbd>
          <span className="ml-1.5">to close</span>
        </span>
      </div>
    </div>
  );
}

export default SearchResults;
