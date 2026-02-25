/* src/features/lostfound/pages/PostItemPage.js */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { functions, storage } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import { useAuth } from '../../auth/context/AuthContext';

const PostItemPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    type: 'lost',
    category: '',
    title: '',
    description: '',
    location: '',
    contactInfo: user?.email || '',
    dateOccurred: '',
    imageFiles: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const categories = ["Phone", "Wallet", "Keys", "Laptop", "Bag", "ID/Documents", "Other"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({ ...prev, imageFiles: files }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate('/signin');
      return;
    }

    if (!formData.category || !formData.title || !formData.description) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload images to Storage
      let imageUrls = [];
      if (formData.imageFiles.length > 0) {
        imageUrls = await Promise.all(
          formData.imageFiles.map(async (file) => {
            const fileRef = ref(storage, `lostfound/${Date.now()}_${file.name}`);
            const metadata = {
              contentType: file.type,
              customMetadata: { userId: user.id }
            };
            await uploadBytes(fileRef, file, metadata);
            return await getDownloadURL(fileRef);
          })
        );
      }

      // Call Cloud Function
      const postLostOrFoundItem = httpsCallable(functions, 'postLostOrFoundItem');
      const result = await postLostOrFoundItem({
        type: formData.type,
        category: formData.category,
        title: formData.title,
        description: formData.description,
        location: formData.location,
        contactInfo: formData.contactInfo,
        dateOccurred: formData.dateOccurred || null,
        images: imageUrls
      });

      if (result.data.success) {
        navigate('/lostfound');
      } else {
        throw new Error('Failed to post item');
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
        <button onClick={() => navigate('/lostfound')} className="text-muted hover:text-white mb-4 text-sm transition-colors">
          ← Back to Lost & Found
        </button>
        <h1 className="lux-title text-4xl">Report Item</h1>
        <p className="lux-subtitle">Help others find what they've lost.</p>
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

            {/* Type: Lost or Found */}
            <div>
              <label className={labelClass}>Item Status *</label>
              <div className="grid grid-cols-2 gap-4">
                {['lost', 'found'].map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, type }))}
                    className={`py-4 rounded-xl font-bold uppercase transition-all ${
                      formData.type === type
                        ? type === 'lost'
                          ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                          : 'bg-green-500/20 text-green-400 border-2 border-green-500'
                        : 'bg-white/5 text-muted border-2 border-white/10 hover:border-white/30'
                    }`}
                  >
                    {type === 'lost' ? '🔍 I Lost This' : '✅ I Found This'}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div>
              <label className={labelClass}>Category *</label>
              <div className="relative">
                <select name="category" value={formData.category}
                  onChange={handleInputChange}
                  className={`${inputClass} appearance-none cursor-pointer`} required>
                  <option value="" className="bg-black">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="bg-black">{cat}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">▼</div>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className={labelClass}>Item Title *</label>
              <input type="text" name="title" value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g. Black iPhone 14 Pro"
                className={inputClass} required />
            </div>

            {/* Description */}
            <div>
              <label className={labelClass}>Description *</label>
              <textarea name="description" value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the item in detail..."
                rows="5" className={inputClass} required />
            </div>

            {/* Location & Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Location (where {formData.type})</label>
                <input type="text" name="location" value={formData.location}
                  onChange={handleInputChange}
                  placeholder="e.g. Library 2nd Floor"
                  className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>Date Occurred</label>
                <input type="date" name="dateOccurred" value={formData.dateOccurred}
                  onChange={handleInputChange}
                  className={inputClass} />
              </div>
            </div>

            {/* Contact Info */}
            <div>
              <label className={labelClass}>Contact Information</label>
              <input type="text" name="contactInfo" value={formData.contactInfo}
                onChange={handleInputChange}
                placeholder="Email or phone number"
                className={inputClass} />
            </div>

            {/* Image Upload */}
            <div>
              <label className={labelClass}>Photos (Optional)</label>
              <input type="file" onChange={handleImageChange}
                accept="image/*" multiple
                className={inputClass} />
              {formData.imageFiles.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.imageFiles.map((f, i) => (
                    <span key={i} className="text-xs bg-white/10 px-2 py-1 rounded text-muted">
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t border-white/10">
              <button type="button" onClick={() => navigate('/lostfound')}
                className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 lux-btn-primary py-3 rounded-xl flex items-center justify-center gap-2">
                {loading ? <>Posting...</> : <><FontAwesomeIcon icon={ICONS.PLUS} /> Post Item</>}
              </button>
            </div>

          </form>
        </div>
      </div>

    </div>
  );
};

export default PostItemPage;