import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Blog, Comment, commentApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { Flag, Trash2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

/* ---------------- COMMENT ITEM ---------------- */

interface CommentItemProps {
  comment: Comment;
  depth?: number;
  blogSlug: string;
  onReplySuccess?: () => void;
}

const CommentItem = ({ comment, depth = 0, blogSlug, onReplySuccess }: CommentItemProps) => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState<'spam' | 'offensive' | 'harassment' | 'other'>('spam');
  const [isDeleting, setIsDeleting] = useState(false);
  const fallbackAvatar = '/placeholder.svg';

  const isOwner = isAuthenticated && user && user.id === comment.author.id;
  const hasReplies = comment.replies && comment.replies.length > 0;
  const canReply = comment.canReply && isAuthenticated && comment.status === 'active';

  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: (content: string) => commentApi.replyToComment(comment.id, { content }),
    onSuccess: () => {
      toast.success('Reply posted successfully!');
      setReplyText('');
      setShowReplyBox(false);
      setShowReplies(true);
      queryClient.invalidateQueries({ queryKey: ['comments', blogSlug] });
      onReplySuccess?.();
    },
    onError: (error: { error?: string }) => {
      toast.error(error.error || 'Failed to post reply. Please try again.');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => commentApi.deleteComment(comment.id),
    onSuccess: () => {
      toast.success('Comment deleted successfully');
      setIsDeleting(false);
      queryClient.invalidateQueries({ queryKey: ['comments', blogSlug] });
    },
    onError: (error: { error?: string }) => {
      toast.error(error.error || 'Failed to delete comment. Please try again.');
      setIsDeleting(false);
    },
  });

  // Report mutation
  const reportMutation = useMutation({
    mutationFn: (reason: 'spam' | 'offensive' | 'harassment' | 'other') =>
      commentApi.reportComment(comment.id, { reason }),
    onSuccess: (data) => {
      toast.success(
        data.data?.status === 'hidden'
          ? 'Comment has been hidden due to multiple reports'
          : data.data?.spam_report_count === 3
          ? 'Comment flagged for review'
          : 'Comment reported successfully'
      );
      setIsReporting(false);
      queryClient.invalidateQueries({ queryKey: ['comments', blogSlug] });
    },
    onError: (error: { error?: string }) => {
      toast.error(error.error || 'Failed to report comment. Please try again.');
      setIsReporting(false);
    },
  });

  const handleReply = () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply');
      return;
    }
    if (replyText.length > 500) {
      toast.error('Reply cannot exceed 500 characters');
      return;
    }
    replyMutation.mutate(replyText.trim());
  };

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  const handleReport = () => {
    reportMutation.mutate(reportReason);
  };

  // Don't render if comment is deleted or hidden (unless owner/admin)
  // But show a placeholder for deleted comments to maintain thread structure
  if (comment.status === 'hidden' && !isOwner) {
    return null;
  }

  return (
    <div className="relative">
      {/* Thread line */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-border" />
      )}

      <div className="mt-4" style={{ marginLeft: depth > 0 ? `${depth * 24}px` : '0' }}>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <img
                src={comment.author.avatar || fallbackAvatar}
                alt={comment.author.name}
                className="h-8 w-8 rounded-full shrink-0 object-cover"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackAvatar;
                }}
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{comment.author.name}</p>
                <p className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</p>
              </div>
            </div>
            {comment.status === 'pending_review' && (
              <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded">
                Flagged
              </span>
            )}
          </div>

          <p className={`mt-2 text-sm whitespace-pre-wrap break-words ${
            comment.status === 'deleted' ? 'text-muted-foreground italic' : ''
          }`}>
            {comment.status === 'deleted' ? (
              <span className="text-muted-foreground italic">[Comment deleted by user]</span>
            ) : comment.status === 'hidden' ? (
              <span className="text-muted-foreground italic">[Comment hidden by moderator]</span>
            ) : (
              comment.content
            )}
          </p>

          <div className="mt-3 flex items-center gap-3 flex-wrap">
            {canReply && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => {
                  if (!isAuthenticated) {
                    toast.error('Please login to reply');
                    return;
                  }
                  setShowReplyBox(!showReplyBox);
                }}
                disabled={replyMutation.isPending}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Reply
              </Button>
            )}

            {hasReplies && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setShowReplies(!showReplies)}
              >
                {showReplies ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Hide replies ({comment.replies.length})
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show replies ({comment.replies.length})
                  </>
                )}
              </Button>
            )}

            {isAuthenticated && !isOwner && comment.status === 'active' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setIsReporting(true)}
                disabled={reportMutation.isPending}
              >
                <Flag className="h-3 w-3 mr-1" />
                Report
              </Button>
            )}

            {isOwner && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-destructive hover:text-destructive"
                onClick={() => setIsDeleting(true)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete
              </Button>
            )}
          </div>

          {/* Reply Input */}
          {showReplyBox && canReply && (
            <div className="mt-4 space-y-2">
              <Textarea
                placeholder="Write a reply..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    if (replyText.trim() && replyText.length <= 500 && !replyMutation.isPending) {
                      handleReply();
                    }
                  }
                  if (e.key === 'Escape') {
                    setShowReplyBox(false);
                    setReplyText('');
                  }
                }}
                rows={3}
                maxLength={500}
                className="resize-none"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs ${replyText.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {replyText.length}/500 characters
                </span>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowReplyBox(false);
                      setReplyText('');
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleReply}
                    disabled={!replyText.trim() || replyText.length > 500 || replyMutation.isPending}
                  >
                    {replyMutation.isPending ? 'Posting...' : 'Post Reply'}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Press <kbd className="px-1 py-0.5 text-xs font-semibold text-muted-foreground bg-muted rounded border">Ctrl/Cmd + Enter</kbd> to submit
              </p>
            </div>
          )}
        </div>

        {/* Replies */}
        {showReplies && hasReplies && (
          <div className="mt-3 ml-4 border-l border-border pl-4">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                blogSlug={blogSlug}
                onReplySuccess={onReplySuccess}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleting} onOpenChange={setIsDeleting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleting(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={isReporting} onOpenChange={setIsReporting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Comment</DialogTitle>
            <DialogDescription>
              Why are you reporting this comment? This helps us keep the community safe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reason</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value as typeof reportReason)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="spam">Spam</option>
                <option value="offensive">Offensive Language</option>
                <option value="harassment">Harassment or Bullying</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReporting(false)}>
              Cancel
            </Button>
            <Button onClick={handleReport} disabled={reportMutation.isPending}>
              {reportMutation.isPending ? 'Reporting...' : 'Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/* ---------------- MAIN COMPONENT ---------------- */

interface BlogCommentProps {
  blog: Blog;
}

const BlogComment = ({ blog }: BlogCommentProps) => {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  // Fetch comments
  const {
    data: commentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['comments', blog.slug],
    queryFn: async () => {
      const response = await commentApi.getComments(blog.slug, 1, 50);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    enabled: !!blog.slug,
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Create comment mutation
  const createMutation = useMutation({
    mutationFn: (content: string) => commentApi.createComment(blog.slug, { content }),
    onSuccess: () => {
      toast.success('Comment posted successfully!');
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', blog.slug] });
    },
    onError: (error: { error?: string }) => {
      toast.error(error.error || 'Failed to post comment. Please try again.');
    },
  });

  const handleAddComment = () => {
    if (!isAuthenticated) {
      toast.error('Please login to comment');
      return;
    }
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    if (newComment.length > 500) {
      toast.error('Comment cannot exceed 500 characters');
      return;
    }
    createMutation.mutate(newComment.trim());
  };

  const comments = commentsData?.comments || [];
  const pagination = commentsData?.pagination;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-6">Comments</h3>

      {/* Add Comment */}
      {isAuthenticated ? (
        <div className="mb-8 bg-muted/50 rounded-lg p-4">
          <Textarea
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                if (newComment.trim() && newComment.length <= 500 && !createMutation.isPending) {
                  handleAddComment();
                }
              }
            }}
            rows={3}
            maxLength={500}
            className="resize-none"
          />
          <div className="flex items-center justify-between mt-3">
            <span className={`text-xs ${newComment.length > 450 ? 'text-destructive' : 'text-muted-foreground'}`}>
              {newComment.length}/500 characters
            </span>
            <Button
              size="sm"
              onClick={handleAddComment}
              disabled={!newComment.trim() || newComment.length > 500 || createMutation.isPending}
            >
              {createMutation.isPending ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press <kbd className="px-1 py-0.5 text-xs font-semibold text-muted-foreground bg-muted rounded border">Ctrl/Cmd + Enter</kbd> to submit
          </p>
        </div>
      ) : (
        <div className="mb-8 bg-muted/50 rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Please{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              login
            </Link>{' '}
            to comment
          </p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-1" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex gap-2 mt-3">
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-7 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-center">
          <p className="text-sm text-destructive mb-3">
            Failed to load comments. Please try again.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['comments', blog.slug] })}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Comments List */}
      {!isLoading && !error && (
        <>
          {comments.length === 0 ? (
            <div className="bg-muted/50 rounded-lg p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground font-medium mb-1">No comments yet</p>
              <p className="text-sm text-muted-foreground">
                {isAuthenticated 
                  ? 'Be the first to share your thoughts!' 
                  : 'Login to start the conversation'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  blogSlug={blog.slug}
                  onReplySuccess={() => {
                    // Scroll to top of comments section
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              ))}
            </div>
          )}

          {/* Pagination Info */}
          {pagination && pagination.pages > 1 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {comments.length} of {pagination.total} comments
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BlogComment;
