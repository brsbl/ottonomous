import { useCallback, useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { KEYBOARD_SHORTCUTS, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

interface ShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Renders a single keyboard key badge
 */
function KeyBadge({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 bg-secondary text-foreground text-xs font-mono font-medium border border-border rounded shadow-sm">
      {children}
    </kbd>
  );
}

/**
 * Renders the key combination for a shortcut
 */
function ShortcutKeys({ shortcut }: { shortcut: KeyboardShortcut }) {
  const isMac = typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  const parts: React.ReactNode[] = [];

  // Add modifier keys
  if (shortcut.ctrl || shortcut.meta) {
    parts.push(<KeyBadge key="mod">{isMac ? '\u2318' : 'Ctrl'}</KeyBadge>);
  }
  if (shortcut.shift) {
    parts.push(<KeyBadge key="shift">{isMac ? '\u21E7' : 'Shift'}</KeyBadge>);
  }

  // Format the main key
  let displayKey = shortcut.key;
  if (shortcut.key === 'Escape') {
    displayKey = 'Esc';
  } else if (shortcut.key === '?') {
    displayKey = '?';
  } else if (shortcut.key === '/') {
    displayKey = '/';
  } else {
    displayKey = shortcut.key.toUpperCase();
  }
  parts.push(<KeyBadge key="main">{displayKey}</KeyBadge>);

  return (
    <div className="flex items-center gap-1">
      {parts.map((part, index) => (
        <span key={index} className="flex items-center">
          {index > 0 && <span className="mx-0.5 text-muted-foreground">+</span>}
          {part}
        </span>
      ))}
    </div>
  );
}

/**
 * Modal component showing available keyboard shortcuts
 */
export function ShortcutsHelp({ isOpen, onClose }: ShortcutsHelpProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        e.stopPropagation();
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-help-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md bg-card border border-border rounded-lg shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <h2
              id="shortcuts-help-title"
              className="text-lg font-semibold text-foreground"
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close shortcuts help"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-4">
          <div className="space-y-3">
            {KEYBOARD_SHORTCUTS.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-secondary/50 transition-colors"
              >
                <span className="text-sm text-foreground">
                  {shortcut.description}
                </span>
                <ShortcutKeys shortcut={shortcut} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4">
          <p className="text-xs text-muted-foreground text-center">
            Press <KeyBadge>?</KeyBadge> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );
}

export default ShortcutsHelp;
