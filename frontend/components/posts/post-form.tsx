"use client";

import { useState, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor, RichTextEditorRef } from "@/components/editor/rich-text-editor";
import { getImageUrl } from "@/lib/utils/image";
import { ImagePlus, X, Upload } from "lucide-react";

interface PostFormProps {
  initialData?: {
    title: string;
    content: string;
    description?: string;
    category?: string;
    thumbnail?: string;
  };
  onSubmit: (data: {
    title: string;
    content: string;
    description?: string;
    category?: string;
    thumbnail?: File;
  }) => Promise<void>;
  submitLabel?: string;
}

const categories = [
  { value: "Technology", icon: "💻", color: "bg-blue-500/10 text-blue-600" },
  { value: "Programming", icon: "👨‍💻", color: "bg-purple-500/10 text-purple-600" },
  { value: "Web Development", icon: "🌐", color: "bg-cyan-500/10 text-cyan-600" },
  { value: "Mobile Development", icon: "📱", color: "bg-green-500/10 text-green-600" },
  { value: "Data Science", icon: "📊", color: "bg-orange-500/10 text-orange-600" },
  { value: "AI & Machine Learning", icon: "🤖", color: "bg-pink-500/10 text-pink-600" },
  { value: "DevOps", icon: "⚙️", color: "bg-yellow-500/10 text-yellow-600" },
  { value: "Design", icon: "🎨", color: "bg-rose-500/10 text-rose-600" },
  { value: "Business", icon: "💼", color: "bg-slate-500/10 text-slate-600" },
  { value: "Other", icon: "📝", color: "bg-gray-500/10 text-gray-600" },
];

export function PostForm({
  initialData,
  onSubmit,
  submitLabel = "Publish Post",
}: PostFormProps) {
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Thumbnail state
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(
    initialData?.thumbnail ? getImageUrl(initialData.thumbnail) : null
  );
  const [isDragging, setIsDragging] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  
  const editorRef = useRef<RichTextEditorRef>(null);

  const validateImageFile = (file: File): string | null => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, WebP, and GIF images are allowed';
    }
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }
    return null;
  };

  const handleThumbnailSelect = useCallback((file: File) => {
    const error = validateImageFile(file);
    if (error) {
      setErrors(prev => ({ ...prev, thumbnail: error }));
      return;
    }
    
    setErrors(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { thumbnail: _thumbnail, ...rest } = prev;
      return rest;
    });
    setThumbnailFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleThumbnailSelect(file);
    }
  };

  const handleThumbnailRemove = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleThumbnailSelect(file);
    }
  }, [handleThumbnailSelect]);

  const validate = (content: string) => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 200) {
      newErrors.title = "Title must be less than 200 characters";
    }

    if (!content.trim()) {
      newErrors.content = "Content is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get content from editor ref
    const content = editorRef.current?.getContent() || "";

    if (!validate(content)) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        content: content.trim(),
        description: description.trim() || undefined,
        category: category || undefined,
        thumbnail: thumbnailFile || undefined,
      });
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategory = categories.find(c => c.value === category);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title Section */}
      <div className="space-y-3">
        <Label htmlFor="title" className="text-base font-semibold">
          Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter an engaging title for your post..."
          aria-invalid={!!errors.title}
          disabled={isSubmitting}
          className="text-lg h-12 font-medium"
        />
        <div className="flex justify-between items-center">
          {errors.title ? (
            <p className="text-sm text-destructive">{errors.title}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              A great title captures attention and summarizes your content
            </p>
          )}
          <span className={`text-xs ${title.length > 180 ? 'text-orange-500' : 'text-muted-foreground'}`}>
            {title.length}/200
          </span>
        </div>
      </div>

      {/* Description Section */}
      <div className="space-y-3">
        <Label htmlFor="description" className="text-base font-semibold">
          Description
          <span className="text-muted-foreground font-normal text-sm ml-2">(optional)</span>
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Write a brief summary that will appear in post previews..."
          disabled={isSubmitting}
          className="resize-none"
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          This will be shown in post cards and search results
        </p>
      </div>

      {/* Category Section */}
      <div className="space-y-3">
        <Label htmlFor="category" className="text-base font-semibold">
          Category
          <span className="text-muted-foreground font-normal text-sm ml-2">(optional)</span>
        </Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full h-11">
            <SelectValue placeholder="Choose a category for your post">
              {selectedCategory && (
                <span className="flex items-center gap-2">
                  <span>{selectedCategory.icon}</span>
                  <span>{selectedCategory.value}</span>
                </span>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <span className="flex items-center gap-2">
                  <span>{cat.icon}</span>
                  <span>{cat.value}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {category && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Selected:</span>
            <Badge variant="secondary" className={selectedCategory?.color}>
              {selectedCategory?.icon} {category}
            </Badge>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setCategory('')}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {/* Thumbnail Section */}
      <div className="space-y-3">
        <Label className="text-base font-semibold">
          Cover Image
          <span className="text-muted-foreground font-normal text-sm ml-2">(optional)</span>
        </Label>
        
        <div
          className={`relative border-2 border-dashed rounded-lg transition-colors ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : thumbnailPreview 
                ? 'border-muted' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {thumbnailPreview ? (
            <div className="relative aspect-video">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbnailPreview}
                alt="Thumbnail preview"
                className="w-full h-full object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="gap-1.5"
                >
                  <Upload className="h-4 w-4" />
                  Replace
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleThumbnailRemove}
                  className="gap-1.5"
                >
                  <X className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div 
              className="flex flex-col items-center justify-center py-12 px-4 cursor-pointer"
              onClick={() => thumbnailInputRef.current?.click()}
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground mb-1">
                {isDragging ? 'Drop image here' : 'Add a cover image'}
              </p>
              <p className="text-xs text-muted-foreground text-center">
                Drag and drop or click to upload<br />
                JPEG, PNG, WebP, GIF (max 5MB)
              </p>
            </div>
          )}
          
          <input
            ref={thumbnailInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleThumbnailChange}
            className="hidden"
            disabled={isSubmitting}
          />
        </div>
        
        {errors.thumbnail ? (
          <p className="text-sm text-destructive">{errors.thumbnail}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            This image will appear at the top of your post and in post cards
          </p>
        )}
      </div>

      {/* Content Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="content" className="text-base font-semibold">
            Content <span className="text-destructive">*</span>
          </Label>
        </div>

        <RichTextEditor
          ref={editorRef}
          initialContent={initialData?.content}
          placeholder="Write your post content here... Use the toolbar above for formatting or try Markdown shortcuts!"
          disabled={isSubmitting}
        />

        <div className="flex justify-between items-center">
          {errors.content ? (
            <p className="text-sm text-destructive">{errors.content}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              💡 Tip: Use the toolbar for formatting or type Markdown shortcuts like **bold** or *italic*
            </p>
          )}
        </div>
      </div>

      {/* Submit Section */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          size="lg"
          className="w-full sm:w-auto min-w-[150px]"
        >
          {isSubmitting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : (
            <>
              🚀 {submitLabel}
            </>
          )}
        </Button>
        <p className="text-xs text-muted-foreground self-center">
          Your post will be published immediately after submission
        </p>
      </div>
    </form>
  );
}
