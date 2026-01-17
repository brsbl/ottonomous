/**
 * FolderTree component for the Personal Knowledge Base application.
 * Provides hierarchical folder navigation with drag-drop support for moving notes.
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  FileText,
  Plus,
  Pencil,
  Trash2,
  FolderPlus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import type { Folder as FolderType, Note } from '../types';
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
  onRenameFolder: (folderId: string, newName: string) => void;
  onDeleteFolder: (folderId: string) => void;
  onCreateSubfolder: (parentId: string) => void;
  onDropNote: (noteId: string, folderId: string | null) => void;
  level?: number;
  draggedNoteId: string | null;
  setDraggedNoteId: (noteId: string | null) => void;
}

/**
 * Recursive component to render folder tree items with context menu.
 */
function FolderTreeItem({
  folder,
  folders,
  notes,
  activeNoteId,
  expandedFolders,
  onToggleFolder,
  onSelectNote,
  onRenameFolder,
  onDeleteFolder,
  onCreateSubfolder,
  onDropNote,
  level = 0,
  draggedNoteId,
  setDraggedNoteId,
}: FolderTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.name);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isExpanded = expandedFolders.has(folder.id);
  const childFolders = folders.filter((f) => f.parentId === folder.id);
  const folderNotes = notes.filter((n) => n.folderId === folder.id);
  const hasChildren = childFolders.length > 0 || folderNotes.length > 0;

  /**
   * Handle rename submission.
   */
  const handleRenameSubmit = () => {
    if (editName.trim() && editName !== folder.name) {
      onRenameFolder(folder.id, editName.trim());
    }
    setIsEditing(false);
  };

  /**
   * Handle key down in rename input.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setEditName(folder.name);
      setIsEditing(false);
    }
  };

  /**
   * Start editing mode.
   */
  const startEditing = () => {
    setEditName(folder.name);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  /**
   * Handle drag over event for drop target.
   */
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNoteId) {
      setIsDragOver(true);
    }
  };

  /**
   * Handle drag leave event.
   */
  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  /**
   * Handle drop event.
   */
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (draggedNoteId) {
      onDropNote(draggedNoteId, folder.id);
      setDraggedNoteId(null);
    }
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => {
              // Prevent toggle when right-clicking
              if (e.button === 0 && !isEditing) {
                onToggleFolder(folder.id);
              }
            }}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors cursor-pointer',
              isDragOver && 'bg-accent/50 ring-2 ring-primary'
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
            {isEditing ? (
              <Input
                ref={inputRef}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRenameSubmit}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="h-6 py-0 px-1 text-sm flex-1"
              />
            ) : (
              <span className="truncate">{folder.name}</span>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem onClick={startEditing}>
            <Pencil className="mr-2 h-4 w-4" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onCreateSubfolder(folder.id)}>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Subfolder
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onDeleteFolder(folder.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
              onRenameFolder={onRenameFolder}
              onDeleteFolder={onDeleteFolder}
              onCreateSubfolder={onCreateSubfolder}
              onDropNote={onDropNote}
              level={level + 1}
              draggedNoteId={draggedNoteId}
              setDraggedNoteId={setDraggedNoteId}
            />
          ))}

          {/* Notes in this folder */}
          {folderNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              level={level + 1}
              isActive={activeNoteId === note.id}
              onSelect={() => onSelectNote(note.id)}
              onDragStart={() => setDraggedNoteId(note.id)}
              onDragEnd={() => setDraggedNoteId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Props for the NoteItem component.
 */
interface NoteItemProps {
  note: Note;
  level: number;
  isActive: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
}

/**
 * Draggable note item component.
 */
function NoteItem({
  note,
  level,
  isActive,
  onSelect,
  onDragStart,
  onDragEnd,
}: NoteItemProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', note.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
    onDragStart();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <button
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={onSelect}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md',
        'hover:bg-accent hover:text-accent-foreground',
        'transition-colors text-left cursor-grab',
        isActive && 'bg-accent text-accent-foreground',
        isDragging && 'opacity-50'
      )}
      style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }}
    >
      <span className="w-4" />
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{note.title}</span>
    </button>
  );
}

/**
 * Props for the FolderTree component.
 */
interface FolderTreeProps {
  onSelectNote?: (noteId: string) => void;
}

/**
 * Main FolderTree component with folder navigation and drag-drop support.
 */
export function FolderTree({ onSelectNote }: FolderTreeProps) {
  const {
    notes,
    folders,
    activeNoteId,
    setActiveNote,
    createFolder,
    updateFolder,
    deleteFolder,
    moveNote,
  } = useKnowledgeBase();

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null);
  const [isRootDragOver, setIsRootDragOver] = useState(false);
  const newFolderInputRef = useRef<HTMLInputElement>(null);

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

  /**
   * Toggle folder expansion state.
   */
  const handleToggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  /**
   * Handle note selection.
   */
  const handleSelectNote = useCallback(
    (noteId: string) => {
      setActiveNote(noteId);
      onSelectNote?.(noteId);
    },
    [setActiveNote, onSelectNote]
  );

  /**
   * Handle folder rename.
   */
  const handleRenameFolder = useCallback(
    async (folderId: string, newName: string) => {
      await updateFolder(folderId, { name: newName });
    },
    [updateFolder]
  );

  /**
   * Handle folder deletion.
   */
  const handleDeleteFolder = useCallback(
    async (folderId: string) => {
      // Move notes to root before deleting
      const folderNotes = notes.filter((n) => n.folderId === folderId);
      for (const note of folderNotes) {
        await moveNote(note.id, null);
      }

      // Move child folders to root
      const childFolders = folders.filter((f) => f.parentId === folderId);
      for (const childFolder of childFolders) {
        await updateFolder(childFolder.id, { parentId: null });
      }

      await deleteFolder(folderId);
    },
    [notes, folders, deleteFolder, moveNote, updateFolder]
  );

  /**
   * Start creating a new subfolder.
   */
  const handleCreateSubfolder = useCallback((parentId: string) => {
    setNewFolderParentId(parentId);
    setNewFolderName('');
    setIsCreatingFolder(true);
    // Expand parent folder
    setExpandedFolders((prev) => new Set(prev).add(parentId));
    setTimeout(() => newFolderInputRef.current?.focus(), 0);
  }, []);

  /**
   * Start creating a new root folder.
   */
  const handleCreateRootFolder = useCallback(() => {
    setNewFolderParentId(null);
    setNewFolderName('');
    setIsCreatingFolder(true);
    setTimeout(() => newFolderInputRef.current?.focus(), 0);
  }, []);

  /**
   * Submit new folder creation.
   */
  const handleNewFolderSubmit = useCallback(async () => {
    if (newFolderName.trim()) {
      await createFolder({
        name: newFolderName.trim(),
        parentId: newFolderParentId,
      });
    }
    setIsCreatingFolder(false);
    setNewFolderName('');
    setNewFolderParentId(null);
  }, [newFolderName, newFolderParentId, createFolder]);

  /**
   * Handle key down in new folder input.
   */
  const handleNewFolderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNewFolderSubmit();
    } else if (e.key === 'Escape') {
      setIsCreatingFolder(false);
      setNewFolderName('');
      setNewFolderParentId(null);
    }
  };

  /**
   * Handle note drop on folder.
   */
  const handleDropNote = useCallback(
    async (noteId: string, folderId: string | null) => {
      await moveNote(noteId, folderId);
    },
    [moveNote]
  );

  /**
   * Handle drag over root area.
   */
  const handleRootDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedNoteId) {
      setIsRootDragOver(true);
    }
  };

  /**
   * Handle drag leave root area.
   */
  const handleRootDragLeave = () => {
    setIsRootDragOver(false);
  };

  /**
   * Handle drop on root area (move to no folder).
   */
  const handleRootDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsRootDragOver(false);
    if (draggedNoteId) {
      await moveNote(draggedNoteId, null);
      setDraggedNoteId(null);
    }
  };

  return (
    <div className="space-y-1">
      {/* Header with new folder button */}
      <div className="flex items-center justify-between px-2 mb-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Folder className="h-3 w-3" />
          Folders
        </h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleCreateRootFolder}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* New folder input at root level */}
      {isCreatingFolder && newFolderParentId === null && (
        <div className="flex items-center gap-2 px-2 py-1">
          <span className="w-4" />
          <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
          <Input
            ref={newFolderInputRef}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onBlur={handleNewFolderSubmit}
            onKeyDown={handleNewFolderKeyDown}
            placeholder="New folder"
            className="h-6 py-0 px-1 text-sm flex-1"
          />
        </div>
      )}

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
          onRenameFolder={handleRenameFolder}
          onDeleteFolder={handleDeleteFolder}
          onCreateSubfolder={handleCreateSubfolder}
          onDropNote={handleDropNote}
          draggedNoteId={draggedNoteId}
          setDraggedNoteId={setDraggedNoteId}
        />
      ))}

      {/* Root drop zone for moving notes out of folders */}
      <div
        onDragOver={handleRootDragOver}
        onDragLeave={handleRootDragLeave}
        onDrop={handleRootDrop}
        className={cn(
          'rounded-md transition-colors min-h-[2rem]',
          isRootDragOver && 'bg-accent/50 ring-2 ring-primary'
        )}
      >
        {/* Root notes (no folder) */}
        {rootNotes.map((note) => (
          <NoteItem
            key={note.id}
            note={note}
            level={0}
            isActive={activeNoteId === note.id}
            onSelect={() => handleSelectNote(note.id)}
            onDragStart={() => setDraggedNoteId(note.id)}
            onDragEnd={() => setDraggedNoteId(null)}
          />
        ))}

        {/* Empty state */}
        {rootFolders.length === 0 && rootNotes.length === 0 && !isCreatingFolder && (
          <p className="text-sm text-muted-foreground px-2 py-4 text-center">
            No folders yet. Click + to create one.
          </p>
        )}

        {/* Drop hint when dragging */}
        {draggedNoteId && (
          <div
            className={cn(
              'text-xs text-muted-foreground px-2 py-2 text-center border-2 border-dashed rounded-md mt-2',
              isRootDragOver && 'border-primary'
            )}
          >
            Drop here to move to root
          </div>
        )}
      </div>
    </div>
  );
}

export default FolderTree;
