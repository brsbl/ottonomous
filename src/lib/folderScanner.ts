// Folder scanner for finding Ableton Live project files (.als)
// Uses the File System Access API for browser-based directory access

// Type declarations for File System Access API (not yet in standard TypeScript lib)
declare global {
  interface Window {
    showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>;
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
    requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>;
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemFileHandle | FileSystemDirectoryHandle>;
  }
}

type FileSystemHandlePermissionDescriptor = { mode?: 'read' | 'readwrite' };

/**
 * Result of scanning a directory for .als files
 */
export interface ScannedFile {
  /** FileSystemFileHandle for reading the file */
  handle: FileSystemFileHandle;
  /** Full path to the file (relative to scanned root) */
  path: string;
  /** File name without path */
  name: string;
}

/**
 * Progress callback for directory scanning
 */
export interface ScanProgress {
  /** Number of .als files found so far */
  filesFound: number;
  /** Number of directories scanned so far */
  directoriesScanned: number;
  /** Current directory being scanned */
  currentDirectory: string;
}

/**
 * Error types for folder scanning
 */
export class FolderScanError extends Error {
  constructor(
    message: string,
    public readonly code: 'PERMISSION_DENIED' | 'ABORTED' | 'NOT_FOUND' | 'UNKNOWN'
  ) {
    super(message);
    this.name = 'FolderScanError';
  }
}

/**
 * Request folder access from the user using the File System Access API
 * Opens a directory picker dialog
 *
 * @returns FileSystemDirectoryHandle for the selected folder
 * @throws FolderScanError if permission is denied or user cancels
 */
export async function requestFolderAccess(): Promise<FileSystemDirectoryHandle> {
  // Check if the File System Access API is available
  if (!('showDirectoryPicker' in window)) {
    throw new FolderScanError(
      'File System Access API is not supported in this browser. Please use Chrome, Edge, or another Chromium-based browser.',
      'UNKNOWN'
    );
  }

  try {
    // Show the directory picker dialog
    const dirHandle = await window.showDirectoryPicker({
      mode: 'read',
    });
    return dirHandle;
  } catch (error) {
    if (error instanceof Error) {
      // User cancelled the dialog
      if (error.name === 'AbortError') {
        throw new FolderScanError('Folder selection was cancelled.', 'ABORTED');
      }
      // Permission denied
      if (error.name === 'NotAllowedError') {
        throw new FolderScanError(
          'Permission to access the folder was denied. Please grant access and try again.',
          'PERMISSION_DENIED'
        );
      }
      // Not found (unlikely but possible)
      if (error.name === 'NotFoundError') {
        throw new FolderScanError('The selected folder could not be found.', 'NOT_FOUND');
      }
    }
    // Unknown error
    throw new FolderScanError(
      `Failed to access folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
      'UNKNOWN'
    );
  }
}

/**
 * Recursively scan a directory for .als files
 *
 * @param dirHandle - FileSystemDirectoryHandle to scan
 * @param onProgress - Optional callback for progress updates
 * @param basePath - Internal: base path for building file paths
 * @returns Array of ScannedFile objects for all .als files found
 */
export async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  onProgress?: (progress: ScanProgress) => void,
  basePath: string = ''
): Promise<ScannedFile[]> {
  const results: ScannedFile[] = [];
  const progress: ScanProgress = {
    filesFound: 0,
    directoriesScanned: 0,
    currentDirectory: basePath || dirHandle.name,
  };

  // Internal recursive function
  async function scanRecursive(
    handle: FileSystemDirectoryHandle,
    currentPath: string
  ): Promise<void> {
    progress.directoriesScanned++;
    progress.currentDirectory = currentPath || handle.name;

    if (onProgress) {
      onProgress({ ...progress });
    }

    try {
      // Iterate over all entries in the directory
      for await (const entry of handle.values()) {
        if (entry.kind === 'file') {
          // Check if it's an .als file (case-insensitive)
          if (entry.name.toLowerCase().endsWith('.als')) {
            const filePath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
            results.push({
              handle: entry,
              path: filePath,
              name: entry.name,
            });
            progress.filesFound++;

            if (onProgress) {
              onProgress({ ...progress });
            }
          }
        } else if (entry.kind === 'directory') {
          // Skip hidden directories (starting with .)
          if (entry.name.startsWith('.')) {
            continue;
          }
          // Skip common non-project directories
          if (isExcludedDirectory(entry.name)) {
            continue;
          }

          // Recursively scan subdirectory
          const subPath = currentPath ? `${currentPath}/${entry.name}` : entry.name;
          try {
            await scanRecursive(entry, subPath);
          } catch (error) {
            // Log but continue on permission errors for subdirectories
            console.warn(`Could not access directory: ${subPath}`, error);
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          throw new FolderScanError(
            `Permission denied for directory: ${currentPath || handle.name}`,
            'PERMISSION_DENIED'
          );
        }
        if (error.name === 'NotFoundError') {
          throw new FolderScanError(
            `Directory not found: ${currentPath || handle.name}`,
            'NOT_FOUND'
          );
        }
      }
      throw new FolderScanError(
        `Error scanning directory: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'UNKNOWN'
      );
    }
  }

  await scanRecursive(dirHandle, basePath);

  return results;
}

/**
 * Check if a directory should be excluded from scanning
 * Excludes common non-project directories to improve scan speed
 */
function isExcludedDirectory(name: string): boolean {
  const excludedDirs = [
    'node_modules',
    '__pycache__',
    '.git',
    '.svn',
    '.hg',
    'Backup', // Ableton's backup folder
    'Samples', // Ableton's samples folder (rarely contains .als files)
    'Trash',
    '$RECYCLE.BIN',
    'System Volume Information',
  ];

  return excludedDirs.some(
    (excluded) => name.toLowerCase() === excluded.toLowerCase()
  );
}

/**
 * Request permission to read a file from a previously stored handle
 * Useful for re-accessing files after page reload
 *
 * @param handle - FileSystemFileHandle to check/request permission for
 * @returns true if permission is granted, false otherwise
 */
export async function verifyFilePermission(
  handle: FileSystemFileHandle
): Promise<boolean> {
  // Check if we already have permission
  const options: FileSystemHandlePermissionDescriptor = { mode: 'read' };

  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  // Request permission if we don't have it
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
}

/**
 * Request permission to read a directory from a previously stored handle
 * Useful for re-accessing directories after page reload
 *
 * @param handle - FileSystemDirectoryHandle to check/request permission for
 * @returns true if permission is granted, false otherwise
 */
export async function verifyDirectoryPermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  // Check if we already have permission
  const options: FileSystemHandlePermissionDescriptor = { mode: 'read' };

  if ((await handle.queryPermission(options)) === 'granted') {
    return true;
  }

  // Request permission if we don't have it
  if ((await handle.requestPermission(options)) === 'granted') {
    return true;
  }

  return false;
}
