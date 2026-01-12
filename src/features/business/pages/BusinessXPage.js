import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { functions, firebaseConfigured } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import './BusinessXPage.css';
import Card from '../../../components/UI/Card';
import Button from '../../../components/UI/Button';
import LoadingScreen from '../../../components/UI/LoadingScreen';

const BusinessXPage = () => {
  useAuth(); // Check auth but don't strictly require it for viewing?
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    category: '',
    searchTerm: '',
    verified: undefined
  });

  const fetchBusinesses = async (currentFilters = filters) => {
    if (!firebaseConfigured || !functions) {
      setError('Firebase configuration missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const getAllBusinesses = httpsCallable(functions, 'getAllBusinesses');
      const result = await getAllBusinesses({
        limit: 20,
        ...currentFilters
      });
      
      setBusinesses(result.data?.businesses || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load businesses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    fetchBusinesses();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  if (loading && businesses.length === 0) return <LoadingScreen />;

  return (
    <div className="businessx-page">
      <div className="container">
        <div className="page-header">
          <h1>BusinessX</h1>
          <p>Discover student-run businesses and services</p>
        </div>

        <div className="businessx-content">
          <div className="filters-section">
            <div className="filters">
              {/* ... Select Inputs ... */}
              <div className="filter-group">
                <label>Category</label>
                <select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="tutoring">Tutoring</option>
                  <option value="photography">Photography</option>
                  <option value="design">Design</option>
                  <option value="food">Food & Beverage</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="filter-group grow">
                <label>Search</label>
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search businesses..."
                />
              </div>

              <button onClick={handleSearch} className="search-btn">
                <FontAwesomeIcon icon={ICONS.SEARCH} /> Search
              </button>
            </div>
          </div>

          <div className="actions-section">
            <Link to="/businessx/register">
              <Button className="nav-primary">Register Business</Button>
            </Link>
          </div>

          <div className="businesses-section">
            {error && <div className="error-banner">{error}</div>}
            
            {businesses.length === 0 && !loading ? (
               <div className="empty-state">No businesses found.</div>
            ) : (
              <div className="businesses-grid">
                {businesses.map((business) => (
                  <Card key={business.id} className="business-card">
                    {/* ... Business Card Logic (same as before) ... */}
                    <div className="business-content">
                      <h3 className="business-name">{business.name}</h3>
                      <p className="business-category">{business.category}</p>
                      <div className="business-actions">
                        <Link to={`/businessx/${business.id}`}>
                           <Button className="btn secondary">View Details</Button>
                        </Link>
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