'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SearchBar } from '@/components/ui/search-bar';
import { PostList } from '@/components/posts/post-list';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { 
  PenSquare, 
  ArrowRight,
  BookOpen,
  Users,
  Lightbulb,
  Sparkles,
  Monitor,
  Code,
  Globe,
  Smartphone,
  BarChart3,
  Bot,
  Settings,
  Palette,
  Briefcase,
  LayoutGrid
} from 'lucide-react';

const categories = [
  { value: '', label: 'All', icon: LayoutGrid },
  { value: 'Technology', label: 'Technology', icon: Monitor },
  { value: 'Programming', label: 'Programming', icon: Code },
  { value: 'Web Development', label: 'Web Dev', icon: Globe },
  { value: 'Mobile Development', label: 'Mobile', icon: Smartphone },
  { value: 'Data Science', label: 'Data Science', icon: BarChart3 },
  { value: 'AI & Machine Learning', label: 'AI/ML', icon: Bot },
  { value: 'DevOps', label: 'DevOps', icon: Settings },
  { value: 'Design', label: 'Design', icon: Palette },
  { value: 'Business', label: 'Business', icon: Briefcase },
];

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background border-b">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container mx-auto px-4 py-12 md:py-20 relative">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              <span>Welcome to NafhanBlog</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text">
              Discover Stories That
              <span className="block text-primary">Inspire & Educate</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Explore articles, tutorials, and insights from our community of writers. 
              Share your knowledge and connect with like-minded people.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              {isAuthenticated ? (
                <Link href="/posts/new">
                  <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all">
                    <PenSquare className="h-5 w-5" />
                    Start Writing
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/auth/register">
                    <Button size="lg" className="w-full sm:w-auto gap-2 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all">
                      Get Started Free
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Sign In
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span>100+ Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>Growing Community</span>
              </div>
              <div className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                <span>Fresh Ideas Daily</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold">Latest Posts</h2>
              <p className="text-muted-foreground mt-1">
                Fresh content from our community
              </p>
            </div>
            
            {/* Search Bar */}
            <div className="w-full md:w-80">
              <SearchBar onSearch={setSearchQuery} />
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="text-sm gap-1.5"
                >
                  <IconComponent className="h-4 w-4" />
                  {cat.label}
                </Button>
              );
            })}
          </div>

          {/* Active Filters */}
          {(searchQuery || selectedCategory) && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Filters:</span>
              {searchQuery && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                  Search: &quot;{searchQuery}&quot;
                </span>
              )}
              {selectedCategory && (
                <span className="bg-primary/10 text-primary px-2 py-1 rounded">
                  Category: {selectedCategory}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('');
                }}
                className="text-xs h-7"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Post List */}
          <PostList searchQuery={searchQuery} category={selectedCategory} />
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="border-t bg-muted/30">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h2 className="text-2xl md:text-3xl font-bold">
                Ready to Share Your Story?
              </h2>
              <p className="text-muted-foreground text-lg">
                Join our community of writers and share your knowledge with the world.
                It&apos;s free to get started!
              </p>
              <Link href="/auth/register">
                <Button size="lg" className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                  Create Your Account
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
