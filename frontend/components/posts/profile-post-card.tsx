'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { postsApi } from '@/lib/api/posts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { getImageUrl } from '@/lib/utils/image';

interface Post {
  _id: string;
  title: string;
  slug: string;
  content: string;
  description: string;
  category?: string;
  thumbnail?: string;
  claps?: number;
  createdAt: string;
  updatedAt: string;
}

interface ProfilePostCardProps {
  post: Post;
  onDelete?: (id: string) => void;
}

const categoryStyles: Record<string, { icon: string; color: string }> = {
  'Technology': { icon: '💻', color: 'bg-blue-500/10 text-blue-600' },
  'Programming': { icon: '👨‍💻', color: 'bg-purple-500/10 text-purple-600' },
  'Web Development': { icon: '🌐', color: 'bg-cyan-500/10 text-cyan-600' },
  'Mobile Development': { icon: '📱', color: 'bg-green-500/10 text-green-600' },
  'Data Science': { icon: '📊', color: 'bg-orange-500/10 text-orange-600' },
  'AI & Machine Learning': { icon: '🤖', color: 'bg-pink-500/10 text-pink-600' },
  'DevOps': { icon: '⚙️', color: 'bg-yellow-500/10 text-yellow-600' },
  'Design': { icon: '🎨', color: 'bg-rose-500/10 text-rose-600' },
  'Business': { icon: '💼', color: 'bg-slate-500/10 text-slate-600' },
  'Other': { icon: '📝', color: 'bg-gray-500/10 text-gray-600' },
};

export function ProfilePostCard({ post, onDelete }: ProfilePostCardProps) {
  const router = useRouter();
  
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const categoryStyle = post.category ? categoryStyles[post.category] : null;
  const wordCount = post.content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));
  const thumbnailUrl = getImageUrl(post.thumbnail);

  const handleEdit = () => {
    router.push(`/posts/${post.slug}/edit`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      await postsApi.delete(post._id);
      onDelete?.(post._id);
    } catch {
      alert('Failed to delete post');
    }
  };

  return (
    <Card className="group hover:shadow-md transition-all duration-200 flex flex-col">
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <Link href={`/posts/${post.slug}`} className="block">
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      ) : (
        <Link href={`/posts/${post.slug}`} className="block">
          <div className="aspect-video w-full bg-gradient-to-br from-primary/10 via-primary/5 to-muted flex items-center justify-center rounded-t-lg">
            <span className="text-3xl opacity-50">📝</span>
          </div>
        </Link>
      )}
      
      <CardHeader className="pb-3">
        {/* Category & Date */}
        <div className="flex items-center justify-between gap-2 mb-2">
          {post.category && categoryStyle ? (
            <Badge variant="secondary" className={`text-xs ${categoryStyle.color}`}>
              {categoryStyle.icon} {post.category}
            </Badge>
          ) : (
            <div />
          )}
          <span className="text-xs text-muted-foreground">{formattedDate}</span>
        </div>
        
        {/* Title */}
        <CardTitle className="text-lg line-clamp-2 group-hover:text-primary transition-colors">
          <Link href={`/posts/${post.slug}`} className="hover:underline">
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>

      {/* Description */}
      {post.description && (
        <CardContent className="py-0 flex-1">
          <p className="text-sm text-muted-foreground line-clamp-2">
            {post.description}
          </p>
        </CardContent>
      )}

      {/* Footer with stats and actions */}
      <CardFooter className="pt-4 mt-auto border-t flex items-center justify-between">
        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {(post.claps ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              👏 {post.claps}
            </span>
          )}
          <span>{readingTime} min read</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 px-2 text-xs"
          >
            ✏️ Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 px-2 text-xs text-destructive hover:text-destructive"
          >
            🗑️ Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
