/* src/pages/DashboardPage.js */
import React, { useState, useEffect } from 'react';
import { db, auth, functions } from '../firebase'; 
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons'; 

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('marketplace');

  const [loadingNotifs, setLoadingNotifs] = useState(true);
  const [notifications, setNotifications] = useState([]);
  
  const [stats, setStats] = useState({ earnings: 0, itemsSold: 0, activeRequests: 0, activeListings: 0 });
  
  const [myListings, setMyListings] = useState([]);
  const [myRequests, setMyRequests] = useState([]); // NEW: Store AdsX requests
  const [loadingListings, setLoadingListings] = useState(true);

  // 1. Fetch User's Listings AND AdsX Requests
  useEffect(() => {
    const fetchData = async () => {
        setLoadingListings(true);
        try {
            // A. Fetch Marketplace Listings
            const getUserListings = httpsCallable(functions, 'getUserListings');
            const listingsResult = await getUserListings();
            const listings = listingsResult.data.listings || [];
            setMyListings(listings);

            // B. Fetch AdsX Requests (NEW)
            const getRequests = httpsCallable(functions, 'getRequests');
            const requestsResult = await getRequests({ type: 'my_requests' });
            const requests = requestsResult.data.requests || [];
            setMyRequests(requests);
            
            // C. Update stats
            setStats(prev => ({
                ...prev,
                activeListings: listings.length,
                activeRequests: requests.length
            }));

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoadingListings(false);
        }
    };

    fetchData();
  }, []); 

 // 2. Live Listener for Notifications
 useEffect(() => {
    let userId = auth.currentUser?.uid;
    // EMULATOR BYPASS
    if (!userId && window.location.hostname === 'localhost') {
        userId = "emulator-test-user-123";
    }

    if (!userId) {
      setLoadingNotifs(false);
      return;
    }

    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setNotifications(notifs);
      setLoadingNotifs(false);
    }, (error) => {
        console.error("Failed to fetch notifications:", error);
        setLoadingNotifs(false);
    });

    return () => unsubscribe();
  }, []);

  const handleReply = (notif) => {
    const replyMsg = window.prompt(`Reply to ${notif.user || 'User'}:`, "Yes, it is still available!");
    if (!replyMsg) return;
    alert(`Reply sent: "${replyMsg}"`);
  };

  return (
    <div className="min-h-screen w-full pr-6">
      {/* 1. WELCOME HEADER */}
      <header className="mb-8 flex flex-col md:flex-row justify-between items-end">
        <div>
          <h1 className="lux-title text-4xl">Dashboard</h1>
          <p className="lux-subtitle mb-0">Welcome back! Manage your listings and requests.</p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
            <Link to="/marketplace/new">
                <button className="lux-btn-primary text-sm">+ Sell Item</button>
            </Link>
            <Link to="/adsx/submit">
                <button className="lux-btn-secondary text-sm">+ Post Request</button>
            </Link>
        </div>
      </header>

      {/* 2. STATS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="lux-card p-4 flex flex-col items-center justify-center bg-gradient-to-br from-white/5 to-white/0">
            <span className="text-muted text-xs uppercase tracking-widest mb-1">Total Earnings</span>
            <span className="text-3xl font-bold font-heading text-green-400">${stats.earnings}</span>
        </div>
        <div className="lux-card p-4 flex flex-col items-center justify-center">
            <span className="text-muted text-xs uppercase tracking-widest mb-1">Items Sold</span>
            <span className="text-3xl font-bold font-heading">{stats.itemsSold}</span>
        </div>
        <div className="lux-card p-4 flex flex-col items-center justify-center">
            <span className="text-muted text-xs uppercase tracking-widest mb-1">Active Gigs</span>
            <span className="text-3xl font-bold font-heading text-primary">{stats.activeRequests}</span>
        </div>
        <div className="lux-card p-4 flex flex-col items-center justify-center">
            <span className="text-muted text-xs uppercase tracking-widest mb-1">Active Listings</span>
            <span className="text-3xl font-bold font-heading">{stats.activeListings}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
        
        {/* 3. LEFT COL: TABS & CONTENT */}
        <div>
            {/* TABS */}
            <div className="flex gap-6 border-b border-white/10 mb-6 pb-2">
                <button 
                    onClick={() => setActiveTab('marketplace')}
                    className={`pb-2 text-sm font-bold tracking-wide transition-colors ${activeTab === 'marketplace' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
                >
                    MY MARKETPLACE
                </button>
                <button 
                    onClick={() => setActiveTab('adsx')}
                    className={`pb-2 text-sm font-bold tracking-wide transition-colors ${activeTab === 'adsx' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
                >
                    ADS / GIGS
                </button>
                <button 
                    onClick={() => setActiveTab('bookx')}
                    className={`pb-2 text-sm font-bold tracking-wide transition-colors ${activeTab === 'bookx' ? 'text-primary border-b-2 border-primary' : 'text-muted hover:text-white'}`}
                >
                    BOOK EXCHANGE
                </button>
            </div>

            {loadingListings && <div className="text-muted text-center py-10">Loading data...</div>}

            {/* TAB CONTENT: MARKETPLACE */}
            {!loadingListings && activeTab === 'marketplace' && (
                <>
                    {myListings.length === 0 ? (
                        <div className="lux-card p-6 text-center text-muted">
                            <p>You have no active listings. <Link to="/marketplace/new" className="text-primary hover:underline">Sell something?</Link></p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {myListings.map(listing => (
                               <Link key={listing.id} to={`/listing/${listing.id}`} className="lux-card group flex flex-col hover:bg-white/5 transition-colors p-0 overflow-hidden">
                                    <div className="h-32 bg-white/5 flex items-center justify-center text-3xl relative">
                                        {listing.images && listing.images.length > 0 ? (
                                            <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <FontAwesomeIcon icon={ICONS.IMAGE} className="text-muted" />
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-lg font-bold text-white line-clamp-1 group-hover:text-primary transition-colors">{listing.title}</h3>
                                        <p className="text-sm text-muted">${listing.price}</p>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* TAB CONTENT: ADS / GIGS (NEW) */}
            {!loadingListings && activeTab === 'adsx' && (
                <>
                    {myRequests.length === 0 ? (
                        <div className="lux-card p-6 text-center text-muted">
                            <p>You haven't posted any service requests. <Link to="/adsx/submit" className="text-primary hover:underline">Post a Request?</Link></p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {myRequests.map(req => (
                               <Link key={req.id} to={`/adsx/${req.id}`} className="lux-card group flex justify-between items-center p-4 hover:border-primary/50 transition-colors">
                                    <div>
                                        <div className="flex gap-2 mb-1">
                                            <span className="text-xs font-bold text-primary uppercase">{req.serviceType}</span>
                                            <span className="text-xs text-muted">• {req.status}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{req.title}</h3>
                                    </div>
                                    <div className="text-right">
                                        <span className="block font-bold text-lg">${req.budget}</span>
                                        <span className="text-xs text-muted">Budget</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </>
            )}
            
            {/* TAB CONTENT: BOOKS */}
            {!loadingListings && activeTab === 'bookx' && (
                 <div className="lux-card p-6 text-center text-muted">
                    <p>Book Exchange dashboard coming soon!</p>
                 </div>
            )}

        </div>

        {/* 4. RIGHT COL: NOTIFICATIONS */}
        <div>
            <h3 className="text-xl font-bold font-heading mb-4">Notifications ({notifications.length})</h3>
            <div className="flex flex-col gap-4">
                {loadingNotifs && <div className="text-muted animate-pulse">Fetching real-time notifications...</div>}

                {!loadingNotifs && notifications.map(notif => (
                    <div key={notif.id} className="lux-card p-4 hover:bg-white/5 transition-colors cursor-pointer border-l-4 border-l-primary">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                            {
  notif.type === 'buy_request' ? 'Buying Inquiry' : 
  notif.type === 'book_request' ? 'Swap Request' : 
  notif.type === 'gig_application' ? 'Gig Application' : 
  'System'
}
                            </span>
                            <span className="text-[10px] text-muted">{notif.time || 'Just now'}</span>
                        </div>
                        
                        <p className="text-sm font-bold text-white mb-1">
                            {notif.user || 'Someone'} is interested in <span className="text-white underline">{notif.item}</span>
                        </p>
                        <p className="text-sm text-muted mb-3 italic">"{notif.message}"</p>
                        
                        <button 
                          className="lux-btn-primary w-full text-xs py-2"
                           onClick={() => handleReply(notif)}
                        >
                                 Reply
                        </button>
                        </div>
            ))}
                
                {!loadingNotifs && notifications.length === 0 && (
                    <div className="lux-card p-6 text-center text-muted border border-dashed border-white/10">
                        All caught up! No new notifications.
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;