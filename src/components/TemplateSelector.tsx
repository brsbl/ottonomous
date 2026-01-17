/**
 * TemplateSelector component for selecting a template when creating a new note.
 * Displays available templates in a dialog with preview and allows selection.
 */

import { useState, useEffect } from 'react';
import { FileText, FilePlus2, Plus, Settings } from 'lucide-react';
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
import { useKnowledgeBase, replacePlaceholders } from '../stores/knowledgeBase';
import type { Template, TemplateCategory } from '../types';
import { cn } from '../lib/utils';

/**
 * Category colors for visual distinction.
 */
const CATEGORY_COLORS: Record<TemplateCategory, string> = {
  daily: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  meeting: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  project: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  custom: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
};

/**
 * Category labels for display.
 */
const CATEGORY_LABELS: Record<TemplateCategory, string> = {
  daily: 'Daily',
  meeting: 'Meeting',
  project: 'Project',
  custom: 'Custom',
};

interface TemplateSelectorProps {
  /** Whether the selector dialog is open */
  open: boolean;
  /** Callback to close the selector */
  onOpenChange: (open: boolean) => void;
  /** Callback when a template is selected with the processed content */
  onSelect: (title: string, content: string, templateId?: string) => void;
  /** Callback to open the template manager */
  onManageTemplates?: () => void;
}

/**
 * TemplateSelector displays a dialog for selecting a template when creating a new note.
 * Supports selecting from available templates or creating a blank note.
 */
export function TemplateSelector({
  open,
  onOpenChange,
  onSelect,
  onManageTemplates,
}: TemplateSelectorProps) {
  const { templates, loadTemplates } = useKnowledgeBase();

  // State for note title input
  const [title, setTitle] = useState('');
  // State for selected template
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  // State for showing preview
  const [showPreview, setShowPreview] = useState(false);

  // Load templates on mount
  useEffect(() => {
    if (open) {
      loadTemplates();
      setTitle('');
      setSelectedTemplate(null);
      setShowPreview(false);
    }
  }, [open, loadTemplates]);

  /**
   * Handle template selection.
   */
  const handleSelectTemplate = (template: Template | null) => {
    setSelectedTemplate(template);
    setShowPreview(!!template);
  };

  /**
   * Handle creating the note with the selected template.
   */
  const handleCreate = () => {
    const noteTitle = title.trim() || 'Untitled';

    if (selectedTemplate) {
      // Apply placeholder replacement to template content
      const processedContent = replacePlaceholders(selectedTemplate.content, noteTitle);
      onSelect(noteTitle, processedContent, selectedTemplate.id);
    } else {
      // Create blank note
      onSelect(noteTitle, '', undefined);
    }

    onOpenChange(false);
  };

  /**
   * Get preview content with placeholders replaced.
   */
  const getPreviewContent = () => {
    if (!selectedTemplate) return '';
    const noteTitle = title.trim() || 'Untitled';
    return replacePlaceholders(selectedTemplate.content, noteTitle);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Note</DialogTitle>
          <DialogDescription>
            Choose a template or start with a blank note.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex flex-col gap-4">
          {/* Title Input */}
          <div>
            <label htmlFor="note-title" className="block text-sm font-medium mb-1">
              Note Title
            </label>
            <Input
              id="note-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title for your note..."
              autoFocus
            />
          </div>

          {/* Template Selection */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Choose a Template</label>
              {onManageTemplates && (
                <Button variant="ghost" size="sm" onClick={onManageTemplates}>
                  <Settings className="h-4 w-4 mr-1" />
                  Manage
                </Button>
              )}
            </div>

            <div className="flex-1 min-h-0 flex gap-4">
              {/* Template List */}
              <ScrollArea className="flex-1 min-h-0 border rounded-lg">
                <div className="p-2 space-y-1">
                  {/* Blank Note Option */}
                  <button
                    type="button"
                    onClick={() => handleSelectTemplate(null)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                      'hover:bg-accent',
                      selectedTemplate === null
                        ? 'bg-primary/10 border border-primary'
                        : 'border border-transparent'
                    )}
                  >
                    <Plus className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Blank Note</p>
                      <p className="text-xs text-muted-foreground">Start from scratch</p>
                    </div>
                  </button>

                  {/* Template Options */}
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      type="button"
                      onClick={() => handleSelectTemplate(template)}
                      className={cn(
                        'w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors',
                        'hover:bg-accent',
                        selectedTemplate?.id === template.id
                          ? 'bg-primary/10 border border-primary'
                          : 'border border-transparent'
                      )}
                    >
                      <FilePlus2 className="h-5 w-5 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{template.name}</p>
                        <span
                          className={cn(
                            'inline-block text-xs px-2 py-0.5 rounded-full mt-0.5',
                            CATEGORY_COLORS[template.category]
                          )}
                        >
                          {CATEGORY_LABELS[template.category]}
                        </span>
                      </div>
                    </button>
                  ))}

                  {templates.length === 0 && (
                    <div className="text-center py-6">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No templates available.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Template Preview */}
              {showPreview && selectedTemplate && (
                <div className="flex-1 min-h-0 border rounded-lg overflow-hidden">
                  <div className="bg-muted/50 px-3 py-2 border-b">
                    <p className="text-sm font-medium">Preview</p>
                  </div>
                  <ScrollArea className="h-[200px]">
                    <pre className="p-3 text-sm whitespace-pre-wrap font-mono text-muted-foreground">
                      {getPreviewContent()}
                    </pre>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>
            <FileText className="h-4 w-4 mr-2" />
            Create Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelector;
