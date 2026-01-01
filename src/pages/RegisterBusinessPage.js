import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// useAuth not required in this page
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './RegisterBusinessPage.css';

const RegisterBusinessPage = () => {
  // user available via context if needed
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    website: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: ''
    },
    logoFile: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('socialMedia.')) {
      const socialPlatform = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [socialPlatform]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          logoFile: {
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
    
    if (!formData.name || !formData.description || !formData.category || !formData.contactEmail) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const registerBusiness = httpsCallable(functions, 'registerBusiness');
      const result = await registerBusiness({
        ...formData,
        logoFile: formData.logoFile
      });

      if (result.data.businessId) {
        navigate('/businessx');
      } else {
        setError('Failed to register business');
      }
    } catch (err) {
      console.error('Error registering business:', err);
      setError(err.message || 'Failed to register business');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-business-page">
      <div className="container">
        <div className="page-header">
          <h1>Register Your Business</h1>
          <p>Join the student business directory</p>
        </div>

        <div className="form-container">
          <form onSubmit={handleSubmit} className="business-form">
            {error && (
              <div className="error-message">
                <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Business Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter business name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your business..."
                rows="4"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select Category</option>
                  <option value="tutoring">Tutoring</option>
                  <option value="photography">Photography</option>
                  <option value="design">Design</option>
                  <option value="food">Food & Beverage</option>
                  <option value="technology">Technology</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contactEmail">Contact Email *</label>
                <input
                  type="email"
                  id="contactEmail"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  placeholder="business@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="contactPhone">Contact Phone</label>
                <input
                  type="tel"
                  id="contactPhone"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  placeholder="(555) 123-4567"
                />
              </div>

              <div className="form-group">
                <label htmlFor="website">Website</label>
                <input
                  type="url"
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Business address"
              />
            </div>

            <div className="form-group">
              <label>Social Media</label>
              <div className="social-media-inputs">
                <div className="social-input">
                  <FontAwesomeIcon icon={ICONS.INSTAGRAM} />
                  <input
                    type="text"
                    name="socialMedia.instagram"
                    value={formData.socialMedia.instagram}
                    onChange={handleInputChange}
                    placeholder="@instagram_handle"
                  />
                </div>
                <div className="social-input">
                  <FontAwesomeIcon icon={ICONS.FACEBOOK} />
                  <input
                    type="text"
                    name="socialMedia.facebook"
                    value={formData.socialMedia.facebook}
                    onChange={handleInputChange}
                    placeholder="Facebook page name"
                  />
                </div>
                <div className="social-input">
                  <FontAwesomeIcon icon={ICONS.TWITTER} />
                  <input
                    type="text"
                    name="socialMedia.twitter"
                    value={formData.socialMedia.twitter}
                    onChange={handleInputChange}
                    placeholder="@twitter_handle"
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="logo">Business Logo</label>
              <input
                type="file"
                id="logo"
                name="logo"
                onChange={handleLogoChange}
                accept="image/*"
              />
              <small>Upload your business logo (optional)</small>
            </div>

            {formData.logoFile && (
              <div className="image-preview">
                <h4>Logo Preview:</h4>
                <div className="preview-image">
                  <img 
                    src={`data:${formData.logoFile.type};base64,${formData.logoFile.buffer}`} 
                    alt="Logo preview"
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate('/businessx')}
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
                    Registering...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={ICONS.PLUS} />
                    Register Business
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

export default RegisterBusinessPage;
