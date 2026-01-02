'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { authApi } from '@/lib/api/auth';
import { postsApi, PaginatedPosts } from '@/lib/api/posts';
import { ProfilePostCard } from '@/components/posts/profile-post-card';
import { Pagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { getImageUrl } from '@/lib/utils/image';
import { Plus } from 'lucide-react';

interface ProfileData {
  _id: string;
  name: string;
  email: string;
  profilePicture?: string;
}

export default function ProfilePage() {
  const { isAuthenticated, isLoading: authLoading, updateUser } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<PaginatedPosts | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasRedirected = useRef(false);

  const limit = 4;

  // Handle redirect separately
  useEffect(() => {
    if (!hasRedirected.current && !authLoading && !isAuthenticated) {
      hasRedirected.current = true;
      router.replace('/auth/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await authApi.getProfile();
        setProfile(data as unknown as ProfileData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load profile';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchProfile();
    }
  }, [isAuthenticated, authLoading]);

  // Fetch posts with pagination
  useEffect(() => {
    const fetchPosts = async () => {
      if (!profile?._id) return;
      
      try {
        setPostsLoading(true);
        const data = await postsApi.getAll({
          page: currentPage,
          limit,
          author: profile._id,
        });
        setPosts(data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      } finally {
        setPostsLoading(false);
      }
    };

    if (profile?._id) {
      fetchPosts();
    }
  }, [profile?._id, currentPage]);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.match(/\/(jpg|jpeg|png|gif)$/)) {
      setUploadError('Only image files (JPG, PNG, GIF) are allowed');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      setUploadError(null);
      
      const updatedUser = await authApi.uploadProfilePicture(file);
      
      // Update profile state
      setProfile((prev) => prev ? { ...prev, profilePicture: updatedUser.profilePicture } : null);
      
      // Update auth context
      updateUser(updatedUser);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload profile picture';
      setUploadError(errorMessage);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleDeletePost = (id: string) => {
    setPosts((prev) => {
      if (!prev) return null;
      const newData = prev.data.filter((p) => p._id !== id);
      const newTotal = prev.meta.total - 1;
      const newTotalPages = Math.ceil(newTotal / limit);
      
      // If current page is now empty and not the first page, go to previous page
      if (newData.length === 0 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
      
      return {
        data: newData,
        meta: {
          ...prev.meta,
          total: newTotal,
          totalPages: newTotalPages,
        },
      };
    });
  };

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-center items-center min-h-[300px] md:min-h-[400px]">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="flex justify-center items-center min-h-[300px] md:min-h-[400px]">
          <p className="text-red-500 text-sm md:text-base">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl">Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
              {/* Profile Picture */}
              <div className="flex-shrink-0 w-full sm:w-auto flex flex-col items-center sm:items-start">
                <div className="relative">
                  {profile.profilePicture ? (
                    <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200 relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getImageUrl(profile.profilePicture) || ''}
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-300">
                      <span className="text-3xl text-gray-500">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  {/* Upload button overlay */}
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-2 w-24"
                    onClick={handleUploadClick}
                    disabled={isUploading}
                  >
                    {isUploading ? 'Uploading...' : 'Change'}
                  </Button>
                  
                  {/* Hidden file input */}
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                {uploadError && (
                  <p className="text-sm text-red-500 mt-2 text-center sm:text-left max-w-[120px]">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 space-y-3 w-full sm:w-auto">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Name
                  </label>
                  <p className="text-base md:text-lg break-words">{profile.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <p className="text-base md:text-lg break-all">{profile.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User's Posts */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 md:mb-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold">My Posts</h2>
              {posts && posts.meta.total > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {posts.meta.total} post{posts.meta.total !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <Button onClick={() => router.push('/posts/new')} className="w-full sm:w-auto gap-2">
              <Plus className="h-4 w-4" />
              Create New Post
            </Button>
          </div>

          {postsLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Loading posts...</p>
            </div>
          ) : !posts || posts.data.length === 0 ? (
            <Card>
              <CardContent className="py-8 md:py-12 text-center">
                <p className="text-muted-foreground mb-4">
                  You haven&apos;t created any posts yet.
                </p>
                <Button onClick={() => router.push('/posts/new')} className="w-full sm:w-auto gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Post
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:gap-6 sm:grid-cols-2">
                {posts.data.map((post) => (
                  <ProfilePostCard 
                    key={post._id} 
                    post={post}
                    onDelete={handleDeletePost}
                  />
                ))}
              </div>

              {posts.meta.totalPages > 1 && (
                <Pagination
                  currentPage={posts.meta.page}
                  totalPages={posts.meta.totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
