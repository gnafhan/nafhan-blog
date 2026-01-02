/**
 * Get full image URL from a path
 * Handles both relative paths (from backend) and absolute URLs
 */
export function getImageUrl(path?: string | null): string | null {
  if (!path) return null;
  
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // Otherwise, prepend the backend URL
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  return `${backendUrl}${path}`;
}

/**
 * Get initials from a name
 */
export function getInitials(name?: string | null): string {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
}
