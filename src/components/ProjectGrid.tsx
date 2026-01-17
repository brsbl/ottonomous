import { useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import type { Project } from '../types';

/**
 * Format file size to human-readable format (KB/MB/GB)
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Empty state component for grid view
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
      <h3 className="text-lg font-medium text-gray-300 mb-2">No projects found</h3>
      <p className="text-gray-500 max-w-md">
        Add a folder to scan for Ableton projects, or adjust your filters to see more results.
      </p>
    </div>
  );
}

/**
 * Individual project card component
 */
function ProjectCard({
  project,
  isSelected,
  onSelect,
  onDoubleClick,
}: {
  project: Project;
  isSelected: boolean;
  onSelect: (e: React.MouseEvent) => void;
  onDoubleClick: () => void;
}) {
  const toggleFavorite = useProjectStore((state) => state.toggleFavorite);

  return (
    <div
      onClick={onSelect}
      onDoubleClick={onDoubleClick}
      className={`
        relative p-4 rounded-lg border transition-all cursor-pointer
        ${isSelected
          ? 'bg-blue-900/30 border-blue-500/50 ring-1 ring-blue-500/30'
          : 'bg-card border-border hover:bg-secondary hover:border-muted-foreground/30'
        }
      `}
    >
      {/* Favorite star - positioned top right */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(project.id);
        }}
        className={`
          absolute top-3 right-3 p-1.5 rounded-full transition-colors
          ${project.favorite
            ? 'text-yellow-400 bg-yellow-400/10 hover:bg-yellow-400/20'
            : 'text-gray-500 hover:text-gray-400 hover:bg-gray-700/50'
          }
        `}
        title={project.favorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <svg
          className="w-4 h-4"
          fill={project.favorite ? 'currentColor' : 'none'}
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      </button>

      {/* Project name */}
      <h3 className="font-medium text-foreground truncate pr-8 mb-3" title={project.name}>
        {project.name}
      </h3>

      {/* Metadata badges row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* BPM Badge */}
        {project.bpm !== null ? (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-900/40 text-blue-300">
            {Math.round(project.bpm)} BPM
          </span>
        ) : (
          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-700/50 text-gray-400">
            -- BPM
          </span>
        )}

        {/* Track count badge */}
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-900/40 text-purple-300">
          {project.trackCount} tracks
        </span>
      </div>

      {/* Additional info row */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span title={`${project.audioTrackCount} audio, ${project.midiTrackCount} MIDI, ${project.returnTrackCount} return`}>
          {project.audioTrackCount}A / {project.midiTrackCount}M / {project.returnTrackCount}R
        </span>
        <span>{formatFileSize(project.fileSize)}</span>
      </div>

      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute bottom-2 left-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
        </div>
      )}
    </div>
  );
}

/**
 * ProjectGrid component - displays projects in a responsive card-based grid
 */
export function ProjectGrid() {
  const {
    projects,
    selectedProjectIds,
    sortField,
    sortDirection,
    filters,
    searchQuery,
    selectProject,
    toggleSelectProject,
  } = useProjectStore();

  // Filter and sort projects (same logic as ProjectTable)
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        p.path.toLowerCase().includes(query)
      );
    }

    // Apply filters
    if (filters.bpmMin !== null) {
      result = result.filter((p) => p.bpm !== null && p.bpm >= filters.bpmMin!);
    }
    if (filters.bpmMax !== null) {
      result = result.filter((p) => p.bpm !== null && p.bpm <= filters.bpmMax!);
    }
    if (filters.trackCountMin !== null) {
      result = result.filter((p) => p.trackCount >= filters.trackCountMin!);
    }
    if (filters.trackCountMax !== null) {
      result = result.filter((p) => p.trackCount <= filters.trackCountMax!);
    }
    if (filters.favoritesOnly) {
      result = result.filter((p) => p.favorite);
    }
    if (filters.analyzedOnly) {
      result = result.filter((p) => p.analyzed);
    }
    if (filters.tagIds.length > 0) {
      result = result.filter((p) =>
        filters.tagIds.some((tagId) => p.tags.includes(tagId))
      );
    }
    if (filters.ratingMin !== null) {
      result = result.filter(
        (p) => p.rating !== null && p.rating >= filters.ratingMin!
      );
    }

    // Sort projects
    result.sort((a, b) => {
      let aVal: string | number | Date | null;
      let bVal: string | number | Date | null;

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'bpm':
          aVal = a.bpm ?? (sortDirection === 'asc' ? Infinity : -Infinity);
          bVal = b.bpm ?? (sortDirection === 'asc' ? Infinity : -Infinity);
          break;
        case 'trackCount':
          aVal = a.trackCount;
          bVal = b.trackCount;
          break;
        case 'fileSize':
          aVal = a.fileSize;
          bVal = b.fileSize;
          break;
        case 'modifiedAt':
          aVal = new Date(a.modifiedAt).getTime();
          bVal = new Date(b.modifiedAt).getTime();
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        case 'rating':
          aVal = a.rating ?? (sortDirection === 'asc' ? Infinity : -Infinity);
          bVal = b.rating ?? (sortDirection === 'asc' ? Infinity : -Infinity);
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [projects, searchQuery, filters, sortField, sortDirection]);

  // Handle card click - select single project
  const handleCardClick = (projectId: string, event: React.MouseEvent) => {
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd click - toggle selection
      toggleSelectProject(projectId);
    } else {
      // Regular click - select only this project
      selectProject(projectId);
    }
  };

  // Handle double-click to open detail (placeholder for now)
  const handleDoubleClick = (projectId: string) => {
    // TODO: Open project detail modal
    console.log('Open detail for project:', projectId);
  };

  if (filteredAndSortedProjects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="p-4">
      {/* Responsive CSS grid:
          - 1 column on mobile (< 640px)
          - 2 columns on small screens (>= 640px)
          - 3 columns on medium screens (>= 768px)
          - 4 columns on large screens (>= 1024px)
      */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAndSortedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            isSelected={selectedProjectIds.includes(project.id)}
            onSelect={(e: React.MouseEvent) => handleCardClick(project.id, e)}
            onDoubleClick={() => handleDoubleClick(project.id)}
          />
        ))}
      </div>

      {/* Results count */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        Showing {filteredAndSortedProjects.length} project{filteredAndSortedProjects.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default ProjectGrid;
