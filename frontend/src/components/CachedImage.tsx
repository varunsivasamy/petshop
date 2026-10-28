import React, { useState, useEffect } from 'react';
import { imageCache } from '../services/imageCache';
import { Zap, HardDrive } from 'lucide-react';

interface CachedImageProps {
  src?: string;
  contentHash?: string;
  alt: string;
  className?: string;
  showBadge?: boolean;
}

/**
 * High-performance CachedImage component.
 * Wrapped in React.memo to prevent Virtual DOM child re-renders.
 * Checks IndexedDB local storage before network fetch to save bandwidth.
 */
export const CachedImage: React.FC<CachedImageProps> = React.memo(
  ({ src, contentHash, alt, className = '', showBadge = true }) => {
    const [displayUrl, setDisplayUrl] = useState<string>('');
    const [isFromCache, setIsFromCache] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
      let isMounted = true;

      if (!src) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      imageCache.getImage(src, contentHash).then((result) => {
        if (isMounted) {
          setDisplayUrl(result.objectUrl);
          setIsFromCache(result.fromCache);
          setIsLoading(false);
        }
      });

      return () => {
        isMounted = false;
      };
    }, [src, contentHash]);

    return (
      <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse text-slate-400 text-xs font-medium">
            Loading...
          </div>
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt={alt}
            className="w-full h-full object-cover transition-opacity duration-300"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-200 text-slate-400 text-sm">
            🐾 No Image
          </div>
        )}

        {/* Bandwidth Optimization Indicator Badge */}
        {showBadge && !isLoading && displayUrl && (
          <div
            title={isFromCache ? 'Zero bandwidth: Loaded from client local IndexedDB cache' : 'Fetched from server and cached locally'}
            className={`absolute bottom-2 right-2 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full backdrop-blur-md flex items-center gap-1 shadow-sm transition-all ${
              isFromCache
                ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                : 'bg-indigo-950/70 text-indigo-300 border border-indigo-500/30'
            }`}
          >
            {isFromCache ? <HardDrive className="w-2.5 h-2.5" /> : <Zap className="w-2.5 h-2.5" />}
            {isFromCache ? 'Local Cache' : 'Server Cached'}
          </div>
        )}
      </div>
    );
  },
  // Custom memo comparison: only re-render if src or contentHash changed
  (prev, next) => prev.src === next.src && prev.contentHash === next.contentHash && prev.className === next.className
);

CachedImage.displayName = 'CachedImage';
