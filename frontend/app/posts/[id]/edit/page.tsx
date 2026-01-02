"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PostForm } from "@/components/posts/post-form";
import { postsApi, Post } from "@/lib/api/posts";

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasRedirected = useRef(false);
  const hasFetched = useRef(false);

  // Fetch post data - only once
  useEffect(() => {
    if (hasFetched.current || !postId) return;
    
    const fetchPost = async () => {
      hasFetched.current = true;
      try {
        const postData = await postsApi.getById(postId);
        setPost(postData);
      } catch (err) {
        console.error("Failed to fetch post:", err);
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Failed to load post. Please try again.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  // Handle all redirects in a single effect to prevent loops
  useEffect(() => {
    // Don't redirect if already redirected or still loading
    if (hasRedirected.current || authLoading || isLoading) {
      return;
    }

    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      hasRedirected.current = true;
      router.replace(`/auth/login?redirect=/posts/${postId}/edit`);
      return;
    }

    // Check if user is the author
    if (post && user && post.author._id !== user.id) {
      hasRedirected.current = true;
      router.replace(`/posts/${postId}`);
      return;
    }
  }, [isAuthenticated, authLoading, isLoading, post, user, router, postId]);

  // Show loading state only on initial load
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-6 md:h-8 bg-muted rounded w-1/2 md:w-1/3 mb-6 md:mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-48 md:h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-destructive text-sm md:text-base">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated or not the author
  if (!isAuthenticated || !post || !user || post.author._id !== user.id) {
    return null;
  }

  const handleSubmit = async (data: {
    title: string;
    content: string;
    description?: string;
    category?: string;
  }) => {
    try {
      await postsApi.update(postId, data);
      // Redirect to the updated post
      router.push(`/posts/${postId}`);
    } catch (error) {
      // Handle error - could show a toast notification
      console.error("Failed to update post:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update post. Please try again.";
      alert(errorMessage);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Edit Post</h1>
        <PostForm
          key={post._id}
          initialData={{
            title: post.title,
            content: post.content,
            description: post.description,
            category: post.category,
          }}
          onSubmit={handleSubmit}
          submitLabel="Update Post"
        />
      </div>
    </div>
  );
}
