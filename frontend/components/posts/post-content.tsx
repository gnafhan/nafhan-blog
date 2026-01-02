import ReactMarkdown from 'react-markdown';
import { Post } from '@/lib/api/posts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface PostContentProps {
  post: Post;
}

export function PostContent({ post }: PostContentProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const updatedDate = new Date(post.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const wasUpdated = post.createdAt !== post.updatedAt;

  return (
    <Card>
      <CardHeader>
        <div className="space-y-4">
          <div>
            <CardTitle className="text-3xl mb-2">{post.title}</CardTitle>
            {post.category && (
              <Badge variant="secondary" className="mb-2">
                {post.category}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {post.author.profilePicture ? (
              <img
                src={post.author.profilePicture}
                alt={post.author.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-medium">
                  {post.author.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{post.author.name}</p>
              <p className="text-xs">
                Published {formattedDate}
                {wasUpdated && ` • Updated ${updatedDate}`}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
