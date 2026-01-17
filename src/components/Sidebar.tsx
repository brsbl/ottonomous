/**
 * Sidebar component for the Personal Knowledge Base application.
 * Provides navigation, search, folder tree, and quick access to notes.
 */

import { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Clock,
  Pin,
  Layers,
  Settings2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import type { Folder as FolderType, Note } from '../types';
import { SmartCollections } from './SmartCollections';
import { cn } from '../lib/utils';

/**
 * Props for the FolderTreeItem component.
 */
interface FolderTreeItemProps {
  folder: FolderType;
  folders: FolderType[];
  notes: Note[];
  activeNoteId: string | null;
  expandedFolders: Set<string>;
  onToggleFolder: (folderId: string) => void;
  onSelectNote: (noteId: string) => void;
  level?: number;
}

/**
 * Recursive component to render folder tree items.
 */
function FolderTreeItem({
  folder,
  folders,
  notes,
  activeNoteId,
  expandedFolders,
  onToggleFolder,
  onSelectNote,
  level = 0,
}: FolderTreeItemProps) {
  const isExpanded = expandedFolders.has(folder.id);
  const childFolders = folders.filter((f) => f.parentId === folder.id);
  const folderNotes = notes.filter((n) => n.folderId === folder.id);
  const hasChildren = childFolders.length > 0 || folderNotes.length > 0;

  return (
    <div>
      <button
        onClick={() => onToggleFolder(folder.id)}
        className={cn(
          'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
          'hover:bg-accent hover:text-accent-foreground',
          'transition-colors'
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          )
        ) : (
          <span className="w-4" />
        )}
        {isExpanded ? (
          <FolderOpen
            className="h-4 w-4 shrink-0"
            style={{ color: folder.color || 'currentColor' }}
          />
        ) : (
          <Folder
            className="h-4 w-4 shrink-0"
            style={{ color: folder.color || 'currentColor' }}
          />
        )}
        <span className="truncate">{folder.name}</span>
      </button>

      {isExpanded && (
        <div>
          {/* Child folders */}
          {childFolders.map((childFolder) => (
            <FolderTreeItem
              key={childFolder.id}
              folder={childFolder}
              folders={folders}
              notes={notes}
              activeNoteId={activeNoteId}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
              onSelectNote={onSelectNote}
              level={level + 1}
            />
          ))}

          {/* Notes in this folder */}
          {folderNotes.map((note) => (
            <button
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                'hover:bg-accent hover:text-accent-foreground',
                'transition-colors',
                activeNoteId === note.id && 'bg-accent text-accent-foreground'
              )}
              style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
            >
              <span className="w-4" />
              <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{note.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main Sidebar component with navigation, search, and folder tree.
 */
export function Sidebar() {
  const {
    notes,
    folders,
    collections,
    activeNoteId,
    searchQuery,
    searchResults,
    setActiveNote,
    setSearchQuery,
    performSearch,
    clearSearch,
    createNote,
    evaluateCollection,
  } = useKnowledgeBase();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);

  // Get root folders (no parent)
  const rootFolders = useMemo(
    () => folders.filter((f) => f.parentId === null),
    [folders]
  );

  // Get root notes (no folder)
  const rootNotes = useMemo(
    () => notes.filter((n) => n.folderId === null),
    [notes]
  );

  // Get recent notes (last 5 by updatedAt)
  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [notes]);

  // Placeholder for pinned notes (will be implemented later)
  const pinnedNotes: Note[] = [];

  // Get notes for selected collection
  const collectionNotes = useMemo(() => {
    if (!selectedCollectionId) return null;
    const collection = collections.find((c) => c.id === selectedCollectionId);
    if (!collection) return null;
    return evaluateCollection(collection);
  }, [selectedCollectionId, collections, evaluateCollection]);

  // Get selected collection
  const selectedCollection = useMemo(() => {
    return collections.find((c) => c.id === selectedCollectionId);
  }, [selectedCollectionId, collections]);

  /**
   * Toggle folder expansion state.
   */
  const handleToggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  /**
   * Handle note selection.
   */
  const handleSelectNote = (noteId: string) => {
    setActiveNote(noteId);
  };

  /**
   * Handle search input change.
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setLocalSearchQuery(query);
    if (query.trim()) {
      setSearchQuery(query);
      performSearch(query);
    } else {
      clearSearch();
    }
  };

  /**
   * Handle creating a new note.
   */
  const handleNewNote = async () => {
    const newNote = await createNote({
      title: 'Untitled',
      content: '',
      folderId: null,
      tags: [],
      isDaily: false,
    });
    setActiveNote(newNote.id);
  };

  const displayNotes = searchQuery ? searchResults : null;

  /**
   * Handle collection selection.
   */
  const handleSelectCollection = (collectionId: string) => {
    setSelectedCollectionId(
      selectedCollectionId === collectionId ? null : collectionId
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Search bar */}
      <div className="p-3 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search notes..."
            value={localSearchQuery}
            onChange={handleSearchChange}
            className="pl-8 h-8"
          />
        </div>
      </div>

      {/* New Note button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={handleNewNote}
          className="w-full justify-start gap-2"
          size="sm"
        >
          <Plus className="h-4 w-4" />
          New Note
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3 space-y-4">
          {/* Search results */}
          {displayNotes && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                Search Results ({displayNotes.length})
              </h3>
              {displayNotes.length === 0 ? (
                <p className="text-sm text-muted-foreground px-2">No results found</p>
              ) : (
                <div className="space-y-0.5">
                  {displayNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleSelectNote(note.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                        'hover:bg-accent hover:text-accent-foreground',
                        'transition-colors text-left',
                        activeNoteId === note.id && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{note.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pinned notes section */}
          {!displayNotes && pinnedNotes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                <Pin className="h-3 w-3" />
                Pinned
              </h3>
              <div className="space-y-0.5">
                {pinnedNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                      'hover:bg-accent hover:text-accent-foreground',
                      'transition-colors text-left',
                      activeNoteId === note.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{note.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent notes section */}
          {!displayNotes && recentNotes.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Recent
              </h3>
              <div className="space-y-0.5">
                {recentNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                      'hover:bg-accent hover:text-accent-foreground',
                      'transition-colors text-left',
                      activeNoteId === note.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{note.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Smart Collections section */}
          {!displayNotes && collections.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2 px-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3 w-3" />
                  Collections
                </h3>
                <button
                  onClick={() => setCollectionsOpen(true)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Manage collections"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-0.5">
                {collections.map((collection) => {
                  const noteCount = evaluateCollection(collection).length;
                  const isSelected = selectedCollectionId === collection.id;
                  return (
                    <button
                      key={collection.id}
                      onClick={() => handleSelectCollection(collection.id)}
                      className={cn(
                        'w-full flex items-center justify-between gap-2 px-2 py-1.5 text-sm rounded-md',
                        'hover:bg-accent hover:text-accent-foreground',
                        'transition-colors text-left',
                        isSelected && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate">{collection.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {noteCount}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Show collection notes when selected */}
              {selectedCollection && collectionNotes && collectionNotes.length > 0 && (
                <div className="mt-2 ml-2 pl-2 border-l border-border space-y-0.5">
                  {collectionNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => handleSelectNote(note.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                        'hover:bg-accent hover:text-accent-foreground',
                        'transition-colors text-left',
                        activeNoteId === note.id && 'bg-accent text-accent-foreground'
                      )}
                    >
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <span className="truncate">{note.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Folder tree */}
          {!displayNotes && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2 flex items-center gap-1.5">
                <Folder className="h-3 w-3" />
                Folders
              </h3>
              <div className="space-y-0.5">
                {/* Root folders */}
                {rootFolders.map((folder) => (
                  <FolderTreeItem
                    key={folder.id}
                    folder={folder}
                    folders={folders}
                    notes={notes}
                    activeNoteId={activeNoteId}
                    expandedFolders={expandedFolders}
                    onToggleFolder={handleToggleFolder}
                    onSelectNote={handleSelectNote}
                  />
                ))}

                {/* Root notes (no folder) */}
                {rootNotes.map((note) => (
                  <button
                    key={note.id}
                    onClick={() => handleSelectNote(note.id)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
                      'hover:bg-accent hover:text-accent-foreground',
                      'transition-colors text-left',
                      activeNoteId === note.id && 'bg-accent text-accent-foreground'
                    )}
                  >
                    <span className="w-4" />
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{note.title}</span>
                  </button>
                ))}

                {/* Empty state */}
                {rootFolders.length === 0 && rootNotes.length === 0 && (
                  <p className="text-sm text-muted-foreground px-2 py-4 text-center">
                    No notes yet. Create your first note!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Smart Collections Manager Dialog */}
      <SmartCollections
        open={collectionsOpen}
        onOpenChange={setCollectionsOpen}
        onSelectNote={handleSelectNote}
      />
    </div>
  );
}

export default Sidebar;
