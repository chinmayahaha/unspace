import React, { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import './PostDetailPage.css';

const PostDetailPage = () => {
  const { postId } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadPost = useCallback(async () => {
    try {
      const getPost = httpsCallable(functions, 'getPost');
      const result = await getPost({ postId });
      setPost(result.data);
    } catch (err) {
      setError('Failed to load post');
      console.error('Error loading post:', err);
    }
  }, [postId]);

  const loadComments = useCallback(async () => {
    try {
      const getComments = httpsCallable(functions, 'getComments');
      const result = await getComments({ postId });
      setComments(result.data.comments || []);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    loadPost();
    loadComments();
  }, [loadPost, loadComments]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const addComment = httpsCallable(functions, 'addComment');
      await addComment({
        postId,
        content: newComment
      });
      setNewComment('');
      loadComments();
      loadPost(); // Refresh post to update comment count
    } catch (err) {
      console.error('Error adding comment:', err);
      alert('Failed to add comment');
    }
  };

  const handleLike = async () => {
    try {
      const togglePostLike = httpsCallable(functions, 'togglePostLike');
      await togglePostLike({ postId });
      loadPost(); // Refresh post to update like count
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  if (loading) {
    return (
      <div className="post-detail-page">
        <div className="container">
          <div className="loading">Loading post...</div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="post-detail-page">
        <div className="container">
          <div className="error-message">
            <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
            {error || 'Post not found'}
          </div>
          <Link to="/community" className="btn btn-primary">
            Back to Community
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      <div className="container">
        <div className="post-detail-content">
          {/* Post Header */}
          <div className="post-header">
            <div className="post-meta">
              <span className="post-category">{post.category}</span>
              {post.official && (
                <span className="official-badge">
                  <FontAwesomeIcon icon={ICONS.STAR} />
                  Official
                </span>
              )}
              <span className="post-date">
                {new Date(post.createdAt?.seconds * 1000).toLocaleDateString()}
              </span>
            </div>
            <Link to="/community" className="back-link">
              <FontAwesomeIcon icon={ICONS.ARROW_LEFT} />
              Back to Community
            </Link>
          </div>

          {/* Post Content */}
          <div className="post-content">
            <h1 className="post-title">{post.title}</h1>
            
            {post.imageUrl && (
              <div className="post-image">
                <img src={post.imageUrl} alt={post.title} />
              </div>
            )}
            
            <div className="post-text">
              {post.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
            
            {post.tags && post.tags.length > 0 && (
              <div className="post-tags">
                {post.tags.map((tag, index) => (
                  <span key={index} className="tag">#{tag}</span>
                ))}
              </div>
            )}
          </div>

          {/* Post Actions */}
          <div className="post-actions">
            <button onClick={handleLike} className="like-btn">
              <FontAwesomeIcon icon={ICONS.HEART} />
              {post.likes || 0} Likes
            </button>
            <span className="comments-count">
              <FontAwesomeIcon icon={ICONS.COMMENTS} />
              {post.comments || 0} Comments
            </span>
          </div>

          {/* Comments Section */}
          <div className="comments-section">
            <h3>Comments</h3>
            
            {/* Add Comment Form */}
            {user && (
              <form onSubmit={handleAddComment} className="add-comment-form">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows="3"
                  required
                />
                <button type="submit" className="btn btn-primary">
                  <FontAwesomeIcon icon={ICONS.PLUS} />
                  Add Comment
                </button>
              </form>
            )}

            {/* Comments List */}
            <div className="comments-list">
              {comments.length === 0 ? (
                <div className="no-comments">
                  <FontAwesomeIcon icon={ICONS.COMMENTS} />
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="comment-item">
                    <div className="comment-content">
                      <p>{comment.content}</p>
                    </div>
                    <div className="comment-meta">
                      <span className="comment-date">
                        {new Date(comment.createdAt?.seconds * 1000).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
