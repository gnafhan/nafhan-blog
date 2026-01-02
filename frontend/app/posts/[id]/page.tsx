'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { postsApi, Post } from '@/lib/api/posts';
import { commentsApi, Comment } from '@/lib/api/comments';
import { useAuth } from '@/contexts/auth-context';
import { PostContent } from '@/components/posts/post-content';
import { CommentList } from '@/components/comments/comment-list';
import { CommentForm } from '@/components/comments/comment-form';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postId = params.id as string;
  const isAuthor = user?.id === post?.author._id;

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch post and comments in parallel
        const [postData, commentsData] = await Promise.all([
          postsApi.getById(postId),
          commentsApi.getByPost(postId),
        ]);

        setPost(postData);
        setComments(commentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    if (postId) {
      fetchPostAndComments();
    }
  }, [postId]);

  const handleDeletePost = async () => {
    if (!post || !confirm('Are you sure you want to delete this post?')) return;

    try {
      await postsApi.delete(post._id);
      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleEditPost = () => {
    if (!post) return;
    router.push(`/posts/${post._id}/edit`);
  };

  const handleCreateComment = async (content: string) => {
    try {
      const newComment = await commentsApi.create(postId, { content });
      setComments([...comments, newComment]);
    } catch (err) {
      throw err;
    }
  };

  const handleUpdateComment = async (id: string, content: string) => {
    try {
      const updatedComment = await commentsApi.update(id, { content });
      setComments(
        comments.map((comment) =>
          comment._id === id ? updatedComment : comment
        )
      );
    } catch (err) {
      throw err;
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      await commentsApi.delete(id);
      setComments(comments.filter((comment) => comment._id !== id));
    } catch (err) {
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-muted-foreground">Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <p className="text-destructive">{error || 'Post not found'}</p>
            <Button onClick={() => router.push('/')}>Back to Home</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Post Content */}
        <div className="space-y-4">
          <PostContent post={post} />
          
          {/* Edit/Delete buttons for author */}
          {isAuthor && (
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleEditPost}>
                Edit Post
              </Button>
              <Button variant="destructive" onClick={handleDeletePost}>
                Delete Post
              </Button>
            </div>
          )}
        </div>

        <Separator />

        {/* Comments Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">
            Comments ({comments.length})
          </h2>

          {/* Comment Form - only for authenticated users */}
          {isAuthenticated ? (
            <CommentForm onSubmit={handleCreateComment} />
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p>Please log in to comment</p>
            </div>
          )}

          {/* Comments List */}
          <CommentList
            comments={comments}
            onUpdate={handleUpdateComment}
            onDelete={handleDeleteComment}
          />
        </div>
      </div>
    </div>
  );
}
