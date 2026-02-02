import { useState } from 'react';
import { Blog } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

type CommentNode = {
    id: number;
    author: string;
    text: string;
    createdAt: string;
    replies: CommentNode[];
};

const dummyComments: CommentNode[] = [
    {
        id: 1,
        author: 'John Doe',
        text: 'Great blog post! Really enjoyed reading this.',
        createdAt: '2026-01-20',
        replies: [
            {
                id: 11,
                author: 'Admin',
                text: 'Thanks John! Glad you liked it 🙌',
                createdAt: '2026-01-21',
                replies: [
                    {
                        id: 111,
                        author: 'John Doe',
                        text: 'Looking forward to more posts!',
                        createdAt: '2026-01-22',
                        replies: [],
                    },
                ],
            },
        ],
    },
    {
        id: 2,
        author: 'Jane Smith',
        text: 'Can you explain more about the backend part?',
        createdAt: '2026-01-22',
        replies: [],
    },
];

/* ---------------- COMMENT ITEM ---------------- */

const CommentItem = ({
    comment,
    depth = 0,
    onReply,
}: {
    comment: CommentNode;
    depth?: number;
    onReply: (parentId: number, text: string) => void;
}) => {
    const [showReplyBox, setShowReplyBox] = useState(false);
    const [showReplies, setShowReplies] = useState(false);
    const [replyText, setReplyText] = useState('');

    const hasReplies = comment.replies.length > 0;

    return (
    <div className="relative">
        {/* Thread line */}
        {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-px bg-muted" />
        )}

        <div
        className="mt-4"
        style={{ marginLeft: depth * 20 }}
        >
        <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex justify-between">
                <span className="font-medium">{comment.author}</span>
                <span className="text-xs text-muted-foreground">
                    {comment.createdAt}
                </span>
            </div>

            <p className="mt-2">{comment.text}</p>

            <div className="mt-2 flex gap-2">
            <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground text-xs"
                onClick={() => setShowReplyBox(!showReplyBox)}
            >
            Reply
            </Button>

            {hasReplies && (
                <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground text-xs"
                onClick={() => setShowReplies(!showReplies)}
                >
                {showReplies
                    ? 'Hide replies'
                    : `Show replies (${comment.replies.length})`}
                </Button>
            )}
            </div>

            {/* Reply Input */}
            {showReplyBox && (
            <div className="mt-3 flex gap-2">
                <Input
                placeholder="Write a reply..."
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                />
                <Button
                size="sm"
                onClick={() => {
                    if (!replyText.trim()) return;
                    onReply(comment.id, replyText);
                    setReplyText('');
                    setShowReplyBox(false);
                    setShowReplies(true);
                }}
                >
                Post
                </Button>
            </div>
            )}
        </div>

        {/* Replies */}
        {showReplies && (
            <div className="mt-3 border-l border-muted pl-4">
            {comment.replies.map(reply => (
                <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                onReply={onReply}
                />
            ))}
            </div>
        )}
        </div>
    </div>
    );
    };

/* ---------------- MAIN ---------------- */

const BlogComment = ({ blog }: { blog: Blog }) => {
  const [comments, setComments] =
    useState<CommentNode[]>(dummyComments);

  const [newComment, setNewComment] = useState('');

  const addComment = () => {
    if (!newComment.trim()) return;

    setComments(prev => [
      {
        id: Date.now(),
        author: 'Guest User',
        text: newComment,
        createdAt: new Date().toISOString().split('T')[0],
        replies: [],
      },
      ...prev,
    ]);

    setNewComment('');
  };

  const addReplyRecursive = (
    list: CommentNode[],
    parentId: number,
    text: string
  ): CommentNode[] => {
    return list.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          replies: [
            ...item.replies,
            {
              id: Date.now(),
              author: 'Guest User',
              text,
              createdAt: new Date().toISOString().split('T')[0],
              replies: [],
            },
          ],
        };
      }
      return {
        ...item,
        replies: addReplyRecursive(item.replies, parentId, text),
      };
    });
  };

  const handleReply = (parentId: number, text: string) => {
    setComments(prev => addReplyRecursive(prev, parentId, text));
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold mb-4">
        Comments on "{blog.title}"
      </h3>

      {/* Add Comment */}
      <div className="mb-8 bg-muted/50 rounded-lg p-4">
        <Textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          rows={3}
        />
        <div className="flex justify-end mt-2">
          <Button size="sm" onClick={addComment}>
            Post Comment
          </Button>
        </div>
      </div>

      {comments.map(comment => (
        <CommentItem
          key={comment.id}
          comment={comment}
          onReply={handleReply}
        />
      ))}
    </div>
  );
};

export default BlogComment;
