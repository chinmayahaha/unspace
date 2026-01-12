import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../config/icons';
import logo from '../../assets/unspace-logo.svg';
import './Navigation.css';

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Lazy Init Theme
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  // Logic: Hide nav on specific auth pages
  if (['/signin', '/signup', '/'].includes(location.pathname)) {
    return null;
  }

  return (
    <>
      <nav className="navigation" role="navigation">
        <div className="nav-container">
          <Link to="/" className="nav-logo">
            <img src={logo} alt="UnSpace Logo" className="nav-logo-img" />
          </Link>

          {/* Semantic Desktop Menu */}
          <ul className="nav-menu">
            <li>
              <Link to="/" className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}>
                <FontAwesomeIcon icon={ICONS.HOME} /> Home
              </Link>
            </li>
            
            {user ? (
              <>
                <li>
                  <Link to="/marketplace" className={location.pathname.includes('marketplace') ? 'nav-link active' : 'nav-link'}>
                    <FontAwesomeIcon icon={ICONS.SHOPPING_CART} /> Marketplace
                  </Link>
                </li>
                <li>
                  <Link to="/book-exchange" className={location.pathname.includes('book-exchange') ? 'nav-link active' : 'nav-link'}>
                    <FontAwesomeIcon icon={ICONS.BOOK} /> Books
                  </Link>
                </li>
                <li>
                  <Link to="/dashboard" className={location.pathname === '/dashboard' ? 'nav-link active' : 'nav-link'}>
                    <FontAwesomeIcon icon={ICONS.USER} /> Dashboard
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link to="/admin" className="nav-link">Admin</Link>
                  </li>
                )}
                <li>
                  <button onClick={handleSignOut} className="nav-link nav-signout">
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li className="auth-buttons">
                <Link to="/signin" className="nav-link">Sign In</Link>
                <Link to="/signup" className="nav-link nav-primary">Sign Up</Link>
              </li>
            )}

            <li>
              <button 
                onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} 
                className="nav-theme-toggle"
                aria-label="Toggle Theme"
              >
                <FontAwesomeIcon icon={theme === 'dark' ? ICONS.SUN : ICONS.MOON} />
              </button>
            </li>
          </ul>

          {/* Mobile Toggle */}
          <button className="nav-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <FontAwesomeIcon icon={isMenuOpen ? ICONS.TIMES : ICONS.BARS} />
          </button>
        </div>
      </nav>
      
      <div className="checkered-divider"></div>
    </>
  );
};

export default Navigation;

