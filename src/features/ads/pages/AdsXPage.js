/* src/features/ads/pages/AdsXPage.js */
/* src/features/ads/pages/AdsXPage.js */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { functions, firebaseConfigured } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';

const AdsXPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); 
  const [serviceType, setServiceType] = useState('All');

  const loadRequests = useCallback(async () => {
    if (!firebaseConfigured || !functions) {
        setLoading(false);
        setError("Firebase not configured.");
        return;
    }

    try {
      setLoading(true);
      setError(null);
      const getRequests = httpsCallable(functions, 'getRequests');
      const result = await getRequests({ limit: 20, serviceType: serviceType === 'All' ? null : serviceType });
      setRequests(result.data.requests || []); 
    } catch (err) {
      console.error('Fetch error:', err); 
      setError('Failed to load requests.');
      setRequests([]); 
    } finally {
      setLoading(false);
    }
  }, [serviceType]);

  useEffect(() => { loadRequests(); }, [loadRequests]);

  const categories = ["All", "Design", "Video", "Content", "Marketing", "Tutoring", "Labor", "Other"];

  return (
    <div className="min-h-screen w-full pr-6 text-white">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="lux-title text-5xl">AdsX</h1>
          <p className="lux-subtitle">Campus Gig Economy. Post tasks, get help, make money.</p>
        </div>
        <Link to="/adsx/submit">
          <button className="lux-btn-primary px-6 py-3 flex items-center gap-2">
            <FontAwesomeIcon icon={ICONS.PLUS} /> Post a Request
          </button>
        </Link>
      </header>

      {/* Category Tabs */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2 border-b border-white/10">
        {categories.map(cat => (
            <button
                key={cat}
                onClick={() => setServiceType(cat)}
                className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                    serviceType === cat 
                    ? 'bg-primary text-black' 
                    : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
                }`}
            >
                {cat}
            </button>
        ))}
      </div>

      {error && <div className="lux-card bg-red-800/20 text-red-300 p-4 mb-6">{error}</div>}

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? <div className="text-muted animate-pulse col-span-3 text-center py-20">Loading requests...</div> : 
             requests.length === 0 ? (
                <div className="col-span-3 lux-card p-12 text-center text-muted border border-dashed border-white/10">
                    <div className="text-4xl mb-4">📢</div>
                    <h3>No requests found in this category.</h3>
                    <p>Be the first to post!</p>
                </div>
             ) : (
                requests.map(req => (
                    <div key={req.id} className="lux-card flex flex-col justify-between group hover:border-primary/50 transition-colors">
                        <div>
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded text-secondary uppercase tracking-wide">
                                    {req.serviceType}
                                </span>
                                <span className="text-xs text-muted font-mono">{new Date(req.createdAt._seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            
                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">{req.title}</h3>
                            <p className="text-muted text-sm mb-4 line-clamp-3">{req.description}</p>
                            
                            {req.creativeAssets && req.creativeAssets.length > 0 && (
                                <div className="mb-4 flex gap-2">
                                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">
                                        📎 {req.creativeAssets.length} Attachment(s)
                                    </span>
                                </div>
                            )}
                        </div>
                        
                        <div className="flex justify-between items-center pt-4 border-t border-white/10 mt-2">
                            <span className="text-white font-mono font-bold text-lg">
                                {req.budget > 0 ? `$${req.budget}` : 'Negotiable'}
                            </span>
                            <Link to={`/adsx/${req.id}`}>
                                <button className="text-sm font-bold hover:text-white text-muted transition-colors">
                                    View Details →
                                </button>
                            </Link>
                        </div>
                    </div>
                ))
            )}
      </div>
    </div>
  );
};

export default AdsXPage;