/**
 * NoteEditor component - Wraps the Editor with auto-save functionality,
 * unsaved changes indicator, and toast notifications.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Editor } from './Editor';
import { useAutoSave } from '../hooks/useAutoSave';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import { Loader2, Check, AlertCircle, Circle } from 'lucide-react';
import { cn } from '../lib/utils';

interface NoteEditorProps {
  /** ID of the note being edited */
  noteId: string;
  /** Whether to use dark mode (default: true) */
  darkMode?: boolean;
  /** Optional additional CSS classes */
  className?: string;
}

/**
 * NoteEditor component that provides auto-save functionality for notes.
 * Includes:
 * - Debounced auto-save (500ms after typing stops)
 * - Unsaved changes indicator in header
 * - Toast notifications on save
 * - Graceful error handling with retry logic
 * - Persistence to IndexedDB via the knowledge base store
 */
export function NoteEditor({ noteId, darkMode = true, className = '' }: NoteEditorProps) {
  const { notes, updateNote } = useKnowledgeBase();

  // Find the note from the store
  const note = useMemo(() => notes.find((n) => n.id === noteId), [notes, noteId]);

  // Local state for title and content
  const [title, setTitle] = useState(note?.title ?? '');
  const [content, setContent] = useState(note?.content ?? '');

  // Sync local state when note changes (e.g., switching notes)
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [noteId, note]);

  // Save function that persists to IndexedDB
  const saveNote = useCallback(
    async (data: { title: string; content: string }) => {
      if (!noteId) return;
      await updateNote(noteId, {
        title: data.title,
        content: data.content,
      });
    },
    [noteId, updateNote]
  );

  // Auto-save hook with debounce and retry logic
  const {
    isDirty,
    isSaving,
    lastError,
    lastSavedAt,
    saveNow,
    retryCount,
  } = useAutoSave({
    data: { title, content },
    onSave: saveNote,
    debounceMs: 500,
    maxRetries: 3,
    retryDelayMs: 1000,
    enabled: !!noteId && !!note,
  });

  // Handle title change
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  }, []);

  // Handle content change from editor
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
  }, []);

  // Handle manual save (Ctrl+S / Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveNow();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [saveNow]);

  // Format last saved time
  const formatLastSaved = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 5) return 'just now';
    if (diffSecs < 60) return `${diffSecs}s ago`;
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!note) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a note to edit</p>
      </div>
    );
  }

  return (
    <div className={cn('h-full flex flex-col', className)}>
      {/* Header with title and save status */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
        {/* Note title input with unsaved indicator */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* Unsaved indicator dot */}
          {isDirty && !isSaving && (
            <Circle
              className="h-2 w-2 fill-amber-500 text-amber-500 shrink-0"
              aria-label="Unsaved changes"
            />
          )}

          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled"
            className={cn(
              'flex-1 text-xl font-semibold bg-transparent border-none outline-none',
              'text-foreground placeholder:text-muted-foreground',
              'focus:ring-0'
            )}
          />
        </div>

        {/* Save status indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>
                {retryCount > 0 ? `Retrying (${retryCount}/3)...` : 'Saving...'}
              </span>
            </>
          ) : lastError ? (
            <>
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-destructive">Save failed</span>
              <button
                onClick={saveNow}
                className="text-xs text-primary hover:underline"
              >
                Retry
              </button>
            </>
          ) : isDirty ? (
            <span className="text-amber-600 dark:text-amber-400">Unsaved changes</span>
          ) : lastSavedAt ? (
            <>
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">
                Saved {formatLastSaved(lastSavedAt)}
              </span>
            </>
          ) : null}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 min-h-0">
        <Editor
          value={content}
          onChange={handleContentChange}
          darkMode={darkMode}
          className="h-full"
        />
      </div>
    </div>
  );
}

export default NoteEditor;
