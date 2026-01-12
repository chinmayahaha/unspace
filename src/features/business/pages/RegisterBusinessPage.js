import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// FIX: Pointing to the lib folder from 4 levels deep
import { functions } from '../../../firebase'; 
import { ICONS } from '../../../config/icons';
import './RegisterBusinessPage.css';

const RegisterBusinessPage = () => {
  const navigate = useNavigate();
  const storage = getStorage(); 
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    contactEmail: '',
    website: '',
    socialMedia: { instagram: '', facebook: '' },
  });
  const [logoFile, setLogoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // ... (Your existing input logic here) ...
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) setLogoFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let logoUrl = '';
      
      // 1. Upload Image Client-Side (Prevents Function Crash)
      if (logoFile) {
        const fileRef = ref(storage, `businesses/${Date.now()}_${logoFile.name}`);
        const snapshot = await uploadBytes(fileRef, logoFile);
        logoUrl = await getDownloadURL(snapshot.ref);
      }

      // 2. Submit Data to Backend
      const registerFn = httpsCallable(functions, 'registerBusiness');
      await registerFn({ ...formData, logoUrl });

      navigate('/businessx');
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to register business");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="container">
        <h1>Register Business</h1>
        {error && <div className="error-banner">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          {/* ... Your Inputs ... */}
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Registering...' : 'Submit'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterBusinessPage;