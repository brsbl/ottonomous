import { X, FolderOpen, Music } from 'lucide-react';
import type { ScanProgress as ScanProgressType } from '../lib/folderScanner';

interface ScanProgressProps {
  /** Current scan progress data */
  progress: ScanProgressType;
  /** Folder name being scanned */
  folderName: string;
  /** Callback when cancel button is clicked */
  onCancel: () => void;
  /** Whether the scan is complete */
  isComplete?: boolean;
  /** Total estimated files (if known) - used for progress bar */
  totalEstimate?: number;
}

/**
 * ScanProgress component displays the progress of a folder scan.
 * Shows a progress bar, file count, and current directory being scanned.
 */
export function ScanProgress({
  progress,
  folderName,
  onCancel,
  isComplete = false,
  totalEstimate,
}: ScanProgressProps) {
  // Calculate progress percentage if we have an estimate
  const progressPercent = totalEstimate
    ? Math.min((progress.filesFound / totalEstimate) * 100, 99)
    : null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <FolderOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">
                {isComplete ? 'Scan Complete' : 'Scanning Folder'}
              </h2>
              <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                {folderName}
              </p>
            </div>
          </div>
          {!isComplete && (
            <button
              onClick={onCancel}
              className="p-2 hover:bg-secondary rounded-md transition-colors text-muted-foreground hover:text-foreground"
              aria-label="Cancel scan"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            {progressPercent !== null ? (
              <div
                className="h-full bg-primary transition-all duration-300 ease-out"
                style={{ width: `${isComplete ? 100 : progressPercent}%` }}
              />
            ) : (
              <div className="h-full bg-primary animate-progress-indeterminate" />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <StatItem
            icon={<Music className="w-4 h-4" />}
            label="Projects Found"
            value={progress.filesFound.toString()}
          />
          <StatItem
            icon={<FolderOpen className="w-4 h-4" />}
            label="Folders Scanned"
            value={progress.directoriesScanned.toString()}
          />
        </div>

        {/* Current directory */}
        {!isComplete && (
          <div className="bg-secondary/50 rounded-md p-3">
            <p className="text-xs text-muted-foreground mb-1">Currently scanning:</p>
            <p className="text-sm text-foreground truncate font-mono">
              {progress.currentDirectory || '...'}
            </p>
          </div>
        )}

        {/* Complete state */}
        {isComplete && (
          <div className="bg-primary/10 rounded-md p-3 text-center">
            <p className="text-sm text-primary">
              Found {progress.filesFound} Ableton project{progress.filesFound !== 1 ? 's' : ''}
            </p>
          </div>
        )}

        {/* Cancel button for complete state */}
        {isComplete && (
          <button
            onClick={onCancel}
            className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
          >
            Done
          </button>
        )}
      </div>
    </div>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function StatItem({ icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-center gap-3 bg-secondary/30 rounded-md p-3">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-lg font-semibold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export default ScanProgress;
