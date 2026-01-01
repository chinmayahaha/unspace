import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import logo from '../assets/unspace-logo.svg';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Theme (light/dark) persisted in localStorage
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('theme') || 'dark';
    } catch (e) {
      return 'dark';
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  // Don't show navigation on auth pages or homepage
  if (location.pathname === '/signin' || location.pathname === '/signup' || location.pathname === '/') {
    return null;
  }

  return (
    <>
      <nav className="navigation">
        <div className="nav-container">
          {/* Logo */}
          <Link to="/" className="nav-logo" onClick={closeMenu}>
            <img src={logo} alt="UnSpace" className="nav-logo-img" />
          </Link>

        {/* Desktop Navigation */}
        <div className="nav-menu">
          <div className="nav-links">
            <Link 
              to="/" 
              className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <FontAwesomeIcon icon={ICONS.HOME} />
              Home
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/marketplace" 
                  className={`nav-link ${location.pathname.startsWith('/marketplace') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.SHOPPING_CART} />
                  Marketplace
                </Link>
                <Link 
                  to="/book-exchange" 
                  className={`nav-link ${location.pathname.startsWith('/book-exchange') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.BOOK} />
                  Book Exchange
                </Link>
                <Link 
                  to="/community" 
                  className={`nav-link ${location.pathname.startsWith('/community') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.COMMENTS} />
                  Community
                </Link>
                <Link 
                  to="/businessx" 
                  className={`nav-link ${location.pathname.startsWith('/businessx') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.BRIEFCASE} />
                  BusinessX
                </Link>
                <Link 
                  to="/adsx" 
                  className={`nav-link ${location.pathname.startsWith('/adsx') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.BULLHORN} />
                  AdsX
                </Link>
                <Link 
                  to="/dashboard" 
                  className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.USER} />
                  Dashboard
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`nav-link ${location.pathname === '/admin' ? 'active' : ''}`}
                    onClick={closeMenu}
                  >
                    <FontAwesomeIcon icon={ICONS.SETTINGS} />
                    Admin
                  </Link>
                )}
                <button 
                  onClick={handleSignOut}
                  className="nav-link nav-signout"
                >
                  <FontAwesomeIcon icon={ICONS.SIGNOUT} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/signin" 
                  className="nav-link nav-auth"
                  onClick={closeMenu}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="nav-link nav-auth nav-primary"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* User Info (Desktop) */}
          {user && (
            <div className="nav-user-info">
              <FontAwesomeIcon icon={ICONS.USER} className="user-avatar" />
              <span className="user-name">{user.name}</span>
            </div>
          )}
          <button className="nav-theme-toggle btn secondary" onClick={toggleTheme} aria-label="Toggle theme">
            <FontAwesomeIcon icon={theme === 'dark' ? ICONS.SUN : ICONS.MOON} />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="nav-toggle" onClick={toggleMenu}>
          <FontAwesomeIcon icon={isMenuOpen ? ICONS.TIMES : ICONS.BARS} />
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`nav-mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <div className="nav-mobile-content">
          {user && (
            <div className="mobile-user-info">
              <FontAwesomeIcon icon={ICONS.USER} className="mobile-user-avatar" />
              <div className="mobile-user-details">
                <span className="mobile-user-name">{user.name}</span>
                <span className="mobile-user-email">{user.email}</span>
              </div>
            </div>
          )}

          <div className="nav-mobile-links">
            <Link 
              to="/" 
              className={`nav-mobile-link ${location.pathname === '/' ? 'active' : ''}`}
              onClick={closeMenu}
            >
              <FontAwesomeIcon icon={ICONS.HOME} />
              Home
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/marketplace" 
                  className={`nav-mobile-link ${location.pathname.startsWith('/marketplace') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.SHOPPING_CART} />
                  Marketplace
                </Link>
                <Link 
                  to="/book-exchange" 
                  className={`nav-mobile-link ${location.pathname.startsWith('/book-exchange') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.BOOK} />
                  Book Exchange
                </Link>
                <Link 
                  to="/community" 
                  className={`nav-mobile-link ${location.pathname.startsWith('/community') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.COMMENTS} />
                  Community
                </Link>
                <Link 
                  to="/businessx" 
                  className={`nav-mobile-link ${location.pathname.startsWith('/businessx') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.BRIEFCASE} />
                  BusinessX
                </Link>
                <Link 
                  to="/adsx" 
                  className={`nav-mobile-link ${location.pathname.startsWith('/adsx') ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.BULLHORN} />
                  AdsX
                </Link>
                <Link 
                  to="/dashboard" 
                  className={`nav-mobile-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                  onClick={closeMenu}
                >
                  <FontAwesomeIcon icon={ICONS.USER} />
                  Dashboard
                </Link>
                <button 
                  onClick={handleSignOut}
                  className="nav-mobile-link nav-mobile-signout"
                >
                  <FontAwesomeIcon icon={ICONS.SIGNOUT} />
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/signin" 
                  className="nav-mobile-link"
                  onClick={closeMenu}
                >
                  Sign In
                </Link>
                <Link 
                  to="/signup" 
                  className="nav-mobile-link nav-mobile-primary"
                  onClick={closeMenu}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && <div className="nav-overlay" onClick={closeMenu}></div>}
      </nav>
      
      {/* Checkered Divider - appears on all pages */}
      <div className="checkered-divider"></div>
    </>
  );
};

export default Navigation;
