import { create } from 'zustand';
import type {
  Project,
  Folder,
  Tag,
  ViewMode,
  SortField,
  SortDirection,
  FilterState,
} from '../types';

/**
 * Default filter state with no active filters
 */
const defaultFilters: FilterState = {
  bpmMin: null,
  bpmMax: null,
  trackCountMin: null,
  trackCountMax: null,
  favoritesOnly: false,
  analyzedOnly: false,
  tagIds: [],
  folderIds: [],
  ratingMin: null,
  abletonVersion: null,
};

/**
 * Project store state interface
 */
interface ProjectState {
  // Data
  projects: Project[];
  folders: Folder[];
  tags: Tag[];

  // UI State
  selectedProjectIds: string[];
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  filters: FilterState;
  searchQuery: string;

  // Actions
  setProjects: (projects: Project[]) => void;
  addFolder: (folder: Folder) => void;
  removeFolder: (folderId: string) => void;
  toggleFavorite: (projectId: string) => void;
  setRating: (projectId: string, rating: number | null) => void;
  updateFilters: (filters: Partial<FilterState>) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  selectProject: (projectId: string) => void;
  toggleSelectProject: (projectId: string) => void;
  clearSelection: () => void;
  setViewMode: (mode: ViewMode) => void;
  setSortDirection: (direction: SortDirection) => void;
  addTag: (tag: Tag) => void;
  removeTag: (tagId: string) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
}

/**
 * Zustand store for application state management
 */
export const useProjectStore = create<ProjectState>((set) => ({
  // Initial state
  projects: [],
  folders: [],
  tags: [],
  selectedProjectIds: [],
  viewMode: 'table',
  sortField: 'modifiedAt',
  sortDirection: 'desc',
  filters: defaultFilters,
  searchQuery: '',

  // Actions
  setProjects: (projects) => set({ projects }),

  addFolder: (folder) =>
    set((state) => ({
      folders: [...state.folders, folder],
    })),

  removeFolder: (folderId) =>
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== folderId),
      // Also remove projects from this folder
      projects: state.projects.filter((p) => !p.path.startsWith(
        state.folders.find((f) => f.id === folderId)?.path || ''
      )),
    })),

  toggleFavorite: (projectId) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, favorite: !p.favorite } : p
      ),
    })),

  setRating: (projectId, rating) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, rating } : p
      ),
    })),

  updateFilters: (filterUpdates) =>
    set((state) => ({
      filters: { ...state.filters, ...filterUpdates },
    })),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setSortField: (field) =>
    set((state) => ({
      sortField: field,
      // Toggle direction if clicking same field
      sortDirection:
        state.sortField === field && state.sortDirection === 'asc'
          ? 'desc'
          : 'asc',
    })),

  selectProject: (projectId) =>
    set({ selectedProjectIds: [projectId] }),

  toggleSelectProject: (projectId) =>
    set((state) => ({
      selectedProjectIds: state.selectedProjectIds.includes(projectId)
        ? state.selectedProjectIds.filter((id) => id !== projectId)
        : [...state.selectedProjectIds, projectId],
    })),

  clearSelection: () => set({ selectedProjectIds: [] }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setSortDirection: (direction) => set({ sortDirection: direction }),

  addTag: (tag) =>
    set((state) => ({
      tags: [...state.tags, tag],
    })),

  removeTag: (tagId) =>
    set((state) => ({
      tags: state.tags.filter((t) => t.id !== tagId),
      // Also remove tag from all projects
      projects: state.projects.map((p) => ({
        ...p,
        tags: p.tags.filter((t) => t !== tagId),
      })),
    })),

  updateProject: (projectId, updates) =>
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === projectId ? { ...p, ...updates } : p
      ),
    })),
}));
