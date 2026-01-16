/**
 * CardModal component - modal overlay for viewing and editing card details.
 * Includes editable title, description, placeholder sections for labels/priority/due date,
 * save and delete buttons with confirmation.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { Card, Priority, Label } from '../types';
import { useBoardStore } from '../store/boardStore';

/**
 * Priority options with display labels and colors for the button group
 */
const PRIORITY_OPTIONS: { value: Priority | undefined; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { value: undefined, label: 'None', color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-600', borderColor: 'border-gray-300 dark:border-gray-500' },
  { value: 'low', label: 'Low', color: 'text-green-700 dark:text-green-300', bgColor: 'bg-green-100 dark:bg-green-900/40', borderColor: 'border-green-400 dark:border-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-700 dark:text-yellow-300', bgColor: 'bg-yellow-100 dark:bg-yellow-900/40', borderColor: 'border-yellow-400 dark:border-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-700 dark:text-orange-300', bgColor: 'bg-orange-100 dark:bg-orange-900/40', borderColor: 'border-orange-400 dark:border-orange-600' },
  { value: 'urgent', label: 'Urgent', color: 'text-red-700 dark:text-red-300', bgColor: 'bg-red-100 dark:bg-red-900/40', borderColor: 'border-red-400 dark:border-red-600' },
];

interface CardModalProps {
  /** The card to view/edit */
  card: Card;
  /** Callback when card is updated */
  onSave: (updates: Partial<Card>) => void;
  /** Callback when card is deleted */
  onDelete: () => void;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * CardModal component that renders a modal overlay with editable card fields.
 * Closes on Escape key or backdrop click.
 */
export function CardModal({ card, onSave, onDelete, onClose }: CardModalProps) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [dueDate, setDueDate] = useState(card.dueDate || '');
  const [priority, setPriority] = useState<Priority | undefined>(card.priority);
  const [selectedLabels, setSelectedLabels] = useState<Label[]>(card.labels || []);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3b82f6');
  const modalRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Get available labels from the store
  const { labels: availableLabels, addLabel } = useBoardStore();

  /**
   * Handle Escape key to close modal
   */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDeleteConfirm) {
          setShowDeleteConfirm(false);
        } else {
          onClose();
        }
      }
    },
    [onClose, showDeleteConfirm]
  );

  /**
   * Handle backdrop click to close modal
   */
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  /**
   * Save changes and close modal
   */
  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return; // Don't save empty title

    onSave({
      title: trimmedTitle,
      description: description.trim() || undefined,
      dueDate: dueDate || undefined,
      priority: priority,
      labels: selectedLabels,
    });
    onClose();
  };

  /**
   * Toggle a label on/off for the current card
   */
  const toggleLabel = (label: Label) => {
    const isSelected = selectedLabels.some((l) => l.id === label.id);
    if (isSelected) {
      setSelectedLabels(selectedLabels.filter((l) => l.id !== label.id));
    } else {
      setSelectedLabels([...selectedLabels, label]);
    }
  };

  /**
   * Check if a label is currently selected
   */
  const isLabelSelected = (labelId: string) => {
    return selectedLabels.some((l) => l.id === labelId);
  };

  /**
   * Create a new custom label
   */
  const handleCreateLabel = () => {
    const trimmedName = newLabelName.trim();
    if (!trimmedName) return;

    addLabel({ name: trimmedName, color: newLabelColor });
    setNewLabelName('');
    setNewLabelColor('#3b82f6');
    setShowCreateLabel(false);
  };

  /**
   * Clear the due date
   */
  const handleClearDueDate = () => {
    setDueDate('');
  };

  /**
   * Handle delete with confirmation
   */
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  /**
   * Confirm deletion
   */
  const handleConfirmDelete = () => {
    onDelete();
    onClose();
  };

  /**
   * Cancel deletion
   */
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  // Add event listener for Escape key
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Focus title input on mount
  useEffect(() => {
    titleInputRef.current?.focus();
    titleInputRef.current?.select();
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="card-modal-title"
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 id="card-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            Edit Card
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Title Field */}
          <div>
            <label
              htmlFor="card-title"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Title
            </label>
            <input
              ref={titleInputRef}
              id="card-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter card title..."
            />
          </div>

          {/* Description Field */}
          <div>
            <label
              htmlFor="card-description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Description
            </label>
            <textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 dark:placeholder-gray-500 resize-none"
              placeholder="Add a more detailed description..."
            />
          </div>

          {/* Labels Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Labels
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {availableLabels.map((label) => {
                const selected = isLabelSelected(label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => toggleLabel(label)}
                    className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${
                      selected
                        ? 'ring-2 ring-offset-1 dark:ring-offset-gray-800'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: label.color,
                      color: '#ffffff',
                      // @ts-expect-error - CSS custom property for ring color
                      '--tw-ring-color': label.color,
                    }}
                    aria-pressed={selected}
                    title={selected ? `Remove ${label.name}` : `Add ${label.name}`}
                  >
                    {selected && (
                      <svg
                        className="w-3.5 h-3.5 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {label.name}
                  </button>
                );
              })}
            </div>

            {/* Create Custom Label */}
            {!showCreateLabel ? (
              <button
                type="button"
                onClick={() => setShowCreateLabel(true)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline focus:outline-none"
              >
                + Create custom label
              </button>
            ) : (
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md">
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Label name"
                    className="flex-1 px-2 py-1 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="w-8 h-8 p-0 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
                    title="Pick color"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreateLabel}
                    disabled={!newLabelName.trim()}
                    className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateLabel(false);
                      setNewLabelName('');
                      setNewLabelColor('#3b82f6');
                    }}
                    className="px-3 py-1 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Priority Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITY_OPTIONS.map((option) => {
                const isSelected = priority === option.value;
                return (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => setPriority(option.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 ${
                      isSelected
                        ? `${option.bgColor} ${option.color} ${option.borderColor}`
                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}
                    aria-pressed={isSelected}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Due Date Field */}
          <div>
            <label
              htmlFor="card-due-date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Due Date
            </label>
            <div className="flex items-center gap-2">
              <input
                id="card-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="flex-1 px-3 py-2 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {dueDate && (
                <button
                  type="button"
                  onClick={handleClearDueDate}
                  className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  aria-label="Clear due date"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          {/* Delete Button */}
          {!showDeleteConfirm ? (
            <button
              onClick={handleDeleteClick}
              className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Delete Card
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Delete this card?</span>
              <button
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Yes, Delete
              </button>
              <button
                onClick={handleCancelDelete}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Save/Cancel Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CardModal;
