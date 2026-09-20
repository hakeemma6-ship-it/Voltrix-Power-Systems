/**
 * Utility to resolve safe image URLs, ensuring leading slash or valid remote URL
 */
export function resolveImageUrl(imgPath: string | undefined | null): string {
  if (!imgPath) return 'https://res.cloudinary.com/a6ppmzjz/image/upload/v1789866584/voltrix_power_systems/Oil_Cooled_Stabilizer.png';
  if (imgPath.startsWith('http://') || imgPath.startsWith('https://')) return imgPath;
  if (imgPath.startsWith('/')) return imgPath;
  return `/${imgPath}`;
}
