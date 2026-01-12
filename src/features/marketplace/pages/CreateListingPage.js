import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { functions, storage, firebaseConfigured } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
// NO UUID IMPORT HERE

const CreateListingPage = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    title: '', description: '', price: '', category: '', condition: 'good'
  });

  const [imageFiles, setImageFiles] = useState([]); 
  const [previews, setPreviews] = useState([]);     

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 

  useEffect(() => {
    return () => previews.forEach(url => URL.revokeObjectURL(url));
  }, [previews]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 5) {
        alert("Maximum 5 images allowed.");
        return;
    }

    const newPreviews = files.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
    setImageFiles(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setPreviews(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!firebaseConfigured || !functions) {
        setError("Firebase not configured.");
        return;
    }

    setLoading(true);
    setError(null);
    
    try {
        // A. Upload Images (Using Date.now() instead of uuid)
        const imageUrls = await Promise.all(
            imageFiles.map(async (file) => {
                // GENERATE SIMPLE UNIQUE NAME
                const uniqueName = `${Date.now()}_${Math.floor(Math.random() * 9999)}_${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;
                const fileRef = ref(storage, `listings/${uniqueName}`);
                
                await uploadBytes(fileRef, file);
                return await getDownloadURL(fileRef);
            })
        );

        // B. Save to Firestore
        const createListing = httpsCallable(functions, 'createListing');
        
        await createListing({
            ...formData,
            price: Number(formData.price),
            images: imageUrls, 
            createdAt: new Date().toISOString()
        });

        alert("✅ Listing Created!");
        navigate('/marketplace');
    } catch (err) {
        console.error('Failed to create listing:', err);
        setError('Failed to publish: ' + err.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 className="lux-title" style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>Create Listing</h1>
        <p className="lux-subtitle" style={{ color: '#aaa' }}>Sell an item to the community.</p>
      </header>
      
      {error && <div className="lux-card" style={{ background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', padding: '1rem', marginBottom: '1rem' }}>{error}</div>}

      <div className="lux-card" style={{ background: 'rgba(255,255,255,0.05)', padding: '2rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem' }}>Title</label>
                    <input type="text" className="lux-input" placeholder="e.g. Macbook Pro M2" required 
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                        onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem' }}>Price ($)</label>
                    <input type="number" className="lux-input" placeholder="0.00" required 
                        style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                        onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem' }}>Category</label>
                    <select required onChange={e => setFormData({...formData, category: e.target.value})}
                        style={{ width: '100%', padding: '10px', background: 'black', border: '1px solid #333', color: 'white', borderRadius: '8px' }}>
                        <option value="">Select Category</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Textbooks">Textbooks</option>
                        <option value="Furniture">Furniture</option>
                        <option value="Services">Services</option>
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem' }}>Condition</label>
                    <select onChange={e => setFormData({...formData, condition: e.target.value})}
                         style={{ width: '100%', padding: '10px', background: 'black', border: '1px solid #333', color: 'white', borderRadius: '8px' }}>
                        <option value="excellent">Excellent</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                    </select>
                </div>
            </div>

            <div>
                <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem' }}>Description</label>
                <textarea rows="5" placeholder="Describe the item..." 
                    style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #333', color: 'white', borderRadius: '8px' }}
                    onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>

            {/* Image Upload Zone */}
            <div>
                <label style={{ display: 'block', color: '#aaa', marginBottom: '0.5rem' }}>Images (Max 5)</label>
                
                {previews.length > 0 && (
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                        {previews.map((src, idx) => (
                            <div key={idx} style={{ position: 'relative', width: '80px', height: '80px' }}>
                                <img src={src} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                <button type="button" onClick={() => removeImage(idx)} 
                                    style={{ position: 'absolute', top: -5, right: -5, background: 'red', color: 'white', borderRadius: '50%', border: 'none', width: '20px', height: '20px', cursor: 'pointer' }}>
                                    X
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div style={{ border: '2px dashed #444', borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer', position: 'relative' }}>
                    <input 
                        type="file" 
                        multiple 
                        accept="image/*"
                        style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                        onChange={handleImageChange}
                    />
                    <FontAwesomeIcon icon={ICONS.IMAGE} size="2x" style={{ color: '#666', marginBottom: '10px' }} />
                    <p style={{ color: '#666', fontSize: '0.9rem' }}>Click to upload photos</p>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1rem' }}>
                <button type="button" onClick={() => navigate('/marketplace')} 
                    style={{ background: 'transparent', color: 'white', border: '1px solid #444', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer' }}>
                    Cancel
                </button>
                <button type="submit" disabled={loading}
                    style={{ background: 'white', color: 'black', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {loading ? 'Uploading...' : 'Create Listing'}
                </button>
            </div>

        </form>
      </div>
    </div>
  );
};

export default CreateListingPage;