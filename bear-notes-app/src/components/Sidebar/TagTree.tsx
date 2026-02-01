/**
 * TagTree Component
 * Renders the hierarchical tag tree with collapsible nodes and note counts
 */

import { useMemo, useCallback } from 'react';
import { useTags } from '../../hooks/useTags';
import { useAppStore } from '../../store/appStore';
import { TagItem } from './TagItem';

/**
 * Props for TagTree component
 */
interface TagTreeProps {
  /** Currently selected tag path (null for all notes) */
  selectedTag: string | null;
  /** Callback when a tag is selected */
  onTagSelect: (tagPath: string | null) => void;
}

/**
 * Notes icon for the "All Notes" section
 */
function NotesIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

/**
 * Tag icon for the "Untagged" section
 */
function UntaggedIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z"
      />
    </svg>
  );
}

/**
 * Special section item (All Notes, Untagged)
 */
interface SpecialSectionProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

function SpecialSection({ icon, label, count, isSelected, onClick }: SpecialSectionProps) {
  return (
    <button
      type="button"
      className={`
        w-full flex items-center gap-2 px-4 py-2 text-left
        transition-colors duration-150 rounded-md mx-1
        ${isSelected ? 'theme-bg-tertiary' : 'hover:theme-bg-tertiary'}
        theme-text-primary
      `}
      style={{ width: 'calc(100% - 8px)' }}
      onClick={onClick}
      aria-pressed={isSelected}
    >
      <span className="theme-text-secondary">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-xs theme-text-secondary">{count}</span>
    </button>
  );
}

/**
 * TagTree displays:
 * - "All Notes" section showing total note count
 * - "Untagged" section showing notes without tags
 * - Pinned tags at the top
 * - Hierarchical tag tree with expand/collapse
 * - Note count badges on each tag
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const [selectedTag, setSelectedTag] = useState<string | null>(null);
 *
 *   return (
 *     <aside>
 *       <TagTree
 *         selectedTag={selectedTag}
 *         onTagSelect={setSelectedTag}
 *       />
 *     </aside>
 *   );
 * }
 * ```
 */
export function TagTree({ selectedTag, onTagSelect }: TagTreeProps) {
  const { tagTree } = useTags();
  const notes = useAppStore((state) => state.notes);

  // Count untagged notes
  const untaggedCount = useMemo(() => {
    return notes.filter((note) => note.tags.length === 0).length;
  }, [notes]);

  // Separate pinned and unpinned tags, then sort each group
  const { pinnedTags, unpinnedTags } = useMemo(() => {
    const pinned: typeof tagTree = [];
    const unpinned: typeof tagTree = [];

    for (const node of tagTree) {
      if (node.isPinned) {
        pinned.push(node);
      } else {
        unpinned.push(node);
      }
    }

    // Sort each group alphabetically by name
    pinned.sort((a, b) => a.name.localeCompare(b.name));
    unpinned.sort((a, b) => a.name.localeCompare(b.name));

    return { pinnedTags: pinned, unpinnedTags: unpinned };
  }, [tagTree]);

  // Handle "All Notes" click
  const handleAllNotesClick = useCallback(() => {
    onTagSelect(null);
  }, [onTagSelect]);

  // Handle "Untagged" click
  const handleUntaggedClick = useCallback(() => {
    onTagSelect('__untagged__');
  }, [onTagSelect]);

  // Handle tag selection
  const handleTagSelect = useCallback(
    (tagPath: string) => {
      onTagSelect(tagPath);
    },
    [onTagSelect]
  );

  // Handle pin toggle (placeholder - would connect to store action)
  const handleTogglePin = useCallback((tagPath: string, isPinned: boolean) => {
    // TODO: Implement tag pinning in store
    // Will need to add pinTag/unpinTag actions to appStore
    console.debug('Pin toggle:', tagPath, isPinned);
  }, []);

  return (
    <nav className="flex flex-col h-full overflow-hidden" aria-label="Tags navigation">
      {/* Special sections */}
      <div className="flex-shrink-0 py-2">
        <SpecialSection
          icon={<NotesIcon />}
          label="All Notes"
          count={notes.length}
          isSelected={selectedTag === null}
          onClick={handleAllNotesClick}
        />
        <SpecialSection
          icon={<UntaggedIcon />}
          label="Untagged"
          count={untaggedCount}
          isSelected={selectedTag === '__untagged__'}
          onClick={handleUntaggedClick}
        />
      </div>

      {/* Divider */}
      <div className="mx-4 border-t theme-bg-tertiary" style={{ borderColor: 'var(--bg-tertiary)' }} />

      {/* Tag tree */}
      <div className="flex-1 overflow-y-auto py-2">
        {/* Pinned tags section */}
        {pinnedTags.length > 0 && (
          <>
            <div className="px-4 py-1">
              <span className="text-xs font-medium uppercase tracking-wider theme-text-secondary">
                Pinned
              </span>
            </div>
            <ul role="tree" className="list-none p-0 m-0" aria-label="Pinned tags">
              {pinnedTags.map((node) => (
                <TagItem
                  key={node.fullPath}
                  node={node}
                  depth={0}
                  selectedTag={selectedTag}
                  onTagSelect={handleTagSelect}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </ul>
            <div className="h-2" />
          </>
        )}

        {/* All tags section */}
        {unpinnedTags.length > 0 && (
          <>
            <div className="px-4 py-1">
              <span className="text-xs font-medium uppercase tracking-wider theme-text-secondary">
                Tags
              </span>
            </div>
            <ul role="tree" className="list-none p-0 m-0" aria-label="All tags">
              {unpinnedTags.map((node) => (
                <TagItem
                  key={node.fullPath}
                  node={node}
                  depth={0}
                  selectedTag={selectedTag}
                  onTagSelect={handleTagSelect}
                  onTogglePin={handleTogglePin}
                />
              ))}
            </ul>
          </>
        )}

        {/* Empty state */}
        {pinnedTags.length === 0 && unpinnedTags.length === 0 && (
          <div className="px-4 py-8 text-center">
            <p className="text-sm theme-text-secondary">
              No tags yet. Add #tags to your notes to organize them.
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}
