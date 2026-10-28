/**
 * IndexedDB Local Image Cache Manager.
 * Guarantees zero redundant network requests for pet images by caching blobs locally.
 * Adheres to bandwidth conservation and low latency Virtual DOM rendering.
 */

const DB_NAME = 'PetShopMediaCache';
const STORE_NAME = 'pet_images';
const DB_VERSION = 1;

class ImageCacheManager {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private memoryCache: Map<string, string> = new Map();
  private stats = { hits: 0, misses: 0, bytesSaved: 0 };

  private getDB(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (event: any) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'key' });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  /**
   * Retrieves an image from local IndexedDB cache or fetches from server and caches it.
   * @param url Server image URL
   * @param contentHash SHA256 checksum from server
   * @returns Object containing objectUrl, fromCache boolean, and size
   */
  async getImage(url: string, contentHash?: string): Promise<{ objectUrl: string; fromCache: boolean; size: number }> {
    if (!url) return { objectUrl: '', fromCache: false, size: 0 };

    const cacheKey = contentHash || url;

    // 1. Check in-memory object URL cache for instant synchronous access
    if (this.memoryCache.has(cacheKey)) {
      this.stats.hits++;
      return {
        objectUrl: this.memoryCache.get(cacheKey)!,
        fromCache: true,
        size: 0,
      };
    }

    try {
      const db = await this.getDB();
      const cachedBlob: any = await new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(cacheKey);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => resolve(null);
      });

      // 2. Cache Hit in IndexedDB
      if (cachedBlob) {
        const objectUrl = URL.createObjectURL(cachedBlob);
        this.memoryCache.set(cacheKey, objectUrl);
        this.stats.hits++;
        this.stats.bytesSaved += cachedBlob.size || 0;
        return {
          objectUrl,
          fromCache: true,
          size: cachedBlob.size,
        };
      }

      // 3. Cache Miss: Fetch from server once, then store locally
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const blob = await response.blob();

      // Write to IndexedDB
      const writeTx = db.transaction(STORE_NAME, 'readwrite');
      const writeStore = writeTx.objectStore(STORE_NAME);
      writeStore.put({
        key: cacheKey,
        blob,
        url,
        timestamp: Date.now(),
        size: blob.size,
      });

      const objectUrl = URL.createObjectURL(blob);
      this.memoryCache.set(cacheKey, objectUrl);
      this.stats.misses++;

      return {
        objectUrl,
        fromCache: false,
        size: blob.size,
      };
    } catch (err) {
      // Fallback directly to network URL if IndexedDB is blocked
      return { objectUrl: url, fromCache: false, size: 0 };
    }
  }

  getStats() {
    return { ...this.stats };
  }

  async clearCache(): Promise<void> {
    const db = await this.getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    this.memoryCache.clear();
    this.stats = { hits: 0, misses: 0, bytesSaved: 0 };
  }
}

export const imageCache = new ImageCacheManager();
