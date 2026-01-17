/**
 * Main App component for the Second Brain Personal Knowledge Base.
 * Wires up all components: Layout, Sidebar, NoteEditor, Preview,
 * BacklinksPanel, NoteOutline, GraphView, QuickSwitcher, CommandPalette,
 * and other modals. Handles initialization, keyboard shortcuts, and theming.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { NoteEditor } from './components/NoteEditor';
import { Preview } from './components/Preview';
import { BacklinksPanel } from './components/BacklinksPanel';
import { NoteOutline } from './components/NoteOutline';
import { GraphView } from './components/GraphView';
import { QuickSwitcher } from './components/QuickSwitcher';
import { CommandPalette } from './components/CommandPalette';
import { ThemeToggle } from './components/ThemeToggle';
import { DailyNotes } from './components/DailyNotes';
import { ExportImport } from './components/ExportImport';
import { TemplateSelector } from './components/TemplateSelector';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { Toaster } from './components/ui/toaster';
import { useKnowledgeBase, seedTemplates } from './stores/knowledgeBase';
import { useAppShortcuts } from './hooks/useAppShortcuts';
import { useTheme } from './hooks/useTheme';
import { db } from './lib/db';
import { Loader2, Network } from 'lucide-react';
import { Button } from './components/ui/button';

/**
 * Sample seed notes to create when database is empty.
 */
const SEED_NOTES = [
  {
    title: 'Welcome to Second Brain',
    content: `# Welcome to Second Brain

Your personal knowledge base for capturing, organizing, and connecting ideas.

## Getting Started

Check out [[Getting Started]] to learn the basics, or explore [[Sample Project]] to see how to structure your notes.

## Key Features

- **Markdown Support**: Write in Markdown with live preview
- **Wiki-style Links**: Connect notes using [[double brackets]]
- **Backlinks**: See which notes link to the current note
- **Graph View**: Visualize your knowledge connections
- **Daily Notes**: Capture daily thoughts and tasks
- **Templates**: Start notes from predefined templates
- **Search**: Find anything across all your notes
- **Tags & Folders**: Organize notes your way

## Quick Tips

- Press \`Cmd/Ctrl + O\` to quickly switch between notes
- Press \`Cmd/Ctrl + P\` to open the command palette
- Press \`?\` to see all keyboard shortcuts

Happy note-taking!
`,
    folderId: null,
    tags: [],
    isDaily: false,
  },
  {
    title: 'Getting Started',
    content: `# Getting Started with Second Brain

This guide will help you get up and running with your personal knowledge base.

## Creating Notes

1. Click the "New Note" button in the sidebar
2. Or press \`Cmd/Ctrl + N\` anywhere in the app
3. Give your note a title and start writing

## Linking Notes

Create connections between notes using wiki-style links:
- Type \`[[Note Title]]\` to link to another note
- Links are clickable in the preview
- See [[Welcome to Second Brain]] for an example

## Using Daily Notes

- Click "Today" in the sidebar to create/open today's note
- Use the calendar to navigate to past days
- Great for journaling, task tracking, and quick capture

## Organizing with Folders

- Create folders in the sidebar
- Drag notes into folders
- Nest folders for hierarchical organization

## Tagging

- Add tags to notes for cross-cutting categorization
- Filter notes by tag in the sidebar
- Combine with folders for powerful organization

## Next Steps

- Explore the [[Sample Project]] to see a real-world example
- Try the command palette (\`Cmd/Ctrl + P\`) for quick actions
- Enable Graph View to visualize your knowledge network
`,
    folderId: null,
    tags: [],
    isDaily: false,
  },
  {
    title: 'Sample Project',
    content: `# Sample Project

This is an example of how you might structure a project in Second Brain.

## Overview

A demonstration project showing how to organize notes, create links, and build a knowledge network.

## Goals

- [ ] Learn the basics of note-taking
- [ ] Create wiki-style links between notes
- [ ] Explore the graph view
- [ ] Set up a daily notes habit

## Project Structure

### Documentation
- [[Getting Started]] - How to use the app
- [[Welcome to Second Brain]] - Feature overview

### Resources
- External links and references
- Research materials

### Notes
- Meeting notes
- Ideas and brainstorms

## How to Use This Template

1. Create a new note for each project
2. Link to related notes using [[brackets]]
3. Use headings to organize content
4. Add tasks with \`- [ ]\` syntax
5. Review backlinks to see connections

## Related Notes

- [[Welcome to Second Brain]]
- [[Getting Started]]

---

*Created with Second Brain - Your Personal Knowledge Base*
`,
    folderId: null,
    tags: [],
    isDaily: false,
  },
];

/**
 * Loading spinner component for initialization state.
 */
function LoadingScreen() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-background text-foreground">
      <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
      <h1 className="text-xl font-semibold mb-2">Second Brain</h1>
      <p className="text-muted-foreground">Loading your knowledge base...</p>
    </div>
  );
}

/**
 * Main App component.
 */
function App() {
  const {
    notes,
    activeNoteId,
    isLoading,
    loadAll,
    createNote,
    setActiveNote,
    refreshBacklinks,
    rebuildSearchIndex,
    createDailyNote,
  } = useKnowledgeBase();

  // Initialize theme
  const { resolvedTheme } = useTheme();

  // UI state
  const [isInitialized, setIsInitialized] = useState(false);
  const [showGraphView, setShowGraphView] = useState(false);
  const [showQuickSwitcher, setShowQuickSwitcher] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);

  /**
   * Get the currently active note.
   */
  const activeNote = useMemo(() => {
    if (!activeNoteId) return null;
    return notes.find((n) => n.id === activeNoteId) || null;
  }, [activeNoteId, notes]);

  /**
   * Initialize the application on mount.
   */
  useEffect(() => {
    const initialize = async () => {
      try {
        // Load all data from IndexedDB
        await loadAll();

        // Seed templates if needed
        await seedTemplates();

        // Check if database is empty and seed with sample notes
        const existingNotes = await db.notes.count();
        if (existingNotes === 0) {
          // Seed with sample notes
          for (const noteData of SEED_NOTES) {
            const note = await createNote(noteData);
            // Set the first note as active
            if (noteData.title === 'Welcome to Second Brain') {
              setActiveNote(note.id);
            }
          }
        }

        // Rebuild search index and backlinks
        rebuildSearchIndex();
        refreshBacklinks();

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsInitialized(true); // Still show the app even if init fails
      }
    };

    initialize();
  }, [loadAll, createNote, setActiveNote, rebuildSearchIndex, refreshBacklinks]);

  /**
   * Handle creating a new note (opens template selector).
   */
  const handleNewNote = useCallback(() => {
    setShowTemplateSelector(true);
  }, []);

  /**
   * Handle template selection - create note with selected template.
   */
  const handleTemplateSelect = useCallback(
    async (title: string, content: string) => {
      const note = await createNote({
        title,
        content,
        folderId: null,
        tags: [],
        isDaily: false,
      });
      setActiveNote(note.id);
    },
    [createNote, setActiveNote]
  );

  /**
   * Handle opening daily note.
   */
  const handleOpenDaily = useCallback(async () => {
    const note = await createDailyNote();
    setActiveNote(note.id);
  }, [createDailyNote, setActiveNote]);

  /**
   * Handle wiki link clicks in preview - navigate to linked note.
   */
  const handleWikiLinkClick = useCallback(
    (linkText: string) => {
      // Find note by title (case-insensitive)
      const linkedNote = notes.find(
        (n) => n.title.toLowerCase() === linkText.toLowerCase()
      );

      if (linkedNote) {
        setActiveNote(linkedNote.id);
      } else {
        // Create new note with the link text as title
        createNote({
          title: linkText,
          content: `# ${linkText}\n\n`,
          folderId: null,
          tags: [],
          isDaily: false,
        }).then((note) => {
          setActiveNote(note.id);
        }).catch((error) => {
          console.error('Failed to create note from wiki link:', error);
        });
      }
    },
    [notes, setActiveNote, createNote]
  );

  /**
   * Set up keyboard shortcuts.
   */
  useAppShortcuts({
    enabled: isInitialized && !showGraphView,
    onNewNote: handleNewNote,
    onQuickSwitcher: () => setShowQuickSwitcher(true),
    onCommandPalette: () => setShowCommandPalette(true),
  });

  /**
   * Handle ? key to show shortcuts modal.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not in an input/textarea and no modifier keys
      if (
        e.key === '?' &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey &&
        e.target instanceof Element &&
        !['INPUT', 'TEXTAREA'].includes(e.target.tagName)
      ) {
        e.preventDefault();
        setShowShortcutsModal(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Show loading screen during initialization
  if (!isInitialized || isLoading) {
    return <LoadingScreen />;
  }

  // Render graph view as full-screen overlay
  if (showGraphView) {
    return (
      <div className="h-screen w-screen">
        <GraphView onClose={() => setShowGraphView(false)} className="h-full" />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen overflow-hidden">
      {/* Main Layout */}
      <Layout
        sidebar={
          <div className="h-full flex flex-col">
            {/* Header actions in sidebar */}
            <div className="p-2 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowGraphView(true)}
                  title="Open Graph View"
                >
                  <Network className="h-4 w-4" />
                </Button>
                <ThemeToggle />
              </div>
              <ExportImport />
            </div>

            {/* Daily Notes Calendar */}
            <DailyNotes />

            {/* Main Sidebar Content */}
            <div className="flex-1 overflow-hidden">
              <Sidebar />
            </div>
          </div>
        }
        editor={
          activeNote ? (
            <NoteEditor
              noteId={activeNote.id}
              darkMode={resolvedTheme === 'dark'}
              className="h-full"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
              <div className="text-center max-w-md">
                <h2 className="text-xl font-semibold mb-2 text-foreground">
                  Welcome to Second Brain
                </h2>
                <p className="mb-4">
                  Select a note from the sidebar or create a new one to get started.
                </p>
                <Button onClick={handleNewNote}>
                  Create New Note
                </Button>
              </div>
            </div>
          )
        }
        preview={
          activeNote ? (
            <div className="h-full flex flex-col">
              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto p-4">
                <Preview
                  content={activeNote.content}
                  onWikiLinkClick={handleWikiLinkClick}
                />
              </div>

              {/* Note Outline */}
              <div className="border-t border-border">
                <NoteOutline
                  content={activeNote.content}
                  onHeadingClick={(headingId) => {
                    // Scroll to heading in preview (simplified implementation)
                    console.log('Scroll to heading:', headingId);
                  }}
                />
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              <p>No note selected</p>
            </div>
          )
        }
        backlinks={activeNote ? <BacklinksPanel /> : undefined}
      />

      {/* Modals */}
      <QuickSwitcher
        open={showQuickSwitcher}
        onOpenChange={setShowQuickSwitcher}
      />

      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        onNewNote={handleNewNote}
        onOpenDaily={handleOpenDaily}
        onToggleGraph={() => setShowGraphView(true)}
        onGlobalSearch={() => setShowQuickSwitcher(true)}
        onShowShortcuts={() => setShowShortcutsModal(true)}
      />

      <TemplateSelector
        open={showTemplateSelector}
        onOpenChange={setShowTemplateSelector}
        onSelect={handleTemplateSelect}
      />

      {showShortcutsModal && (
        <KeyboardShortcutsModal
          onClose={() => setShowShortcutsModal(false)}
          mode="pkb"
        />
      )}

      {/* Toast notifications */}
      <Toaster />
    </div>
  );
}

export default App;
