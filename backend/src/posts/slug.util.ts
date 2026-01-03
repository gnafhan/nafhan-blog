import { Model } from 'mongoose';
import { PostDocument } from './schemas/post.schema';

/**
 * Generates a URL-safe slug from a title.
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters (keeps only alphanumeric and hyphens)
 * - Trims leading/trailing hyphens
 * - Collapses multiple hyphens into single hyphen
 * - Returns 'untitled' if result is empty
 */
export function generateSlug(title: string): string {
  const slug = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove all except lowercase letters, numbers, spaces, hyphens
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Multiple hyphens to single
    .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens

  // Return 'untitled' if slug is empty (title had only special characters)
  return slug || 'untitled';
}

/**
 * Ensures the slug is unique by appending a numeric suffix if needed.
 * Checks the database for existing slugs and increments suffix until unique.
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  postModel: Model<PostDocument>,
  excludePostId?: string,
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  // Build query to check for existing slug
  const buildQuery = (slugToCheck: string) => {
    const query: Record<string, unknown> = { slug: slugToCheck };
    if (excludePostId) {
      query._id = { $ne: excludePostId };
    }
    return query;
  };

  // Check if slug exists
  while (await postModel.exists(buildQuery(slug))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}
