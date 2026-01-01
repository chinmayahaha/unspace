import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { functions, firebaseConfigured } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './BusinessXPage.css';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const BusinessXPage = () => {
  useAuth();
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    category: '',
    searchTerm: '',
    verified: undefined
  });

  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!firebaseConfigured || !functions) {
        setError('Firebase is not configured. Please check your environment variables.');
        console.error('Firebase functions not available.');
        setBusinesses([]);
        return;
      }

      const getAllBusinesses = httpsCallable(functions, 'getAllBusinesses');
      const result = await getAllBusinesses({
        limit: 20,
        ...filters
      });
      setBusinesses(result.data?.businesses || []);
    } catch (err) {
      const errorMessage = err?.message || err?.code || 'Unknown error';
      setError(`Failed to load businesses: ${errorMessage}`);
      console.error('Error loading businesses:', err);
      setBusinesses([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    loadBusinesses();
  };

  if (loading) {
    return (
      <div className="businessx-page">
        <div className="container">
          <div className="loading">Loading businesses...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="businessx-page">
      <div className="container">
        <div className="page-header">
          <h1>BusinessX</h1>
          <p>Discover student-run businesses and services</p>
        </div>

        <div className="businessx-content">
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
                  <option value="tutoring">Tutoring</option>
                  <option value="photography">Photography</option>
                  <option value="design">Design</option>
                  <option value="food">Food & Beverage</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select 
                  value={filters.verified} 
                  onChange={(e) => handleFilterChange('verified', e.target.value === '' ? undefined : e.target.value === 'true')}
                >
                  <option value="">All Businesses</option>
                  <option value="true">Verified Only</option>
                  <option value="false">Unverified</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Search:</label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  placeholder="Search businesses..."
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
            <Link to="/businessx/register"><Button className="nav-primary"><FontAwesomeIcon icon={ICONS.PLUS} /> Register Your Business</Button></Link>
          </div>

          {/* Businesses Grid */}
          <div className="businesses-section">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            {businesses.length === 0 ? (
              <div className="no-businesses">
                <FontAwesomeIcon icon={ICONS.BRIEFCASE} />
                <h3>No businesses found</h3>
                <p>Be the first to register your business!</p>
                <Link to="/businessx/register" className="btn btn-primary">
                  Register First Business
                </Link>
              </div>
            ) : (
              <div className="businesses-grid">
                {businesses.map((business) => (
                  <Card key={business.id} className="business-card">
                    <div className="business-image">
                      {business.logoUrl ? (
                        <img src={business.logoUrl} alt={business.name} />
                      ) : (
                        <div className="no-image">
                          <FontAwesomeIcon icon={ICONS.BRIEFCASE} />
                        </div>
                      )}
                      {business.verified && (
                        <div className="verified-badge">
                          <FontAwesomeIcon icon={ICONS.CHECK} />
                          Verified
                        </div>
                      )}
                    </div>
                    
                    <div className="business-content">
                      <h3 className="business-name">{business.name}</h3>
                      <p className="business-category">{business.category}</p>
                      
                      <p className="business-description">
                        {business.description.length > 150 
                          ? `${business.description.substring(0, 150)}...` 
                          : business.description
                        }
                      </p>
                      
                      <div className="business-rating">
                        <div className="stars">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FontAwesomeIcon 
                              key={star}
                              icon={ICONS.STAR} 
                              className={star <= business.rating ? 'filled' : 'empty'}
                            />
                          ))}
                        </div>
                        <span className="rating-text">
                          {business.rating.toFixed(1)} ({business.reviewCount} reviews)
                        </span>
                      </div>
                      
                      <div className="business-contact">
                        {business.contactEmail && (
                          <div className="contact-item">
                            <FontAwesomeIcon icon={ICONS.ENVELOPE} />
                            {business.contactEmail}
                          </div>
                        )}
                        {business.website && (
                          <div className="contact-item">
                            <FontAwesomeIcon icon={ICONS.GLOBE} />
                            <a href={business.website} target="_blank" rel="noopener noreferrer">
                              Website
                            </a>
                          </div>
                        )}
                      </div>
                      
                      <div className="business-actions">
                        <Link to={`/businessx/${business.id}`}><Button className="btn secondary">View Details</Button></Link>
                        <Button className="nav-primary"><FontAwesomeIcon icon={ICONS.ENVELOPE} /> Contact</Button>
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

export default BusinessXPage;
