/* src/features/books/pages/BookExchangePage.js */
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { functions, firebaseConfigured } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
// FIX: Import useAuth to guard auth-required actions
import { useAuth } from '../../auth/context/AuthContext';

const BookExchangePage = () => {
  const navigate = useNavigate();
  // FIX: Get user from context
  const { user } = useAuth();

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);

  // getAllBooks is public — no auth required
  const fetchBooks = useCallback(async () => {
    if (!firebaseConfigured || !functions) {
      setLoading(false);
      setError("Firebase not configured.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const getAllBooks = httpsCallable(functions, 'getAllBooks');
      const result = await getAllBooks({ limit: 20, searchTerm });
      setBooks(result.data?.books || []);
    } catch (err) {
      console.error('Fetch error in BookExchangePage:', err);
      setError('Failed to load books. Please try again.');
      setBooks([]);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  const handleRequestBook = async (book) => {
    // FIX: Guard — must be signed in to request a book
    if (!user) {
      navigate('/signin');
      return;
    }

    const message = window.prompt(
      `Request "${book.title}" from the owner?\n\nAdd a note:`,
      "Is this still available?"
    );
    if (!message) return;

    try {
      const requestFunc = httpsCallable(functions, 'initiateExchangeRequest');
      await requestFunc({ targetBookId: book.id, message });
      alert("Request sent! Check your Dashboard for updates.");
    } catch (err) {
      console.error(err);
      alert("Failed to send request: " + err.message);
    }
  };

  return (
    <div className="min-h-screen w-full pr-6">

      {/* HEADER */}
      <header className="mb-12">
        <h1 className="lux-title">Book Exchange</h1>
        <p className="lux-subtitle">Swap books directly with students. No fees.</p>

        <Link to="/book-exchange/add">
          <button className="lux-btn-primary flex items-center gap-2">
            <FontAwesomeIcon icon={ICONS.PLUS} /> List a Book
          </button>
        </Link>

        {/* Search */}
        <div className="relative mt-6">
          <input
            type="text"
            placeholder="Search by title, author, or course code..."
            className="lux-input w-full pr-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') fetchBooks(); }}
          />
          <button
            onClick={fetchBooks}
            className="absolute right-0 top-0 h-full px-4 text-primary hover:text-white transition-colors"
            aria-label="Search"
          >
            🔍
          </button>
        </div>
      </header>

      {error && (
        <div className="lux-card bg-red-800/20 text-red-300 p-4 mb-6">{error}</div>
      )}

      {/* BOOK GRID */}
      {loading ? (
        <div className="text-muted text-center py-10">Loading the library catalogue...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {books.length === 0 && searchTerm === '' ? (
            <div className="col-span-4 lux-card p-8 text-center text-muted">
              No books have been listed yet! Be the first to start a swap.
            </div>
          ) : books.length === 0 ? (
            <div className="col-span-4 lux-card p-8 text-center text-muted">
              No results found for "{searchTerm}". Try a different term.
            </div>
          ) : (
            books.map(book => (
              <div key={book.id} className="lux-card group p-0 overflow-hidden flex flex-col h-full">
                <div className="h-48 bg-white/5 flex items-center justify-center text-5xl relative overflow-hidden">
                  <span className="group-hover:scale-125 transition-transform duration-500 select-none">📚</span>
                  {book.course && (
                    <div className="absolute top-2 right-2 bg-black/60 px-2 py-1 rounded text-xs font-mono border border-white/10 backdrop-blur-sm">
                      {book.course}
                    </div>
                  )}
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-sm text-muted mb-4">by {book.author}</p>

                  <button
                    onClick={() => handleRequestBook(book)}
                    className="lux-btn-secondary w-full mt-auto group-hover:bg-white group-hover:text-black group-hover:border-transparent"
                  >
                    {user ? 'Request Book' : 'Sign In to Request'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default BookExchangePage;