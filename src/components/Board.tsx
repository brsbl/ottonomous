/**
 * Board component - main container for the kanban board.
 * Displays columns in a horizontal flex layout with overflow scrolling.
 */

import { useBoardStore } from '../store/boardStore';

/**
 * Board layout component that renders the board header and columns container.
 * Connects to Zustand store for board data.
 */
export function Board() {
  const board = useBoardStore((state) => state.board);
  const cards = useBoardStore((state) => state.cards);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Board Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">{board.title}</h1>
        {board.description && (
          <p className="text-sm text-gray-500 mt-1">{board.description}</p>
        )}
      </header>

      {/* Columns Container - horizontal scroll */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <div className="flex gap-4 h-full min-w-max">
          {board.columns.map((column) => (
            <div
              key={column.id}
              className="flex flex-col w-72 bg-gray-100 rounded-lg shadow-sm"
            >
              {/* Column Header */}
              <div className="px-3 py-2 bg-gray-200 rounded-t-lg">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-gray-700">{column.title}</h2>
                  <span className="text-xs text-gray-500 bg-gray-300 px-2 py-0.5 rounded-full">
                    {column.cardIds.length}
                  </span>
                </div>
              </div>

              {/* Column Cards Area */}
              <div className="flex-1 p-2 overflow-y-auto min-h-[200px]">
                {column.cardIds.map((cardId) => {
                  const card = cards[cardId];
                  if (!card) return null;
                  return (
                    <div
                      key={card.id}
                      className="bg-white p-3 rounded shadow-sm mb-2 cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <p className="text-sm text-gray-800">{card.title}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Board;
