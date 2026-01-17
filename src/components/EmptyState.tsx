import { FolderOpen, Music, Search, BarChart3, Tag } from 'lucide-react';

interface EmptyStateProps {
  onAddFolder: () => void;
}

/**
 * EmptyState component shown when no folders have been added yet.
 * Displays a welcoming message with clear CTA to add the first folder.
 */
export function EmptyState({ onAddFolder }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Icon and heading */}
      <div className="flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-6">
        <Music className="w-10 h-10 text-primary" />
      </div>

      <h1 className="text-2xl font-bold text-foreground mb-2 text-center">
        Welcome to Ableton Project Manager
      </h1>

      <p className="text-muted-foreground text-center max-w-md mb-8">
        Organize, analyze, and manage your Ableton Live projects. Get insights into your
        music production workflow with powerful search and filtering.
      </p>

      {/* CTA Button */}
      <button
        onClick={onAddFolder}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background"
      >
        <FolderOpen className="w-5 h-5" />
        Add Folder
      </button>

      {/* Features preview */}
      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <FeatureCard
          icon={<Search className="w-5 h-5" />}
          title="Smart Search"
          description="Find projects by name, BPM, plugins, or any metadata"
        />
        <FeatureCard
          icon={<BarChart3 className="w-5 h-5" />}
          title="Analytics"
          description="Visualize your production trends and habits"
        />
        <FeatureCard
          icon={<Tag className="w-5 h-5" />}
          title="Organization"
          description="Tag, rate, and annotate your projects"
        />
      </div>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-center text-center p-4 rounded-lg bg-card/50">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary mb-3 text-muted-foreground">
        {icon}
      </div>
      <h3 className="font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default EmptyState;
