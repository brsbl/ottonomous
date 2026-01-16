/**
 * Board component - main container for the kanban board.
 * Displays columns in a horizontal flex layout with overflow scrolling.
 */

import { useRef, useState, useEffect } from 'react';
import { useBoardStore } from '../store/boardStore';
import { useThemeStore, initializeTheme } from '../store/themeStore';
import { Column } from './Column';
import { exportBoard, importBoard } from '../utils/exportImport';

/**
 * Board layout component that renders the board header and columns container.
 * Connects to Zustand store for board data.
 */
export function Board() {
  const board = useBoardStore((state) => state.board);
  const cards = useBoardStore((state) => state.cards);
  const addColumn = useBoardStore((state) => state.addColumn);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  // Initialize theme on mount
  useEffect(() => {
    initializeTheme();
  }, []);

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const newColumnInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportData, setPendingImportData] = useState<{
    board: typeof board;
    cards: typeof cards;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Get cards for a specific column by resolving card IDs to Card objects.
   */
  const getColumnCards = (cardIds: string[]) => {
    return cardIds
      .map((id) => cards[id])
      .filter((card) => card !== undefined);
  };

  /**
   * Handle export button click - downloads board as JSON
   */
  const handleExport = () => {
    exportBoard(board, cards);
  };

  /**
   * Handle import button click - opens file picker
   */
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Handle file selection for import
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Reset the input so the same file can be selected again
    event.target.value = '';

    try {
      setImportError(null);
      const data = await importBoard(file);
      setPendingImportData({ board: data.board, cards: data.cards });
      setShowConfirmDialog(true);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'Failed to import file');
    }
  };

  /**
   * Confirm and apply the imported board data
   */
  const handleConfirmImport = () => {
    if (pendingImportData) {
      // Update the store with imported data
      useBoardStore.setState({
        board: pendingImportData.board,
        cards: pendingImportData.cards,
      });
    }
    setShowConfirmDialog(false);
    setPendingImportData(null);
  };

  /**
   * Cancel the import operation
   */
  const handleCancelImport = () => {
    setShowConfirmDialog(false);
    setPendingImportData(null);
  };

  /**
   * Handle adding a new column
   */
  const handleAddColumn = () => {
    const trimmedTitle = newColumnTitle.trim();
    if (trimmedTitle) {
      addColumn(trimmedTitle);
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  /**
   * Handle keyboard events for new column input
   */
  const handleNewColumnKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddColumn();
    } else if (e.key === 'Escape') {
      setNewColumnTitle('');
      setIsAddingColumn(false);
    }
  };

  /**
   * Cancel adding a new column
   */
  const handleCancelAddColumn = () => {
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  // Focus new column input when adding starts
  useEffect(() => {
    if (isAddingColumn && newColumnInputRef.current) {
      newColumnInputRef.current.focus();
    }
  }, [isAddingColumn]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col transition-colors">
      {/* Board Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{board.title}</h1>
            {board.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{board.description}</p>
            )}
          </div>

          {/* Export/Import/Theme Toolbar */}
          <div className="flex items-center gap-2">
            {/* Dark Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-10 h-10 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
              aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  />
                </svg>
              ) : (
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              )}
            </button>

            <button
              onClick={handleExport}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              title="Export board as JSON"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>

            <button
              onClick={handleImportClick}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
              title="Import board from JSON"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              Import
            </button>

            {/* Hidden file input for import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Import error message */}
        {importError && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-md">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-400 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{importError}</span>
              <button
                onClick={() => setImportError(null)}
                className="ml-auto text-red-400 hover:text-red-600 dark:hover:text-red-300"
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
      </header>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Import Board?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This will replace your current board and all its cards with the imported data.
              This action cannot be undone.
            </p>
            {pendingImportData && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded p-3 mb-4 text-sm">
                <p className="font-medium text-gray-700 dark:text-gray-200">
                  Board: {pendingImportData.board.title}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {pendingImportData.board.columns.length} columns,{' '}
                  {Object.keys(pendingImportData.cards).length} cards
                </p>
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancelImport}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmImport}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Columns Container - horizontal scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {board.columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              cards={getColumnCards(column.cardIds)}
            />
          ))}

          {/* Add Column Button/Form */}
          <div className="flex-shrink-0 w-[300px]">
            {isAddingColumn ? (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow p-3">
                <input
                  ref={newColumnInputRef}
                  type="text"
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  onKeyDown={handleNewColumnKeyDown}
                  placeholder="Enter column title..."
                  className="w-full px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={handleAddColumn}
                    className="flex-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800"
                  >
                    Add Column
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelAddColumn}
                    className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:focus:ring-offset-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingColumn(true)}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Column
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Board;
