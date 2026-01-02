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

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{post.title}</CardTitle>
        <CardDescription>
          By {post.author.name} • {formattedDate}
        </CardDescription>
      </CardHeader>
      {post.description && (
        <CardContent>
          <p className="text-muted-foreground">{post.description}</p>
        </CardContent>
      )}
      <CardFooter>
        <Link href={`/posts/${post._id}`}>
          <Button variant="outline">Read more</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
