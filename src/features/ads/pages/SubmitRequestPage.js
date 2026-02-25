/* src/features/ads/pages/SubmitRequestPage.js */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { functions, storage } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// FIX: Use useAuth hook — never import raw 'auth' and call auth.currentUser directly
import { useAuth } from '../../auth/context/AuthContext';

const SubmitRequestPage = () => {
  const navigate = useNavigate();
  // FIX: Get user from context — guaranteed ready because AuthProvider
  // blocks all rendering until auth state resolves
  const { user } = useAuth();

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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAssetChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, creativeAssets: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.serviceType || !formData.title) {
      setError('Please fill in required fields');
      return;
    }

    // FIX: Guard against unauthenticated submission — redirect to sign in
    if (!user) {
      setError('You must be logged in to post a request.');
      navigate('/signin');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload all asset files to Storage first, collect URLs
      let assetUrls = [];
      if (formData.creativeAssets && formData.creativeAssets.length > 0) {
        assetUrls = await Promise.all(
          formData.creativeAssets.map(async (file) => {
            const fileRef = ref(storage, `adsx_assets/${Date.now()}_${file.name}`);
            const metadata = {
              contentType: file.type,
              customMetadata: {
                // FIX: Use user.id from context instead of auth.currentUser.uid
                userId: user.id
              }
            };
            await uploadBytes(fileRef, file, metadata);
            return await getDownloadURL(fileRef);
          })
        );
      }

      // Call Cloud Function — Firebase SDK automatically attaches auth token
      const submitServiceRequest = httpsCallable(functions, 'submitServiceRequest');

      // Convert requirements string to array for backend
      const requirementsArray = typeof formData.requirements === 'string'
        ? formData.requirements.split('\n').filter(r => r.trim())
        : formData.requirements;

      const result = await submitServiceRequest({
        serviceType: formData.serviceType,
        title: formData.title,
        description: formData.description,
        timeline: formData.timeline,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
        requirements: requirementsArray,
        creativeAssets: assetUrls, // Send URLs, never raw File objects
      });

      if (result.data.requestId) {
        navigate('/adsx');
      } else {
        throw new Error('Failed to submit request');
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors";
  const labelClass = "block text-xs font-bold text-muted mb-2 uppercase tracking-wide";

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">
      <div className="mb-8">
        <button onClick={() => navigate('/adsx')} className="text-muted hover:text-white mb-4 text-sm transition-colors">
          ← Back to AdsX
        </button>
        <h1 className="lux-title text-4xl">Post a Request</h1>
        <p className="lux-subtitle">Get professional help with your creative projects.</p>
      </div>

      <div className="flex justify-center">
        <div className="lux-card p-8 w-full max-w-3xl border border-white/10 shadow-2xl">

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl mb-6 flex items-center gap-3">
              <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Service Type */}
            <div>
              <label className={labelClass}>Service Type *</label>
              <div className="relative">
                <select name="serviceType" value={formData.serviceType}
                  onChange={handleInputChange}
                  className={`${inputClass} appearance-none cursor-pointer`} required>
                  <option value="" className="bg-black">Select Service Type</option>
                  <option value="design" className="bg-black">Design</option>
                  <option value="video" className="bg-black">Video Production</option>
                  <option value="content" className="bg-black">Content Creation</option>
                  <option value="social_media" className="bg-black">Social Media</option>
                  <option value="marketing" className="bg-black">Marketing</option>
                  <option value="tutoring" className="bg-black">Tutoring</option>
                  <option value="labor" className="bg-black">Manual Labor</option>
                  <option value="other" className="bg-black">Other</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">▼</div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className={labelClass}>Project Title *</label>
              <input type="text" name="title" value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Logo Design for Startup"
                className={inputClass} required />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description *</label>
              <textarea name="description" value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your project details..."
                rows="5" className={inputClass} required />
            </div>

            {/* Budget & Timeline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Budget ($)</label>
                <input type="number" name="budget" value={formData.budget}
                  onChange={handleInputChange}
                  placeholder="0.00" min="0" step="0.01" className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Timeline</label>
                <input type="text" name="timeline" value={formData.timeline}
                  onChange={handleInputChange}
                  placeholder="e.g. 1 week" className={inputClass} />
              </div>
            </div>

            {/* Requirements */}
            <div>
              <label className={labelClass}>Requirements</label>
              <textarea name="requirements" value={formData.requirements}
                onChange={handleInputChange}
                placeholder="List specific requirements (one per line)..."
                rows="3" className={inputClass} />
            </div>

            {/* Assets */}
            <div>
              <label className={labelClass}>Creative Assets (Optional)</label>
              <input type="file" onChange={handleAssetChange}
                accept="image/*,video/*,.pdf" multiple className={inputClass} />
              {formData.creativeAssets.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.creativeAssets.map((f, i) => (
                    <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-muted">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <button type="button" onClick={() => navigate('/adsx')}
                className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 lux-btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                {loading ? (
                  <>Processing...</>
                ) : (
                  <><FontAwesomeIcon icon={ICONS.PLUS} /> Submit Request</>
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