/**
 * BacklinksPanel component - Displays all notes linking to the current note.
 * Shows link context (surrounding text), click-to-navigate functionality,
 * and a count badge. Implements a collapsible panel design.
 */

import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronRight, Link2, FileText } from 'lucide-react';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import { cn } from '../lib/utils';
import type { NoteLink, Note } from '../types';

interface BacklinksPanelProps {
  /** Optional additional CSS classes */
  className?: string;
  /** Whether the panel starts expanded (default: true) */
  defaultExpanded?: boolean;
}

/**
 * Single backlink item component showing source note title and context.
 */
interface BacklinkItemProps {
  backlink: NoteLink;
  sourceNote: Note | undefined;
  onNavigate: (noteId: string) => void;
}

function BacklinkItem({ backlink, sourceNote, onNavigate }: BacklinkItemProps) {
  if (!sourceNote) {
    return null;
  }

  /**
   * Highlight the wiki link in the context text.
   * Replaces [[...]] patterns with styled spans.
   */
  const highlightedContext = useMemo(() => {
    // Find and highlight [[...]] links in the context
    const parts: (string | JSX.Element)[] = [];
    const regex = /\[\[([^\]]+)\]\]/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(backlink.context)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(backlink.context.slice(lastIndex, match.index));
      }
      // Add highlighted link
      parts.push(
        <span
          key={key++}
          className="font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/40 px-1 rounded"
        >
          [[{match[1]}]]
        </span>
      );
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < backlink.context.length) {
      parts.push(backlink.context.slice(lastIndex));
    }

    return parts.length > 0 ? parts : backlink.context;
  }, [backlink.context]);

  return (
    <button
      onClick={() => onNavigate(backlink.sourceId)}
      className={cn(
        'w-full text-left p-3 rounded-lg',
        'bg-muted/50 hover:bg-muted',
        'border border-transparent hover:border-border',
        'transition-all duration-200',
        'group'
      )}
      aria-label={`Navigate to ${sourceNote.title}`}
    >
      {/* Note title */}
      <div className="flex items-center gap-2 mb-1.5">
        <FileText className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
        <span className="font-medium text-sm text-foreground truncate">
          {sourceNote.title}
        </span>
      </div>

      {/* Context snippet */}
      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 pl-6">
        {highlightedContext}
      </p>
    </button>
  );
}

/**
 * BacklinksPanel component displays all notes that link to the currently active note.
 * Features:
 * - Collapsible panel design
 * - Count badge showing number of backlinks
 * - Context snippets for each backlink
 * - Click-to-navigate functionality
 */
export function BacklinksPanel({
  className = '',
  defaultExpanded = true,
}: BacklinksPanelProps) {
  const {
    notes,
    activeNoteId,
    getBacklinks,
    setActiveNote,
    refreshBacklinks,
  } = useKnowledgeBase();

  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Refresh backlinks index when notes change
  useEffect(() => {
    refreshBacklinks();
  }, [notes, refreshBacklinks]);

  // Get backlinks for the active note
  const backlinks = useMemo<NoteLink[]>(() => {
    if (!activeNoteId) {
      return [];
    }
    return getBacklinks(activeNoteId);
  }, [activeNoteId, getBacklinks]);

  // Create a map for quick note lookups
  const notesMap = useMemo(() => {
    return new Map(notes.map((note) => [note.id, note]));
  }, [notes]);

  /**
   * Handle navigation to a linked note.
   */
  const handleNavigate = (noteId: string) => {
    setActiveNote(noteId);
  };

  /**
   * Toggle panel expansion state.
   */
  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  const backlinkCount = backlinks.length;

  // Don't render if no active note
  if (!activeNoteId) {
    return (
      <div className={cn('p-4', className)}>
        <p className="text-sm text-muted-foreground text-center">
          Select a note to view backlinks
        </p>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* Panel header with toggle and count badge */}
      <button
        onClick={handleToggle}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'hover:bg-muted/50 transition-colors',
          'rounded-lg'
        )}
        aria-expanded={isExpanded}
        aria-controls="backlinks-content"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <Link2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Backlinks</span>
        </div>

        {/* Count badge */}
        <span
          className={cn(
            'inline-flex items-center justify-center',
            'min-w-[1.5rem] h-6 px-2',
            'text-xs font-medium rounded-full',
            backlinkCount > 0
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {backlinkCount}
        </span>
      </button>

      {/* Panel content */}
      {isExpanded && (
        <div id="backlinks-content" className="px-3 pb-3 space-y-2">
          {backlinkCount === 0 ? (
            <div className="py-6 text-center">
              <Link2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No notes link to this note yet
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use [[note title]] syntax to create links
              </p>
            </div>
          ) : (
            <>
              {backlinks.map((backlink, index) => (
                <BacklinkItem
                  key={`${backlink.sourceId}-${index}`}
                  backlink={backlink}
                  sourceNote={notesMap.get(backlink.sourceId)}
                  onNavigate={handleNavigate}
                />
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default BacklinksPanel;
