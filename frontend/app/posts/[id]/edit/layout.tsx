import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Post",
  description: "Edit your blog post on NafhanBlog.",
};

export default function EditPostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
