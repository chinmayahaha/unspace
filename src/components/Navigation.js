import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
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

  // Don't show navigation on auth pages
  if (location.pathname === '/signin' || location.pathname === '/signup') {
    return null;
  }

  return (
    <nav className="navigation">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo" onClick={closeMenu}>
          <FontAwesomeIcon icon={ICONS.ROBOT} className="nav-icon" />
          <span>UnSpace</span>
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
                    <FontAwesomeIcon icon={ICONS.GEAR} />
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
  );
};

export default Navigation;
