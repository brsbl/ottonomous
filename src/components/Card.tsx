/**
 * Card component - displays a single kanban card with title, description preview,
 * labels, due date indicator, and priority indicator.
 */

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Card as CardType, Priority } from '../types';

/**
 * Get the left border color class based on priority level
 * Colors: green=low, yellow=medium, orange=high, red=urgent
 */
function getPriorityBorderClass(priority: Priority | undefined): string {
  switch (priority) {
    case 'low':
      return 'border-l-4 border-l-green-500';
    case 'medium':
      return 'border-l-4 border-l-yellow-500';
    case 'high':
      return 'border-l-4 border-l-orange-500';
    case 'urgent':
      return 'border-l-4 border-l-red-500';
    default:
      return '';
  }
}

interface CardProps {
  /** The card data to display */
  card: CardType;
  /** Callback when the card is clicked */
  onClick?: () => void;
  /** Whether to show just the overlay version (no drag) */
  isOverlay?: boolean;
  /** Whether this card is currently selected via keyboard navigation */
  isSelected?: boolean;
}

/**
 * Get due date status and styling information
 */
function getDueDateStatus(dueDate: string): {
  isOverdue: boolean;
  isDueSoon: boolean;
  formattedDate: string;
} {
  const due = new Date(dueDate + 'T23:59:59'); // End of the due day
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const isOverdue = diffMs < 0;
  const isDueSoon = !isOverdue && diffHours <= 24;

  // Format date as "Jan 20" style
  const dateObj = new Date(dueDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return { isOverdue, isDueSoon, formattedDate };
}

/**
 * Card component that renders a task card with title, optional description preview,
 * colored label chips, and due date indicator. Supports drag-and-drop via @dnd-kit/sortable.
 */
export function Card({ card, onClick, isOverlay = false, isSelected = false }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /**
   * Truncate text to a maximum length, adding ellipsis if truncated.
   */
  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  // Calculate due date status if present
  const dueDateStatus = card.dueDate ? getDueDateStatus(card.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`bg-white dark:bg-gray-700 rounded-md shadow-sm p-3 cursor-pointer
        transition-all duration-200 ease-in-out
        hover:shadow-lg hover:-translate-y-0.5
        motion-reduce:transition-none motion-reduce:hover:transform-none
        ${isDragging ? 'opacity-50 scale-105' : 'animate-card-enter'}
        ${isOverlay ? 'shadow-xl ring-2 ring-blue-500 scale-105' : ''}
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-gray-100 dark:ring-offset-gray-800 shadow-lg' : ''}
        ${getPriorityBorderClass(card.priority)}`}
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

      {/* Due Date indicator */}
      {dueDateStatus && (
        <div className="mt-2 flex items-center gap-1">
          <svg
            className={`w-3.5 h-3.5 ${
              dueDateStatus.isOverdue
                ? 'text-red-500 dark:text-red-400'
                : dueDateStatus.isDueSoon
                ? 'text-orange-500 dark:text-orange-400'
                : 'text-gray-400 dark:text-gray-500'
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span
            className={`text-xs font-medium ${
              dueDateStatus.isOverdue
                ? 'text-red-600 dark:text-red-400'
                : dueDateStatus.isDueSoon
                ? 'text-orange-600 dark:text-orange-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
            title={
              dueDateStatus.isOverdue
                ? 'Overdue'
                : dueDateStatus.isDueSoon
                ? 'Due soon'
                : `Due ${dueDateStatus.formattedDate}`
            }
          >
            {dueDateStatus.isOverdue
              ? `Overdue: ${dueDateStatus.formattedDate}`
              : dueDateStatus.isDueSoon
              ? `Due soon: ${dueDateStatus.formattedDate}`
              : `Due ${dueDateStatus.formattedDate}`}
          </span>
        </div>
      )}
    </div>
  );
}

export default Card;
