/**
 * Card component - displays a single kanban card with title, description preview,
 * and labels.
 */

import type { Card as CardType } from '../types';

interface CardProps {
  /** The card data to display */
  card: CardType;
  /** Callback when the card is clicked */
  onClick?: () => void;
}

/**
 * Card component that renders a task card with title, optional description preview,
 * and colored label chips.
 */
export function Card({ card, onClick }: CardProps) {
  /**
   * Truncate text to a maximum length, adding ellipsis if truncated.
   */
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  return (
    <div
      className="bg-white dark:bg-gray-700 rounded-md shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Card Title - truncated if too long */}
      <p className="text-sm text-gray-800 dark:text-gray-100 font-medium truncate" title={card.title}>
        {card.title}
      </p>

      {/* Optional Description Preview - first 100 characters */}
      {card.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {truncateText(card.description, 100)}
        </p>
      )}

      {/* Labels as colored chips/badges */}
      {card.labels && card.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {card.labels.map((label) => (
            <span
              key={label.id}
              className="inline-block px-2 py-0.5 text-xs rounded-full text-white"
              style={{ backgroundColor: label.color }}
              title={label.name}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Card;
