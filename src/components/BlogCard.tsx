import { Link } from 'react-router-dom';
import { Blog } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar } from 'lucide-react';

interface BlogCardProps {
  blog: Blog;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function calculateReadTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

export function BlogCard({ blog }: BlogCardProps) {
  const readTime = calculateReadTime(blog.content);
  const fallbackAvatar = '/placeholder.svg';

  return (
    <article className="group border-b border-border py-8 first:pt-0 last:border-b-0">
      <Link to={`/blog/${blog.slug}`} className="block">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <img
              src={blog.author.avatar || fallbackAvatar}
              alt={blog.author.name}
              className="h-6 w-6 rounded-full object-cover"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = fallbackAvatar;
              }}
            />
            <span className="font-medium text-foreground">{blog.author.name}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(blog.createdAt)}
            </span>
          </div>

          <h2 className="font-serif text-2xl font-semibold leading-tight text-foreground group-hover:text-primary transition-colors">
            {blog.title}
          </h2>

          <p className="text-muted-foreground leading-relaxed line-clamp-2">
            {blog.description.length > 150 
              ? blog.description.slice(0, 150) + '...' 
              : blog.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex flex-wrap gap-2">
              {blog.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground ml-auto">
              <span>{readTime} min read</span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {blog.views}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
