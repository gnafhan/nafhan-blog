'use client';

import { useState } from 'react';
import { SearchBar } from '@/components/ui/search-bar';
import { PostList } from '@/components/posts/post-list';

export default function Page() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">Blog Posts</h1>
          <p className="text-muted-foreground text-lg">
            Discover articles, tutorials, and insights from our community
          </p>
        </div>

        {/* Search Bar */}
        <SearchBar onSearch={setSearchQuery} />

        {/* Post List */}
        <PostList searchQuery={searchQuery} />
      </div>
    </div>
  );
}