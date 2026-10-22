'use client';

const imageCache = new Map();

export function loadSharedImage(url, options = {}) {
  const { maxWidth } = options;
  const cacheKey = maxWidth ? `${url}@w${maxWidth}` : url;
  const cachedPromise = imageCache.get(cacheKey);
  if (cachedPromise) {
    return cachedPromise;
  }
  const fetchPromise = (async () => {
    try {
      const response = await fetch(url, { mode: 'cors', credentials: 'omit' });

      if (!response.ok) {
        throw new Error(`fetch failed ${response.status} for ${url}`);
      }
      const blobData = await response.blob();
      const bitmapOptions = { imageOrientation: 'flipY' };
      if (maxWidth) {
        bitmapOptions.resizeWidth = maxWidth;
        bitmapOptions.resizeQuality = 'high';
      }
      return await createImageBitmap(blobData, bitmapOptions);
    } catch (error) {
      imageCache.delete(cacheKey);
      throw error;
    }
  })();
  imageCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}
