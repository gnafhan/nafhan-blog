'use client';

import Link from 'next/link';
import { Post } from '@/lib/api/posts';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getImageUrl } from '@/lib/utils/image';

interface PostCardProps {
  post: Post;
}

const categoryStyles: Record<string, { icon: string; color: string }> = {
  'Technology': { icon: '💻', color: 'bg-blue-500/10 text-blue-600 hover:bg-blue-500/20' },
  'Programming': { icon: '👨‍💻', color: 'bg-purple-500/10 text-purple-600 hover:bg-purple-500/20' },
  'Web Development': { icon: '🌐', color: 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20' },
  'Mobile Development': { icon: '📱', color: 'bg-green-500/10 text-green-600 hover:bg-green-500/20' },
  'Data Science': { icon: '📊', color: 'bg-orange-500/10 text-orange-600 hover:bg-orange-500/20' },
  'AI & Machine Learning': { icon: '🤖', color: 'bg-pink-500/10 text-pink-600 hover:bg-pink-500/20' },
  'DevOps': { icon: '⚙️', color: 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' },
  'Design': { icon: '🎨', color: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20' },
  'Business': { icon: '💼', color: 'bg-slate-500/10 text-slate-600 hover:bg-slate-500/20' },
  'Other': { icon: '📝', color: 'bg-gray-500/10 text-gray-600 hover:bg-gray-500/20' },
};

export function PostCard({ post }: PostCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const authorName = post.author?.name || 'Unknown Author';
  const authorInitial = authorName.charAt(0).toUpperCase();
  const categoryStyle = post.category ? categoryStyles[post.category] : null;
  const thumbnailUrl = getImageUrl(post.thumbnail);

  // Calculate reading time (rough estimate: 200 words per minute)
  const wordCount = post.content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  // Use slug if available, fallback to _id for older posts
  const postUrl = `/posts/${post.slug || post._id}`;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 hover:border-primary/20 overflow-hidden">
      {/* Thumbnail */}
      {thumbnailUrl ? (
        <Link href={postUrl} className="block">
          <div className="aspect-video w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnailUrl}
              alt={post.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </Link>
      ) : (
        <Link href={postUrl} className="block">
          <div className="aspect-video w-full bg-gradient-to-br from-primary/10 via-primary/5 to-muted flex items-center justify-center">
            <span className="text-4xl opacity-50">📝</span>
          </div>
        </Link>
      )}
      
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {post.category && categoryStyle && (
              <Badge 
                variant="secondary" 
                className={`mb-2 text-xs ${categoryStyle.color}`}
              >
                {categoryStyle.icon} {post.category}
              </Badge>
            )}
            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
              <Link href={postUrl} className="hover:underline">
                {post.title}
              </Link>
            </CardTitle>
          </div>
        </div>
        <CardDescription className="flex items-center gap-2 mt-2">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
              {authorInitial}
            </div>
            <span className="font-medium text-foreground/80">{authorName}</span>
          </div>
          <span className="text-muted-foreground">•</span>
          <span>{formattedDate}</span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{readingTime} min read</span>
        </CardDescription>
      </CardHeader>
      
      {post.description && (
        <CardContent className="pb-3">
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {post.description}
          </p>
        </CardContent>
      )}
      
      <CardFooter className="pt-3 border-t bg-muted/30">
        <div className="flex items-center justify-between w-full">
          <Link href={postUrl}>
            <Button 
              variant="ghost" 
              size="sm"
              className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
            >
              Read article →
            </Button>
          </Link>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {(post.claps ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <span>👏</span>
                <span>{post.claps}</span>
              </span>
            )}
            <span className="flex items-center gap-1">
              <span>📖</span>
              <span>{wordCount} words</span>
            </span>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
