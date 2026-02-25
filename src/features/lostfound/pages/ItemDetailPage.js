/* src/features/lostfound/pages/ItemDetailPage.js */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db, functions } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';
import { useAuth } from '../../auth/context/AuthContext';

const ItemDetailPage = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true);
        const itemDoc = await getDoc(doc(db, 'lostAndFound', itemId));
        if (itemDoc.exists()) {
          setItem({ id: itemDoc.id, ...itemDoc.data() });
        } else {
          setError('Item not found');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load item');
      } finally {
        setLoading(false);
      }
    };

    if (itemId) fetchItem();
  }, [itemId]);

  const handleClaim = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const message = window.prompt(
      `Claim this ${item.type} item?\n\nProvide details to verify ownership:`,
      "I can provide proof of ownership..."
    );
    if (!message) return;

    try {
      const claimLostOrFoundItem = httpsCallable(functions, 'claimLostOrFoundItem');
      const result = await claimLostOrFoundItem({ itemId: item.id, message });
      
      if (result.data.conversationId) {
        alert("Claim sent! Check your Messages to communicate with the poster.");
        navigate('/messages');
      }
    } catch (err) {
      console.error(err);
      alert("Failed to send claim: " + err.message);
    }
  };

  const handleMarkResolved = async () => {
    if (!window.confirm("Mark this item as resolved/returned?")) return;

    try {
      const markLostOrFoundResolved = httpsCallable(functions, 'markLostOrFoundResolved');
      await markLostOrFoundResolved({ itemId: item.id });
      alert("Item marked as resolved!");
      navigate('/lostfound');
    } catch (err) {
      alert("Failed to mark resolved: " + err.message);
    }
  };

  const formatDate = (date) => {
    try {
      if (!date) return 'Unknown';
      if (date._seconds) return new Date(date._seconds * 1000).toLocaleDateString();
      return new Date(date).toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) return (
    <div className="text-center py-20 text-white animate-pulse">Loading item...</div>
  );

  if (error || !item) return (
    <div className="text-center py-20">
      <p className="text-red-400 mb-4">{error || 'Item not found'}</p>
      <Link to="/lostfound" className="lux-btn-primary px-6 py-3 inline-block">
        Back to Lost & Found
      </Link>
    </div>
  );

  const isOwner = user?.id === item.posterId;
  const statusBadge = item.type === 'lost'
    ? 'bg-red-500/20 text-red-400 border-red-500/30'
    : 'bg-green-500/20 text-green-400 border-green-500/30';

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">

      {/* HEADER */}
      <div className="mb-6">
        <Link to="/lostfound" className="text-muted hover:text-white text-sm mb-4 inline-block">
          ← Back to Lost & Found
        </Link>

        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${statusBadge}`}>
                {item.type}
              </span>
              <span className="text-muted text-sm">Posted {formatDate(item.createdAt)}</span>
            </div>
            <h1 className="lux-title text-4xl leading-tight">{item.title}</h1>
            <p className="text-muted text-lg mt-2">{item.category}</p>
          </div>

          <div className="lux-card p-4 text-center min-w-[180px] border border-primary/30 bg-primary/5">
            <span className="block text-muted text-xs uppercase tracking-widest mb-1">Status</span>
            <span className="block text-2xl font-bold text-white capitalize">
              {item.status}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT: IMAGES & DETAILS */}
        <div className="lg:col-span-2 space-y-8">

          {/* Images */}
          {item.images && item.images.length > 0 && (
            <div className="lux-card p-8">
              <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Photos</h3>
              <div className="grid grid-cols-2 gap-4">
                {item.images.map((url, idx) => (
                  <img key={idx} src={url} alt={`${item.title} ${idx + 1}`}
                    className="w-full h-64 object-cover rounded-lg border border-white/10" />
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="lux-card p-8">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Description</h3>
            <p className="text-gray-300 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Details */}
          <div className="lux-card p-8">
            <h3 className="text-xl font-bold mb-4 text-white border-b border-white/10 pb-2">Details</h3>
            <div className="space-y-3 text-sm">
              {item.location && (
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={ICONS.MAP_MARKER_ALT} className="text-primary w-5" />
                  <span className="text-muted">Location:</span>
                  <span className="text-white font-bold">{item.location}</span>
                </div>
              )}
              {item.dateOccurred && (
                <div className="flex items-center gap-3">
                  <FontAwesomeIcon icon={ICONS.CALENDAR} className="text-primary w-5" />
                  <span className="text-muted">Date:</span>
                  <span className="text-white font-bold">{formatDate(item.dateOccurred)}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <FontAwesomeIcon icon={ICONS.USER} className="text-primary w-5" />
                <span className="text-muted">Posted by:</span>
                <span className="text-white font-bold">{isOwner ? 'You' : 'Another student'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT: ACTIONS */}
        <div className="space-y-6">
          <div className="lux-card p-6 sticky top-6">
            <h3 className="font-bold text-white mb-4">Actions</h3>

            {isOwner ? (
              <>
                <p className="text-sm text-muted mb-4">This is your post</p>
                {item.status === 'active' && (
                  <button onClick={handleMarkResolved}
                    className="lux-btn-primary w-full py-3 mb-3 flex justify-center items-center gap-2">
                    <FontAwesomeIcon icon={ICONS.CHECK_CIRCLE} /> Mark as Resolved
                  </button>
                )}
                <Link to="/messages">
                  <button className="lux-btn-secondary w-full py-3">
                    View Messages
                  </button>
                </Link>
              </>
            ) : (
              <>
                {user ? (
                  <button onClick={handleClaim}
                    className="lux-btn-primary w-full py-3 mb-3 flex justify-center items-center gap-2">
                    <FontAwesomeIcon icon={ICONS.HAND_PAPER} /> Claim This Item
                  </button>
                ) : (
                  <Link to="/signin">
                    <button className="lux-btn-primary w-full py-3 mb-3">
                      Sign In to Claim
                    </button>
                  </Link>
                )}
              </>
            )}

            {item.contactInfo && (
              <div className="mt-6 pt-6 border-t border-white/10 text-sm text-muted">
                <p className="mb-2"><span className="text-white font-bold">Contact:</span></p>
                <p className="text-white">{item.contactInfo}</p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ItemDetailPage;