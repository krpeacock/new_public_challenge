'use client';

import { useState, useEffect } from 'react';
interface User {
  id: string;
  username: string;
  role: 'USER' | 'ADMIN';
}

interface Comment {
  id: string;
  content: string;
  authorId: string;
  author: string;
  createdAt: string;
  isHidden?: boolean;
}

interface CommentSectionProps {
  initialComments: Comment[];
  currentUser: User | null;
  onAddCommentAction: (formData: FormData) => Promise<void>;
  onFlagCommentAction: (formData: FormData) => Promise<void>;
  onUnflagCommentAction?: (formData: FormData) => Promise<void>;
}

export default function CommentSection({ 
  initialComments,
  currentUser,
  onAddCommentAction,
  onFlagCommentAction,
  onUnflagCommentAction
}: CommentSectionProps) {
  const [comments, setComments] = useState(initialComments);

  // Update comments when initialComments changes
  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  return (
    <div className="space-y-6">
      <form action={onAddCommentAction} className="flex gap-4">
        <input
          type="text"
          name="content"
          data-testid="comment-input"
          placeholder="Add a comment..."
          className="flex-1 rounded-md border border-gray-300 px-4 py-2"
        />
        <button
          type="submit"
          data-testid="submit-comment"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Post
        </button>
      </form>

      <div className="divide-y divide-gray-200">
        {comments.map((comment) => (
          <div key={comment.id} className="py-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{comment.author}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {(!comment.isHidden || currentUser?.role === 'ADMIN' || comment.authorId === currentUser?.id) && (
              <p data-testid={`comment-${comment.id}`} className="mt-2 text-gray-700">
                {comment.content}
                {comment.isHidden && currentUser?.role === 'ADMIN' && (
                  <span className="ml-2 text-xs text-red-500">(Flagged)</span>
                )}
              </p>
            )}
            {currentUser?.role === 'ADMIN' && (
              <div className="mt-2 flex gap-3">
                {!comment.isHidden && (
                  <form action={onFlagCommentAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button
                      type="submit"
                      data-testid={`flag-comment-${comment.id}`}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Flag Comment
                    </button>
                  </form>
                )}
                {comment.isHidden && onUnflagCommentAction && (
                  <form action={onUnflagCommentAction}>
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button
                      type="submit"
                      data-testid={`unflag-comment-${comment.id}`}
                      className="text-sm text-green-700 hover:text-green-900"
                    >
                      Remove Flag
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
