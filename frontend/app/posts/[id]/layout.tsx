import type { Metadata } from "next";

// API URL for server-side fetching
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Post {
  _id: string;
  title: string;
  description: string;
  content: string;
  category?: string;
  author: {
    name: string;
  };
}

async function getPost(id: string): Promise<Post | null> {
  try {
    const res = await fetch(`${API_URL}/posts/${id}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: "Post Not Found",
      description: "The requested post could not be found.",
    };
  }

  const description = post.description || post.content.substring(0, 160).replace(/\n/g, ' ') + '...';

  return {
    title: post.title,
    description,
    authors: [{ name: post.author?.name || 'Unknown Author' }],
    openGraph: {
      type: "article",
      title: post.title,
      description,
      siteName: "NafhanBlog",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description,
    },
  };
}

export default function PostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
