import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Header } from "@/components/layout/header";

const outfit = Outfit({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "NafhanBlog - Share Your Stories",
    template: "%s | NafhanBlog",
  },
  description: "A modern blog platform to share your thoughts, stories, and ideas with the world.",
  keywords: ["blog", "writing", "stories", "articles", "technology", "programming"],
  authors: [{ name: "NafhanBlog Team" }],
  icons: {
    icon: [
      { url: "/logo.png", sizes: "any" },
      { url: "/logo.png", type: "image/png", sizes: "32x32" },
      { url: "/logo.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/logo.png",
    apple: [
      { url: "/logo.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "NafhanBlog",
    title: "NafhanBlog - Share Your Stories",
    description: "A modern blog platform to share your thoughts, stories, and ideas with the world.",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "NafhanBlog - Share Your Stories",
    description: "A modern blog platform to share your thoughts, stories, and ideas with the world.",
    images: ["/logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <Header />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
