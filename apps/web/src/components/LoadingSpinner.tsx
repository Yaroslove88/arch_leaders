import { Spinner } from '@leadership-architect/ui';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner - wrapper around Spinner primitive for backward compatibility
 * @deprecated Use Spinner from @leadership-architect/ui directly for new code
 */
export default function LoadingSpinner({ 
  size = 'md', 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  // Non-fullscreen has a wrapper with padding for backward compatibility
  if (!fullScreen) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size={size} text={text} tone="focus" />
      </div>
    );
  }

  // Fullscreen uses Spinner's built-in fullScreen mode
  return <Spinner size={size} text={text} fullScreen tone="focus" />;
}
