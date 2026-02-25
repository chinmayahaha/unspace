/* src/components/layout/Layout.js */
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../features/auth/context/AuthContext';
import LuxuryBackground from '../UI/LuxuryBackground';
import './Layout.css';

const NAV_ITEMS = [
  { path: '/dashboard',     label: 'Dashboard',    icon: '📊' },
  { path: '/marketplace',   label: 'Marketplace',  icon: '🛍️' },
  { path: '/book-exchange', label: 'BookX',        icon: '📚' },
  { path: '/lostfound',     label: 'Lost & Found', icon: '🔍' },
  { path: '/adsx',          label: 'AdsX',         icon: '📢' },
  { path: '/messages',      label: 'Messages',     icon: '💬', showBadge: true },
  { path: '/terms',         label: 'Terms',        icon: '📜' },
  { path: '/contact',       label: 'Contact',      icon: '📞' },
];

const Layout = ({ children }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isLinkActive = (path) => location.pathname.startsWith(path);

  // Count unread conversations
  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    // Query conversations where user is a participant and has unread messages
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.id)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      // For each conversation, check if there are unread messages
      // This is a simplified version - in production you'd store unread count in conversation doc
      let totalUnread = 0;
      
      for (const convDoc of snapshot.docs) {
        const conv = convDoc.data();
        // Check if last message was from someone else
        const participants = conv.participants || [];
        const lastMessageSender = conv.lastMessageSenderId; // Would need to add this field
        if (lastMessageSender && lastMessageSender !== user.id) {
          totalUnread++;
        }
      }
      
      setUnreadCount(totalUnread);
    }, (error) => {
      console.error("Failed to fetch unread count:", error);
      setUnreadCount(0);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="app_layout">
      <LuxuryBackground />

      {/* Mobile Toggle Button */}
      <button
        className="mobile_toggle_btn"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label="Toggle Menu"
      >
        {mobileMenuOpen ? '✕' : '☰'}
      </button>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="sidebar_overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
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

                {/* Unread badge for Messages */}
                {item.showBadge && unreadCount > 0 && (
                  <span className="nav_badge">{unreadCount}</span>
                )}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main_content">
        {children}
      </main>
    </div>
  );
};

export default Layout;