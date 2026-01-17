/**
 * useAutoSave hook - Provides debounced auto-save functionality with
 * dirty state tracking, error handling, and retry logic.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { toast } from './use-toast';

/**
 * Configuration options for the auto-save hook
 */
interface UseAutoSaveOptions<T> {
  /** The data to be saved */
  data: T;
  /** Function to save the data, returns a Promise */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 500ms) */
  debounceMs?: number;
  /** Maximum number of retry attempts on error (default: 3) */
  maxRetries?: number;
  /** Delay between retries in milliseconds (default: 1000ms) */
  retryDelayMs?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
  /** Show success toast on save (default: true) */
  showSuccessToast?: boolean;
  /** Show error toast on save failure (default: true) */
  showErrorToast?: boolean;
  /** Callback when save succeeds */
  onSaveSuccess?: () => void;
  /** Callback when save fails after all retries */
  onSaveError?: (error: Error) => void;
}

/**
 * Return value from the useAutoSave hook
 */
interface UseAutoSaveReturn {
  /** Whether there are unsaved changes */
  isDirty: boolean;
  /** Whether a save is currently in progress */
  isSaving: boolean;
  /** The last error that occurred during save (null if none) */
  lastError: Error | null;
  /** Timestamp of the last successful save */
  lastSavedAt: Date | null;
  /** Manually trigger a save immediately */
  saveNow: () => Promise<void>;
  /** Mark the current state as saved (reset dirty flag) */
  markAsSaved: () => void;
  /** Current retry count (0 if not retrying) */
  retryCount: number;
}

/**
 * Deep comparison utility for detecting changes
 */
function hasDataChanged<T>(prev: T | null, current: T): boolean {
  if (prev === null) return true;
  if (typeof prev !== typeof current) return true;
  if (typeof prev !== 'object' || prev === null) return prev !== current;
  return JSON.stringify(prev) !== JSON.stringify(current);
}

/**
 * Hook that provides debounced auto-save functionality with error handling
 * and retry logic. Persists data after a configurable delay.
 *
 * @example
 * const { isDirty, isSaving, saveNow } = useAutoSave({
 *   data: { title, content },
 *   onSave: async (data) => await updateNote(noteId, data),
 *   debounceMs: 500,
 * });
 */
export function useAutoSave<T>({
  data,
  onSave,
  debounceMs = 500,
  maxRetries = 3,
  retryDelayMs = 1000,
  enabled = true,
  showSuccessToast = true,
  showErrorToast = true,
  onSaveSuccess,
  onSaveError,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastError, setLastError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedDataRef = useRef<T | null>(null);
  const currentDataRef = useRef<T>(data);
  const isMountedRef = useRef(true);
  const saveInProgressRef = useRef(false);

  // Update current data ref
  currentDataRef.current = data;

  /**
   * Perform the save operation with retry logic
   */
  const performSave = useCallback(async (dataToSave: T, retriesLeft: number = maxRetries): Promise<void> => {
    if (saveInProgressRef.current) {
      return;
    }

    saveInProgressRef.current = true;
    setIsSaving(true);
    setLastError(null);

    try {
      await onSave(dataToSave);

      if (isMountedRef.current) {
        lastSavedDataRef.current = dataToSave;
        setIsSaving(false);
        setIsDirty(false);
        setLastSavedAt(new Date());
        setRetryCount(0);
        saveInProgressRef.current = false;

        if (showSuccessToast) {
          toast({
            title: 'Saved',
            description: 'Your changes have been saved.',
            duration: 2000,
          });
        }

        onSaveSuccess?.();
      }
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Save failed');

      if (isMountedRef.current) {
        if (retriesLeft > 0) {
          // Retry after delay
          setRetryCount(maxRetries - retriesLeft + 1);
          saveInProgressRef.current = false;

          setTimeout(() => {
            if (isMountedRef.current) {
              performSave(dataToSave, retriesLeft - 1);
            }
          }, retryDelayMs);
        } else {
          // All retries exhausted
          setIsSaving(false);
          setLastError(saveError);
          setRetryCount(0);
          saveInProgressRef.current = false;

          if (showErrorToast) {
            toast({
              title: 'Save failed',
              description: 'Unable to save changes. Please try again.',
              variant: 'destructive',
              duration: 5000,
            });
          }

          onSaveError?.(saveError);
        }
      }
    }
  }, [onSave, maxRetries, retryDelayMs, showSuccessToast, showErrorToast, onSaveSuccess, onSaveError]);

  /**
   * Schedule a debounced save
   */
  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      if (isMountedRef.current && enabled) {
        performSave(currentDataRef.current);
      }
    }, debounceMs);
  }, [debounceMs, enabled, performSave]);

  /**
   * Detect changes and trigger auto-save
   */
  useEffect(() => {
    if (!enabled) return;

    const dataChanged = hasDataChanged(lastSavedDataRef.current, data);

    if (dataChanged) {
      setIsDirty(true);
      scheduleSave();
    }
  }, [data, enabled, scheduleSave]);

  /**
   * Cleanup on unmount - flush pending saves to prevent data loss
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      // Flush pending save if there's dirty data
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      // If there are unsaved changes, attempt a synchronous save before unmount
      // Check if data has changed from last saved state
      const hasPendingChanges = hasDataChanged(lastSavedDataRef.current, currentDataRef.current);
      if (hasPendingChanges && enabled && !saveInProgressRef.current) {
        // Perform a fire-and-forget save to prevent data loss
        // Note: We can't await here, but the save will still execute
        onSave(currentDataRef.current).catch((error) => {
          console.error('Failed to save on unmount:', error);
        });
      }

      isMountedRef.current = false;
    };
  }, [enabled, onSave]);

  /**
   * Manual save trigger - bypasses debounce
   */
  const saveNow = useCallback(async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    await performSave(currentDataRef.current);
  }, [performSave]);

  /**
   * Mark current state as saved without actually saving
   */
  const markAsSaved = useCallback(() => {
    lastSavedDataRef.current = currentDataRef.current;
    setIsDirty(false);
    setLastSavedAt(new Date());
  }, []);

  return {
    isDirty,
    isSaving,
    lastError,
    lastSavedAt,
    saveNow,
    markAsSaved,
    retryCount,
  };
}

export default useAutoSave;
