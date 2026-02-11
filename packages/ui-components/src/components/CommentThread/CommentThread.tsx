import { useState, FormEvent } from 'react'
import styles from './CommentThread.module.css'

export interface Comment {
  id: string
  content: string
  authorName?: string
  authorEmail?: string
  createdAt: string
  updatedAt: string
  userId: string
}

export interface CommentThreadProps {
  comments: Comment[]
  currentUserId?: string
  onAddComment: (content: string) => Promise<void>
  onEditComment: (id: string, content: string) => Promise<void>
  onDeleteComment: (id: string) => Promise<void>
  isLoading?: boolean
}

export function CommentThread({
  comments,
  currentUserId,
  onAddComment,
  onEditComment,
  onDeleteComment,
  isLoading = false,
}: CommentThreadProps) {
  const [newComment, setNewComment] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmitNew = async (e: FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return

    try {
      setSubmitting(true)
      await onAddComment(newComment.trim())
      setNewComment('')
    } catch (err) {
      console.error('Failed to add comment:', err)
      alert('Failed to add comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id)
    setEditContent(comment.content)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleSubmitEdit = async (id: string) => {
    if (!editContent.trim() || submitting) return

    try {
      setSubmitting(true)
      await onEditComment(id, editContent.trim())
      setEditingId(null)
      setEditContent('')
    } catch (err) {
      console.error('Failed to edit comment:', err)
      alert('Failed to edit comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment? This action cannot be undone.')) return

    try {
      setSubmitting(true)
      await onDeleteComment(id)
    } catch (err) {
      console.error('Failed to delete comment:', err)
      alert('Failed to delete comment. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    }).format(date)
  }

  const getAuthorDisplay = (comment: Comment) => {
    return comment.authorName || comment.authorEmail || 'Unknown User'
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Comments ({comments.length})</h3>

      <div className={styles.commentList}>
        {comments.length === 0 ? (
          <p className={styles.emptyState}>No comments yet. Be the first to comment!</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className={styles.comment}>
              <div className={styles.commentHeader}>
                <div className={styles.authorInfo}>
                  <span className={styles.authorName}>{getAuthorDisplay(comment)}</span>
                  <span className={styles.commentTime}>{formatDate(comment.createdAt)}</span>
                  {comment.updatedAt !== comment.createdAt && (
                    <span className={styles.edited}>(edited)</span>
                  )}
                </div>
                {currentUserId === comment.userId && (
                  <div className={styles.commentActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleStartEdit(comment)}
                      disabled={submitting}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleDelete(comment.id)}
                      disabled={submitting}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {editingId === comment.id ? (
                <div className={styles.editForm}>
                  <textarea
                    className={styles.textarea}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={3}
                    disabled={submitting}
                  />
                  <div className={styles.editActions}>
                    <button
                      className={styles.cancelButton}
                      onClick={handleCancelEdit}
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      className={styles.saveButton}
                      onClick={() => handleSubmitEdit(comment.id)}
                      disabled={submitting || !editContent.trim()}
                    >
                      {submitting ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className={styles.commentContent}>{comment.content}</p>
              )}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmitNew} className={styles.newCommentForm}>
        <textarea
          className={styles.textarea}
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          disabled={submitting || isLoading}
        />
        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting || isLoading || !newComment.trim()}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>
    </div>
  )
}
