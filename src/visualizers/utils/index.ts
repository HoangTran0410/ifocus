// Gradient cache for performance optimization
export const gradientCache = new Map<string, CanvasGradient>();

// Clear gradient cache when canvas size changes
export const clearGradientCache = () => {
  gradientCache.clear();
};

export const getCachedGradient = (
  ctx: CanvasRenderingContext2D,
  key: string,
  createFn: () => CanvasGradient
): CanvasGradient => {
  if (!gradientCache.has(key)) {
    gradientCache.set(key, createFn());
  }
  return gradientCache.get(key)!;
};
