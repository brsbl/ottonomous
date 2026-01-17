/**
 * TemplateManager component for creating, editing, and deleting note templates.
 * Provides a full CRUD interface for managing templates with a form-based UI.
 */

import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, FileText, X, Check } from 'lucide-react';
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
import type { Template, TemplateCategory } from '../types';
import { cn } from '@/lib/utils';

/**
 * Category options with labels and colors for display.
 */
const CATEGORY_OPTIONS: { value: TemplateCategory; label: string; color: string }[] = [
  { value: 'daily', label: 'Daily', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  { value: 'meeting', label: 'Meeting', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
  { value: 'project', label: 'Project', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' },
  { value: 'custom', label: 'Custom', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
];

/**
 * Get category display info by value.
 */
function getCategoryInfo(category: TemplateCategory) {
  return CATEGORY_OPTIONS.find((c) => c.value === category) || CATEGORY_OPTIONS[3];
}

interface TemplateManagerProps {
  /** Whether the manager dialog is open */
  open: boolean;
  /** Callback to close the manager */
  onOpenChange: (open: boolean) => void;
}

/**
 * TemplateManager provides a dialog-based interface for managing templates.
 * Supports creating new templates, editing existing ones, and deleting templates.
 */
export function TemplateManager({ open, onOpenChange }: TemplateManagerProps) {
  const { templates, createTemplate, updateTemplate, deleteTemplate, loadTemplates } = useKnowledgeBase();

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<TemplateCategory>('custom');

  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Load templates on mount
  useEffect(() => {
    if (open) {
      loadTemplates();
    }
  }, [open, loadTemplates]);

  /**
   * Reset form to initial state.
   */
  const resetForm = () => {
    setName('');
    setContent('');
    setCategory('custom');
    setEditingTemplate(null);
    setIsEditing(false);
  };

  /**
   * Start editing an existing template.
   */
  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setName(template.name);
    setContent(template.content);
    setCategory(template.category);
    setIsEditing(true);
  };

  /**
   * Start creating a new template.
   */
  const handleNew = () => {
    resetForm();
    setIsEditing(true);
  };

  /**
   * Save the template (create or update).
   */
  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    if (editingTemplate) {
      // Update existing template
      await updateTemplate(editingTemplate.id, {
        name: trimmedName,
        content,
        category,
      });
    } else {
      // Create new template
      await createTemplate({
        name: trimmedName,
        content,
        category,
      });
    }

    resetForm();
  };

  /**
   * Delete a template after confirmation.
   */
  const handleDelete = async (id: string) => {
    await deleteTemplate(id);
    setDeleteConfirmId(null);
  };

  /**
   * Cancel form editing.
   */
  const handleCancel = () => {
    resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Manage Templates</DialogTitle>
          <DialogDescription>
            Create and edit note templates with placeholders like {'{{date}}'} and {'{{title}}'}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {isEditing ? (
            /* Edit/Create Form */
            <div className="space-y-4">
              <div>
                <label htmlFor="template-name" className="block text-sm font-medium mb-1">
                  Template Name
                </label>
                <Input
                  id="template-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Weekly Review"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setCategory(option.value)}
                      className={cn(
                        'px-3 py-1.5 text-sm font-medium rounded-md border-2 transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
                        category === option.value
                          ? `${option.color} border-current`
                          : 'bg-background border-border hover:border-muted-foreground'
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="template-content" className="block text-sm font-medium mb-1">
                  Template Content
                </label>
                <p className="text-xs text-muted-foreground mb-2">
                  Use {'{{date}}'} for current date and {'{{title}}'} for note title.
                </p>
                <textarea
                  id="template-content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={10}
                  className={cn(
                    'w-full px-3 py-2 rounded-md border border-input bg-background',
                    'text-sm font-mono resize-none',
                    'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
                  )}
                  placeholder="# {{title}}&#10;&#10;**Date:** {{date}}&#10;&#10;## Notes&#10;&#10;"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={!name.trim()}>
                  <Check className="h-4 w-4 mr-2" />
                  {editingTemplate ? 'Save Changes' : 'Create Template'}
                </Button>
              </div>
            </div>
          ) : (
            /* Template List */
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {templates.length} template{templates.length !== 1 ? 's' : ''}
                </p>
                <Button onClick={handleNew} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Template
                </Button>
              </div>

              <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
                <div className="space-y-2">
                  {templates.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">No templates yet.</p>
                      <p className="text-sm text-muted-foreground">
                        Create your first template to get started.
                      </p>
                    </div>
                  ) : (
                    templates.map((template) => {
                      const categoryInfo = getCategoryInfo(template.category);
                      return (
                        <div
                          key={template.id}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg',
                            'border border-border hover:bg-accent/50 transition-colors'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium truncate">{template.name}</p>
                              <span
                                className={cn(
                                  'inline-block text-xs px-2 py-0.5 rounded-full mt-1',
                                  categoryInfo.color
                                )}
                              >
                                {categoryInfo.label}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {deleteConfirmId === template.id ? (
                              <>
                                <span className="text-sm text-muted-foreground mr-2">Delete?</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(template.id)}
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
                                  onClick={() => handleEdit(template)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirmId(template.id)}
                                  className="text-muted-foreground hover:text-destructive"
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

export default TemplateManager;
