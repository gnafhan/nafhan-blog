'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { postsApi, Post } from '@/lib/api/posts';
import { commentsApi, CommentWithReplies } from '@/lib/api/comments';
import { useAuth } from '@/contexts/auth-context';
import { PostContent } from '@/components/posts/post-content';
import { CommentList } from '@/components/comments/comment-list';
import { CommentForm } from '@/components/comments/comment-form';
import { ClapButton } from '@/components/posts/clap-button';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { getImageUrl, getInitials } from '@/lib/utils/image';
import { 
  Pencil, 
  Trash2, 
  BookOpen, 
  Clock, 
  MessageCircle,
  ArrowLeft,
  FileQuestion,
  Monitor,
  Code,
  Globe,
  Smartphone,
  BarChart3,
  Bot,
  Settings,
  Palette,
  Briefcase,
  FileText
} from 'lucide-react';

const categoryStyles: Record<string, { icon: typeof Monitor; color: string }> = {
  'Technology': { icon: Monitor, color: 'bg-blue-500/10 text-blue-600 border-blue-200' },
  'Programming': { icon: Code, color: 'bg-purple-500/10 text-purple-600 border-purple-200' },
  'Web Development': { icon: Globe, color: 'bg-cyan-500/10 text-cyan-600 border-cyan-200' },
  'Mobile Development': { icon: Smartphone, color: 'bg-green-500/10 text-green-600 border-green-200' },
  'Data Science': { icon: BarChart3, color: 'bg-orange-500/10 text-orange-600 border-orange-200' },
  'AI & Machine Learning': { icon: Bot, color: 'bg-pink-500/10 text-pink-600 border-pink-200' },
  'DevOps': { icon: Settings, color: 'bg-yellow-500/10 text-yellow-600 border-yellow-200' },
  'Design': { icon: Palette, color: 'bg-rose-500/10 text-rose-600 border-rose-200' },
  'Business': { icon: Briefcase, color: 'bg-slate-500/10 text-slate-600 border-slate-200' },
  'Other': { icon: FileText, color: 'bg-gray-500/10 text-gray-600 border-gray-200' },
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const slug = params.slug as string;
  
  const getAuthorId = (author: Post['author'] | string | undefined): string => {
    if (!author) return '';
    if (typeof author === 'string') return author;
    return author._id || '';
  };
  
  const userId = user?.id || '';
  const authorId = getAuthorId(post?.author);
  const isAuthor = isAuthenticated && !!userId && !!authorId && userId === authorId;

  useEffect(() => {
    const fetchPostAndComments = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch post by slug
        const postData = await postsApi.getBySlug(slug);
        setPost(postData);

        // Fetch comments using the post ID
        const commentsData = await commentsApi.getByPost(postData._id);
        setComments(commentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load post');
      } finally {
        setIsLoading(false);
      }
    };

    if (slug) {
      fetchPostAndComments();
    }
  }, [slug]);

  // Helper function to count all comments including nested replies
  const countAllComments = (comments: CommentWithReplies[]): number => {
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies ? countAllComments(comment.replies) : 0);
    }, 0);
  };

  const totalCommentCount = countAllComments(comments);


  const handleDeletePost = async () => {
    if (!post || !confirm('Are you sure you want to delete this post? This action cannot be undone.')) return;

    try {
      await postsApi.delete(post._id);
      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete post');
    }
  };

  const handleEditPost = () => {
    if (!post) return;
    router.push(`/posts/${post.slug}/edit`);
  };

  const handleCreateComment = async (content: string) => {
    if (!post) return;
    const newComment = await commentsApi.create(post._id, { content });
    // Add new top-level comment with empty replies array
    const commentWithReplies: CommentWithReplies = { ...newComment, replies: [] };
    setComments([commentWithReplies, ...comments]);
  };

  const handleReplyToComment = async (parentId: string, content: string) => {
    if (!post) return;
    const newReply = await commentsApi.create(post._id, { content, parentCommentId: parentId });
    const replyWithReplies: CommentWithReplies = { ...newReply, replies: [] };
    
    // Helper function to add reply to the correct parent in the tree
    const addReplyToTree = (comments: CommentWithReplies[]): CommentWithReplies[] => {
      return comments.map(comment => {
        if (comment._id === parentId) {
          return {
            ...comment,
            replies: [...comment.replies, replyWithReplies]
          };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: addReplyToTree(comment.replies)
          };
        }
        return comment;
      });
    };
    
    setComments(addReplyToTree(comments));
  };

  const handleUpdateComment = async (id: string, content: string) => {
    const updatedComment = await commentsApi.update(id, { content });
    
    // Helper function to update comment in the tree
    const updateInTree = (comments: CommentWithReplies[]): CommentWithReplies[] => {
      return comments.map(comment => {
        if (comment._id === id) {
          return { ...comment, ...updatedComment };
        }
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: updateInTree(comment.replies)
          };
        }
        return comment;
      });
    };
    
    setComments(updateInTree(comments));
  };

  const handleDeleteComment = async (id: string) => {
    await commentsApi.delete(id);
    
    // Helper function to remove comment from the tree
    const removeFromTree = (comments: CommentWithReplies[]): CommentWithReplies[] => {
      return comments
        .filter(comment => comment._id !== id)
        .map(comment => ({
          ...comment,
          replies: comment.replies ? removeFromTree(comment.replies) : []
        }));
    };
    
    setComments(removeFromTree(comments));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="animate-pulse space-y-8">
              <div className="h-6 bg-muted rounded w-24" />
              <div className="h-12 bg-muted rounded w-full" />
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32" />
                  <div className="h-3 bg-muted rounded w-24" />
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded" />
                <div className="h-4 bg-muted rounded w-5/6" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md w-full mx-4 border-0 shadow-lg">
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <FileQuestion className="h-16 w-16 mx-auto text-muted-foreground" />
            <h2 className="text-2xl font-bold">Post Not Found</h2>
            <p className="text-muted-foreground">
              {error || "The post you're looking for doesn't exist or has been removed."}
            </p>
            <Link href="/">
              <Button className="mt-4 gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const categoryStyle = post.category ? categoryStyles[post.category] : null;
  const CategoryIcon = categoryStyle?.icon || FileText;
  const authorName = post.author?.name || 'Unknown Author';
  const authorProfilePicture = getImageUrl(post.author?.profilePicture);
  const thumbnailUrl = getImageUrl(post.thumbnail);
  const wordCount = post.content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });


  return (
    <div className="min-h-screen bg-background">
      <article className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto">
          {/* Category */}
          {post.category && categoryStyle && (
            <div className="mb-6">
              <Badge variant="outline" className={`${categoryStyle.color} border px-3 py-1 gap-1.5`}>
                <CategoryIcon className="h-3.5 w-3.5" />
                {post.category}
              </Badge>
            </div>
          )}

          {/* Cover Image */}
          {thumbnailUrl && (
            <div className="mb-8 -mx-4 md:mx-0">
              <div className="aspect-video w-full overflow-hidden md:rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={thumbnailUrl}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-[42px] font-bold leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          {/* Description/Subtitle */}
          {post.description && (
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed mb-8">
              {post.description}
            </p>
          )}

          {/* Author Info */}
          <div className="flex items-center justify-between flex-wrap gap-4 py-6 border-y">
            <div className="flex items-center gap-4">
              {authorProfilePicture ? (
                <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-primary/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={authorProfilePicture}
                    alt={authorName}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-semibold text-lg">
                  {getInitials(authorName)}
                </div>
              )}
              
              <div>
                <p className="font-semibold text-foreground">{authorName}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{formattedDate}</span>
                  <span>·</span>
                  <span>{readingTime} min read</span>
                </div>
              </div>
            </div>

            {isAuthor && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleEditPost} className="gap-1.5">
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button variant="outline" size="sm" onClick={handleDeletePost} className="gap-1.5 text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>

          {/* Post Content */}
          <div className="py-8 md:py-12">
            <PostContent post={post} />
          </div>

          {/* Post Footer */}
          <div className="py-6 border-t">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <ClapButton postId={post._id} initialClaps={post.claps || 0} />
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" />
                  {wordCount} words
                </span>
                <span>·</span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {readingTime} min read
                </span>
              </div>
            </div>
          </div>

          <Separator className="my-8" />

          {/* Comments Section */}
          <section className="space-y-8">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">Responses</h2>
              <span className="text-muted-foreground">({totalCommentCount})</span>
            </div>

            {isAuthenticated ? (
              <div className="bg-muted/30 rounded-xl p-6">
                <CommentForm onSubmit={handleCreateComment} />
              </div>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center space-y-4">
                  <p className="text-muted-foreground">
                    Sign in to join the conversation
                  </p>
                  <div className="flex justify-center gap-3">
                    <Link href="/auth/login">
                      <Button variant="outline">Sign In</Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button>Create Account</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}

            {comments.length > 0 ? (
              <div className="space-y-4">
                <CommentList
                  comments={comments}
                  onReply={handleReplyToComment}
                  onUpdate={handleUpdateComment}
                  onDelete={handleDeleteComment}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  No responses yet. Be the first to share your thoughts!
                </p>
              </div>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
