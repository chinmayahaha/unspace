import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { functions, firebaseConfigured } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';

const MarketplacePage = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [filters, setFilters] = useState({ category: '', minPrice: '', maxPrice: '' });

  const fetchListings = async () => {
    if (!firebaseConfigured || !functions) { setLoading(false); return; }
    try {
      setLoading(true);
      const getAllListings = httpsCallable(functions, 'getAllListings');
      const result = await getAllListings({ limit: 20, searchTerm: activeSearch, ...filters });
      setListings(result.data?.listings || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchListings(); 
  }, [activeSearch, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleManualSearch = () => {
    setActiveSearch(searchTerm); 
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
        handleManualSearch();
    }
  };

  return (
    <div className="min-h-screen text-white">
      {/* HEADER */}
      <header className="mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
            <span className="font-mono text-secondary text-sm tracking-widest uppercase mb-2 block">Marketplace</span>
            <h1 className="text-5xl md:text-6xl font-bold font-heading mb-4 tracking-tight">Buy & Sell</h1>
            <p className="text-muted text-lg max-w-xl">The safe campus marketplace for students. Connect, trade, and save.</p>
        </div>
        <Link to="/marketplace/new">
            <button className="bg-white text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg shadow-white/10">
                <FontAwesomeIcon icon={ICONS.PLUS} /> Sell Item
            </button>
        </Link>
      </header>

      {/* SEARCH & FILTERS ROW */}
      <div className="bg-panel border border-border backdrop-blur-xl rounded-2xl p-4 mb-10 shadow-2xl">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_200px_auto] gap-4 items-center">
            
            {/* Search Bar - FIXED */}
            <div className="flex items-center bg-white/5 rounded-xl px-4 h-12 border border-transparent focus-within:border-primary transition-colors">
                <FontAwesomeIcon 
                    icon={ICONS.SEARCH} 
                    className="text-muted mr-3 cursor-pointer hover:text-white"
                    onClick={handleManualSearch} 
                />
                
                <input 
                    type="text" 
                    className="bg-transparent border-none outline-none text-white w-full h-full placeholder-gray-500 font-sans" 
                    placeholder="Search for laptops, furniture..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                />
            </div>

            {/* Category Select */}
            <div className="relative h-12">
                <select 
                    className="w-full h-full bg-white/5 border border-white/10 rounded-xl px-4 text-white appearance-none cursor-pointer hover:bg-white/10 transition-colors focus:border-primary outline-none"
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                    <option value="" className="bg-black">All Categories</option>
                    <option value="electronics" className="bg-black">Electronics</option>
                    <option value="books" className="bg-black">Books</option>
                    <option value="furniture" className="bg-black">Furniture</option>
                </select>
            </div>

            {/* Price Inputs */}
            <div className="flex gap-2 h-12">
                <input 
                    type="number" 
                    placeholder="Min $" 
                    className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-3 text-white outline-none focus:border-primary"
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)} 
                />
                <input 
                    type="number" 
                    placeholder="Max $" 
                    className="w-1/2 bg-white/5 border border-white/10 rounded-xl px-3 text-white outline-none focus:border-primary"
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)} 
                />
            </div>

            <button 
                onClick={fetchListings} 
                className="h-12 px-6 rounded-xl border border-white/20 hover:bg-white/10 transition-colors font-medium text-white"
            >
                Apply
            </button>
        </div>
      </div>

      {/* LISTINGS GRID */}
      {loading ? (
         <div className="text-center py-20 text-muted animate-pulse">Loading marketplace...</div>
      ) : listings.length === 0 ? (
         <div className="text-center py-20">
            <div className="text-6xl mb-4">👻</div>
            <h3 className="text-xl text-white font-bold">No items found</h3>
            <p className="text-muted">Be the first to list something!</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {listings.map(listing => (
                <div key={listing.id} className="group bg-panel border border-border rounded-2xl overflow-hidden hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/10 flex flex-col">
                    {/* Image Area */}
                    <div className="h-48 bg-black/50 relative overflow-hidden">
                        {listing.image ? (
                            <img src={listing.image} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-white/20">
                                <FontAwesomeIcon icon={ICONS.IMAGE} size="3x" />
                            </div>
                        )}
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold text-white border border-white/10">
                            {listing.category || 'Item'}
                        </div>
                    </div>
                    
                    {/* Content Area */}
                    <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
                            <span className="text-primary font-bold font-mono text-lg">${listing.price}</span>
                        </div>
                        
                        <p className="text-sm text-muted mb-4 line-clamp-2 flex-1">
                            {listing.description || 'No description provided.'}
                        </p>

                        <Link to={`/listing/${listing.id}`} className="block mt-auto">
                            <button className="w-full py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white hover:text-black transition-all font-semibold text-sm">
                                View Details
                            </button>
                        </Link>
                    </div>
                </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default MarketplacePage;