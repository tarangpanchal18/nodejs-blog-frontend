import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { blogApi } from '@/lib/api';
import { Header } from '@/components/Header';
import { TagInput } from '@/components/TagInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'react-toastify';
import { Eye, EyeOff, Send, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const MIN_TITLE_LENGTH = 10;
const MIN_DESCRIPTION_LENGTH = 10;

export default function Write() {
  const { slug } = useParams<{ slug?: string }>();
  const isEditMode = !!slug;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [isPreview, setIsPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();
  const hasPopulatedForm = useRef(false);

  // Fetch blog data if in edit mode
  const { data: existingBlog, isLoading: isLoadingBlog } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      if (!slug) return null;
      const response = await blogApi.getBlogBySlug(slug);
      if (response.data) return response.data;
      throw new Error(response.error);
    },
    enabled: isEditMode && !!slug,
    refetchOnWindowFocus: false, // Prevent refetch when switching tabs
    refetchOnMount: false, // Prevent refetch on component remount
  });

  // Populate form when blog data is loaded (only once)
  useEffect(() => {
    if (existingBlog && !hasPopulatedForm.current) {
      setTitle(existingBlog.title);
      setDescription(existingBlog.description);
      setContent(existingBlog.content);
      setTags(existingBlog.tags);
      setCoverImage(existingBlog.coverImage || '');
      setStatus(existingBlog.status);
      hasPopulatedForm.current = true;
    }
  }, [existingBlog]);

  // Reset the flag when slug changes (navigating to different blog)
  useEffect(() => {
    hasPopulatedForm.current = false;
  }, [slug]);

  const titleError = title.trim().length > 0 && title.trim().length < MIN_TITLE_LENGTH;
  const descriptionError = description.trim().length > 0 && description.trim().length < MIN_DESCRIPTION_LENGTH;

  const handlePublish = async () => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    toast.dismiss(); // Clear any existing toasts
    
    if (!title.trim()) {
      toast.error('Please add a title for your blog post.');
      return;
    }

    if (title.trim().length < MIN_TITLE_LENGTH) {
      toast.error(`Title must be at least ${MIN_TITLE_LENGTH} characters long.`);
      return;
    }

    if (!description.trim()) {
      toast.error('Please add a description for your blog post.');
      return;
    }

    if (description.trim().length < MIN_DESCRIPTION_LENGTH) {
      toast.error(`Description must be at least ${MIN_DESCRIPTION_LENGTH} characters long.`);
      return;
    }

    if (!content.trim()) {
      toast.error('Please add some content to your blog post.');
      return;
    }

    setIsSubmitting(true);

    if (isEditMode && slug) {
      // Update existing blog
      const response = await blogApi.updateBlog(slug, {
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        tags,
        coverImage: coverImage.trim(),
        status,
      });

      if (response.error) {
        toast.error(response.error);
        setIsSubmitting(false);
        return;
      }

      toast.success('Your blog post has been updated.');

      if (response.data) {
        navigate(`/blog/${response.data.slug}`);
      } else {
        navigate('/my-blogs');
      }
    } else {
      // Create new blog
      const response = await blogApi.createBlog({
        title: title.trim(),
        description: description.trim(),
        content: content.trim(),
        tags,
        coverImage: coverImage.trim(),
        status,
      });

      if (response.error) {
        toast.error(response.error);
        setIsSubmitting(false);
        return;
      }

      if (status === 'published') {
        toast.success('Submitted for Review! Your blog post has been submitted for moderation and will be published after approval.');
      } else {
        toast.success('Saved as draft! Your blog post has been saved as draft.');
      }

      if (response.data) {
        navigate(`/blog/${response.data.slug}`);
      } else {
        navigate('/my-blogs');
      }
    }
  };

  if (isEditMode && isLoadingBlog) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <div className="flex items-center justify-center py-12">
            <p className="text-muted-foreground">Loading blog...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-4xl px-4 py-8">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
          <h1 className="font-serif text-xl font-semibold">
            {isEditMode ? 'Edit your story' : 'Write your story'}
          </h1>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(!isPreview)}
              className="gap-2"
            >
              {isPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isPreview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              size="lg"
              onClick={handlePublish}
              disabled={isSubmitting}
              className="gap-2 font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              <Send className="h-4 w-4" />
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : status === 'published' ? 'Publishing...' : 'Saving...')
                : (isEditMode ? 'Update Story' : status === 'published' ? 'Publish Story' : 'Save as Draft')
              }
            </Button>
          </div>
        </div>

        {isPreview ? (
          /* Preview Mode */
          <article className="max-w-[680px] mx-auto">
            <h1 className="font-serif text-4xl font-bold text-foreground mb-4">
              {title || 'Untitled'}
            </h1>
            {description && (
              <p className="text-xl text-muted-foreground mb-8">{description}</p>
            )}
            {coverImage && (
              <img src={coverImage} alt={title || 'Blog cover'} className="w-full h-auto rounded-lg mb-8" />
            )}
            <div className="prose-blog">
              <ReactMarkdown>{content || '*No content yet...*'}</ReactMarkdown>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-8 border-t border-border">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </article>
        ) : (
          /* Edit Mode */
          <div className="space-y-8">
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                type="text"
                placeholder="Enter your blog title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={
                  titleError 
                    ? 'border-destructive focus-visible:ring-destructive' 
                    : ''
                }
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {title.trim().length > 0 ? (
                    <span className={titleError ? 'text-destructive flex items-center gap-1' : 'text-muted-foreground'}>
                      {titleError && <AlertCircle className="h-3 w-3 inline" />}
                      {title.trim().length} / {MIN_TITLE_LENGTH} characters
                      {titleError && ' (minimum required)'}
                    </span>
                  ) : (
                    `Minimum ${MIN_TITLE_LENGTH} characters required`
                  )}
                </p>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Description</label>
              <Input
                type="text"
                placeholder="Write a compelling description for your blog post..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className={
                  descriptionError 
                    ? 'border-destructive focus-visible:ring-destructive' 
                    : ''
                }
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {description.trim().length > 0 ? (
                    <span className={descriptionError ? 'text-destructive flex items-center gap-1' : 'text-muted-foreground'}>
                      {descriptionError && <AlertCircle className="h-3 w-3 inline" />}
                      {description.trim().length} / {MIN_DESCRIPTION_LENGTH} characters
                      {descriptionError && ' (minimum required)'}
                    </span>
                  ) : (
                    `Minimum ${MIN_DESCRIPTION_LENGTH} characters required`
                  )}
                </p>
              </div>
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Cover Image URL</label>
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste or enter a URL for your blog cover image (optional)
              </p>
              {coverImage && (
                <div className="mt-2">
                  <img 
                    src={coverImage} 
                    alt="Cover preview" 
                    className="w-full h-48 object-cover rounded-md border border-border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Tags - Moved to top, below description */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Tags</label>
                <span className="text-xs text-muted-foreground">
                  {tags.length} / 5 tags
                </span>
              </div>
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder="Add tags to help readers find your story..."
                maxTags={5}
              />
              <p className="text-xs text-muted-foreground">
                Add up to 5 relevant tags to help readers discover your story
              </p>
            </div>

            {/* Status Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Status</label>
              <Select value={status} onValueChange={(value: 'draft' | 'published') => setStatus(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {status === 'published' 
                  ? 'Your post will be submitted for review and published after approval' 
                  : 'Draft posts are only visible to you'}
              </p>
            </div>

            {/* Content Editor and Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Content (Markdown supported)
                </label>
                <Textarea
                  placeholder="Start writing your story...

You can use Markdown:
- **bold** and *italic*
- # Headings
- > Blockquotes
- `code` and code blocks
- [links](url)
- Lists and more!"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="min-h-[400px] font-mono text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Live Preview
                </label>
                <div className="h-[400px] rounded-md border border-border bg-card p-4 overflow-auto">
                  <div className="prose-blog text-sm">
                    <ReactMarkdown>{content || '*Start typing to see preview...*'}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
