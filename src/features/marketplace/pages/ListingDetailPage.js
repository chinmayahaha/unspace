// src/pages/ListingDetailPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import { functions, firebaseConfigured } from '../../../firebase';
import { httpsCallable } from 'firebase/functions';

const ListingDetailPage = () => {
  const { listingId } = useParams();
  const [listing, setListing] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [contacting, setContacting] = useState(false); // New state for button loading
  const [error, setError] = useState(null);

  const fetchListingDetails = useCallback(async () => {
    if (!firebaseConfigured || !functions) {
      setLoading(false);
      setError("Firebase not configured. Cannot load data.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const getListing = httpsCallable(functions, 'getListing');
      const result = await getListing({ listingId });

      if (result.data && result.data.id) {
        setListing(result.data);
      } else {
        setError("Listing not found.");
      }
    } catch (err) {
      console.error('Fetch error in ListingDetailPage:', err);
      setError('Failed to load listing details.');
    } finally {
      setLoading(false);
    }
  }, [listingId]);

  useEffect(() => {
    fetchListingDetails();
  }, [fetchListingDetails]);

  const handleContactSeller = async () => {
    if (!functions) return;
    
    const message = window.prompt("Write a message to the seller:");
    if (!message) return;

    try {
        const contactSellerFunc = httpsCallable(functions, 'contactSeller');
        await contactSellerFunc({ listingId, message });
        alert("Message sent to seller!");
    } catch (err) {
        console.error("Contact failed:", err);
        alert("Failed to send message: " + err.message);
    }
  };

  if (loading) {
    return <div className="text-muted text-center py-20">Loading listing details...</div>;
  }
  
  if (error || !listing) {
    return (
        <div className="lux-card p-8 text-center bg-red-800/20 text-red-300">
            <h1 className="lux-title mb-4">Error</h1>
            <p>{error || "The requested listing could not be found."}</p>
            <Link to="/marketplace" className="text-primary mt-4 inline-block hover:underline">&larr; Back to Marketplace</Link>
        </div>
    );
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      
      <div style={{ marginBottom: '2rem' }}>
         <Link to="/marketplace" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>← Back to Marketplace</Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '2rem' }}>
        
        {/* Left: Images */}
        <div className="lux-card" style={{ padding: '1rem', minHeight: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
            {/* FIX: Check array length instead of single string */}
{listing.images && listing.images.length > 0 ? (
    <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
) : (
                <FontAwesomeIcon icon={ICONS.IMAGE} size="4x" style={{ color: '#333' }} />
            )}
        </div>

        {/* Right: Info */}
        <div className="lux-card" style={{ height: 'fit-content' }}>
            <span style={{ background: 'rgba(139, 92, 246, 0.1)', color: 'var(--accent-primary)', padding: '4px 10px', borderRadius: '4px', fontSize: '0.8rem', textTransform: 'uppercase' }}>
                {listing.category} 
            </span>
            
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', margin: '1rem 0' }}>{listing.title}</h1> 
            <h2 style={{ fontSize: '2.5rem', color: 'white', fontWeight: 'bold', marginBottom: '2rem' }}>${listing.price}</h2> 

            {/* BUTTON CONNECTED HERE */}
            <button 
                className="lux-btn-primary" 
                style={{ width: '100%', marginBottom: '1rem' }}
                onClick={handleContactSeller}
                disabled={contacting}
            >
                {contacting ? "Sending..." : "Contact Seller"}
            </button>
            
            <button className="lux-btn-secondary" style={{ width: '100%' }}>
                Save Item
            </button>

            <div style={{ marginTop: '2rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Description</h4>
                <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>
                    {listing.description} 
                </p>
                <h4 style={{ color: 'var(--text-muted)', marginBottom: '0.5rem', marginTop: '1.5rem' }}>Condition</h4>
                <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>
                    {listing.condition} 
                </p>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ListingDetailPage;