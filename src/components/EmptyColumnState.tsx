/**
 * EmptyColumnState component - displays a helpful empty state when a column has no cards.
 * Shows a simple illustration and helpful message.
 */

interface EmptyColumnStateProps {
  /** The name of the column */
  columnName: string;
  /** Callback to start adding a card */
  onAddCard?: () => void;
}

export function EmptyColumnState({ columnName, onAddCard }: EmptyColumnStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-card-enter">
      {/* Empty state illustration - simple card stack icon */}
      <div className="w-12 h-12 mb-3 text-gray-300 dark:text-gray-600">
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Stacked cards */}
          <rect
            x="8"
            y="14"
            width="32"
            height="24"
            rx="4"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <rect
            x="4"
            y="10"
            width="32"
            height="24"
            rx="4"
            fill="currentColor"
            fillOpacity="0.5"
          />
          {/* Plus icon */}
          <circle
            cx="20"
            cy="22"
            r="8"
            fill="white"
            className="dark:fill-gray-800"
          />
          <path
            d="M20 18V26M16 22H24"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Message */}
      <p className="text-sm text-gray-400 dark:text-gray-500 mb-2">
        No cards in {columnName}
      </p>

      {/* Add card button */}
      {onAddCard && (
        <button
          onClick={onAddCard}
          className="text-xs text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 font-medium transition-colors"
        >
          + Add your first card
        </button>
      )}
    </div>
  );
}

export default EmptyColumnState;
