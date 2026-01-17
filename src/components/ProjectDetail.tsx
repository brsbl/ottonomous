import { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  Heart,
  Star,
  Clock,
  HardDrive,
  Calendar,
  Music,
  Layers,
  Plug,
  FileAudio,
  FolderOpen,
  Info,
  Tag as TagIcon,
  Plus,
  ChevronDown,
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { db } from '../lib/db';
import { TagBadge } from './TagBadge';
import type { Project, Tag } from '../types';

interface ProjectDetailProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Formats bytes into human-readable file size
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formats duration in seconds to MM:SS or HH:MM:SS
 */
function formatDuration(seconds: number | null): string {
  if (seconds === null) return '--:--';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formats a date object to a readable string
 */
function formatDate(date: Date | null): string {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Counts occurrences of items in an array and returns sorted by count
 */
function countItems(items: string[]): { name: string; count: number }[] {
  const counts = items.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

interface StarRatingProps {
  rating: number | null;
  onChange: (rating: number | null) => void;
}

/**
 * Interactive star rating component (1-5 stars)
 */
function StarRating({ rating, onChange }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const handleClick = (starIndex: number) => {
    // If clicking the same star that's currently selected, clear the rating
    if (rating === starIndex) {
      onChange(null);
    } else {
      onChange(starIndex);
    }
  };

  const displayRating = hoverRating ?? rating ?? 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starIndex) => (
        <button
          key={starIndex}
          type="button"
          onClick={() => handleClick(starIndex)}
          onMouseEnter={() => setHoverRating(starIndex)}
          onMouseLeave={() => setHoverRating(null)}
          className="p-0.5 transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          aria-label={`Rate ${starIndex} star${starIndex > 1 ? 's' : ''}`}
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              starIndex <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground hover:text-yellow-400/50'
            }`}
          />
        </button>
      ))}
      {rating && (
        <span className="ml-2 text-sm text-muted-foreground">
          {rating}/5
        </span>
      )}
    </div>
  );
}

interface MetadataRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

/**
 * Single row displaying a metadata item with icon and value
 */
function MetadataRow({ icon, label, value }: MetadataRowProps) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="text-muted-foreground mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-0.5">
          {label}
        </div>
        <div className="text-sm text-foreground break-words">{value}</div>
      </div>
    </div>
  );
}

interface TagSelectorProps {
  projectId: string;
  projectTags: string[];
  availableTags: Tag[];
  onTagsChange: (tagIds: string[]) => void;
}

/**
 * Tag selector component with dropdown for assigning/removing tags
 */
function TagSelector({ projectId, projectTags, availableTags, onTagsChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggleTag = async (tagId: string) => {
    const newTags = projectTags.includes(tagId)
      ? projectTags.filter((t) => t !== tagId)
      : [...projectTags, tagId];

    // Update in database
    try {
      await db.projects.update(projectId, { tags: newTags });
      onTagsChange(newTags);
    } catch (error) {
      console.error('Failed to update project tags:', error);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    const newTags = projectTags.filter((t) => t !== tagId);
    try {
      await db.projects.update(projectId, { tags: newTags });
      onTagsChange(newTags);
    } catch (error) {
      console.error('Failed to remove tag:', error);
    }
  };

  // Get assigned tags objects
  const assignedTags = availableTags.filter((t) => projectTags.includes(t.id));
  const unassignedTags = availableTags.filter((t) => !projectTags.includes(t.id));

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-start gap-3">
        <span className="text-muted-foreground mt-1">
          <TagIcon className="w-4 h-4" />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
            Tags
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {assignedTags.length > 0 ? (
              assignedTags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  tag={tag}
                  size="md"
                  showRemove
                  onRemove={() => handleRemoveTag(tag.id)}
                />
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">No tags assigned</span>
            )}
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`
                inline-flex items-center gap-1 px-2 py-1 text-sm
                border border-dashed border-border rounded-full
                text-muted-foreground hover:text-foreground hover:border-foreground/50
                transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring
                ${availableTags.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              disabled={availableTags.length === 0}
              aria-label="Add tag"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && availableTags.length > 0 && (
        <div className="absolute left-7 top-full mt-2 z-10 min-w-[200px] max-w-[280px] bg-card border border-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto p-1">
            {unassignedTags.length > 0 && (
              <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                Available Tags
              </div>
            )}
            {unassignedTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => handleToggleTag(tag.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left hover:bg-secondary rounded-md transition-colors"
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="truncate">{tag.name}</span>
              </button>
            ))}
            {unassignedTags.length === 0 && assignedTags.length > 0 && (
              <div className="px-2 py-3 text-sm text-muted-foreground text-center">
                All tags assigned
              </div>
            )}
            {assignedTags.length > 0 && unassignedTags.length > 0 && (
              <div className="border-t border-border my-1" />
            )}
            {assignedTags.length > 0 && (
              <>
                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                  Assigned Tags
                </div>
                {assignedTags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleToggleTag(tag.id)}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-sm text-left hover:bg-secondary rounded-md transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="truncate">{tag.name}</span>
                    </span>
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Project detail modal component
 * Shows comprehensive metadata, plugins, samples, notes, rating, and favorite toggle
 */
export function ProjectDetail({ project, isOpen, onClose }: ProjectDetailProps) {
  const [notes, setNotes] = useState(project.notes);
  const [projectTags, setProjectTags] = useState(project.tags);
  const modalRef = useRef<HTMLDivElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  const toggleFavorite = useProjectStore((state) => state.toggleFavorite);
  const setRating = useProjectStore((state) => state.setRating);
  const updateProject = useProjectStore((state) => state.updateProject);
  const tags = useProjectStore((state) => state.tags);

  // Sync notes and tags with project when project changes
  useEffect(() => {
    setNotes(project.notes);
    setProjectTags(project.tags);
  }, [project.notes, project.tags, project.id]);

  // Handle tags change
  const handleTagsChange = useCallback(
    (newTags: string[]) => {
      setProjectTags(newTags);
      updateProject(project.id, { tags: newTags });
    },
    [project.id, updateProject]
  );

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Auto-save notes on blur
  const handleNotesBlur = useCallback(() => {
    if (notes !== project.notes) {
      updateProject(project.id, { notes });
    }
  }, [notes, project.notes, project.id, updateProject]);

  // Handle rating change
  const handleRatingChange = useCallback(
    (rating: number | null) => {
      setRating(project.id, rating);
    },
    [project.id, setRating]
  );

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(() => {
    toggleFavorite(project.id);
  }, [project.id, toggleFavorite]);

  if (!isOpen) {
    return null;
  }

  // Count plugins by name
  const pluginCounts = countItems(project.plugins);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="project-detail-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[90vh] bg-card border border-border rounded-lg shadow-xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-border bg-card/95">
          <div className="flex-1 min-w-0 pr-4">
            <h2
              id="project-detail-title"
              className="text-lg font-semibold text-foreground truncate"
            >
              {project.name}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {project.path}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Favorite button */}
            <button
              onClick={handleFavoriteToggle}
              className={`p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                project.favorite
                  ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                  : 'hover:bg-secondary text-muted-foreground hover:text-red-500'
              }`}
              aria-label={project.favorite ? 'Remove from favorites' : 'Add to favorites'}
              title={project.favorite ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-5 h-5 ${project.favorite ? 'fill-current' : ''}`}
              />
            </button>
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Rating */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Rating:</span>
            <StarRating rating={project.rating} onChange={handleRatingChange} />
          </div>

          {/* Tags */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <TagSelector
              projectId={project.id}
              projectTags={projectTags}
              availableTags={tags}
              onTagsChange={handleTagsChange}
            />
          </div>

          {/* Metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 border border-border rounded-lg p-4 bg-secondary/30">
            <MetadataRow
              icon={<Music className="w-4 h-4" />}
              label="BPM"
              value={project.bpm ?? 'Unknown'}
            />
            <MetadataRow
              icon={<Info className="w-4 h-4" />}
              label="Key"
              value={project.key ?? 'Unknown'}
            />
            <MetadataRow
              icon={<Clock className="w-4 h-4" />}
              label="Duration"
              value={formatDuration(project.duration)}
            />
            <MetadataRow
              icon={<HardDrive className="w-4 h-4" />}
              label="File Size"
              value={formatFileSize(project.fileSize)}
            />
            <MetadataRow
              icon={<Layers className="w-4 h-4" />}
              label="Tracks"
              value={
                <div className="space-y-0.5">
                  <div>{project.trackCount} total</div>
                  <div className="text-xs text-muted-foreground">
                    {project.audioTrackCount} audio, {project.midiTrackCount} MIDI, {project.returnTrackCount} return
                  </div>
                </div>
              }
            />
            <MetadataRow
              icon={<FolderOpen className="w-4 h-4" />}
              label="Ableton Version"
              value={project.abletonVersion ?? 'Unknown'}
            />
            <MetadataRow
              icon={<Calendar className="w-4 h-4" />}
              label="Created"
              value={formatDate(project.createdAt)}
            />
            <MetadataRow
              icon={<Calendar className="w-4 h-4" />}
              label="Modified"
              value={formatDate(project.modifiedAt)}
            />
          </div>

          {/* Plugins section */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <Plug className="w-4 h-4" />
              Plugins Used ({project.plugins.length})
            </h3>
            {pluginCounts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pluginCounts.map(({ name, count }) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary text-sm text-foreground rounded-md"
                  >
                    {name}
                    {count > 1 && (
                      <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                        {count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No plugins detected</p>
            )}
          </div>

          {/* Samples section */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground mb-3">
              <FileAudio className="w-4 h-4" />
              Samples Referenced ({project.samples.length})
            </h3>
            {project.samples.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pr-2">
                {project.samples.map((sample, index) => (
                  <div
                    key={`${sample}-${index}`}
                    className="text-xs text-muted-foreground font-mono truncate hover:text-foreground transition-colors"
                    title={sample}
                  >
                    {sample}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">No samples detected</p>
            )}
          </div>

          {/* Notes section */}
          <div className="border border-border rounded-lg p-4 bg-secondary/30">
            <h3 className="text-sm font-semibold text-foreground mb-3">Notes</h3>
            <textarea
              ref={notesRef}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes about this project..."
              className="w-full h-28 px-3 py-2 text-sm bg-background text-foreground border border-border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              aria-label="Project notes"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Notes are saved automatically when you click outside.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProjectDetail;
