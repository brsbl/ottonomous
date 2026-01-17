import { X } from 'lucide-react';
import type { Tag } from '../types';

interface TagBadgeProps {
  /** The tag to display */
  tag: Tag;
  /** Optional click handler for the badge */
  onClick?: () => void;
  /** Whether to show the remove button */
  showRemove?: boolean;
  /** Handler for remove button click */
  onRemove?: () => void;
  /** Size variant */
  size?: 'sm' | 'md';
}

/**
 * Tag color presets - these map to Tailwind-compatible colors
 * Used for the color picker in TagManager
 */
export const TAG_COLORS = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
} as const;

export type TagColorName = keyof typeof TAG_COLORS;

/**
 * Gets a contrasting text color (black or white) for a given background color
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');

  // Parse RGB values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return black for light backgrounds, white for dark
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Small badge component for displaying a tag with its color
 * Can optionally include an X button for removal
 */
export function TagBadge({
  tag,
  onClick,
  showRemove = false,
  onRemove,
  size = 'sm',
}: TagBadgeProps) {
  const textColor = getContrastColor(tag.color);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        transition-opacity
        ${sizeClasses[size]}
        ${onClick ? 'cursor-pointer hover:opacity-80' : ''}
      `}
      style={{
        backgroundColor: tag.color,
        color: textColor,
      }}
      type={onClick ? 'button' : undefined}
    >
      <span className="truncate max-w-[120px]">{tag.name}</span>
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={handleRemoveClick}
          className="ml-0.5 p-0.5 rounded-full hover:bg-black/20 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50"
          aria-label={`Remove ${tag.name} tag`}
        >
          <X className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        </button>
      )}
    </Component>
  );
}

export default TagBadge;
