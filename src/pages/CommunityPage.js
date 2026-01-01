import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
// useAuth not required in this page
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './CommunityPage.css';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const CommunityPage = () => {
  // user not directly used in this page (kept in context for other components)
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    searchTerm: '',
    sortBy: 'createdAt'
  });

  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const getPosts = httpsCallable(functions, 'getPosts');
      const result = await getPosts({
        limit: 20,
        ...filters
      });
      setPosts(result.data.posts || []);
    } catch (err) {
      setError('Failed to load posts');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    loadPosts();
  };

  const handleLike = async (postId) => {
    try {
      const togglePostLike = httpsCallable(functions, 'togglePostLike');
      await togglePostLike({ postId });
      // Reload posts to get updated like count
      loadPosts();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  if (loading) {
    return (
      <div className="community-page">
        <div className="container">
          <div className="loading">Loading posts...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="community-page">
      <div className="container">
        <div className="page-header">
          <h1>Community Hub</h1>
          <p>Connect with fellow students and share experiences</p>
        </div>

        <div className="community-content">
          {/* Filters */}
          <div className="filters-section">
            <div className="filters">
              <div className="filter-group">
                <label>Category:</label>
                <select 
                  value={filters.category} 
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  <option value="general">General</option>
                  <option value="academic">Academic</option>
                  <option value="social">Social</option>
                  <option value="events">Events</option>
                  <option value="announcement">Announcements</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Sort by:</label>
                <select 
                  value={filters.sortBy} 
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <option value="createdAt">Newest First</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Search:</label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Search posts..."
                />
              </div>

              <button onClick={handleSearch} className="search-btn">
                <FontAwesomeIcon icon={ICONS.SEARCH} />
                Search
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="actions-section">
            <Link to="/community/new"><Button className="nav-primary"><FontAwesomeIcon icon={ICONS.PLUS} /> Create New Post</Button></Link>
          </div>

          {/* Posts List */}
          <div className="posts-section">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            {posts.length === 0 ? (
              <div className="no-posts">
                <FontAwesomeIcon icon={ICONS.COMMENTS} />
                <h3>No posts found</h3>
                <p>Be the first to start a conversation!</p>
                <Link to="/community/new" className="btn btn-primary">
                  Create First Post
                </Link>
              </div>
            ) : (
              <div className="posts-list">
                {posts.map((post) => (
                  <Card key={post.id} className="post-card">
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
                    </div>
                    
                    <div className="post-content">
                      <h3 className="post-title">
                        <Link to={`/community/post/${post.id}`}>
                          {post.title}
                        </Link>
                      </h3>
                      
                      <p className="post-description">
                        {post.content.length > 200 
                          ? `${post.content.substring(0, 200)}...` 
                          : post.content
                        }
                      </p>
                      
                      {post.imageUrl && (
                        <div className="post-image">
                          <img src={post.imageUrl} alt={post.title} />
                        </div>
                      )}
                      
                      {post.tags && post.tags.length > 0 && (
                        <div className="post-tags">
                          {post.tags.map((tag, index) => (
                            <span key={index} className="tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="post-footer">
                      <div className="post-stats">
                        <button 
                          onClick={() => handleLike(post.id)}
                          className="like-btn"
                        >
                          <FontAwesomeIcon icon={ICONS.HEART} />
                          {post.likes || 0}
                        </button>
                        <span className="comments-count">
                          <FontAwesomeIcon icon={ICONS.COMMENTS} />
                          {post.comments || 0} comments
                        </span>
                      </div>
                      
                      <div className="post-actions">
                        <Link to={`/community/post/${post.id}`}><Button className="btn secondary">Read More</Button></Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
