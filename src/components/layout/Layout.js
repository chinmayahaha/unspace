/* src/components/layout/Layout.js */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase'; // Adjust path if needed (../../firebase)
import LuxuryBackground from '../UI/LuxuryBackground';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/marketplace', label: 'Marketplace', icon: '🛍️' },
  { path: '/book-exchange', label: 'BookX', icon: '📚' },
  { path: '/community', label: 'Community', icon: '🤝' },
  { path: '/adsx', label: 'AdsX', icon: '📢' },
  { path: '/terms', label: 'Terms', icon: '📜' },
  { path: '/contact', label: 'Contact', icon: '📞' },
  // Add to NAV_ITEMS:
{ path: '/admin', label: 'Admin', icon: '⚡' },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const isLinkActive = (path) => location.pathname.startsWith(path);

  // RED DOT LISTENER
  useEffect(() => {
    // 1. If no user, do nothing (or if emulator, we might need to hardcode ID if auth is null)
    let userId = auth.currentUser?.uid;
    
    // EMULATOR BYPASS FOR LAYOUT (Matches your backend logic)
    if (!userId && window.location.hostname === 'localhost') {
        userId = "emulator-test-user-123";
    }

    if (!userId) return;

    // 2. Listen for unread notifications
    const q = query(
      collection(db, "notifications"),
      where("toUserId", "==", userId),
      where("read", "==", false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="app_layout">
      {/* PERFORMANCE: If this component is heavy, consider removing it during dev */}
      <LuxuryBackground /> 

      <aside className="sidebar">
        <Link to="/" className="logo_area">
          UNSPACE<span className="logo_dot">.</span>
        </Link>

        <nav className="nav_menu">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav_link ${isLinkActive(item.path) ? 'nav_link_active' : ''}`}
              style={{ position: 'relative' }} // For the badge
            >
              <span className="nav_icon">{item.icon}</span>
              {item.label}

              

              {/* THE RED DOT BADGE */}
              {item.path === '/dashboard' && unreadCount > 0 && (
                <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: '#ef4444',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    padding: '2px 6px',
                    borderRadius: '10px',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}>
                    {unreadCount}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="main_content">
        {children}
      </main>
    </div>
  );
};

export default Layout;