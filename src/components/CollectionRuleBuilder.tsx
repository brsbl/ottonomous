/**
 * CollectionRuleBuilder component for building smart collection filter rules.
 * Provides a UI for defining field, operator, and value combinations.
 */

import { Plus, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import type { CollectionRule, CollectionRuleField, CollectionRuleOperator } from '../types';
import { cn } from '../lib/utils';

/**
 * Field options with display labels.
 */
const FIELD_OPTIONS: { value: CollectionRuleField; label: string }[] = [
  { value: 'tag', label: 'Tag' },
  { value: 'folder', label: 'Folder' },
  { value: 'createdAt', label: 'Created Date' },
  { value: 'content', label: 'Content' },
];

/**
 * Operator options based on field type.
 */
const OPERATOR_OPTIONS: Record<CollectionRuleField, { value: CollectionRuleOperator; label: string }[]> = {
  tag: [
    { value: 'contains', label: 'contains' },
    { value: 'equals', label: 'equals' },
  ],
  folder: [
    { value: 'equals', label: 'equals' },
    { value: 'contains', label: 'contains' },
  ],
  createdAt: [
    { value: 'before', label: 'before' },
    { value: 'after', label: 'after' },
  ],
  content: [
    { value: 'contains', label: 'contains' },
    { value: 'equals', label: 'equals' },
  ],
};

interface CollectionRuleBuilderProps {
  /** Current rules array */
  rules: CollectionRule[];
  /** Callback when rules change */
  onChange: (rules: CollectionRule[]) => void;
}

/**
 * CollectionRuleBuilder provides a UI for building filter rules.
 * Supports multiple rules with AND logic between them.
 */
export function CollectionRuleBuilder({ rules, onChange }: CollectionRuleBuilderProps) {
  /**
   * Add a new empty rule.
   */
  const handleAddRule = () => {
    onChange([
      ...rules,
      { field: 'tag', operator: 'contains', value: '' },
    ]);
  };

  /**
   * Update a specific rule.
   */
  const handleUpdateRule = (index: number, updates: Partial<CollectionRule>) => {
    const newRules = rules.map((rule, i) => {
      if (i !== index) return rule;

      const updatedRule = { ...rule, ...updates };

      // Reset operator when field changes to first valid operator for new field
      if (updates.field && updates.field !== rule.field) {
        const validOperators = OPERATOR_OPTIONS[updates.field];
        if (!validOperators.some((op) => op.value === updatedRule.operator)) {
          updatedRule.operator = validOperators[0].value;
        }
        // Reset value for date fields
        if (updates.field === 'createdAt') {
          updatedRule.value = new Date().toISOString().split('T')[0];
        } else if (rule.field === 'createdAt') {
          updatedRule.value = '';
        }
      }

      return updatedRule;
    });
    onChange(newRules);
  };

  /**
   * Remove a rule by index.
   */
  const handleRemoveRule = (index: number) => {
    onChange(rules.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {rules.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No rules defined. Add a rule to filter notes.
        </p>
      ) : (
        rules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2">
            {/* AND indicator for subsequent rules */}
            {index > 0 && (
              <span className="text-xs font-medium text-muted-foreground px-2">
                AND
              </span>
            )}

            {/* Field selector */}
            <select
              value={rule.field}
              onChange={(e) => handleUpdateRule(index, { field: e.target.value as CollectionRuleField })}
              className={cn(
                'h-9 px-3 rounded-md border border-input bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
            >
              {FIELD_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Operator selector */}
            <select
              value={rule.operator}
              onChange={(e) => handleUpdateRule(index, { operator: e.target.value as CollectionRuleOperator })}
              className={cn(
                'h-9 px-3 rounded-md border border-input bg-background text-sm',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
              )}
            >
              {OPERATOR_OPTIONS[rule.field].map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Value input - date picker for createdAt, text input otherwise */}
            {rule.field === 'createdAt' ? (
              <Input
                type="date"
                value={rule.value}
                onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                className="h-9 flex-1"
              />
            ) : (
              <Input
                type="text"
                value={rule.value}
                onChange={(e) => handleUpdateRule(index, { value: e.target.value })}
                placeholder={
                  rule.field === 'tag'
                    ? 'Tag name...'
                    : rule.field === 'folder'
                    ? 'Folder name...'
                    : 'Search text...'
                }
                className="h-9 flex-1"
              />
            )}

            {/* Remove rule button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleRemoveRule(index)}
              className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))
      )}

      {/* Add rule button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleAddRule}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Rule
      </Button>
    </div>
  );
}

export default CollectionRuleBuilder;
