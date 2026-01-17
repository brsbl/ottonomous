import { useMemo } from 'react';
import { useProjectStore } from '../store/projectStore';
import { searchProjects } from '../lib/search';
import type { Project, SortField } from '../types';

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
 * Format date to a nice readable format
 */
function formatDate(date: Date | string | null): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} month${months > 1 ? 's' : ''} ago`;
  }

  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Sort icon component
 */
function SortIcon({ field, currentField, direction }: {
  field: SortField;
  currentField: SortField;
  direction: 'asc' | 'desc';
}) {
  if (field !== currentField) {
    return (
      <svg className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
      </svg>
    );
  }

  return direction === 'asc' ? (
    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * Empty state component
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
 * ProjectTable component - displays projects in a sortable table with selection
 */
export function ProjectTable() {
  const {
    projects,
    selectedProjectIds,
    sortField,
    sortDirection,
    filters,
    searchQuery,
    setSortField,
    toggleSelectProject,
    clearSelection,
  } = useProjectStore();

  // Filter and sort projects
  const filteredAndSortedProjects = useMemo(() => {
    let result = [...projects];

    // Apply fuzzy search filter using Fuse.js
    if (searchQuery.trim()) {
      const searchResults = searchProjects(searchQuery, projects);
      result = searchResults.map((r) => r.project);
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

  // Check if all visible projects are selected
  const allSelected =
    filteredAndSortedProjects.length > 0 &&
    filteredAndSortedProjects.every((p) => selectedProjectIds.includes(p.id));

  // Handle select all toggle
  const handleSelectAll = () => {
    if (allSelected) {
      clearSelection();
    } else {
      // Select all visible projects
      filteredAndSortedProjects.forEach((p) => {
        if (!selectedProjectIds.includes(p.id)) {
          toggleSelectProject(p.id);
        }
      });
    }
  };

  // Handle header click for sorting
  const handleSort = (field: SortField) => {
    setSortField(field);
  };

  if (filteredAndSortedProjects.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead className="text-xs uppercase bg-gray-800/50 text-gray-400 sticky top-0">
          <tr>
            <th className="px-4 py-3 w-10">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800 cursor-pointer"
              />
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors group"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center gap-2">
                Name
                <SortIcon field="name" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors group w-24"
              onClick={() => handleSort('bpm')}
            >
              <div className="flex items-center gap-2">
                BPM
                <SortIcon field="bpm" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors group w-24"
              onClick={() => handleSort('trackCount')}
            >
              <div className="flex items-center gap-2">
                Tracks
                <SortIcon field="trackCount" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors group w-28"
              onClick={() => handleSort('fileSize')}
            >
              <div className="flex items-center gap-2">
                Size
                <SortIcon field="fileSize" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
            <th
              className="px-4 py-3 cursor-pointer hover:bg-gray-700/50 transition-colors group w-36"
              onClick={() => handleSort('modifiedAt')}
            >
              <div className="flex items-center gap-2">
                Modified
                <SortIcon field="modifiedAt" currentField={sortField} direction={sortDirection} />
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {filteredAndSortedProjects.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              isSelected={selectedProjectIds.includes(project.id)}
              onToggleSelect={() => toggleSelectProject(project.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Individual project row component
 */
function ProjectRow({
  project,
  isSelected,
  onToggleSelect,
}: {
  project: Project;
  isSelected: boolean;
  onToggleSelect: () => void;
}) {
  const toggleFavorite = useProjectStore((state) => state.toggleFavorite);

  return (
    <tr
      className={`
        ${isSelected ? 'bg-blue-900/20' : 'bg-transparent'}
        hover:bg-gray-700/30 transition-colors cursor-pointer
      `}
    >
      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800 cursor-pointer"
        />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(project.id);
            }}
            className={`
              flex-shrink-0 p-1 rounded hover:bg-gray-700/50 transition-colors
              ${project.favorite ? 'text-yellow-400' : 'text-gray-500 hover:text-gray-400'}
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
          <div className="min-w-0">
            <div className="font-medium text-gray-200 truncate">{project.name}</div>
            <div className="text-xs text-gray-500 truncate" title={project.path}>
              {project.path}
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3">
        {project.bpm !== null ? (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-900/40 text-blue-300">
            {Math.round(project.bpm)}
          </span>
        ) : (
          <span className="text-gray-500">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-gray-300">
        <div className="flex items-center gap-1">
          <span>{project.trackCount}</span>
          {project.trackCount > 0 && (
            <span className="text-xs text-gray-500" title={`${project.audioTrackCount} audio, ${project.midiTrackCount} MIDI, ${project.returnTrackCount} return`}>
              ({project.audioTrackCount}A/{project.midiTrackCount}M)
            </span>
          )}
        </div>
      </td>
      <td className="px-4 py-3 text-gray-400">
        {formatFileSize(project.fileSize)}
      </td>
      <td className="px-4 py-3 text-gray-400">
        {formatDate(project.modifiedAt)}
      </td>
    </tr>
  );
}

export default ProjectTable;
