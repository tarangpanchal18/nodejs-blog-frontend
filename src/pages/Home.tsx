import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { blogApi, Blog } from '@/lib/api';
import { Header } from '@/components/Header';
import { BlogCard } from '@/components/BlogCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, X } from 'lucide-react';
import { APP_NAME } from '@/lib/appName';

export default function Home() {
  const [page, setPage] = useState(1);
  const [selectedTag, setSelectedTag] = useState('');
  const [tagSearch, setTagSearch] = useState('');
  const [blogs, setBlogs] = useState<Blog[]>([]);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['blogs', page, selectedTag],
    queryFn: async () => {
      const response = await blogApi.getBlogs(page, 'published', selectedTag);
      if (response.data) {
        if (page === 1) {
          setBlogs(response.data.blogs);
        } else {
          setBlogs((prev) => [...prev, ...response.data!.blogs]);
        }
        return response.data;
      }
      throw new Error(response.error);
    },
  });

  const { data: tagSuggestions } = useQuery({
    queryKey: ['tagSearch', tagSearch],
    queryFn: async () => {
      if (tagSearch.length < 1) return [];
      const response = await blogApi.searchTags(tagSearch);
      return response.data || [];
    },
    enabled: tagSearch.length >= 1,
  });

  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag);
    setTagSearch('');
    setPage(1);
    setBlogs([]);
  };

  const clearTagFilter = () => {
    setSelectedTag('');
    setPage(1);
    setBlogs([]);
  };

  const loadMore = () => {
    if (data && page < data.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="mx-auto max-w-5xl px-4 py-10 sm:py-12">
        {/* Cat-themed Hero */}
        <section className="relative mb-10 overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-[#fff8ef] via-[#fffdf7] to-[#f8f5ef] p-6 shadow-sm sm:p-10">
          <div className="pointer-events-none absolute -top-8 -left-8 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-36 w-36 rounded-full bg-amber-200/35 blur-3xl" />
          <img
            src="/paws.png"
            alt=""
            className="pointer-events-none absolute right-5 top-5 h-10 w-10 rotate-12 opacity-15"
          />
          <img
            src="/paws.png"
            alt=""
            className="pointer-events-none absolute bottom-5 left-5 h-8 w-8 -rotate-12 opacity-10"
          />

          <div className="relative z-10">
            <Badge className="mb-4 bg-primary/15 text-primary hover:bg-primary/15">
              Cat-first storytelling
            </Badge>
            <h1 className="mb-4 max-w-3xl font-serif text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Where every whisker-worthy story finds a home
            </h1>
            <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
              {APP_NAME} is crafted for cat lovers, rescuers, and storytellers.
              Share rescue journeys, behavior tips, funny moments, and everything
              in between.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Rescue Tales</Badge>
              <Badge variant="secondary">Cat Care</Badge>
              <Badge variant="secondary">Whisker Wisdom</Badge>
              <Badge variant="secondary">Daily Meows</Badge>
            </div>
          </div>
        </section>

        <section className="mb-8 grid gap-4 rounded-xl border border-border bg-card/60 p-4 sm:grid-cols-3 sm:p-5">
          <div className="rounded-lg border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Community
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-foreground">
              Cat People Only
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tone
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-foreground">
              Cozy and Curious
            </p>
          </div>
          <div className="rounded-lg border border-border/70 bg-background p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Content
            </p>
            <p className="mt-1 font-serif text-xl font-semibold text-foreground">
              Paws, Purrs, and Stories
            </p>
          </div>
        </section>

        {/* Tag Search */}
        <section className="mb-8">
          <div className="relative mx-auto max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search cat tags..."
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              className="pl-10"
            />

            {tagSuggestions && tagSuggestions.length > 0 && tagSearch && (
              <div className="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover shadow-lg">
                <ul className="py-1">
                  {tagSuggestions.map((tag) => (
                    <li
                      key={tag}
                      onClick={() => handleTagSelect(tag)}
                      className="cursor-pointer px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {selectedTag && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <span className="text-sm text-muted-foreground">Filtering by:</span>
              <Badge variant="secondary" className="gap-1">
                {selectedTag}
                <button onClick={clearTagFilter} className="hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            </div>
          )}
        </section>

        {/* Blog List */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
              Latest Cat Chronicles
            </h2>
            <img src="/paws.png" alt="" className="h-8 w-8 opacity-70" />
          </div>

          {isLoading && page === 1 ? (
            <div className="space-y-8">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-3 border-b border-border pb-8">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">
                {selectedTag
                  ? `No blogs found with tag "${selectedTag}"`
                  : 'No cat blogs published yet. Be the first to share a meow-ment!'}
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-border">
                {blogs.map((blog) => (
                  <BlogCard key={blog.id} blog={blog} />
                ))}
              </div>

              {data && page < data.totalPages && (
                <div className="flex justify-center pt-12">
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={loadMore}
                    disabled={isFetching}
                  >
                    {isFetching ? 'Loading...' : 'Load more stories'}
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
