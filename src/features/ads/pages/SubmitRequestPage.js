/* src/features/ads/pages/SubmitRequestPage.js */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';

const SubmitRequestPage = () => {
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
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRequirementsChange = (e) => {
    // Just store as string for now, or split if backend requires array
    // Backend expects array? Let's split it.
    const reqs = e.target.value; 
    setFormData(prev => ({ ...prev, requirements: reqs }));
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
              buffer: reader.result.split(',')[1] // Base64
            });
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(assetPromises).then(assets => {
        setFormData(prev => ({ ...prev, creativeAssets: assets }));
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
      
      // Convert requirements string to array if needed
      const requirementsArray = typeof formData.requirements === 'string' 
        ? formData.requirements.split('\n').filter(r => r.trim())
        : formData.requirements;

      const result = await submitServiceRequest({
        ...formData,
        requirements: requirementsArray,
        budget: formData.budget ? parseFloat(formData.budget) : 0,
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

  // Styles
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors";
  const labelClass = "block text-xs font-bold text-muted mb-2 uppercase tracking-wide";

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">
      <div className="mb-8">
          <button onClick={() => navigate('/adsx')} className="text-muted hover:text-white mb-4 text-sm transition-colors">← Back to AdsX</button>
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
                
                {/* 1. Service Type */}
                <div>
                    <label className={labelClass}>Service Type *</label>
                    <div className="relative">
                        <select
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleInputChange}
                            className={`${inputClass} appearance-none cursor-pointer`}
                            required
                        >
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

                {/* 2. Title */}
                <div>
                    <label className={labelClass}>Project Title *</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="e.g. Logo Design for Startup"
                        className={inputClass}
                        required
                    />
                </div>

                {/* 3. Description */}
                <div>
                    <label className={labelClass}>Description *</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Describe your project details..."
                        rows="5"
                        className={inputClass}
                        required
                    />
                </div>

                {/* 4. Budget & Timeline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Budget ($)</label>
                        <input
                            type="number"
                            name="budget"
                            value={formData.budget}
                            onChange={handleInputChange}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Timeline</label>
                        <input
                            type="text"
                            name="timeline"
                            value={formData.timeline}
                            onChange={handleInputChange}
                            placeholder="e.g. 1 week"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* 5. Requirements */}
                <div>
                    <label className={labelClass}>Requirements</label>
                    <textarea
                        name="requirements"
                        value={formData.requirements}
                        onChange={handleInputChange} // Fixed to use handleInputChange (storing as string first)
                        placeholder="List specific requirements..."
                        rows="3"
                        className={inputClass}
                    />
                </div>

                {/* 6. Assets */}
                <div>
                    <label className={labelClass}>Creative Assets (Optional)</label>
                    <input
                        type="file"
                        onChange={handleAssetChange}
                        accept="image/*,video/*,.pdf"
                        multiple
                        className={inputClass}
                    />
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
                    <button
                        type="button"
                        onClick={() => navigate('/adsx')}
                        className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 lux-btn-primary py-3 rounded-xl flex items-center justify-center gap-2"
                    >
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