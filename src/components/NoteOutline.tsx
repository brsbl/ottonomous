/**
 * NoteOutline component - Displays a collapsible outline/table of contents
 * parsed from the current note's markdown headings.
 * Features:
 * - Nested tree structure (h2 under h1, h3 under h2, etc.)
 * - Click to scroll to section
 * - Collapsible sections with expand/collapse
 * - Real-time updates as content changes
 */

import { useState, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronRight, List, Hash } from 'lucide-react';
import { parseOutline, type HeadingTreeNode } from '../lib/parseOutline';
import { cn } from '../lib/utils';

interface NoteOutlineProps {
  /** The markdown content to parse for headings */
  content: string;
  /** Optional callback when a heading is clicked (for scroll handling) */
  onHeadingClick?: (headingId: string) => void;
  /** Optional additional CSS classes */
  className?: string;
  /** Whether the panel starts expanded (default: true) */
  defaultExpanded?: boolean;
}

/**
 * Props for individual outline items
 */
interface OutlineItemProps {
  node: HeadingTreeNode;
  expandedSections: Set<string>;
  onToggleSection: (id: string) => void;
  onHeadingClick?: (headingId: string) => void;
  level?: number;
}

/**
 * Recursive component for rendering a single outline item with its children.
 */
function OutlineItem({
  node,
  expandedSections,
  onToggleSection,
  onHeadingClick,
  level = 0,
}: OutlineItemProps) {
  const hasChildren = node.children.length > 0;
  const isExpanded = expandedSections.has(node.id);

  // Calculate indentation based on nesting level
  const paddingLeft = level * 12 + 8;

  /**
   * Handle click on the heading text to scroll to section.
   */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHeadingClick?.(node.id);
  };

  /**
   * Handle expand/collapse toggle.
   */
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggleSection(node.id);
    }
  };

  /**
   * Handle keyboard navigation.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onHeadingClick?.(node.id);
    }
  };

  return (
    <div>
      <div
        className={cn(
          'flex items-center gap-1 py-1 px-1 rounded-md',
          'hover:bg-muted/50 transition-colors cursor-pointer',
          'group'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
      >
        {/* Expand/collapse button or spacer */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-0.5 hover:bg-muted rounded shrink-0"
            aria-label={isExpanded ? 'Collapse section' : 'Expand section'}
            aria-expanded={isExpanded}
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <span className="w-4.5 shrink-0" />
        )}

        {/* Heading level indicator */}
        <span
          className={cn(
            'shrink-0 text-[10px] font-medium rounded px-1 py-0.5',
            'text-muted-foreground bg-muted/50',
            node.level === 1 && 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
            node.level === 2 && 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
          )}
        >
          H{node.level}
        </span>

        {/* Heading text */}
        <button
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className={cn(
            'flex-1 text-left text-sm truncate',
            'text-foreground/80 hover:text-foreground',
            'transition-colors focus:outline-none focus:text-primary',
            node.level === 1 && 'font-medium',
            node.level === 2 && 'font-normal',
            node.level >= 3 && 'text-muted-foreground text-xs'
          )}
          title={node.text}
        >
          {node.text}
        </button>
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <OutlineItem
              key={child.id}
              node={child}
              expandedSections={expandedSections}
              onToggleSection={onToggleSection}
              onHeadingClick={onHeadingClick}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * NoteOutline component - A collapsible panel showing the document outline.
 * Parses markdown headings and displays them in a hierarchical tree structure.
 */
export function NoteOutline({
  content,
  onHeadingClick,
  className = '',
  defaultExpanded = true,
}: NoteOutlineProps) {
  // Panel expansion state
  const [isPanelExpanded, setIsPanelExpanded] = useState(defaultExpanded);

  // Track which sections are expanded (all expanded by default)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Parse the content into a tree structure
  const outlineTree = useMemo(() => parseOutline(content), [content]);

  // Flatten headings for ID collection
  const allHeadingIds = useMemo(() => {
    const ids: string[] = [];
    const collectIds = (nodes: HeadingTreeNode[]) => {
      for (const node of nodes) {
        ids.push(node.id);
        collectIds(node.children);
      }
    };
    collectIds(outlineTree);
    return ids;
  }, [outlineTree]);

  // Initialize all sections as expanded when content first loads
  useMemo(() => {
    if (allHeadingIds.length > 0 && !hasInitialized) {
      setExpandedSections(new Set(allHeadingIds));
      setHasInitialized(true);
    }
  }, [allHeadingIds, hasInitialized]);

  /**
   * Toggle a section's expanded state.
   */
  const handleToggleSection = useCallback((id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  /**
   * Toggle the entire panel's expanded state.
   */
  const handlePanelToggle = () => {
    setIsPanelExpanded((prev) => !prev);
  };

  /**
   * Expand all sections.
   */
  const handleExpandAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(new Set(allHeadingIds));
  };

  /**
   * Collapse all sections.
   */
  const handleCollapseAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSections(new Set());
  };

  const headingCount = allHeadingIds.length;

  return (
    <div className={cn('', className)}>
      {/* Panel header with toggle */}
      <button
        onClick={handlePanelToggle}
        className={cn(
          'w-full flex items-center justify-between p-3',
          'hover:bg-muted/50 transition-colors',
          'rounded-lg'
        )}
        aria-expanded={isPanelExpanded}
        aria-controls="outline-content"
      >
        <div className="flex items-center gap-2">
          {isPanelExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <List className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Outline</span>
        </div>

        {/* Count badge */}
        <span
          className={cn(
            'inline-flex items-center justify-center',
            'min-w-[1.5rem] h-6 px-2',
            'text-xs font-medium rounded-full',
            headingCount > 0
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {headingCount}
        </span>
      </button>

      {/* Panel content */}
      {isPanelExpanded && (
        <div id="outline-content" className="px-3 pb-3">
          {headingCount === 0 ? (
            <div className="py-6 text-center">
              <Hash className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">
                No headings found
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Use # for H1, ## for H2, etc.
              </p>
            </div>
          ) : (
            <>
              {/* Expand/Collapse all buttons */}
              <div className="flex items-center justify-end gap-2 mb-2 px-1">
                <button
                  onClick={handleExpandAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Expand all sections"
                >
                  Expand all
                </button>
                <span className="text-muted-foreground/50">|</span>
                <button
                  onClick={handleCollapseAll}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Collapse all sections"
                >
                  Collapse all
                </button>
              </div>

              {/* Outline tree */}
              <div className="space-y-0.5">
                {outlineTree.map((node) => (
                  <OutlineItem
                    key={node.id}
                    node={node}
                    expandedSections={expandedSections}
                    onToggleSection={handleToggleSection}
                    onHeadingClick={onHeadingClick}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default NoteOutline;
