"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { PostForm } from "@/components/posts/post-form";
import { postsApi } from "@/lib/api/posts";

export default function NewPostPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const hasRedirected = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!hasRedirected.current && !isLoading && !isAuthenticated) {
      hasRedirected.current = true;
      router.replace("/auth/login?redirect=/posts/new");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
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

  // Don't render form if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleSubmit = async (data: {
    title: string;
    content: string;
    description?: string;
    category?: string;
    thumbnail?: File;
  }) => {
    try {
      const post = await postsApi.create(data);
      // Redirect to the newly created post using slug
      router.push(`/posts/${post.slug}`);
    } catch (error) {
      // Handle error - could show a toast notification
      console.error("Failed to create post:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to create post. Please try again.";
      alert(errorMessage);
      throw error;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8">Create New Post</h1>
        <PostForm onSubmit={handleSubmit} submitLabel="Create Post" />
      </div>
    </div>
  );
}
