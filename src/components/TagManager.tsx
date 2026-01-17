import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check, Trash2, Edit2 } from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { db } from '../lib/db';
import type { Tag } from '../types';
import { TAG_COLORS, TagColorName } from './TagBadge';

interface TagManagerProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Handler to close the modal */
  onClose: () => void;
  /** Optional: Tag to edit (if provided, the modal opens in edit mode) */
  editTag?: Tag | null;
}

/**
 * Generate a unique ID for tags
 */
function generateTagId(): string {
  return `tag-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Modal for creating and editing tags
 * Includes a name input and simple preset color picker
 */
export function TagManager({ isOpen, onClose, editTag = null }: TagManagerProps) {
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(TAG_COLORS.blue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const tags = useProjectStore((state) => state.tags);
  const addTag = useProjectStore((state) => state.addTag);
  const removeTag = useProjectStore((state) => state.removeTag);
  const updateTag = useProjectStore((state) => state.updateTag);

  // Initialize form when editTag changes
  useEffect(() => {
    if (editTag) {
      setName(editTag.name);
      setSelectedColor(editTag.color);
    } else {
      setName('');
      setSelectedColor(TAG_COLORS.blue);
    }
    setError(null);
  }, [editTag, isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Tag name is required');
      return;
    }

    // Check for duplicate names (excluding current tag if editing)
    const isDuplicate = tags.some(
      (t) => t.name.toLowerCase() === trimmedName.toLowerCase() && t.id !== editTag?.id
    );
    if (isDuplicate) {
      setError('A tag with this name already exists');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editTag) {
        // Update existing tag
        const updatedTag: Tag = {
          ...editTag,
          name: trimmedName,
          color: selectedColor,
        };
        await db.tags.put(updatedTag);
        updateTag(editTag.id, { name: trimmedName, color: selectedColor });
      } else {
        // Create new tag
        const newTag: Tag = {
          id: generateTagId(),
          name: trimmedName,
          color: selectedColor,
          projectCount: 0,
        };
        await db.tags.add(newTag);
        addTag(newTag);
      }
      onClose();
    } catch (err) {
      setError('Failed to save tag. Please try again.');
      console.error('Error saving tag:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle delete tag
  const handleDelete = async () => {
    if (!editTag) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete the tag "${editTag.name}"? This will remove it from all projects.`
    );
    if (!confirmed) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Remove tag from database
      await db.tags.delete(editTag.id);

      // Remove tag from all projects in database
      const projects = await db.projects.filter((p) => p.tags.includes(editTag.id)).toArray();
      for (const project of projects) {
        await db.projects.update(project.id, {
          tags: project.tags.filter((t) => t !== editTag.id),
        });
      }

      // Remove from store
      removeTag(editTag.id);
      onClose();
    } catch (err) {
      setError('Failed to delete tag. Please try again.');
      console.error('Error deleting tag:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  const isEditing = editTag !== null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="tag-manager-title"
    >
      <div className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2
            id="tag-manager-title"
            className="text-lg font-semibold text-foreground flex items-center gap-2"
          >
            {isEditing ? (
              <>
                <Edit2 className="w-5 h-5" />
                Edit Tag
              </>
            ) : (
              <>
                <Check className="w-5 h-5" />
                Create Tag
              </>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close modal"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Tag name input */}
          <div>
            <label
              htmlFor="tag-name"
              className="block text-sm font-medium text-foreground mb-1.5"
            >
              Tag Name
            </label>
            <input
              ref={nameInputRef}
              id="tag-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter tag name..."
              className="w-full px-3 py-2 text-sm bg-background text-foreground border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
              maxLength={50}
              disabled={isSubmitting}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Tag Color
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(TAG_COLORS) as [TagColorName, string][]).map(
                ([colorName, colorValue]) => (
                  <button
                    key={colorName}
                    type="button"
                    onClick={() => setSelectedColor(colorValue)}
                    className={`
                      w-8 h-8 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background
                      ${
                        selectedColor === colorValue
                          ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110'
                          : 'hover:scale-105'
                      }
                    `}
                    style={{ backgroundColor: colorValue }}
                    aria-label={`Select ${colorName} color`}
                    aria-pressed={selectedColor === colorValue}
                    disabled={isSubmitting}
                  />
                )
              )}
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Preview
            </label>
            <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-md">
              <span
                className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium"
                style={{
                  backgroundColor: selectedColor,
                  color:
                    selectedColor === TAG_COLORS.yellow ||
                    selectedColor === TAG_COLORS.orange
                      ? '#000000'
                      : '#ffffff',
                }}
              >
                {name.trim() || 'Tag Name'}
              </span>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md">
              <p className="text-sm text-red-500">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4" />
                Delete Tag
              </button>
            ) : (
              <div /> // Spacer
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting || !name.trim()}
              >
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Tag'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TagManager;
