/**
 * Utility to resolve safe image URLs, ensuring leading slash or valid remote URL
 */
export function resolveImageUrl(imgPath: string | undefined | null): string {
  if (!imgPath) return '/Images/Oil Cooled Stabilizer.png';
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  if (imgPath.startsWith('/')) return imgPath;
  return `/${imgPath}`;
}
