/* src/components/layout/Layout.js */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../../firebase'; 
import LuxuryBackground from '../UI/LuxuryBackground';
import './Layout.css';

// Admin is intentionally excluded here
const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/marketplace', label: 'Marketplace', icon: '🛍️' },
  { path: '/book-exchange', label: 'BookX', icon: '📚' },
  { path: '/community', label: 'Community', icon: '🤝' },
  { path: '/adsx', label: 'AdsX', icon: '📢' },
  { path: '/terms', label: 'Terms', icon: '📜' },
  { path: '/contact', label: 'Contact', icon: '📞' },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLinkActive = (path) => location.pathname.startsWith(path);

  // RED DOT LISTENER
  useEffect(() => {
    let userId = auth.currentUser?.uid;
    if (!userId && window.location.hostname === 'localhost') {
        userId = "emulator-test-user-123";
    }
    if (!userId) return;

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
      <LuxuryBackground /> 

      {/* 1. TOGGLE BUTTON (Styled in CSS now) */}
      <button 
        className="mobile_toggle_btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* 2. OVERLAY (Closes sidebar when clicked) */}
      {mobileMenuOpen && (
        <div 
            className="sidebar_overlay"
            onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* 3. SIDEBAR */}
      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar_content">
            <Link to="/" className="logo_area" onClick={() => setMobileMenuOpen(false)}>
            UNSPACE<span className="logo_dot">.</span>
            </Link>

            <nav className="nav_menu">
            {NAV_ITEMS.map((item) => (
                <Link
                key={item.path}
                to={item.path}
                className={`nav_link ${isLinkActive(item.path) ? 'nav_link_active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
                >
                <span className="nav_icon">{item.icon}</span>
                {item.label}

                {/* Red Dot Badge */}
                {item.path === '/dashboard' && unreadCount > 0 && (
                    <span className="nav_badge">
                        {unreadCount}
                    </span>
                )}
                </Link>
            ))}
            </nav>
        </div>
      </aside>

      {/* 4. MAIN CONTENT */}
      <main className="main_content">
        {children}
      </main>
    </div>
  );
};

export default Layout;