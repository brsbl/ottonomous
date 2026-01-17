/**
 * CodeMirror extension for [[wiki-link]] autocomplete.
 * Provides autocomplete suggestions when user types [[ with note titles
 * and an option to create new notes if not found.
 */

import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
  startCompletion,
} from '@codemirror/autocomplete';
import { Extension, EditorState } from '@codemirror/state';
import { EditorView, ViewPlugin, ViewUpdate, keymap } from '@codemirror/view';

/**
 * Options for configuring the link autocomplete extension.
 */
export interface LinkAutocompleteOptions {
  /** Function that returns array of note titles for suggestions */
  getNoteTitles: () => string[];
  /** Optional callback when user selects "Create new note" option */
  onCreateNote?: (title: string) => void;
  /** Minimum characters to type after [[ before showing suggestions (default: 0) */
  minChars?: number;
}

/**
 * Check if cursor is inside a potential wiki-link context.
 * Returns the text between [[ and cursor position if valid, null otherwise.
 */
function getWikiLinkContext(state: EditorState, pos: number): string | null {
  // Look backwards from cursor to find [[
  const lineStart = state.doc.lineAt(pos).from;
  const textBefore = state.doc.sliceString(lineStart, pos);

  // Find the last [[ that hasn't been closed
  const lastOpenBracket = textBefore.lastIndexOf('[[');
  if (lastOpenBracket === -1) {
    return null;
  }

  // Check if there's a ]] between [[ and cursor (already closed link)
  const textAfterBracket = textBefore.slice(lastOpenBracket + 2);
  if (textAfterBracket.includes(']]')) {
    return null;
  }

  // Return the query text (what user has typed after [[)
  return textAfterBracket;
}

/**
 * Create a completion source for wiki-links.
 */
function createWikiLinkCompletionSource(options: LinkAutocompleteOptions) {
  return (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context;
    const minChars = options.minChars ?? 0;

    // Get wiki-link context
    const query = getWikiLinkContext(state, pos);
    if (query === null) {
      return null;
    }

    // Check minimum characters requirement
    if (query.length < minChars) {
      // Still show suggestions if minChars is 0
      if (minChars > 0) {
        return null;
      }
    }

    // Get note titles and filter by query
    const noteTitles = options.getNoteTitles();
    const lowerQuery = query.toLowerCase();

    // Filter titles that match the query
    const matchingTitles = noteTitles.filter(title =>
      title.toLowerCase().includes(lowerQuery)
    );

    // Sort: exact starts first, then alphabetically
    matchingTitles.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(lowerQuery);
      const bStarts = b.toLowerCase().startsWith(lowerQuery);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });

    // Build completions
    const completions: Completion[] = matchingTitles.map(title => ({
      label: title,
      type: 'text',
      detail: 'Note',
      apply: (view: EditorView, completion: Completion, from: number, to: number) => {
        // Insert the full link syntax: [[title]]
        // We need to find where [[ starts
        const lineStart = view.state.doc.lineAt(from).from;
        const textBefore = view.state.doc.sliceString(lineStart, from);
        const bracketPos = textBefore.lastIndexOf('[[');
        const actualFrom = bracketPos !== -1 ? lineStart + bracketPos : from;

        view.dispatch({
          changes: {
            from: actualFrom,
            to,
            insert: `[[${completion.label}]]`,
          },
          selection: { anchor: actualFrom + completion.label.length + 4 },
        });
      },
    }));

    // Add "Create new note" option if query is not empty and no exact match exists
    if (query.trim().length > 0 && options.onCreateNote) {
      const exactMatch = noteTitles.some(
        title => title.toLowerCase() === lowerQuery
      );

      if (!exactMatch) {
        completions.push({
          label: `Create "${query}"`,
          type: 'keyword',
          detail: 'New note',
          boost: -100, // Show at bottom
          apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
            // Insert the link first
            const lineStart = view.state.doc.lineAt(from).from;
            const textBefore = view.state.doc.sliceString(lineStart, from);
            const bracketPos = textBefore.lastIndexOf('[[');
            const actualFrom = bracketPos !== -1 ? lineStart + bracketPos : from;

            view.dispatch({
              changes: {
                from: actualFrom,
                to,
                insert: `[[${query}]]`,
              },
              selection: { anchor: actualFrom + query.length + 4 },
            });

            // Trigger create note callback
            options.onCreateNote?.(query);
          },
        });
      }
    }

    if (completions.length === 0) {
      return null;
    }

    // Calculate the start position (after [[)
    const lineStart = state.doc.lineAt(pos).from;
    const textBefore = state.doc.sliceString(lineStart, pos);
    const bracketPos = textBefore.lastIndexOf('[[');
    const fromPos = lineStart + bracketPos + 2; // Position right after [[

    return {
      from: fromPos,
      options: completions,
      validFor: /^[^\[\]]*$/, // Valid while not typing brackets
    };
  };
}

/**
 * ViewPlugin to detect [[ typing and trigger autocomplete.
 */
function createTriggerPlugin() {
  return ViewPlugin.fromClass(
    class {
      constructor(_view: EditorView) {}

      update(update: ViewUpdate) {
        // Check if user just typed a second [
        if (update.docChanged) {
          update.changes.iterChanges((_fromA, _toA, _fromB, toB, inserted) => {
            const insertedText = inserted.toString();
            if (insertedText === '[') {
              // Check if this creates [[
              const pos = toB;
              if (pos > 0) {
                const charBefore = update.state.doc.sliceString(pos - 1, pos);
                if (charBefore === '[') {
                  // Trigger autocomplete after a small delay
                  setTimeout(() => {
                    startCompletion(update.view);
                  }, 10);
                }
              }
            }
          });
        }
      }
    }
  );
}

/**
 * Create the link autocomplete extension.
 *
 * @param options - Configuration options
 * @returns CodeMirror extension array
 *
 * @example
 * ```ts
 * const extensions = [
 *   ...createLinkAutocomplete({
 *     getNoteTitles: () => notes.map(n => n.title),
 *     onCreateNote: (title) => createNote({ title, content: '' }),
 *   }),
 * ];
 * ```
 */
export function createLinkAutocomplete(options: LinkAutocompleteOptions): Extension[] {
  return [
    autocompletion({
      override: [createWikiLinkCompletionSource(options)],
      activateOnTyping: true,
      closeOnBlur: true,
      defaultKeymap: true,
      optionClass: () => 'cm-link-autocomplete-option',
    }),
    createTriggerPlugin(),
    // Add keyboard shortcut for manual trigger (Ctrl+Space already handled by default)
    keymap.of([
      {
        key: 'Mod-Space',
        run: (view) => {
          startCompletion(view);
          return true;
        },
      },
    ]),
    // Add custom styling for the autocomplete popup
    EditorView.theme({
      '.cm-tooltip.cm-tooltip-autocomplete': {
        border: '1px solid #374151',
        borderRadius: '6px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul': {
        maxHeight: '200px',
        fontFamily: 'inherit',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li': {
        padding: '4px 8px',
      },
      '.cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]': {
        backgroundColor: '#3b82f6',
        color: 'white',
      },
      '.cm-completionLabel': {
        fontWeight: '500',
      },
      '.cm-completionDetail': {
        marginLeft: '8px',
        fontStyle: 'italic',
        opacity: '0.7',
      },
    }),
  ];
}

export default createLinkAutocomplete;
