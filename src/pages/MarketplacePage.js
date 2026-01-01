import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
// useAuth not required in this page
import { functions, firebaseConfigured } from '../firebase';  // Add firebaseConfigured
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './MarketplacePage.css';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const MarketplacePage = () => {
  // user available via context if needed
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    searchTerm: ''
  });

  const loadListings = useCallback(async () => {
    try {
      setLoading(true);
      
      // Check if Firebase is configured and functions are available
      if (!firebaseConfigured || !functions) {
        setError('Firebase is not configured. Please check your environment variables.');
        console.error('Firebase functions not available. Check REACT_APP_* environment variables.');
        setListings([]);
        return;
      }

      const getAllListings = httpsCallable(functions, 'getAllListings');
      const result = await getAllListings({
        limit: 20,
        ...filters
      });
      setListings(result.data?.listings || []);
    } catch (err) {
      // Better error handling
      const errorMessage = err?.message || err?.code || 'Unknown error';
      setError(`Failed to load listings: ${errorMessage}`);
      console.error('Error loading listings:', err);
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  const handleSearch = () => {
    loadListings();
  };

  const handleContactSeller = async (listingId) => {
    try {
      const contactSeller = httpsCallable(functions, 'contactSeller');
      await contactSeller({
        listingId,
        message: 'I am interested in this item. Please contact me.'
      });
      alert('Message sent to seller!');
    } catch (err) {
      console.error('Error contacting seller:', err);
      alert('Failed to contact seller');
    }
  };

  if (loading) {
    return (
      <div className="marketplace-page">
        <div className="container">
          <div className="loading">Loading listings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="marketplace-page">
      <div className="container">
        <div className="page-header">
          <h1>Marketplace</h1>
          <p>Buy and sell items with fellow students</p>
        </div>

        <div className="marketplace-content">
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
                  <option value="electronics">Electronics</option>
                  <option value="books">Books</option>
                  <option value="furniture">Furniture</option>
                  <option value="clothing">Clothing</option>
                  <option value="sports">Sports</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Min Price:</label>
                <input
                  type="number"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  placeholder="0"
                />
              </div>

              <div className="filter-group">
                <label>Max Price:</label>
                <input
                  type="number"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  placeholder="1000"
                />
              </div>

              <div className="filter-group">
                <label>Search:</label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Search listings..."
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
            <Link to="/marketplace/new">
              <Button className="nav-primary">
                <FontAwesomeIcon icon={ICONS.PLUS} />
                Create New Listing
              </Button>
            </Link>
          </div>

          {/* Listings Grid */}
          <div className="listings-section">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            {listings.length === 0 ? (
              <div className="no-listings">
                <FontAwesomeIcon icon={ICONS.SHOPPING_CART} />
                <h3>No listings found</h3>
                <p>Try adjusting your filters or create the first listing!</p>
                <Link to="/marketplace/new" className="btn btn-primary">
                  Create First Listing
                </Link>
              </div>
            ) : (
              <div className="listings-grid">
                {listings.map((listing) => (
                  <Card key={listing.id} className="listing-card">
                    <div className="listing-card-inner">
                      <div className="listing-media">
                        {listing.images && listing.images.length > 0 ? (
                          <img src={listing.images[0]} alt={listing.title} />
                        ) : (
                          <div className="no-image"><FontAwesomeIcon icon={ICONS.IMAGE} /></div>
                        )}
                        {listing.featured && (
                          <div className="featured-badge"><FontAwesomeIcon icon={ICONS.STAR} /> Featured</div>
                        )}
                      </div>

                      <div className="listing-body">
                        <h3 className="listing-title">{listing.title}</h3>
                        <p className="listing-description">{listing.description || listing.aiDescription || 'No description available'}</p>

                        <div className="listing-meta">
                          <span className="listing-category">{listing.category}</span>
                          <span className="listing-condition">{listing.condition}</span>
                        </div>

                        <div className="listing-footer">
                          <div className="listing-price">${listing.price}</div>
                          <div className="listing-actions">
                            <Link to={`/listing/${listing.id}`}>
                              <Button className="btn secondary">View</Button>
                            </Link>
                            <Button onClick={() => handleContactSeller(listing.id)} className="nav-primary">
                              <FontAwesomeIcon icon={ICONS.ENVELOPE} /> Contact
                            </Button>
                          </div>
                        </div>
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

export default MarketplacePage;
