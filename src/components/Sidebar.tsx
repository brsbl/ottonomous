import { useState } from 'react';
import { FolderOpen, Tag as TagIcon, Plus, ChevronRight, X, Edit2 } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { TagBadge } from './TagBadge';
import { TagManager } from './TagManager';
import type { Tag } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);

  // Connect to store
  const folders = useProjectStore((state) => state.folders);
  const tags = useProjectStore((state) => state.tags);
  const projects = useProjectStore((state) => state.projects);
  const filters = useProjectStore((state) => state.filters);
  const updateFilters = useProjectStore((state) => state.updateFilters);

  // Calculate tag counts from projects
  const tagCounts = tags.map((tag) => ({
    ...tag,
    projectCount: projects.filter((p) => p.tags.includes(tag.id)).length,
  }));

  // Calculate folder project counts
  const folderCounts = folders.map((folder) => ({
    ...folder,
    projectCount: projects.filter((p) => p.path.startsWith(folder.path)).length,
  }));

  // Handle tag click for filtering
  const handleTagClick = (tagId: string) => {
    const currentTagIds = filters.tagIds;
    if (currentTagIds.includes(tagId)) {
      // Remove tag from filter
      updateFilters({ tagIds: currentTagIds.filter((id) => id !== tagId) });
    } else {
      // Add tag to filter
      updateFilters({ tagIds: [...currentTagIds, tagId] });
    }
  };

  // Handle folder click for filtering
  const handleFolderClick = (folderId: string) => {
    const currentFolderIds = filters.folderIds;
    if (currentFolderIds.includes(folderId)) {
      // Remove folder from filter
      updateFilters({ folderIds: currentFolderIds.filter((id) => id !== folderId) });
    } else {
      // Add folder to filter
      updateFilters({ folderIds: [...currentFolderIds, folderId] });
    }
  };

  // Open tag manager for creating new tag
  const handleCreateTag = () => {
    setEditingTag(null);
    setIsTagManagerOpen(true);
  };

  // Open tag manager for editing existing tag
  const handleEditTag = (tag: Tag, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTag(tag);
    setIsTagManagerOpen(true);
  };

  // Close tag manager
  const handleCloseTagManager = () => {
    setIsTagManagerOpen(false);
    setEditingTag(null);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-50
          w-64 bg-background border-r border-border
          transform transition-transform duration-200 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          flex flex-col h-full
        `}
      >
        {/* Mobile close button */}
        <div className="flex items-center justify-between p-4 border-b border-border md:hidden">
          <span className="font-semibold">Menu</span>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-md transition-colors"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Folders section */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Folders
              </h2>
              <button
                className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Add folder"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {folderCounts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3 px-2 bg-secondary/50 rounded-md">
                <p className="mb-2">No folders added yet.</p>
                <button className="text-primary hover:underline text-xs flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Add your first folder
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {folderCounts.map((folder) => {
                  const isActive = filters.folderIds.includes(folder.id);
                  return (
                    <li key={folder.id}>
                      <button
                        onClick={() => handleFolderClick(folder.id)}
                        className={`
                          w-full flex items-center justify-between px-2 py-1.5 rounded-md
                          hover:bg-secondary transition-colors text-sm group
                          ${isActive ? 'bg-primary/10 text-primary' : ''}
                        `}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <ChevronRight
                            className={`w-4 h-4 transition-colors ${
                              isActive
                                ? 'text-primary'
                                : 'text-muted-foreground group-hover:text-foreground'
                            }`}
                          />
                          <span className="truncate">{folder.name}</span>
                        </span>
                        <span
                          className={`
                            text-xs px-1.5 py-0.5 rounded
                            ${isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground bg-secondary'}
                          `}
                        >
                          {folder.projectCount}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Tags section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <TagIcon className="w-4 h-4" />
                Tags
              </h2>
              <button
                onClick={handleCreateTag}
                className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Add tag"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {tagCounts.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3 px-2 bg-secondary/50 rounded-md">
                <p className="mb-2">No tags created yet.</p>
                <button
                  onClick={handleCreateTag}
                  className="text-primary hover:underline text-xs flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Create your first tag
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {tagCounts.map((tag) => {
                  const isActive = filters.tagIds.includes(tag.id);
                  return (
                    <li key={tag.id}>
                      <div
                        className={`
                          w-full flex items-center justify-between px-2 py-1.5 rounded-md
                          hover:bg-secondary transition-colors text-sm group cursor-pointer
                          ${isActive ? 'bg-primary/10' : ''}
                        `}
                        onClick={() => handleTagClick(tag.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleTagClick(tag.id);
                          }
                        }}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className={`
                              w-3 h-3 rounded-full flex-shrink-0
                              ${isActive ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''}
                            `}
                            style={{ backgroundColor: tag.color }}
                          />
                          <span className="truncate">{tag.name}</span>
                        </span>
                        <span className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleEditTag(tag, e)}
                            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-secondary/80 rounded transition-opacity"
                            aria-label={`Edit ${tag.name} tag`}
                          >
                            <Edit2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <span
                            className={`
                              text-xs px-1.5 py-0.5 rounded
                              ${isActive ? 'bg-primary/20 text-primary' : 'text-muted-foreground bg-secondary'}
                            `}
                          >
                            {tag.projectCount}
                          </span>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* Active filter indicator */}
            {filters.tagIds.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Active filters</span>
                  <button
                    onClick={() => updateFilters({ tagIds: [] })}
                    className="text-primary hover:underline"
                  >
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {filters.tagIds.map((tagId) => {
                    const tag = tags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <TagBadge
                        key={tagId}
                        tag={tag}
                        size="sm"
                        showRemove
                        onRemove={() => handleTagClick(tagId)}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
            <p>{folders.length} folder{folders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </aside>

      {/* Tag Manager Modal */}
      <TagManager
        isOpen={isTagManagerOpen}
        onClose={handleCloseTagManager}
        editTag={editingTag}
      />
    </>
  );
}

export default Sidebar;
