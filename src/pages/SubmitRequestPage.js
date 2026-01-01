import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// useAuth not required in this page
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './SubmitRequestPage.css';

const SubmitRequestPage = () => {
  // user available via context if needed
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    serviceType: '',
    title: '',
    description: '',
    budget: '',
    timeline: '',
    requirements: '',
    creativeAssets: []
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

  const handleRequirementsChange = (e) => {
    const requirements = e.target.value.split('\n').filter(req => req.trim());
    setFormData(prev => ({
      ...prev,
      requirements
    }));
  };

  const handleAssetChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const assetPromises = files.map(file => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              name: file.name,
              type: file.type,
              buffer: reader.result.split(',')[1]
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(assetPromises).then(assets => {
        setFormData(prev => ({
          ...prev,
          creativeAssets: assets
        }));
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.serviceType || !formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const submitServiceRequest = httpsCallable(functions, 'submitServiceRequest');
      const result = await submitServiceRequest({
        ...formData,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        creativeAssets: formData.creativeAssets
      });

      if (result.data.requestId) {
        navigate('/adsx');
      } else {
        setError('Failed to submit service request');
      }
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.message || 'Failed to submit service request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="submit-request-page">
      <div className="container">
        <div className="page-header">
          <h1>Submit Service Request</h1>
          <p>Get professional help with your creative projects</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="request-form">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="serviceType">Service Type *</label>
              <select
                id="serviceType"
                name="serviceType"
                value={formData.serviceType}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Service Type</option>
                <option value="design">Design</option>
                <option value="video">Video Production</option>
                <option value="content">Content Creation</option>
                <option value="social_media">Social Media</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="title">Project Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter project title"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Project Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your project in detail..."
                rows="6"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="budget">Budget ($)</label>
                <input
                  type="number"
                  id="budget"
                  name="budget"
                  value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  step="0.01"
                />
                <small>Leave empty if flexible</small>
              </div>

              <div className="form-group">
                <label htmlFor="timeline">Timeline</label>
                <input
                  type="text"
                  id="timeline"
                  name="timeline"
                  value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="e.g., 1 week, 2 months"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="requirements">Requirements</label>
              <textarea
                id="requirements"
                name="requirements"
                value={formData.requirements.join('\n')}
                onChange={handleRequirementsChange}
                placeholder="List specific requirements (one per line)..."
                rows="4"
              />
              <small>Enter each requirement on a new line</small>
            </div>

            <div className="form-group">
              <label htmlFor="creativeAssets">Creative Assets</label>
              <input
                type="file"
                id="creativeAssets"
                name="creativeAssets"
                onChange={handleAssetChange}
                accept="image/*,video/*,.pdf,.doc,.docx"
                multiple
              />
              <small>Upload reference materials, images, videos, or documents (optional)</small>
            </div>

            {formData.creativeAssets.length > 0 && (
              <div className="assets-preview">
                <h4>Uploaded Assets:</h4>
                <div className="assets-list">
                  {formData.creativeAssets.map((asset, index) => (
                    <div key={index} className="asset-item">
                      <FontAwesomeIcon icon={ICONS.FILE_ALT} />
                      <span>{asset.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/adsx')}
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
                    Submitting...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={ICONS.PLUS} />
                    Submit Request
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

export default SubmitRequestPage;
