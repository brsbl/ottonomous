/**
 * Export/Import component for the Personal Knowledge Base application.
 * Provides UI for exporting notes to Markdown/ZIP and importing from files.
 */

import { useState, useRef } from 'react';
import {
  Download,
  Upload,
  FileText,
  FolderArchive,
  AlertCircle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from './ui/dialog';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import {
  downloadNote,
  downloadAllNotes,
  importMarkdown,
  importObsidianVault,
  type ImportVaultResult,
} from '../lib/exportImport';
import type { Folder } from '../types';

/**
 * Status type for import/export operations.
 */
type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * ExportImport component provides buttons and dialogs for export/import operations.
 */
export function ExportImport() {
  const {
    notes,
    folders,
    activeNoteId,
    createNote,
    createFolder,
  } = useKnowledgeBase();

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [status, setStatus] = useState<OperationStatus>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const zipInputRef = useRef<HTMLInputElement>(null);

  /**
   * Get the currently active note.
   */
  const activeNote = activeNoteId
    ? notes.find((n) => n.id === activeNoteId)
    : null;

  /**
   * Handle exporting the current note.
   */
  const handleExportCurrentNote = () => {
    if (!activeNote) {
      setStatus('error');
      setStatusMessage('No note selected');
      return;
    }

    try {
      downloadNote(activeNote);
      setStatus('success');
      setStatusMessage(`Exported "${activeNote.title}" successfully`);
      setTimeout(() => setIsExportDialogOpen(false), 1500);
    } catch (error) {
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to export note'
      );
    }
  };

  /**
   * Handle exporting all notes as ZIP.
   */
  const handleExportAll = async () => {
    if (notes.length === 0) {
      setStatus('error');
      setStatusMessage('No notes to export');
      return;
    }

    setStatus('loading');
    setStatusMessage('Creating ZIP archive...');

    try {
      await downloadAllNotes(notes, folders);
      setStatus('success');
      setStatusMessage(`Exported ${notes.length} notes successfully`);
      setTimeout(() => setIsExportDialogOpen(false), 1500);
    } catch (error) {
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to export notes'
      );
    }
  };

  /**
   * Handle importing a single markdown file.
   */
  const handleImportMarkdown = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    setStatusMessage('Importing markdown file...');

    try {
      const noteData = await importMarkdown(file);
      await createNote(noteData);
      setStatus('success');
      setStatusMessage(`Imported "${noteData.title}" successfully`);
      setTimeout(() => setIsImportDialogOpen(false), 1500);
    } catch (error) {
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to import file'
      );
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  /**
   * Handle importing an Obsidian vault from ZIP.
   */
  const handleImportVault = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('loading');
    setStatusMessage('Importing Obsidian vault...');

    try {
      const result: ImportVaultResult = await importObsidianVault(file);

      // Create folders first and track path-to-ID mapping
      const pathToFolderId = new Map<string, string>();
      const foldersWithPaths = result.folders as Array<
        Omit<Folder, 'id' | 'createdAt'> & { _tempPath?: string }
      >;

      // Sort folders by depth (parents first)
      const sortedFolders = [...foldersWithPaths].sort((a, b) => {
        const depthA = (a._tempPath || '').split('/').length;
        const depthB = (b._tempPath || '').split('/').length;
        return depthA - depthB;
      });

      // Create folders in order
      for (const folderData of sortedFolders) {
        const tempPath = (folderData as { _tempPath?: string })._tempPath;
        const pathParts = tempPath?.split('/') || [];
        const parentPath =
          pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : null;

        const folder = await createFolder({
          name: folderData.name,
          parentId: parentPath ? pathToFolderId.get(parentPath) || null : null,
          color: folderData.color,
        });

        if (tempPath) {
          pathToFolderId.set(tempPath, folder.id);
        }
      }

      // Create notes with resolved folder IDs
      let importedCount = 0;
      for (const noteData of result.notes) {
        const folderId = noteData.folderId
          ? pathToFolderId.get(noteData.folderId) || null
          : null;

        await createNote({
          ...noteData,
          folderId,
        });
        importedCount++;
      }

      setStatus('success');
      setStatusMessage(
        `Imported ${importedCount} notes and ${result.folders.length} folders`
      );
      setTimeout(() => setIsImportDialogOpen(false), 2000);
    } catch (error) {
      setStatus('error');
      setStatusMessage(
        error instanceof Error ? error.message : 'Failed to import vault'
      );
    }

    // Reset file input
    if (zipInputRef.current) {
      zipInputRef.current.value = '';
    }
  };

  /**
   * Reset status when dialogs open.
   */
  const handleExportDialogOpen = (open: boolean) => {
    if (open) {
      setStatus('idle');
      setStatusMessage('');
    }
    setIsExportDialogOpen(open);
  };

  const handleImportDialogOpen = (open: boolean) => {
    if (open) {
      setStatus('idle');
      setStatusMessage('');
    }
    setIsImportDialogOpen(open);
  };

  /**
   * Render status indicator.
   */
  const renderStatus = () => {
    if (status === 'idle') return null;

    return (
      <div
        className={`flex items-center gap-2 p-3 rounded-md mt-4 ${
          status === 'loading'
            ? 'bg-muted text-muted-foreground'
            : status === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
        }`}
      >
        {status === 'loading' && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {status === 'success' && <CheckCircle className="h-4 w-4" />}
        {status === 'error' && <AlertCircle className="h-4 w-4" />}
        <span className="text-sm">{statusMessage}</span>
      </div>
    );
  };

  return (
    <div className="flex items-center gap-2">
      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={handleExportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Notes</DialogTitle>
            <DialogDescription>
              Export your notes as Markdown files or a ZIP archive.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Export current note */}
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={handleExportCurrentNote}
              disabled={!activeNote || status === 'loading'}
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Export Current Note</div>
                <div className="text-xs text-muted-foreground">
                  {activeNote
                    ? `Export "${activeNote.title}" as Markdown`
                    : 'Select a note first'}
                </div>
              </div>
            </Button>

            {/* Export all notes */}
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={handleExportAll}
              disabled={notes.length === 0 || status === 'loading'}
            >
              <FolderArchive className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Export All Notes</div>
                <div className="text-xs text-muted-foreground">
                  {notes.length > 0
                    ? `Export ${notes.length} notes as ZIP with folder structure`
                    : 'No notes to export'}
                </div>
              </div>
            </Button>
          </div>

          {renderStatus()}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsExportDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={handleImportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Notes</DialogTitle>
            <DialogDescription>
              Import notes from Markdown files or an Obsidian vault.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Import markdown file */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              className="hidden"
              onChange={handleImportMarkdown}
            />
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => fileInputRef.current?.click()}
              disabled={status === 'loading'}
            >
              <FileText className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Import Markdown File</div>
                <div className="text-xs text-muted-foreground">
                  Import a single .md file as a new note
                </div>
              </div>
            </Button>

            {/* Import Obsidian vault */}
            <input
              ref={zipInputRef}
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleImportVault}
            />
            <Button
              variant="outline"
              className="justify-start h-auto py-4"
              onClick={() => zipInputRef.current?.click()}
              disabled={status === 'loading'}
            >
              <FolderArchive className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Import Obsidian Vault</div>
                <div className="text-xs text-muted-foreground">
                  Import a ZIP archive with folder structure
                </div>
              </div>
            </Button>
          </div>

          {renderStatus()}

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setIsImportDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ExportImport;
