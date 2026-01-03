'use client';

import { CommentWithReplies } from '@/lib/api/comments';
import { CommentItem } from './comment-item';

interface CommentListProps {
  comments: CommentWithReplies[];
  onReply: (parentId: string, content: string) => Promise<void>;
  onUpdate: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  maxVisibleDepth?: number;
}

export function CommentList({ 
  comments, 
  onReply,
  onUpdate, 
  onDelete,
  maxVisibleDepth = 3
}: CommentListProps) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No comments yet. Be the first to comment!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 divide-y divide-border">
      {comments.map((comment) => (
        <CommentItem
          key={comment._id}
          comment={comment}
          depth={0}
          maxVisibleDepth={maxVisibleDepth}
          onReply={onReply}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
