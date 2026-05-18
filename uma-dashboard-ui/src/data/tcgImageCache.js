const imageBlobCache = new Map();

export function getCachedCardImage(imageUrl) {
  return imageBlobCache.get(imageUrl) || imageUrl;
}

export function preloadCardImages(cardsById = {}) {
  Object.values(cardsById).forEach((card) => {
    const imageUrl = card?.image;
    if (!imageUrl || imageBlobCache.has(imageUrl)) return;

    fetch(imageUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Image preload failed: ${imageUrl}`);
        return response.blob();
      })
      .then((blob) => {
        imageBlobCache.set(imageUrl, URL.createObjectURL(blob));
      })
      .catch(() => {
        imageBlobCache.set(imageUrl, imageUrl);
      });
  });
}
