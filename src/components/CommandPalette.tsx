/**
 * CommandPalette component - a searchable command interface (similar to VS Code/Obsidian).
 * Provides fuzzy search, categorized commands, keyboard shortcuts, and recently used tracking.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import {
  FilePlus,
  Calendar,
  Network,
  Sun,
  Moon,
  Download,
  Upload,
  Search,
  Settings,
  Keyboard,
  FolderOpen,
  Home,
  Tag,
  BookOpen,
  Layers,
  type LucideIcon,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '../lib/utils';
import { getModifierSymbol } from '../lib/shortcuts';
import { useTheme } from '../hooks/useTheme';
import { useKnowledgeBase } from '../stores/knowledgeBase';

// =============================================================================
// Types
// =============================================================================

/**
 * Command category for grouping related commands.
 */
export type CommandCategory = 'notes' | 'navigation' | 'view' | 'settings';

/**
 * Command definition with all necessary metadata.
 */
export interface Command {
  /** Unique identifier for the command */
  id: string;
  /** Display label for the command */
  label: string;
  /** Category for grouping */
  category: CommandCategory;
  /** Icon component to display */
  icon: LucideIcon;
  /** Keyboard shortcut keys (for display) */
  shortcut?: string[];
  /** Description of what the command does */
  description?: string;
  /** Handler function when command is executed */
  execute: () => void;
  /** Whether the command is currently available */
  isEnabled?: () => boolean;
}

/**
 * Props for the CommandPalette component.
 */
export interface CommandPaletteProps {
  /** Whether the palette is open */
  isOpen: boolean;
  /** Callback to close the palette */
  onClose: () => void;
  /** Callback for creating a new note */
  onNewNote?: () => void;
  /** Callback to open daily notes */
  onOpenDaily?: () => void;
  /** Callback to toggle graph view */
  onToggleGraph?: () => void;
  /** Callback to open export dialog */
  onExport?: () => void;
  /** Callback to open import dialog */
  onImport?: () => void;
  /** Callback to open global search */
  onGlobalSearch?: () => void;
  /** Callback to open keyboard shortcuts help */
  onShowShortcuts?: () => void;
  /** Callback to open settings */
  onOpenSettings?: () => void;
  /** Callback to navigate to home/all notes */
  onNavigateHome?: () => void;
  /** Callback to open folder browser */
  onOpenFolders?: () => void;
  /** Callback to open tag browser */
  onOpenTags?: () => void;
  /** Callback to open templates */
  onOpenTemplates?: () => void;
  /** Callback to open collections */
  onOpenCollections?: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  notes: 'Notes',
  navigation: 'Navigation',
  view: 'View',
  settings: 'Settings',
};

const CATEGORY_ORDER: CommandCategory[] = ['notes', 'navigation', 'view', 'settings'];

const RECENTLY_USED_KEY = 'command-palette-recent';
const MAX_RECENT_COMMANDS = 5;

// =============================================================================
// Hooks
// =============================================================================

/**
 * Hook for managing recently used commands in localStorage.
 */
function useRecentCommands() {
  const [recentIds, setRecentIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(RECENTLY_USED_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addRecentCommand = useCallback((commandId: string) => {
    setRecentIds((prev) => {
      // Remove if already exists, then add to front
      const filtered = prev.filter((id) => id !== commandId);
      const updated = [commandId, ...filtered].slice(0, MAX_RECENT_COMMANDS);

      // Persist to localStorage
      try {
        localStorage.setItem(RECENTLY_USED_KEY, JSON.stringify(updated));
      } catch {
        // Ignore localStorage errors
      }

      return updated;
    });
  }, []);

  return { recentIds, addRecentCommand };
}

// =============================================================================
// Component
// =============================================================================

/**
 * CommandPalette provides a searchable command interface with categories,
 * keyboard navigation, and recently used tracking.
 */
export function CommandPalette({
  isOpen,
  onClose,
  onNewNote,
  onOpenDaily,
  onToggleGraph,
  onExport,
  onImport,
  onGlobalSearch,
  onShowShortcuts,
  onOpenSettings,
  onNavigateHome,
  onOpenFolders,
  onOpenTags,
  onOpenTemplates,
  onOpenCollections,
}: CommandPaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const { toggleTheme, resolvedTheme } = useTheme();
  const { createNote, createDailyNote, setActiveNote } = useKnowledgeBase();
  const { recentIds, addRecentCommand } = useRecentCommands();

  const modKey = getModifierSymbol();

  /**
   * Build the list of available commands.
   */
  const commands: Command[] = useMemo(() => {
    const cmds: Command[] = [
      // Notes commands
      {
        id: 'new-note',
        label: 'New Note',
        category: 'notes',
        icon: FilePlus,
        shortcut: [modKey, 'N'],
        description: 'Create a new note',
        execute: async () => {
          if (onNewNote) {
            onNewNote();
          } else {
            const note = await createNote({
              title: 'Untitled',
              content: '',
              folderId: null,
              tags: [],
              isDaily: false,
            });
            setActiveNote(note.id);
          }
        },
      },
      {
        id: 'open-daily',
        label: 'Open Daily Note',
        category: 'notes',
        icon: Calendar,
        description: "Open or create today's daily note",
        execute: async () => {
          if (onOpenDaily) {
            onOpenDaily();
          } else {
            const note = await createDailyNote();
            setActiveNote(note.id);
          }
        },
      },
      {
        id: 'export-notes',
        label: 'Export Notes',
        category: 'notes',
        icon: Download,
        description: 'Export notes to Markdown or ZIP',
        execute: () => onExport?.(),
        isEnabled: () => !!onExport,
      },
      {
        id: 'import-notes',
        label: 'Import Notes',
        category: 'notes',
        icon: Upload,
        description: 'Import notes from Markdown or Obsidian vault',
        execute: () => onImport?.(),
        isEnabled: () => !!onImport,
      },

      // Navigation commands
      {
        id: 'navigate-home',
        label: 'Go to All Notes',
        category: 'navigation',
        icon: Home,
        description: 'View all notes',
        execute: () => onNavigateHome?.(),
        isEnabled: () => !!onNavigateHome,
      },
      {
        id: 'open-folders',
        label: 'Browse Folders',
        category: 'navigation',
        icon: FolderOpen,
        description: 'Open folder browser',
        execute: () => onOpenFolders?.(),
        isEnabled: () => !!onOpenFolders,
      },
      {
        id: 'open-tags',
        label: 'Browse Tags',
        category: 'navigation',
        icon: Tag,
        description: 'View and filter by tags',
        execute: () => onOpenTags?.(),
        isEnabled: () => !!onOpenTags,
      },
      {
        id: 'open-templates',
        label: 'Manage Templates',
        category: 'navigation',
        icon: BookOpen,
        description: 'View and edit templates',
        execute: () => onOpenTemplates?.(),
        isEnabled: () => !!onOpenTemplates,
      },
      {
        id: 'open-collections',
        label: 'Smart Collections',
        category: 'navigation',
        icon: Layers,
        description: 'View smart collections',
        execute: () => onOpenCollections?.(),
        isEnabled: () => !!onOpenCollections,
      },
      {
        id: 'global-search',
        label: 'Search All Notes',
        category: 'navigation',
        icon: Search,
        shortcut: [modKey, 'Shift', 'F'],
        description: 'Search across all notes',
        execute: () => onGlobalSearch?.(),
        isEnabled: () => !!onGlobalSearch,
      },

      // View commands
      {
        id: 'toggle-graph',
        label: 'Toggle Graph View',
        category: 'view',
        icon: Network,
        description: 'Show/hide the graph view',
        execute: () => onToggleGraph?.(),
        isEnabled: () => !!onToggleGraph,
      },
      {
        id: 'toggle-theme',
        label: resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        category: 'view',
        icon: resolvedTheme === 'dark' ? Sun : Moon,
        description: 'Toggle between light and dark theme',
        execute: () => toggleTheme(),
      },

      // Settings commands
      {
        id: 'show-shortcuts',
        label: 'Keyboard Shortcuts',
        category: 'settings',
        icon: Keyboard,
        shortcut: ['?'],
        description: 'Show keyboard shortcuts help',
        execute: () => onShowShortcuts?.(),
        isEnabled: () => !!onShowShortcuts,
      },
      {
        id: 'open-settings',
        label: 'Open Settings',
        category: 'settings',
        icon: Settings,
        description: 'Open application settings',
        execute: () => onOpenSettings?.(),
        isEnabled: () => !!onOpenSettings,
      },
    ];

    // Filter out disabled commands
    return cmds.filter((cmd) => cmd.isEnabled === undefined || cmd.isEnabled());
  }, [
    modKey,
    resolvedTheme,
    toggleTheme,
    onNewNote,
    onOpenDaily,
    onExport,
    onImport,
    onNavigateHome,
    onOpenFolders,
    onOpenTags,
    onOpenTemplates,
    onOpenCollections,
    onGlobalSearch,
    onToggleGraph,
    onShowShortcuts,
    onOpenSettings,
    createNote,
    createDailyNote,
    setActiveNote,
  ]);

  /**
   * Create Fuse.js search index for fuzzy matching.
   */
  const fuse = useMemo(() => {
    return new Fuse(commands, {
      keys: ['label', 'description', 'category'],
      threshold: 0.4,
      includeScore: true,
    });
  }, [commands]);

  /**
   * Filter and sort commands based on search query and recency.
   */
  const filteredCommands = useMemo(() => {
    let results: Command[];

    if (searchQuery.trim()) {
      // Use fuzzy search
      const searchResults = fuse.search(searchQuery);
      results = searchResults.map((result) => result.item);
    } else {
      // Show all commands, sorted by category and recency
      results = [...commands];
    }

    // Sort by recency (recently used first) when no search
    if (!searchQuery.trim()) {
      results.sort((a, b) => {
        const aRecentIndex = recentIds.indexOf(a.id);
        const bRecentIndex = recentIds.indexOf(b.id);

        // Both are recent - sort by recency
        if (aRecentIndex !== -1 && bRecentIndex !== -1) {
          return aRecentIndex - bRecentIndex;
        }
        // Only a is recent
        if (aRecentIndex !== -1) return -1;
        // Only b is recent
        if (bRecentIndex !== -1) return 1;
        // Neither is recent - sort by category
        return CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
      });
    }

    return results;
  }, [commands, searchQuery, fuse, recentIds]);

  /**
   * Group commands by category for display.
   */
  const groupedCommands = useMemo(() => {
    const groups = new Map<string, Command[]>();

    // If searching, show results as a flat list under "Results"
    if (searchQuery.trim()) {
      groups.set('Results', filteredCommands);
      return groups;
    }

    // Show recently used first
    const recentCommands = filteredCommands.filter((cmd) => recentIds.includes(cmd.id));
    if (recentCommands.length > 0) {
      groups.set('Recently Used', recentCommands);
    }

    // Group remaining by category
    const nonRecent = filteredCommands.filter((cmd) => !recentIds.includes(cmd.id));
    for (const category of CATEGORY_ORDER) {
      const categoryCommands = nonRecent.filter((cmd) => cmd.category === category);
      if (categoryCommands.length > 0) {
        groups.set(CATEGORY_LABELS[category], categoryCommands);
      }
    }

    return groups;
  }, [filteredCommands, searchQuery, recentIds]);

  /**
   * Flat list of commands for keyboard navigation.
   */
  const flatCommands = useMemo(() => {
    const result: Command[] = [];
    for (const commands of groupedCommands.values()) {
      result.push(...commands);
    }
    return result;
  }, [groupedCommands]);

  /**
   * Execute a command and close the palette.
   */
  const executeCommand = useCallback((command: Command) => {
    addRecentCommand(command.id);
    onClose();
    // Execute after a small delay to allow modal to close
    setTimeout(() => {
      command.execute();
    }, 50);
  }, [addRecentCommand, onClose]);

  /**
   * Handle keyboard navigation.
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [flatCommands, selectedIndex, executeCommand, onClose]);

  /**
   * Scroll selected item into view.
   */
  useEffect(() => {
    const itemElement = itemRefs.current.get(selectedIndex);
    if (itemElement) {
      itemElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  /**
   * Reset state when dialog opens.
   */
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      // Focus input after a short delay to ensure dialog is mounted
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  /**
   * Reset selection when search changes.
   */
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  /**
   * Render a keyboard shortcut badge.
   */
  const renderShortcut = (shortcut: string[]) => (
    <div className="flex items-center gap-0.5">
      {shortcut.map((key, index) => (
        <span key={index} className="flex items-center">
          <kbd className="inline-flex items-center justify-center min-w-[20px] px-1.5 py-0.5 text-xs font-medium text-muted-foreground bg-muted border border-border rounded">
            {key}
          </kbd>
          {index < shortcut.length - 1 && (
            <span className="mx-0.5 text-xs text-muted-foreground">+</span>
          )}
        </span>
      ))}
    </div>
  );

  /**
   * Track the flat index for keyboard navigation.
   */
  let flatIndex = -1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg p-0 gap-0 overflow-hidden"
        onKeyDown={handleKeyDown}
        aria-label="Command palette"
      >
        <DialogTitle className="sr-only">Command Palette</DialogTitle>

        {/* Search input */}
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type a command or search..."
            className="border-0 focus-visible:ring-0 shadow-none h-12"
            autoFocus
          />
        </div>

        {/* Command list */}
        <ScrollArea className="max-h-[400px]" ref={listRef}>
          <div className="p-2">
            {flatCommands.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No commands found
              </div>
            ) : (
              Array.from(groupedCommands.entries()).map(([groupName, commands]) => (
                <div key={groupName} className="mb-2 last:mb-0">
                  {/* Category header */}
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {groupName}
                  </div>

                  {/* Commands in category */}
                  <div className="space-y-0.5">
                    {commands.map((command) => {
                      flatIndex++;
                      const currentIndex = flatIndex;
                      const isSelected = selectedIndex === currentIndex;
                      const Icon = command.icon;

                      return (
                        <button
                          key={command.id}
                          ref={(el) => {
                            if (el) {
                              itemRefs.current.set(currentIndex, el);
                            } else {
                              itemRefs.current.delete(currentIndex);
                            }
                          }}
                          onClick={() => executeCommand(command)}
                          onMouseEnter={() => setSelectedIndex(currentIndex)}
                          className={cn(
                            'w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors',
                            'hover:bg-accent hover:text-accent-foreground',
                            isSelected && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                            <div className="flex flex-col items-start min-w-0">
                              <span className="truncate">{command.label}</span>
                              {command.description && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {command.description}
                                </span>
                              )}
                            </div>
                          </div>

                          {command.shortcut && (
                            <div className="ml-4 shrink-0">
                              {renderShortcut(command.shortcut)}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer hint */}
        <div className="flex items-center justify-between px-3 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background border rounded">Enter</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-background border rounded">↑</kbd>
              <kbd className="px-1 py-0.5 bg-background border rounded">↓</kbd>
              <span>to navigate</span>
            </span>
          </div>
          <span className="flex items-center gap-1">
            <kbd className="px-1 py-0.5 bg-background border rounded">Esc</kbd>
            <span>to close</span>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default CommandPalette;
