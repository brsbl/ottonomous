import { FolderOpen, Tag, Plus, ChevronRight, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  // Placeholder data - will be connected to store later
  const folders: { id: string; name: string; projectCount: number }[] = [];
  const tags: { id: string; name: string; color: string; projectCount: number }[] = [];

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

            {folders.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3 px-2 bg-secondary/50 rounded-md">
                <p className="mb-2">No folders added yet.</p>
                <button className="text-primary hover:underline text-xs flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Add your first folder
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {folders.map((folder) => (
                  <li key={folder.id}>
                    <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary transition-colors text-sm group">
                      <span className="flex items-center gap-2 truncate">
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
                        <span className="truncate">{folder.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {folder.projectCount}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tags section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags
              </h2>
              <button
                className="p-1 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
                aria-label="Add tag"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {tags.length === 0 ? (
              <div className="text-sm text-muted-foreground py-3 px-2 bg-secondary/50 rounded-md">
                <p className="mb-2">No tags created yet.</p>
                <button className="text-primary hover:underline text-xs flex items-center gap-1">
                  <Plus className="w-3 h-3" />
                  Create your first tag
                </button>
              </div>
            ) : (
              <ul className="space-y-1">
                {tags.map((tag) => (
                  <li key={tag.id}>
                    <button className="w-full flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-secondary transition-colors text-sm">
                      <span className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span>{tag.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                        {tag.projectCount}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>0 projects</p>
            <p>0 folders</p>
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
