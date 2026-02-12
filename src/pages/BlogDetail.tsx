import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { blogApi } from '@/lib/api';
import { Header } from '@/components/Header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import BlogComment from '@/components/BlogComment';
import { Eye, Calendar, User, Edit } from 'lucide-react';

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export default function BlogDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();


  const { data: blog, isLoading, error } = useQuery({
    queryKey: ['blog', slug],
    queryFn: async () => {
      if (!slug) throw new Error('Blog slug is required');
      const response = await blogApi.getBlogBySlug(slug);
      if (response.data) return response.data;
      throw new Error(response.error);
    },
    enabled: !!slug && !authLoading,
  });

  const isOwner = isAuthenticated && user && blog && user.id === blog.author.id;
  // Only owners can view draft, pending_approval, or rejected blogs
  const isPrivateStatus = blog && ['draft', 'pending_approval', 'rejected'].includes(blog.status);
  const isDraftAndNotOwner = isPrivateStatus && !isOwner;


  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-[680px] px-4 py-12">
          <Skeleton className="h-12 w-3/4 mb-4" />
          <Skeleton className="h-6 w-1/2 mb-8" />
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !blog || isDraftAndNotOwner) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-[680px] px-4 py-12 text-center">
          <h1 className="text-2xl font-semibold mb-4">Blog not found</h1>
          <p className="text-muted-foreground">
            The blog you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
        </main>
      </div>
    );
  }

  const readTime = calculateReadTime(blog.content);
  const fallbackAvatar = '/placeholder.svg';

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <article className="mx-auto max-w-[680px] px-4 py-12">
        <header className="mb-12">
          <div className="flex items-start justify-between gap-4 mb-6">
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight text-foreground flex-1">
            {blog.title}
          </h1>
            {isOwner && (
              <Button asChild variant="outline" size="sm" className="gap-2 shrink-0">
                <Link to={`/write/${blog.slug}`}>
                  <Edit className="h-4 w-4" />
                  Edit
                </Link>
              </Button>
            )}
          </div>

          {/* Status Badge for Owner */}
          {isOwner && blog.status !== 'published' && (
            <div className="mb-4">
              <Badge
                variant={
                  blog.status === 'rejected' 
                    ? 'destructive' 
                    : blog.status === 'pending_approval'
                    ? 'secondary'
                    : 'secondary'
                }
                className="text-xs"
              >
                {blog.status === 'pending_approval' ? 'Pending Approval' : 
                 blog.status === 'rejected' ? 'Rejected' : 
                 blog.status}
              </Badge>
              {blog.status === 'rejected' && blog.rejectionReason && (
                <p className="text-sm text-destructive mt-2">{blog.rejectionReason}</p>
              )}
            </div>
          )}

          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            {blog.description}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y border-border py-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center">
                <img
                  src={blog.author.avatar || fallbackAvatar}
                  alt={blog.author.name}
                  className="h-6 w-6 rounded-full object-cover"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackAvatar;
                  }}
                />
              </div>
              <div>
                <p className="font-medium text-foreground">{blog.author.name}</p>
                <p className="text-xs">{readTime} min read</p>
              </div>
            </div>

            <div className="flex items-center gap-4 ml-auto">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {formatDate(blog.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {blog.views} views
              </span>
            </div>
          </div>
        </header>

        <div className="prose-blog">
          {blog.coverImage && (
            <img src={blog.coverImage} alt={blog.title} className="w-full h-auto rounded-lg mb-8" />
          )}
          <ReactMarkdown>{blog.content}</ReactMarkdown>
        </div>

        {blog.tags.length > 0 && (
          <footer className="mt-12 pt-8 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {blog.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-sm">
                  {tag}
                </Badge>
              ))}
            </div>
          </footer>
        )}

        <section className="mt-16 pt-8 border-t border-border">
          <BlogComment blog={blog} />
        </section>
      </article>
    </div>
  );
}
