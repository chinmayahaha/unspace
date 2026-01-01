import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './BookExchangePage.css';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const BookExchangePage = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const loadBooks = useCallback(async () => {
    try {
      setLoading(true);
      const getAllBooks = httpsCallable(functions, 'getAllBooks');
      const result = await getAllBooks({
        limit: 20,
        searchTerm: searchTerm || undefined
      });
      setBooks(result.data.books || []);
    } catch (err) {
      setError('Failed to load books');
      console.error('Error loading books:', err);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  const handleSearch = () => {
    loadBooks();
  };

  const handleExchangeRequest = async (bookId) => {
    try {
      const findMatchingBooks = httpsCallable(functions, 'findMatchingBooks');
      const result = await findMatchingBooks({ bookId });
      
      if (result.data.matches && result.data.matches.length > 0) {
        // Show matching books modal or navigate to exchange page
        alert(`Found ${result.data.matches.length} matching books for exchange!`);
      } else {
        alert('No matching books found for exchange.');
      }
    } catch (err) {
      console.error('Error finding matching books:', err);
      alert('Failed to find matching books');
    }
  };

  if (loading) {
    return (
      <div className="book-exchange-page">
        <div className="container">
          <div className="loading">Loading books...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="book-exchange-page">
      <div className="container">
        <div className="page-header">
          <h1>Book Exchange</h1>
          <p>Exchange textbooks and books with fellow students</p>
        </div>

        <div className="book-exchange-content">
          {/* Search */}
          <div className="search-section">
            <div className="search-bar">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search books by title or author..."
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <button onClick={handleSearch} className="search-btn">
                <FontAwesomeIcon icon={ICONS.SEARCH} />
                Search
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="actions-section">
            <Link to="/book-exchange/add">
              <Button className="nav-primary"><FontAwesomeIcon icon={ICONS.PLUS} /> Add a Book</Button>
            </Link>
          </div>

          {/* Books Grid */}
          <div className="books-section">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            {books.length === 0 ? (
              <div className="no-books">
                <FontAwesomeIcon icon={ICONS.BOOK} />
                <h3>No books available</h3>
                <p>Be the first to add a book for exchange!</p>
                <Link to="/book-exchange/add" className="btn btn-primary">
                  Add First Book
                </Link>
              </div>
            ) : (
              <div className="books-grid">
                {books.map((book) => (
                  <Card key={book.id} className="book-card">
                    <div className="book-image">
                      {book.imageUrl ? (
                        <img src={book.imageUrl} alt={book.title} />
                      ) : (
                        <div className="no-image"><FontAwesomeIcon icon={ICONS.BOOK} /></div>
                      )}
                    </div>
                    <div className="book-content">
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-author">by {book.author}</p>
                      {book.isbn && <p className="book-isbn">ISBN: {book.isbn}</p>}
                      <div className="book-meta">
                        <span className="book-condition">{book.condition}</span>
                        {book.course && <span className="book-course">{book.course}</span>}
                      </div>
                      {book.description && <p className="book-description">{book.description}</p>}
                      <div className="book-actions">
                        <Button onClick={() => handleExchangeRequest(book.id)} className="nav-primary" disabled={book.ownerId === user?.id}>
                          <FontAwesomeIcon icon={ICONS.EXCHANGE} />
                          {book.ownerId === user?.id ? 'Your Book' : 'Request Exchange'}
                        </Button>
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

export default BookExchangePage;
