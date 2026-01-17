import { useProjectStore } from '../store/projectStore';

/**
 * BulkActions toolbar - appears when items are selected
 * Provides batch operations for multi-select functionality
 */
export function BulkActions() {
  const {
    selectedProjectIds,
    projects,
    clearSelection,
    favoriteAll,
    unfavoriteAll,
  } = useProjectStore();

  const selectionCount = selectedProjectIds.length;
  const hasSelection = selectionCount > 0;

  // Calculate how many of the selected projects are already favorites
  const selectedProjects = projects.filter((p) =>
    selectedProjectIds.includes(p.id)
  );
  const favoriteCount = selectedProjects.filter((p) => p.favorite).length;
  const allFavorited = favoriteCount === selectionCount;
  const noneFavorited = favoriteCount === 0;

  const handleFavoriteAll = () => {
    favoriteAll(selectedProjectIds);
  };

  const handleUnfavoriteAll = () => {
    unfavoriteAll(selectedProjectIds);
  };

  const handleClearSelection = () => {
    clearSelection();
  };

  return (
    <div
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        transition-all duration-300 ease-out
        ${hasSelection
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4 pointer-events-none'
        }
      `}
    >
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl backdrop-blur-sm">
        {/* Selection count */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-600">
          <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full text-xs font-bold text-white">
            {selectionCount}
          </div>
          <span className="text-sm text-gray-300 whitespace-nowrap">
            {selectionCount === 1 ? 'project selected' : 'projects selected'}
          </span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Favorite All */}
          <button
            onClick={handleFavoriteAll}
            disabled={allFavorited}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
              transition-colors duration-150
              ${allFavorited
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
              }
            `}
            title={allFavorited ? 'All selected projects are already favorites' : 'Add all selected to favorites'}
          >
            <svg
              className="w-4 h-4"
              fill="currentColor"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={0}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span className="hidden sm:inline">Favorite All</span>
          </button>

          {/* Unfavorite All */}
          <button
            onClick={handleUnfavoriteAll}
            disabled={noneFavorited}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
              transition-colors duration-150
              ${noneFavorited
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-600/50 text-gray-300 hover:bg-gray-600'
              }
            `}
            title={noneFavorited ? 'None of the selected projects are favorites' : 'Remove all selected from favorites'}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
            <span className="hidden sm:inline">Unfavorite All</span>
          </button>

          {/* Divider */}
          <div className="w-px h-6 bg-gray-600 mx-1" />

          {/* Clear Selection */}
          <button
            onClick={handleClearSelection}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors duration-150"
            title="Clear selection"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default BulkActions;
