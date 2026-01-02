import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Join NafhanBlog and start sharing your stories with the world. Create your free account today.",
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
