/**
 * Export/Import utilities for the Personal Knowledge Base application.
 * Provides functions to export notes to Markdown/ZIP and import from Markdown/Obsidian vaults.
 */

import JSZip from 'jszip';
import type { Note, Folder } from '../types';

/**
 * Result of importing an Obsidian vault or ZIP archive.
 */
export interface ImportVaultResult {
  notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[];
  folders: Omit<Folder, 'id' | 'createdAt'>[];
}

/**
 * Generate a safe filename from a note title.
 * Removes or replaces characters that are invalid in filenames.
 */
function sanitizeFilename(title: string): string {
  return title
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim() || 'Untitled';
}

/**
 * Extract title from markdown content (first H1 heading or first line).
 */
function extractTitleFromMarkdown(content: string, filename: string): string {
  // Try to find first H1 heading
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    return h1Match[1].trim();
  }

  // Fall back to first non-empty line
  const firstLine = content.split('\n').find((line) => line.trim());
  if (firstLine) {
    // Remove markdown formatting from first line
    return firstLine.replace(/^#+\s*/, '').trim().slice(0, 100);
  }

  // Fall back to filename without extension
  return filename.replace(/\.md$/i, '') || 'Untitled';
}

/**
 * Parse wiki-links from content and convert Obsidian-style links to our format.
 * Obsidian uses [[note]] or [[note|alias]] syntax, which we preserve.
 * Also handles #tags in content.
 */
function parseWikiLinksFromContent(content: string): { content: string; wikiLinks: string[] } {
  const wikiLinkPattern = /\[\[([^\[\]|]+)(?:\|[^\[\]]+)?\]\]/g;
  const wikiLinks: string[] = [];
  let match: RegExpExecArray | null;

  const regex = new RegExp(wikiLinkPattern.source, 'g');
  while ((match = regex.exec(content)) !== null) {
    const target = match[1].trim();
    if (target && !wikiLinks.includes(target)) {
      wikiLinks.push(target);
    }
  }

  // Content is already in compatible format, no transformation needed
  return { content, wikiLinks };
}

/**
 * Build folder path string for a note based on folder hierarchy.
 */
function buildFolderPath(folderId: string | null, folders: Folder[]): string {
  if (!folderId) return '';

  const path: string[] = [];
  let currentId: string | null = folderId;

  while (currentId) {
    const folder = folders.find((f) => f.id === currentId);
    if (!folder) break;
    path.unshift(folder.name);
    currentId = folder.parentId;
  }

  return path.join('/');
}

/**
 * Export a single note as a Markdown file.
 * @param note - The note to export
 * @returns Blob containing the markdown content
 */
export function exportNote(note: Note): Blob {
  // Create markdown content with frontmatter
  const frontmatter = [
    '---',
    `title: "${note.title.replace(/"/g, '\\"')}"`,
    `created: ${note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt}`,
    `updated: ${note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt}`,
  ];

  if (note.tags && note.tags.length > 0) {
    frontmatter.push(`tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]`);
  }

  if (note.isDaily && note.dailyDate) {
    frontmatter.push(`daily: true`);
    frontmatter.push(`date: ${note.dailyDate}`);
  }

  frontmatter.push('---', '');

  const content = frontmatter.join('\n') + note.content;

  return new Blob([content], { type: 'text/markdown;charset=utf-8' });
}

/**
 * Export all notes as a ZIP archive with folder structure.
 * @param notes - Array of notes to export
 * @param folders - Array of folders for structure
 * @returns Promise resolving to a Blob containing the ZIP archive
 */
export async function exportAll(notes: Note[], folders: Folder[]): Promise<Blob> {
  const zip = new JSZip();

  // Create folder structure in ZIP
  const folderPaths = new Map<string, string>();

  // Build folder paths
  for (const folder of folders) {
    const path = buildFolderPath(folder.id, folders);
    folderPaths.set(folder.id, path);
  }

  // Add notes to ZIP
  for (const note of notes) {
    const folderPath = note.folderId ? folderPaths.get(note.folderId) || '' : '';
    const filename = sanitizeFilename(note.title) + '.md';
    const fullPath = folderPath ? `${folderPath}/${filename}` : filename;

    // Create note content with frontmatter
    const frontmatter = [
      '---',
      `title: "${note.title.replace(/"/g, '\\"')}"`,
      `created: ${note.createdAt instanceof Date ? note.createdAt.toISOString() : note.createdAt}`,
      `updated: ${note.updatedAt instanceof Date ? note.updatedAt.toISOString() : note.updatedAt}`,
    ];

    if (note.tags && note.tags.length > 0) {
      frontmatter.push(`tags: [${note.tags.map((t) => `"${t}"`).join(', ')}]`);
    }

    if (note.isDaily && note.dailyDate) {
      frontmatter.push(`daily: true`);
      frontmatter.push(`date: ${note.dailyDate}`);
    }

    frontmatter.push('---', '');

    const content = frontmatter.join('\n') + note.content;
    zip.file(fullPath, content);
  }

  return zip.generateAsync({ type: 'blob' });
}

/**
 * Import a single Markdown file as a note.
 * @param file - The File object to import
 * @returns Promise resolving to note data (without id, createdAt, updatedAt)
 */
export async function importMarkdown(
  file: File
): Promise<Omit<Note, 'id' | 'createdAt' | 'updatedAt'>> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result;
        if (typeof content !== 'string') {
          reject(new Error('Failed to read file content'));
          return;
        }

        // Parse frontmatter if present
        let noteContent = content;
        let title = '';
        let tags: string[] = [];
        let isDaily = false;
        let dailyDate: string | undefined;

        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (frontmatterMatch) {
          const frontmatter = frontmatterMatch[1];
          noteContent = frontmatterMatch[2];

          // Parse title from frontmatter
          const titleMatch = frontmatter.match(/^title:\s*"?([^"\n]+)"?$/m);
          if (titleMatch) {
            title = titleMatch[1].trim();
          }

          // Parse tags from frontmatter
          const tagsMatch = frontmatter.match(/^tags:\s*\[([^\]]*)\]/m);
          if (tagsMatch) {
            tags = tagsMatch[1]
              .split(',')
              .map((t) => t.trim().replace(/^"|"$/g, ''))
              .filter((t) => t);
          }

          // Parse daily note info
          const dailyMatch = frontmatter.match(/^daily:\s*(true|false)/m);
          if (dailyMatch && dailyMatch[1] === 'true') {
            isDaily = true;
          }

          const dateMatch = frontmatter.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
          if (dateMatch) {
            dailyDate = dateMatch[1];
          }
        }

        // Extract title from content if not in frontmatter
        if (!title) {
          title = extractTitleFromMarkdown(noteContent, file.name);
        }

        // Parse wiki-links
        const { content: parsedContent } = parseWikiLinksFromContent(noteContent);

        resolve({
          title,
          content: parsedContent,
          folderId: null,
          tags,
          isDaily,
          dailyDate,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsText(file);
  });
}

/**
 * Import an Obsidian vault from a ZIP file.
 * Preserves folder structure and parses wiki-links.
 * @param zipFile - The ZIP file containing the Obsidian vault
 * @returns Promise resolving to notes and folders data
 */
export async function importObsidianVault(zipFile: File): Promise<ImportVaultResult> {
  const zip = await JSZip.loadAsync(zipFile);
  const notes: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  const folderMap = new Map<string, Omit<Folder, 'id' | 'createdAt'>>();

  // Track folder IDs we'll assign later (using path as temp ID)
  const pathToFolderId = new Map<string, string>();

  // Process all files in the ZIP
  const filePromises: Promise<void>[] = [];

  zip.forEach((relativePath, zipEntry) => {
    // Skip directories, hidden files, and non-markdown files
    if (zipEntry.dir) return;
    if (relativePath.startsWith('.') || relativePath.includes('/.')) return;
    if (!relativePath.toLowerCase().endsWith('.md')) return;

    const promise = zipEntry.async('string').then((content) => {
      // Extract folder path
      const pathParts = relativePath.split('/');
      const filename = pathParts.pop() || '';
      const folderPath = pathParts.join('/');

      // Create folder hierarchy
      let currentPath = '';
      let parentPath: string | null = null;

      for (const folderName of pathParts) {
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;

        if (!folderMap.has(currentPath)) {
          folderMap.set(currentPath, {
            name: folderName,
            parentId: parentPath, // Will be resolved later
          });
          pathToFolderId.set(currentPath, currentPath); // Use path as temp ID
        }

        parentPath = currentPath;
      }

      // Parse note content
      let noteContent = content;
      let title = '';
      let tags: string[] = [];
      let isDaily = false;
      let dailyDate: string | undefined;

      // Parse frontmatter if present
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        noteContent = frontmatterMatch[2];

        // Parse title from frontmatter
        const titleMatch = frontmatter.match(/^title:\s*"?([^"\n]+)"?$/m);
        if (titleMatch) {
          title = titleMatch[1].trim();
        }

        // Parse tags from frontmatter (YAML array format)
        const tagsMatch = frontmatter.match(/^tags:\s*\[([^\]]*)\]/m);
        if (tagsMatch) {
          tags = tagsMatch[1]
            .split(',')
            .map((t) => t.trim().replace(/^"|"$/g, ''))
            .filter((t) => t);
        }

        // Also check for YAML list format tags
        const tagsListMatch = frontmatter.match(/^tags:\s*\n((?:\s*-\s*.+\n?)*)/m);
        if (tagsListMatch && tags.length === 0) {
          tags = tagsListMatch[1]
            .split('\n')
            .map((line) => line.replace(/^\s*-\s*/, '').trim())
            .filter((t) => t);
        }

        // Parse daily note info
        const dailyMatch = frontmatter.match(/^daily:\s*(true|false)/m);
        if (dailyMatch && dailyMatch[1] === 'true') {
          isDaily = true;
        }

        const dateMatch = frontmatter.match(/^date:\s*(\d{4}-\d{2}-\d{2})/m);
        if (dateMatch) {
          dailyDate = dateMatch[1];
        }
      }

      // Extract title from content if not in frontmatter
      if (!title) {
        title = extractTitleFromMarkdown(noteContent, filename);
      }

      // Parse wiki-links (preserves them as-is since our app uses same format)
      const { content: parsedContent } = parseWikiLinksFromContent(noteContent);

      notes.push({
        title,
        content: parsedContent,
        folderId: folderPath || null, // Will be resolved later
        tags,
        isDaily,
        dailyDate,
      });
    });

    filePromises.push(promise);
  });

  await Promise.all(filePromises);

  // Convert folder map to array
  const folders = Array.from(folderMap.entries()).map(([path, folder]) => ({
    ...folder,
    // Store path as a temporary identifier that will be replaced with real ID later
    _tempPath: path,
  }));

  return {
    notes,
    folders: folders as Omit<Folder, 'id' | 'createdAt'>[],
  };
}

/**
 * Trigger a file download in the browser.
 * @param blob - The Blob to download
 * @param filename - The filename for the download
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export a single note and trigger download.
 * @param note - The note to export
 */
export function downloadNote(note: Note): void {
  const blob = exportNote(note);
  const filename = sanitizeFilename(note.title) + '.md';
  downloadBlob(blob, filename);
}

/**
 * Export all notes and trigger download.
 * @param notes - Array of notes to export
 * @param folders - Array of folders for structure
 */
export async function downloadAllNotes(notes: Note[], folders: Folder[]): Promise<void> {
  const blob = await exportAll(notes, folders);
  const date = new Date().toISOString().split('T')[0];
  downloadBlob(blob, `knowledge-base-export-${date}.zip`);
}
