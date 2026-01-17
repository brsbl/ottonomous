/**
 * SmartCollections component for managing and viewing smart collections.
 * Provides a dialog-based interface for creating, editing, and previewing collections.
 */

import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, Layers, X, Check, FileText, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { useKnowledgeBase } from '../stores/knowledgeBase';
import { CollectionRuleBuilder } from './CollectionRuleBuilder';
import type { SmartCollection, CollectionRule } from '../types';
import { cn } from '../lib/utils';

interface SmartCollectionsProps {
  /** Whether the manager dialog is open */
  open: boolean;
  /** Callback to close the manager */
  onOpenChange: (open: boolean) => void;
  /** Callback when a note is selected from preview */
  onSelectNote?: (noteId: string) => void;
}

/**
 * SmartCollections provides a dialog-based interface for managing smart collections.
 * Supports creating new collections, editing existing ones, previewing matching notes, and deleting collections.
 */
export function SmartCollections({ open, onOpenChange, onSelectNote }: SmartCollectionsProps) {
  const {
    collections,
    createCollection,
    updateCollection,
    deleteCollection,
    evaluateCollection,
    loadCollections,
    setActiveNote,
  } = useKnowledgeBase();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingCollection, setEditingCollection] = useState<SmartCollection | null>(null);
  const [name, setName] = useState('');
  const [rules, setRules] = useState<CollectionRule[]>([]);

  // Preview state
  const [previewCollection, setPreviewCollection] = useState<SmartCollection | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load collections on mount
  useEffect(() => {
    if (open) {
      loadCollections();
    }
  }, [open, loadCollections]);

  // Preview matching notes
  const previewNotes = useMemo(() => {
    if (!previewCollection) return [];
    return evaluateCollection(previewCollection);
  }, [previewCollection, evaluateCollection]);

  // Live preview during editing
  const editPreviewNotes = useMemo(() => {
    if (!isEditing || rules.length === 0) return [];
    const tempCollection: SmartCollection = {
      id: 'preview',
      name: 'Preview',
      rules,
      createdAt: new Date(),
    };
    return evaluateCollection(tempCollection);
  }, [isEditing, rules, evaluateCollection]);

  /**
   * Reset form to initial state.
   */
  const resetForm = () => {
    setName('');
    setRules([]);
    setEditingCollection(null);
    setIsEditing(false);
  };

  /**
   * Start editing an existing collection.
   */
  const handleEdit = (collection: SmartCollection) => {
    setEditingCollection(collection);
    setName(collection.name);
    setRules([...collection.rules]);
    setIsEditing(true);
    setShowPreview(false);
    setPreviewCollection(null);
  };

  /**
   * Start creating a new collection.
   */
  const handleNew = () => {
    resetForm();
    setIsEditing(true);
    setShowPreview(false);
    setPreviewCollection(null);
  };

  /**
   * Save the collection (create or update).
   */
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (editingCollection) {
      // Update existing collection
      await updateCollection(editingCollection.id, {
        name: trimmedName,
        rules,
      });
    } else {
      // Create new collection
      await createCollection({
        name: trimmedName,
        rules,
      });
    }

    resetForm();
  };

  /**
   * Delete a collection after confirmation.
   */
  const handleDelete = async (id: string) => {
    await deleteCollection(id);
    setDeleteConfirmId(null);
    if (previewCollection?.id === id) {
      setPreviewCollection(null);
      setShowPreview(false);
    }
  };

  /**
   * Cancel form editing.
   */
  const handleCancel = () => {
    resetForm();
  };

  /**
   * Show preview for a collection.
   */
  const handleShowPreview = (collection: SmartCollection) => {
    setPreviewCollection(collection);
    setShowPreview(true);
  };

  /**
   * Handle note selection from preview.
   */
  const handleNoteClick = (noteId: string) => {
    if (onSelectNote) {
      onSelectNote(noteId);
    } else {
      setActiveNote(noteId);
    }
    onOpenChange(false);
  };

  /**
   * Get rule summary for display.
   */
  const getRuleSummary = (collection: SmartCollection): string => {
    if (collection.rules.length === 0) return 'No rules';
    if (collection.rules.length === 1) {
      const rule = collection.rules[0];
      return `${rule.field} ${rule.operator} "${rule.value}"`;
    }
    return `${collection.rules.length} rules`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Smart Collections</DialogTitle>
          <DialogDescription>
            Create dynamic collections that automatically filter notes based on rules.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {isEditing ? (
            /* Edit/Create Form */
            <div className="space-y-4">
              <div>
                <label htmlFor="collection-name" className="block text-sm font-medium mb-1">
                  Collection Name
                </label>
                <Input
                  id="collection-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Work Projects"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Filter Rules
                </label>
                <p className="text-xs text-muted-foreground mb-3">
                  Notes matching ALL rules will be included (AND logic).
                </p>
                <CollectionRuleBuilder rules={rules} onChange={setRules} />
              </div>

              {/* Live preview during editing */}
              {rules.length > 0 && (
                <div className="border border-border rounded-lg p-3">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    Preview ({editPreviewNotes.length} matching notes)
                  </h4>
                  {editPreviewNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No notes match the current rules.
                    </p>
                  ) : (
                    <ScrollArea className="max-h-32">
                      <div className="space-y-1">
                        {editPreviewNotes.slice(0, 10).map((note) => (
                          <div
                            key={note.id}
                            className="flex items-center gap-2 text-sm py-1"
                          >
                            <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{note.title}</span>
                          </div>
                        ))}
                        {editPreviewNotes.length > 10 && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ...and {editPreviewNotes.length - 10} more
                          </p>
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!name.trim()}>
                  <Check className="h-4 w-4 mr-2" />
                  {editingCollection ? 'Save Changes' : 'Create Collection'}
                </Button>
              </div>
            </div>
          ) : showPreview && previewCollection ? (
            /* Preview View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{previewCollection.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {previewNotes.length} matching note{previewNotes.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                  Back to List
                </Button>
              </div>

              <ScrollArea className="flex-1 min-h-0 max-h-[400px] -mx-6 px-6">
                <div className="space-y-2">
                  {previewNotes.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No matching notes.</p>
                      <p className="text-sm text-muted-foreground">
                        Try adjusting the collection rules.
                      </p>
                    </div>
                  ) : (
                    previewNotes.map((note) => (
                      <button
                        key={note.id}
                        onClick={() => handleNoteClick(note.id)}
                        className={cn(
                          'w-full flex items-center gap-3 p-3 rounded-lg text-left',
                          'border border-border hover:bg-accent/50 transition-colors'
                        )}
                      >
                        <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{note.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated {new Date(note.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          ) : (
            /* Collection List */
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {collections.length} collection{collections.length !== 1 ? 's' : ''}
                </p>
                <Button onClick={handleNew} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Collection
                </Button>
              </div>

              <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
                <div className="space-y-2">
                  {collections.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No smart collections yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Create a collection to automatically organize notes by rules.
                      </p>
                    </div>
                  ) : (
                    collections.map((collection) => {
                      const matchCount = evaluateCollection(collection).length;
                      return (
                        <div
                          key={collection.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg',
                            'border border-border hover:bg-accent/50 transition-colors'
                          )}
                        >
                          <button
                            onClick={() => handleShowPreview(collection)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left"
                          >
                            <Layers className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{collection.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {getRuleSummary(collection)} - {matchCount} note{matchCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {deleteConfirmId === collection.id ? (
                              <>
                                <span className="text-sm text-muted-foreground mr-2">Delete?</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(collection.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleShowPreview(collection)}
                                  title="Preview collection"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(collection)}
                                  title="Edit collection"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(collection.id)}
                                  className="text-muted-foreground hover:text-destructive"
                                  title="Delete collection"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default SmartCollections;
