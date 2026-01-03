'use client';

import { useState } from 'react';
import { CommentWithReplies, commentsApi } from '@/lib/api/comments';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getImageUrl, getInitials } from '@/lib/utils/image';
import { MessageCircle, ChevronDown, ChevronUp, Heart } from 'lucide-react';

interface CommentItemProps {
  comment: CommentWithReplies;
  depth?: number;
  maxVisibleDepth?: number;
  onReply: (parentId: string, content: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onLikeUpdate?: (commentId: string, likes: string[], likesCount: number) => void;
}

export function CommentItem({ 
  comment, 
  depth = 0, 
  maxVisibleDepth = 3,
  onReply, 
  onUpdate, 
  onDelete,
  onLikeUpdate 
}: CommentItemProps) {
  const { user, isAuthenticated } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(depth < maxVisibleDepth);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);
  const [isLiked, setIsLiked] = useState(
    user?.id ? (comment.likes || []).includes(user.id) : false
  );
  const [isLiking, setIsLiking] = useState(false);

  // Safely access author properties with fallbacks
  const authorName = comment.author?.name || 'Unknown';
  const authorId = comment.author?._id || '';
  const authorProfilePicture = getImageUrl(comment.author?.profilePicture);
  
  // Check if current user is the author
  const userId = user?.id || '';
  const isAuthor = isAuthenticated && !!userId && !!authorId && userId === authorId;

  const formattedDate = new Date(comment.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const wasUpdated = comment.createdAt !== comment.updatedAt;

  const handleUpdate = async () => {
    if (!editContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onUpdate(comment._id, editContent);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    setIsSubmitting(true);
    try {
      await onDelete(comment._id);
    } catch (error) {
      console.error('Failed to delete comment:', error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleReply = async () => {
    if (!replyContent.trim()) return;

    setIsSubmitting(true);
    try {
      await onReply(comment._id, replyContent);
      setReplyContent('');
      setIsReplying(false);
      setShowReplies(true); // Show replies after adding one
    } catch (error) {
      console.error('Failed to post reply:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReply = () => {
    setReplyContent('');
    setIsReplying(false);
  };

  const handleLike = async () => {
    if (!isAuthenticated || isLiking) return;

    setIsLiking(true);
    try {
      const response = await commentsApi.toggleLike(comment._id);
      setLikesCount(response.likesCount);
      setIsLiked(response.liked);
      if (onLikeUpdate) {
        onLikeUpdate(comment._id, response.likes, response.likesCount);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const hasReplies = comment.replies && comment.replies.length > 0;
  const replyCount = comment.replies?.length || 0;

  // Calculate indentation based on depth (max 3 levels of visual indentation)
  const indentClass = depth > 0 ? 'ml-6 md:ml-10 pl-4 border-l-2 border-muted' : '';

  return (
    <div className={indentClass}>
      <div className="flex gap-4 py-4">
      {/* Avatar */}
      {authorProfilePicture ? (
        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={authorProfilePicture}
            alt={authorName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary">
            {getInitials(authorName)}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <p className="font-semibold text-sm">{authorName}</p>
            <p className="text-xs text-muted-foreground">
              {formattedDate}
              {wasUpdated && <span className="ml-1">(edited)</span>}
            </p>
          </div>
          
          {isAuthor && !isEditing && (
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isSubmitting}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Delete
              </Button>
            </div>
          )}
        </div>

        {/* Comment Body */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Edit your comment..."
              rows={3}
              disabled={isSubmitting}
              className="text-sm resize-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                disabled={isSubmitting || !editContent.trim()}
              >
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {comment.content}
            </p>
            
            {/* Reply Button */}
            {isAuthenticated && (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`h-7 px-2 text-xs gap-1 ${
                    isLiked 
                      ? 'text-red-500 hover:text-red-600' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Heart className={`h-3.5 w-3.5 ${isLiked ? 'fill-current' : ''}`} />
                  {likesCount > 0 && <span>{likesCount}</span>}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Reply
                </Button>
              </div>
            )}
            {/* Show likes count for non-authenticated users */}
            {!isAuthenticated && likesCount > 0 && (
              <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                <Heart className="h-3.5 w-3.5" />
                <span>{likesCount}</span>
              </div>
            )}
          </>
        )}

        {/* Inline Reply Form */}
        {isReplying && (
          <div className="mt-4 space-y-3">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              disabled={isSubmitting}
              className="text-sm resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleReply}
                disabled={isSubmitting || !replyContent.trim()}
              >
                {isSubmitting ? 'Posting...' : 'Reply'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCancelReply}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Nested Replies */}
    {hasReplies && (
      <div className="mt-2">
        {/* Show/Hide Replies Toggle */}
        {depth >= maxVisibleDepth - 1 && replyCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowReplies(!showReplies)}
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1 mb-2"
          >
            {showReplies ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Hide {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </>
            )}
          </Button>
        )}

        {/* Render Replies */}
        {showReplies && comment.replies.map((reply) => (
          <CommentItem
            key={reply._id}
            comment={reply}
            depth={depth + 1}
            maxVisibleDepth={maxVisibleDepth}
            onReply={onReply}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onLikeUpdate={onLikeUpdate}
          />
        ))}
      </div>
    )}
  </div>
  );
}
