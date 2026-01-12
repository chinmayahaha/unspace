import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// useAuth not required in this page
import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import './CreatePostPage.css';

const CreatePostPage = () => {
  // user available via context if needed
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    imageFile: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: {
            name: file.name,
            type: file.type,
            buffer: reader.result.split(',')[1]
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      setError('Please fill in title and content');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const createPost = httpsCallable(functions, 'createPost');
      const result = await createPost({
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [],
        imageUrl: formData.imageFile ? `data:${formData.imageFile.type};base64,${formData.imageFile.buffer}` : ''
      });

      if (result.data.postId) {
        navigate('/community');
      } else {
        setError('Failed to create post');
      }
    } catch (err) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-post-page">
      <div className="container">
        <div className="page-header">
          <h1>Create New Post</h1>
          <p>Share your thoughts with the community</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="post-form">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter post title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Content *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="Write your post content..."
                rows="8"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="general">General</option>
                  <option value="academic">Academic</option>
                  <option value="social">Social</option>
                  <option value="events">Events</option>
                  <option value="announcement">Announcement</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="tag1, tag2, tag3"
                />
                <small>Separate tags with commas</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="image">Image</label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
              />
              <small>Upload an image (optional)</small>
            </div>

            {formData.imageFile && (
              <div className="image-preview">
                <h4>Image Preview:</h4>
                <div className="preview-image">
                  <img 
                    src={`data:${formData.imageFile.type};base64,${formData.imageFile.buffer}`} 
                    alt="Post preview"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
              >
                {loading ? (
                  <>
                    <FontAwesomeIcon icon={ICONS.CLOCK} />
                    Creating...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={ICONS.PLUS} />
                    Create Post
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostPage;
