import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Post",
  description: "Write and publish a new blog post on NafhanBlog.",
};

export default function NewPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
