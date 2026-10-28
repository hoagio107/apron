interface PageLoaderProps {
  /** Minimum height of the loader container. Defaults to '400px' */
  minHeight?: string;
  /** Custom className for the container */
  className?: string;
}

/**
 * PageLoader — Full-page centered loading spinner.
 *
 * Usage:
 *   if (isLoading) return <PageLoader />;
 *
 * Or inline within a section:
 *   {isLoading ? <PageLoader minHeight="200px" /> : <Content />}
 */
export function PageLoader({ minHeight = '400px', className = '' }: PageLoaderProps) {
  const minHeightClass = minHeight === '200px' ? 'min-h-[200px]' : 'min-h-[400px]';
  return (
    <div
      className={`flex-1 flex items-center justify-center ${minHeightClass} ${className}`}
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
