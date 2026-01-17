// Type definitions for Ableton Project Manager

/**
 * Represents an Ableton Live project (.als file)
 */
export interface Project {
  /** Unique identifier (UUID) */
  id: string;
  /** File system path to the .als file */
  path: string;
  /** Project name (filename without .als extension) */
  name: string;

  // Extracted metadata
  /** Project tempo in BPM */
  bpm: number | null;
  /** Musical key (if detectable) */
  key: string | null;
  /** Project length in seconds */
  duration: number | null;
  /** Total number of tracks */
  trackCount: number;
  /** Number of audio tracks */
  audioTrackCount: number;
  /** Number of MIDI tracks */
  midiTrackCount: number;
  /** Number of return tracks */
  returnTrackCount: number;

  // Plugin/instrument analysis
  /** VST/AU plugin names used in the project */
  plugins: string[];
  /** Native Ableton devices used in the project */
  abletonDevices: string[];
  /** Sample file paths referenced in the project */
  samples: string[];

  // File info
  /** File size in bytes */
  fileSize: number;
  /** File creation date */
  createdAt: Date;
  /** Last modified date */
  modifiedAt: Date;
  /** Ableton Live version that created the project */
  abletonVersion: string | null;

  // User data
  /** User-assigned tag IDs */
  tags: string[];
  /** User notes about the project */
  notes: string;
  /** User rating (1-5 stars) */
  rating: number | null;
  /** Whether the project is marked as favorite */
  favorite: boolean;
  /** Last time the user viewed this project in the app */
  lastOpenedAt: Date | null;

  // Analysis status
  /** Whether metadata has been extracted from the .als file */
  analyzed: boolean;
  /** Error message if parsing failed */
  analysisError: string | null;
}

/**
 * Represents a folder being monitored for Ableton projects
 */
export interface Folder {
  /** Unique identifier */
  id: string;
  /** File system path to the folder */
  path: string;
  /** Folder display name */
  name: string;
  /** Number of projects found in this folder */
  projectCount: number;
  /** Last time the folder was scanned for projects */
  lastScanned: Date;
  /** Whether to watch for file system changes */
  watching: boolean;
}

/**
 * Represents a user-created tag for organizing projects
 */
export interface Tag {
  /** Unique identifier */
  id: string;
  /** Tag display name */
  name: string;
  /** Tag color (hex color code) */
  color: string;
  /** Number of projects with this tag */
  projectCount: number;
}

/**
 * Represents the current state of filters in the UI
 */
export interface FilterState {
  /** Minimum BPM for filtering (null = no minimum) */
  bpmMin: number | null;
  /** Maximum BPM for filtering (null = no maximum) */
  bpmMax: number | null;
  /** Minimum track count for filtering (null = no minimum) */
  trackCountMin: number | null;
  /** Maximum track count for filtering (null = no maximum) */
  trackCountMax: number | null;
  /** Show only favorite projects */
  favoritesOnly: boolean;
  /** Show only projects that have been analyzed */
  analyzedOnly: boolean;
  /** Filter by specific tag IDs (empty = show all) */
  tagIds: string[];
  /** Filter by specific folder IDs (empty = show all) */
  folderIds: string[];
  /** Minimum rating for filtering (null = no minimum) */
  ratingMin: number | null;
  /** Filter by Ableton version */
  abletonVersion: string | null;
}

/**
 * View mode for the project list
 */
export type ViewMode = 'table' | 'grid';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Fields that can be used for sorting projects
 */
export type SortField = keyof Pick<
  Project,
  'name' | 'bpm' | 'trackCount' | 'fileSize' | 'createdAt' | 'modifiedAt' | 'rating'
>;
