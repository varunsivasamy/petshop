import React, { useState, useEffect } from 'react';
import { imageCache } from '../services/imageCache';

interface CachedImageProps {
  src?: string;
  contentHash?: string;
  alt: string;
  className?: string;
}

/**
 * Modern CachedImage component.
 * Invisibly loads from local browser cache for instant rendering without bandwidth lag.
 * No technical jargon or debug badges are exposed to the user.
 */
export const CachedImage: React.FC<CachedImageProps> = React.memo(
  ({ src, contentHash, alt, className = '' }) => {
    const [displayUrl, setDisplayUrl] = useState<string>('');
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
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 animate-pulse text-slate-300 text-xs font-medium">
            🐾
          </div>
        ) : displayUrl ? (
          <img
            src={displayUrl}
            alt={alt}
            className="w-full h-full object-cover transition-all duration-500 ease-out"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
            🐾 No Image
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.src === next.src &&
    prev.contentHash === next.contentHash &&
    prev.className === next.className
);

CachedImage.displayName = 'CachedImage';
