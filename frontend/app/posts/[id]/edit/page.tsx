"use client";

import { useEffect, useState } from "react";
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

  // Fetch post data
  useEffect(() => {
    const fetchPost = async () => {
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

    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push(`/auth/login?redirect=/posts/${postId}/edit`);
    }
  }, [isAuthenticated, authLoading, router, postId]);

  // Check if user is the author
  useEffect(() => {
    if (!authLoading && !isLoading && post && user) {
      if (post.author._id !== user.id) {
        // User is not the author, redirect to post detail
        router.push(`/posts/${postId}`);
      }
    }
  }, [post, user, authLoading, isLoading, router, postId]);

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-10 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4">
            <p className="text-destructive">{error}</p>
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
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Edit Post</h1>
        <PostForm
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
