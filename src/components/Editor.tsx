/**
 * Editor component - CodeMirror 6 based Markdown editor with syntax highlighting,
 * line numbers, One Dark theme, and [[wiki-link]] autocomplete.
 * Provides controlled value/onChange interface.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { EditorView, lineNumbers, highlightActiveLine, highlightActiveLineGutter, keymap } from '@codemirror/view';
import { EditorState, Extension } from '@codemirror/state';
import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxHighlighting, defaultHighlightStyle, bracketMatching } from '@codemirror/language';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { createLinkAutocomplete } from '../lib/linkAutocomplete';

interface EditorProps {
  /** The current content value */
  value: string;
  /** Callback when content changes */
  onChange: (value: string) => void;
  /** Optional placeholder text when editor is empty */
  placeholder?: string;
  /** Optional additional CSS classes for the container */
  className?: string;
  /** Whether to use dark theme (default: true) */
  darkMode?: boolean;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Optional array of note titles for [[link]] autocomplete */
  noteTitles?: string[];
  /** Optional callback when user selects "Create new note" from autocomplete */
  onCreateNote?: (title: string) => void;
}

/**
 * Create a custom light theme that matches the app's design
 */
const lightTheme = EditorView.theme({
  '&': {
    backgroundColor: '#ffffff',
    color: '#1f2937',
  },
  '.cm-content': {
    caretColor: '#3b82f6',
  },
  '.cm-cursor': {
    borderLeftColor: '#3b82f6',
  },
  '.cm-selectionBackground, ::selection': {
    backgroundColor: '#dbeafe',
  },
  '.cm-focused .cm-selectionBackground': {
    backgroundColor: '#bfdbfe',
  },
  '.cm-activeLine': {
    backgroundColor: '#f3f4f6',
  },
  '.cm-activeLineGutter': {
    backgroundColor: '#f3f4f6',
  },
  '.cm-gutters': {
    backgroundColor: '#f9fafb',
    color: '#9ca3af',
    borderRight: '1px solid #e5e7eb',
  },
  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
  },
});

/**
 * Options for creating base editor extensions
 */
interface BaseExtensionOptions {
  onChange: (value: string) => void;
  readOnly: boolean;
  noteTitles?: string[];
  onCreateNote?: (title: string) => void;
}

/**
 * Create base editor extensions shared between themes
 */
function createBaseExtensions(options: BaseExtensionOptions): Extension[] {
  const { onChange, readOnly, noteTitles, onCreateNote } = options;

  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLine(),
    highlightActiveLineGutter(),
    bracketMatching(),
    history(),
    markdown({ base: markdownLanguage }),
    syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
    keymap.of([...defaultKeymap, ...historyKeymap]),
    EditorView.lineWrapping,
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    }),
  ];

  // Add link autocomplete if noteTitles is provided
  if (noteTitles) {
    extensions.push(
      ...createLinkAutocomplete({
        getNoteTitles: () => noteTitles,
        onCreateNote,
        minChars: 0,
      })
    );
  }

  if (readOnly) {
    extensions.push(EditorState.readOnly.of(true));
  }

  return extensions;
}

/**
 * Editor component that provides a CodeMirror 6 Markdown editor
 */
export function Editor({
  value,
  onChange,
  placeholder: _placeholder,
  className = '',
  darkMode = true,
  readOnly = false,
  noteTitles,
  onCreateNote,
}: EditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<EditorView | null>(null);
  const valueRef = useRef(value);

  // Keep track of the latest value for comparison
  valueRef.current = value;

  // Memoize onChange to prevent unnecessary recreations
  const handleChange = useCallback(
    (newValue: string) => {
      onChange(newValue);
    },
    [onChange]
  );

  // Memoize onCreateNote callback
  const handleCreateNote = useCallback(
    (title: string) => {
      onCreateNote?.(title);
    },
    [onCreateNote]
  );

  // Memoize note titles to prevent unnecessary recreations
  const memoizedNoteTitles = useMemo(() => noteTitles, [noteTitles]);

  // Initialize the editor
  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up existing editor
    if (editorRef.current) {
      editorRef.current.destroy();
    }

    const extensions = [
      ...createBaseExtensions({
        onChange: handleChange,
        readOnly,
        noteTitles: memoizedNoteTitles,
        onCreateNote: handleCreateNote,
      }),
      darkMode ? oneDark : lightTheme,
    ];

    const state = EditorState.create({
      doc: valueRef.current,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
      editorRef.current = null;
    };
  }, [handleChange, darkMode, readOnly, memoizedNoteTitles, handleCreateNote]);

  // Sync external value changes
  useEffect(() => {
    const view = editorRef.current;
    if (!view) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== value) {
      view.dispatch({
        changes: {
          from: 0,
          to: currentContent.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return (
    <div
      ref={containerRef}
      className={`editor-container h-full w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}
      data-testid="markdown-editor"
    />
  );
}

export default Editor;
