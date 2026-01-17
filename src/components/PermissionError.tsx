import { ShieldAlert, RefreshCw, FolderOpen, ExternalLink } from 'lucide-react';
import type { FolderScanError } from '../lib/folderScanner';

interface PermissionErrorProps {
  /** The error that occurred */
  error: FolderScanError;
  /** Callback to retry the operation */
  onRetry: () => void;
  /** Callback to dismiss the error */
  onDismiss: () => void;
}

/**
 * PermissionError component displays a helpful error message when
 * folder access is denied or other scan errors occur.
 */
export function PermissionError({ error, onRetry, onDismiss }: PermissionErrorProps) {
  const isPermissionDenied = error.code === 'PERMISSION_DENIED';
  const isAborted = error.code === 'ABORTED';
  const isNotFound = error.code === 'NOT_FOUND';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Icon and heading */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isAborted ? 'bg-muted' : 'bg-destructive/10'
          }`}>
            {isAborted ? (
              <FolderOpen className="w-8 h-8 text-muted-foreground" />
            ) : (
              <ShieldAlert className={`w-8 h-8 ${isPermissionDenied ? 'text-destructive' : 'text-orange-500'}`} />
            )}
          </div>

          <h2 className="text-xl font-semibold text-foreground mb-2">
            {isAborted && 'Selection Cancelled'}
            {isPermissionDenied && 'Permission Denied'}
            {isNotFound && 'Folder Not Found'}
            {error.code === 'UNKNOWN' && 'Something Went Wrong'}
          </h2>

          <p className="text-muted-foreground">
            {error.message}
          </p>
        </div>

        {/* Help text for permission errors */}
        {isPermissionDenied && (
          <div className="bg-secondary/50 rounded-md p-4 mb-6">
            <h3 className="font-medium text-foreground mb-2 text-sm">How to fix this:</h3>
            <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
              <li>When the folder picker opens, select your projects folder</li>
              <li>Click "View files" when prompted by your browser</li>
              <li>If you previously denied access, you may need to clear site permissions</li>
            </ol>
          </div>
        )}

        {/* Browser compatibility note */}
        {error.code === 'UNKNOWN' && error.message.includes('File System Access API') && (
          <div className="bg-secondary/50 rounded-md p-4 mb-6">
            <h3 className="font-medium text-foreground mb-2 text-sm">Browser Compatibility</h3>
            <p className="text-sm text-muted-foreground mb-3">
              This app requires a Chromium-based browser for folder access.
            </p>
            <div className="flex flex-wrap gap-2">
              <BrowserBadge name="Chrome" supported />
              <BrowserBadge name="Edge" supported />
              <BrowserBadge name="Opera" supported />
              <BrowserBadge name="Firefox" supported={false} />
              <BrowserBadge name="Safari" supported={false} />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md font-medium hover:bg-secondary/80 transition-colors"
          >
            {isAborted ? 'Close' : 'Cancel'}
          </button>
          {!isAborted && (
            <button
              onClick={onRetry}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
          )}
        </div>

        {/* Help link */}
        {isPermissionDenied && (
          <a
            href="https://support.google.com/chrome/answer/114662"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Learn about site permissions
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  );
}

interface BrowserBadgeProps {
  name: string;
  supported: boolean;
}

function BrowserBadge({ name, supported }: BrowserBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
        supported
          ? 'bg-green-500/10 text-green-500'
          : 'bg-red-500/10 text-red-500'
      }`}
    >
      {name}
      {supported ? ' \u2713' : ' \u2717'}
    </span>
  );
}

export default PermissionError;
