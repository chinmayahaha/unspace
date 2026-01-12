import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/context/AuthContext'; // Ensure this path is correct
import './HomePage.css'; 

const FAQ_ITEMS = [
  {
    question: 'How does BookX exchange work?',
    answer: 'List your old textbooks, set a price (or swap), and connect with students on campus. No shipping fees, just meet up and exchange.',
  },
  {
    question: 'Is the platform free for students?',
    answer: 'Yes! Creating an account and browsing listings is completely free. We take a tiny success fee only when you sell something over $50.',
  },
  {
    question: 'How do I verify my student status?',
    answer: 'Simply sign up with your .edu email address. We send a magic link to verify you belong to the campus community.',
  },
  {
    question: 'Can I sell things other than books?',
    answer: 'Absolutely. Furniture, electronics, dorm essentials – if a student needs it, you can sell it here.',
  },
];

const HomePage = () => {
  const [activeFaqIndex, setActiveFaqIndex] = useState(-1);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- FIX START: Corrected variable names to match AuthContext ---
  const { user, signOut } = useAuth(); 
  // --- FIX END ---
  
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
        await signOut(); // Changed from logout() to signOut()
        navigate('/'); 
    } catch (error) {
        console.error("Failed to log out", error);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleFAQ = (index) => {
    setActiveFaqIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="lux-container">
      {/* NAVBAR */}
      <nav className={`lux-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="lux-nav-inner">
          <div className="lux-brand">UNSPACE</div>
          
          <div className={`lux-nav-links ${mobileMenuOpen ? 'open' : ''}`}>
            <Link to="/book-exchange" className="lux-link">BookX</Link>
            <Link to="/marketplace" className="lux-link">Buy & Sell</Link>
            <Link to="/adsx" className="lux-link">AdsX</Link>
            
            {/* MOBILE MENU AUTH LOGIC */}
            <div className="lux-mobile-auth">
                {/* Check 'user' instead of 'currentUser' */}
                {user ? (
                    <button onClick={handleLogout} className="lux-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                        Log Out
                    </button>
                ) : (
                    <Link to="/signin" className="lux-link">Log In</Link>
                )}
            </div>
          </div>

          {/* DESKTOP MENU AUTH LOGIC */}
          <div className="lux-auth">
            {/* Check 'user' instead of 'currentUser' */}
            {user ? (
                <>
                    <Link to="/dashboard" className="lux-btn-text">Dashboard</Link>
                    <button onClick={handleLogout} className="lux-btn-primary">
                        Log Out
                    </button>
                </>
            ) : (
                <>
                    <Link to="/signin" className="lux-btn-text">Log In</Link>
                    <Link to="/signup" className="lux-btn-primary">Sign Up</Link>
                </>
            )}
          </div>

          <button className="lux-hamburger" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="lux-hero">
        <div className="shape-blob blob-1"></div>
        <div className="shape-blob blob-2"></div>
        <div className="shape-blob blob-3"></div>

        <div className="lux-hero-content">
          <h1 className="lux-title">
            Connect. <br />
            <span className="lux-accent">Empower.</span> Thrive.
          </h1>
          <p className="lux-subtitle">
            The exclusive marketplace and community platform for students. 
            Buy, sell, and connect with verified peers on your campus.
          </p>
          <div className="lux-cta-group">
            <Link to="/marketplace" className="lux-btn-large">Explore Market</Link>
            <Link to="/community" className="lux-btn-outline">Join Community</Link>
          </div>
        </div>
      </header>

      {/* METRICS STRIP */}
       <div className="lux-metrics">
       <div className="lux-metric-item">
          <span className="lux-metric-num"></span>
          <span className="lux-metric-label"></span>
        </div>
        <div className="lux-metric-divider"></div>
        <div className="lux-metric-item">
          <span className="lux-metric-num"></span>
          <span className="lux-metric-label"></span>
        </div>
        <div className="lux-metric-divider"></div>
        <div className="lux-metric-item">
          <span className="lux-metric-num"></span>
          <span className="lux-metric-label"></span>
        </div>
      </div>

      {/* FEATURES GRID */}
      <section className="lux-section">
        <h2 className="lux-section-title">The Ecosystem</h2>
        <div className="lux-grid">
          <div className="lux-card">
            <div className="lux-icon">📚</div>
            <h3>BookX Exchange</h3>
            <p>Direct peer-to-peer textbook swapping. No middleman, no markup. Find exactly what you need.</p>
          </div>
          <div className="lux-card">
            <div className="lux-icon">🛒</div>
            <h3>Student Marketplace</h3>
            <p>Buy and sell dorm essentials, electronics, and gear safely within your campus bubble.</p>
          </div>
          <div className="lux-card">
            <div className="lux-icon">🤝</div>
            <h3>Community Hub</h3>
            <p>Find roommates, study groups, and campus events instantly. Your social life, organized.</p>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="lux-section" id="about">
        <h2 className="lux-section-title">Common Questions</h2>
        <div className="lux-accordion">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className="lux-accordion-item" onClick={() => toggleFAQ(index)}>
              <div className="lux-accordion-header">
                {item.question}
                <span className="lux-plus">{activeFaqIndex === index ? '−' : '+'}</span>
              </div>
              <div className={`lux-accordion-body ${activeFaqIndex === index ? 'open' : ''}`}>
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lux-footer">
        <div className="lux-footer-content">
          <div className="lux-footer-brand">
            <h3>UNSPACE</h3>
            <p>Designed for the next generation of students.</p>
          </div>
          <div className="lux-footer-links">
            <div className="footer-col">
              <h4>Platform</h4>
              <Link to="/book-exchange">BookX</Link>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/adsx">Ads / Gigs</Link>
              <Link to="/community">Community</Link>
            </div>
            <div className="footer-col">
              <h4>Support</h4>
              <Link to="/contact">Contact</Link>
              <Link to="/terms">Terms</Link>
            </div>
          </div>
        </div>
        <div className="lux-copyright">
          © {new Date().getFullYear()} Unspace Inc. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default HomePage;