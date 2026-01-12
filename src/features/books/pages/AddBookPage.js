/* src/features/books/pages/AddBookPage.js */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/context/AuthContext';
import { functions } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';

const AddBookPage = () => {
  useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    edition: '',
    condition: 'good',
    description: '',
    course: '',
    semester: '',
    price: '',
    imageFile: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          imageFile: {
            name: file.name,
            type: file.type,
            buffer: reader.result.split(',')[1] // Extract Base64
          }
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.author) {
      setError('Title and Author are required.');
      window.scrollTo(0,0);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const addBookForExchange = httpsCallable(functions, 'addBookForExchange');
      const result = await addBookForExchange({
        ...formData,
        price: formData.price ? parseFloat(formData.price) : 0,
        imageUrl: formData.imageFile ? `data:${formData.imageFile.type};base64,${formData.imageFile.buffer}` : ''
      });

      if (result.data.success || result.data.bookId) {
        navigate('/book-exchange');
      } else {
        setError('Failed to add book. Please try again.');
      }
    } catch (err) {
      console.error('Error adding book:', err);
      setError(err.message || 'Failed to add book');
      window.scrollTo(0,0);
    } finally {
      setLoading(false);
    }
  };

  // Reusable Input Style
  const inputClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:outline-none transition-colors placeholder-gray-500";
  const labelClass = "block text-xs font-bold text-muted mb-2 uppercase tracking-wide";

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">
      
      {/* HEADER */}
      <div className="mb-8">
        <button onClick={() => navigate('/book-exchange')} className="text-muted hover:text-white mb-4 text-sm transition-colors">
            ← Back to Library
        </button>
        <h1 className="lux-title text-4xl">List a Book</h1>
        <p className="lux-subtitle">Help a junior out. Exchange or sell your old textbooks.</p>
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
                
                {/* SECTION 1: BASIC INFO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label htmlFor="title" className={labelClass}>Book Title *</label>
                        <input
                            type="text"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="e.g. Introduction to Algorithms"
                            className={inputClass}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="author" className={labelClass}>Author *</label>
                        <input
                            type="text"
                            name="author"
                            value={formData.author}
                            onChange={handleInputChange}
                            placeholder="e.g. Cormen, Leiserson, Rivest"
                            className={inputClass}
                            required
                        />
                    </div>
                </div>

                {/* SECTION 2: DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <label className={labelClass}>Course Code</label>
                        <input
                            type="text"
                            name="course"
                            value={formData.course}
                            onChange={handleInputChange}
                            placeholder="CS101"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Semester Used</label>
                        <input
                            type="text"
                            name="semester"
                            value={formData.semester}
                            onChange={handleInputChange}
                            placeholder="Fall 2024"
                            className={inputClass}
                        />
                    </div>
                    <div>
                         <label className={labelClass}>Condition</label>
                         <div className="relative">
                            <select
                                name="condition"
                                value={formData.condition}
                                onChange={handleInputChange}
                                className={`${inputClass} appearance-none cursor-pointer`}
                            >
                                <option value="new" className="bg-black text-white">New (Unused)</option>
                                <option value="like_new" className="bg-black text-white">Like New</option>
                                <option value="good" className="bg-black text-white">Good</option>
                                <option value="fair" className="bg-black text-white">Fair (Highlighted)</option>
                                <option value="poor" className="bg-black text-white">Poor (Readable)</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-muted">▼</div>
                         </div>
                    </div>
                </div>

                {/* SECTION 3: OPTIONAL DETAILS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className={labelClass}>Edition (Optional)</label>
                        <input
                            type="text"
                            name="edition"
                            value={formData.edition}
                            onChange={handleInputChange}
                            placeholder="3rd Edition"
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>ISBN (Optional)</label>
                        <input
                            type="text"
                            name="isbn"
                            value={formData.isbn}
                            onChange={handleInputChange}
                            placeholder="978-3-16-148410-0"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* PRICE */}
                <div>
                     <label className={labelClass}>Selling Price ($)</label>
                     <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0.00 (Leave empty for Free Exchange)"
                        min="0"
                        step="0.01"
                        className={inputClass}
                     />
                     <p className="text-xs text-muted mt-2">If you want to swap for another book, leave this as 0 or empty.</p>
                </div>

                {/* DESCRIPTION */}
                <div>
                    <label className={labelClass}>Description</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        placeholder="Mention any highlights, missing pages, or specific books you want in return..."
                        rows="4"
                        className={inputClass}
                    />
                </div>

                {/* IMAGE UPLOAD */}
                <div className="p-6 border border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-center relative">
                    <input
                        type="file"
                        onChange={handleImageChange}
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="pointer-events-none">
                        {formData.imageFile ? (
                             <div className="flex flex-col items-center">
                                <img 
                                    src={`data:${formData.imageFile.type};base64,${formData.imageFile.buffer}`} 
                                    alt="Preview" 
                                    className="h-32 w-auto object-contain rounded-lg mb-2 shadow-lg"
                                />
                                <span className="text-primary text-sm font-bold">Image Selected (Click to change)</span>
                             </div>
                        ) : (
                            <>
                                <FontAwesomeIcon icon={ICONS.IMAGE} className="text-4xl text-muted mb-3" />
                                <p className="text-white font-bold">Upload Book Cover</p>
                                <p className="text-xs text-muted">PNG, JPG up to 5MB</p>
                            </>
                        )}
                    </div>
                </div>

                {/* ACTIONS */}
                <div className="flex gap-4 pt-4 border-t border-white/10">
                    <button
                        type="button"
                        onClick={() => navigate('/book-exchange')}
                        className="flex-1 py-3 rounded-xl border border-white/20 hover:bg-white/10 text-white font-bold transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 lux-btn-primary py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                             <>
                                <FontAwesomeIcon icon={ICONS.CLOCK} className="animate-spin" />
                                Processing...
                             </>
                        ) : (
                             <>
                                <FontAwesomeIcon icon={ICONS.PLUS} />
                                List Book
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

export default AddBookPage;