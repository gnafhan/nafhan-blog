'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { getImageUrl, getInitials } from '@/lib/utils/image';

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
}

export function CommentForm({ onSubmit }: CommentFormProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const userProfilePicture = getImageUrl(user?.profilePicture);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(content);
      setContent('');
      setIsFocused(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        {/* User Avatar */}
        {userProfilePicture ? (
          <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={userProfilePicture}
              alt={user?.name || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center flex-shrink-0 text-primary-foreground">
            <span className="text-sm font-semibold">
              {getInitials(user?.name)}
            </span>
          </div>
        )}

        {/* Input Area */}
        <div className="flex-1">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder="What are your thoughts?"
            rows={isFocused || content ? 4 : 2}
            disabled={isSubmitting}
            className="resize-none transition-all duration-200 text-sm"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive ml-14">{error}</p>
      )}

      {(isFocused || content) && (
        <div className="flex justify-end gap-2 ml-14">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setContent('');
              setIsFocused(false);
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            size="sm"
            disabled={isSubmitting || !content.trim()}
          >
            {isSubmitting ? 'Posting...' : 'Respond'}
          </Button>
        </div>
      )}
    </form>
  );
}
