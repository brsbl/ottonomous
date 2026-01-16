/**
 * EmptyBoardState component - displays a helpful empty state when the board has no cards.
 * Shows a friendly message, illustration, quick-start suggestions, and keyboard shortcut hint.
 */

interface EmptyBoardStateProps {
  /** Callback to open the keyboard shortcuts help */
  onShowKeyboardShortcuts?: () => void;
  /** Whether this is the first time the user has visited */
  isFirstTimeUser?: boolean;
  /** Callback to dismiss the first-time user hint */
  onDismissFirstTimeHint?: () => void;
}

export function EmptyBoardState({
  onShowKeyboardShortcuts,
  isFirstTimeUser = false,
  onDismissFirstTimeHint,
}: EmptyBoardStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 animate-card-enter">
      {/* Illustration - Kanban board icon */}
      <div className="w-24 h-24 mb-6 text-gray-300 dark:text-gray-600">
        <svg
          viewBox="0 0 96 96"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Board background */}
          <rect
            x="8"
            y="12"
            width="80"
            height="72"
            rx="8"
            fill="currentColor"
            fillOpacity="0.3"
          />
          {/* Column 1 */}
          <rect
            x="14"
            y="24"
            width="20"
            height="54"
            rx="4"
            fill="currentColor"
            fillOpacity="0.5"
          />
          {/* Column 2 */}
          <rect
            x="38"
            y="24"
            width="20"
            height="54"
            rx="4"
            fill="currentColor"
            fillOpacity="0.5"
          />
          {/* Column 3 */}
          <rect
            x="62"
            y="24"
            width="20"
            height="54"
            rx="4"
            fill="currentColor"
            fillOpacity="0.5"
          />
          {/* Plus icon in center */}
          <circle
            cx="48"
            cy="48"
            r="16"
            fill="white"
            className="dark:fill-gray-800"
          />
          <path
            d="M48 40V56M40 48H56"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Main message */}
      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        Your board is empty
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
        Get started by adding your first card to one of the columns. Click the "Add card" button at the bottom of any column.
      </p>

      {/* Quick-start suggestions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mb-6">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
          Quick Start Tips
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-blue-400 dark:text-blue-500 mt-0.5">1.</span>
            <span>Click "Add card" in any column to create a task</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 dark:text-blue-500 mt-0.5">2.</span>
            <span>Drag cards between columns to track progress</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400 dark:text-blue-500 mt-0.5">3.</span>
            <span>Click on a card to add details, labels, and due dates</span>
          </li>
        </ul>
      </div>

      {/* Keyboard shortcut hint for first-time users */}
      {isFirstTimeUser && (
        <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-w-md animate-card-enter">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                ?
              </kbd>
              <span>Press to view keyboard shortcuts</span>
            </div>
            <button
              onClick={onDismissFirstTimeHint}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Dismiss"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Show shortcuts link (always visible) */}
      {onShowKeyboardShortcuts && (
        <button
          onClick={onShowKeyboardShortcuts}
          className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          View keyboard shortcuts
        </button>
      )}
    </div>
  );
}

export default EmptyBoardState;
