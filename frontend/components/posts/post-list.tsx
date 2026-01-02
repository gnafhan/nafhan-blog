'use client';

import { useEffect, useState } from 'react';
import { postsApi, PaginatedPosts } from '@/lib/api/posts';
import { PostCard } from './post-card';
import { Pagination } from '@/components/ui/pagination';

interface PostListProps {
  searchQuery?: string;
  category?: string;
}

export function PostList({ searchQuery, category }: PostListProps) {
  const [posts, setPosts] = useState<PaginatedPosts | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const limit = 5;

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await postsApi.getAll({
          page: currentPage,
          limit,
          search: searchQuery,
          category: category,
        });
        setPosts(data);
      } catch (err) {
        setError('Failed to load posts. Please try again later.');
        console.error('Error fetching posts:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [currentPage, searchQuery, category]);

  // Reset to page 1 when search query or category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, category]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Loading posts...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-destructive">{error}</div>
      </div>
    );
  }

  if (!posts || posts.data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">
          {searchQuery
            ? 'No posts found matching your search.'
            : 'No posts available yet.'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-1">
        {posts.data.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </div>

      {posts.meta.totalPages > 1 && (
        <Pagination
          currentPage={posts.meta.page}
          totalPages={posts.meta.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
