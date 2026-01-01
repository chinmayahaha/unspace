import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './AdsXPage.css';
import Card from '../components/UI/Card';
import Button from '../components/UI/Button';

const AdsXPage = () => {
  useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    serviceType: '',
    status: 'all'
  });

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const getRequests = httpsCallable(functions, 'getRequests');
      const result = await getRequests({
        type: filters.status === 'all' ? 'all' : filters.status,
        serviceType: filters.serviceType || undefined,
        limit: 20
      });
      setRequests(result.data.requests || []);
    } catch (err) {
      setError('Failed to load service requests');
      console.error('Error loading requests:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = () => {
    loadRequests();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'status-pending';
      case 'in_progress': return 'status-progress';
      case 'completed': return 'status-completed';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-default';
    }
  };

  if (loading) {
    return (
      <div className="adsx-page">
        <div className="container">
          <div className="loading">Loading service requests...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="adsx-page">
      <div className="container">
        <div className="page-header">
          <h1>AdsX</h1>
          <p>Promotional services and creative solutions for students</p>
        </div>

        <div className="adsx-content">
          {/* Filters */}
          <div className="filters-section">
            <div className="filters">
              <div className="filter-group">
                <label>Service Type:</label>
                <select 
                  value={filters.serviceType} 
                  onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                >
                  <option value="">All Services</option>
                  <option value="design">Design</option>
                  <option value="video">Video Production</option>
                  <option value="content">Content Creation</option>
                  <option value="social_media">Social Media</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>

              <div className="filter-group">
                <label>Status:</label>
                <select 
                  value={filters.status} 
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">All Requests</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button onClick={handleSearch} className="search-btn">
                <FontAwesomeIcon icon={ICONS.SEARCH} />
                Filter
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="actions-section">
            <Link to="/adsx/submit"><Button className="nav-primary"><FontAwesomeIcon icon={ICONS.PLUS} /> Submit Service Request</Button></Link>
          </div>

          {/* Requests List */}
          <div className="requests-section">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            {requests.length === 0 ? (
              <div className="no-requests">
                <FontAwesomeIcon icon={ICONS.BULLHORN} />
                <h3>No service requests found</h3>
                <p>Submit your first service request!</p>
                <Link to="/adsx/submit" className="btn btn-primary">
                  Submit First Request
                </Link>
              </div>
            ) : (
              <div className="requests-list">
                {requests.map((request) => (
                  <Card key={request.id} className="request-card">
                    <div className="request-header">
                      <div className="request-meta">
                        <span className={`status-badge ${getStatusColor(request.status)}`}>
                          {request.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="service-type">{request.serviceType}</span>
                        {request.promoted && (
                          <span className="promoted-badge">
                            <FontAwesomeIcon icon={ICONS.STAR} />
                            Promoted
                          </span>
                        )}
                      </div>
                      <div className="request-date">
                        {new Date(request.createdAt?.seconds * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="request-content">
                      <h3 className="request-title">
                        <Link to={`/adsx/${request.id}`}>
                          {request.title}
                        </Link>
                      </h3>
                      
                      <p className="request-description">
                        {request.description.length > 200 
                          ? `${request.description.substring(0, 200)}...` 
                          : request.description
                        }
                      </p>
                      
                      <div className="request-details">
                        <div className="detail-item">
                          <FontAwesomeIcon icon={ICONS.DOLLAR_SIGN} />
                          <span>Budget: ${request.budget}</span>
                        </div>
                        {request.timeline && (
                          <div className="detail-item">
                            <FontAwesomeIcon icon={ICONS.CLOCK} />
                            <span>Timeline: {request.timeline}</span>
                          </div>
                        )}
                        {request.assignedTo && (
                          <div className="detail-item">
                            <FontAwesomeIcon icon={ICONS.USER} />
                            <span>Assigned to: {request.assignedTo}</span>
                          </div>
                        )}
                      </div>
                      
                      {request.requirements && request.requirements.length > 0 && (
                        <div className="request-requirements">
                          <h4>Requirements:</h4>
                          <ul>
                            {request.requirements.map((req, index) => (
                              <li key={index}>{req}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {request.creativeAssets && request.creativeAssets.length > 0 && (
                        <div className="request-assets">
                          <h4>Creative Assets:</h4>
                          <div className="assets-grid">
                            {request.creativeAssets.map((asset, index) => (
                              <div key={index} className="asset-item">
                                <FontAwesomeIcon icon={ICONS.FILE_ALT} />
                                <span>Asset {index + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="request-footer">
                      <div className="request-actions">
                        <Link to={`/adsx/${request.id}`}><Button className="btn secondary">View Details</Button></Link>
                        {request.status === 'pending' && (
                          <Button className="nav-primary"><FontAwesomeIcon icon={ICONS.HEART} /> Apply</Button>
                        )}
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

export default AdsXPage;
