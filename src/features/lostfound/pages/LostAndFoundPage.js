/* src/features/lostfound/pages/LostAndFoundPage.js */
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { functions, firebaseConfigured } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';

const LostAndFoundPage = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all'); // all, lost, found
  const [category, setCategory] = useState('All');

  const categories = ["All", "Phone", "Wallet", "Keys", "Laptop", "Bag", "ID/Documents", "Other"];

  const loadItems = useCallback(async () => {
    if (!firebaseConfigured || !functions) {
      setLoading(false);
      setError("Firebase not configured.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const getLostAndFoundItems = httpsCallable(functions, 'getLostAndFoundItems');
      
      const result = await getLostAndFoundItems({
        type: activeTab === 'all' ? null : activeTab,
        category: category === 'All' ? null : category,
        status: 'active',
        limit: 20
      });

      setItems(result.data.items || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load items. Please try again.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, category]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const getStatusBadge = (type) => {
    return type === 'lost' 
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-green-500/20 text-green-400 border-green-500/30';
  };

  const formatDate = (date) => {
    try {
      if (!date) return 'Recently';
      if (date._seconds) return new Date(date._seconds * 1000).toLocaleDateString();
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Recently';
    }
  };

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">
      
      {/* HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-end">
        <div>
          <h1 className="lux-title text-5xl">Lost & Found</h1>
          <p className="lux-subtitle">Help reunite students with their belongings.</p>
        </div>
        <Link to="/lostfound/post">
          <button className="lux-btn-primary px-6 py-3 flex items-center gap-2 mt-4 md:mt-0">
            <FontAwesomeIcon icon={ICONS.PLUS} /> Report Item
          </button>
        </Link>
      </header>

      {/* TABS: All / Lost / Found */}
      <div className="flex gap-4 mb-6 border-b border-white/10 pb-2">
        {['all', 'lost', 'found'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 font-bold uppercase text-sm transition-colors ${
              activeTab === tab
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted hover:text-white'
            }`}
          >
            {tab === 'all' ? 'All Items' : tab === 'lost' ? '🔍 Lost' : '✅ Found'}
          </button>
        ))}
      </div>

      {/* CATEGORY FILTER */}
      <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
              category === cat
                ? 'bg-primary text-black'
                : 'bg-white/5 text-muted hover:bg-white/10 hover:text-white'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {error && (
        <div className="lux-card bg-red-800/20 text-red-300 p-4 mb-6">{error}</div>
      )}

      {/* ITEMS GRID */}
      {loading ? (
        <div className="text-muted text-center py-20 animate-pulse">Loading items...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <div className="col-span-3 lux-card p-12 text-center text-muted border border-dashed border-white/10">
              <div className="text-4xl mb-4">📦</div>
              <h3>No items found in this category.</h3>
              <p>Be the first to report!</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.id} className="lux-card group hover:border-primary/50 transition-all p-0 overflow-hidden flex flex-col">
                
                {/* Image */}
                <div className="h-48 bg-white/5 relative overflow-hidden">
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">
                     {item.category === 'Phone' ? '📱' :
item.category === 'Wallet' ? '👛' :
item.category === 'Keys' ? '🔑' :
item.category === 'Laptop' ? '💻' :
item.category === 'Bag' ? '🎒' :
item.category === 'ID/Documents' ? '🪪' : '📦'}
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold uppercase border ${getStatusBadge(item.type)}`}>
                    {item.type}
                  </div>
                  {/* Category Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                    {item.category}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted mb-3 line-clamp-2 flex-1">
                    {item.description}
                  </p>
                  
                  {item.location && (
                    <div className="flex items-center gap-2 text-xs text-muted mb-3">
                      <FontAwesomeIcon icon={ICONS.MAP_MARKER_ALT} className="text-primary" />
                      {item.location}
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-white/10">
                    <span className="text-xs text-muted">{formatDate(item.createdAt)}</span>
                    <Link to={`/lostfound/${item.id}`}>
                      <button className="text-sm font-bold text-primary hover:text-white transition-colors">
                      View Details →
                      </button>
                    </Link>
                  </div>
                </div>

              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default LostAndFoundPage;