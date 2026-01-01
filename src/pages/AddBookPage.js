import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './AddBookPage.css';

const AddBookPage = () => {
  useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    edition: '',
    condition: 'good',
    description: '',
    course: '',
    semester: '',
    price: '',
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
    
    if (!formData.title || !formData.author) {
      setError('Please fill in title and author');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const addBookForExchange = httpsCallable(functions, 'addBookForExchange');
      const result = await addBookForExchange({
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        imageUrl: formData.imageFile ? `data:${formData.imageFile.type};base64,${formData.imageFile.buffer}` : ''
      });

      if (result.data.bookId) {
        navigate('/book-exchange');
      } else {
        setError('Failed to add book');
      }
    } catch (err) {
      console.error('Error adding book:', err);
      setError(err.message || 'Failed to add book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-book-page">
      <div className="container">
        <div className="page-header">
          <h1>Add Book for Exchange</h1>
          <p>List a book for exchange with fellow students</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="book-form">
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
                placeholder="Enter book title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="author">Author *</label>
              <input
                type="text"
                id="author"
                name="author"
                value={formData.author}
                onChange={handleInputChange}
                placeholder="Enter author name"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="isbn">ISBN</label>
                <input
                  type="text"
                  id="isbn"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleInputChange}
                  placeholder="978-0-123456-78-9"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edition">Edition</label>
                <input
                  type="text"
                  id="edition"
                  name="edition"
                  value={formData.edition}
                  onChange={handleInputChange}
                  placeholder="1st Edition"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="course">Course Code</label>
                <input
                  type="text"
                  id="course"
                  name="course"
                  value={formData.course}
                  onChange={handleInputChange}
                  placeholder="CS101, MATH201, etc."
                />
              </div>

              <div className="form-group">
                <label htmlFor="semester">Semester</label>
                <input
                  type="text"
                  id="semester"
                  name="semester"
                  value={formData.semester}
                  onChange={handleInputChange}
                  placeholder="Fall 2024"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="condition">Condition</label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleInputChange}
              >
                <option value="new">New</option>
                <option value="like_new">Like New</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="price">Selling Price (Optional)</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
              <small>Leave empty for exchange only</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the book's condition, highlights, etc..."
                rows="4"
              />
            </div>

            <div className="form-group">
              <label htmlFor="image">Book Cover Image</label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleImageChange}
                accept="image/*"
              />
              <small>Upload book cover image (optional)</small>
            </div>

            {formData.imageFile && (
              <div className="image-preview">
                <h4>Image Preview:</h4>
                <div className="preview-image">
                  <img 
                    src={`data:${formData.imageFile.type};base64,${formData.imageFile.buffer}`} 
                    alt="Book preview"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/book-exchange')}
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
                    Adding...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={ICONS.PLUS} />
                    Add Book
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

export default AddBookPage;
