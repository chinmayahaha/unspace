import React, { useState, useEffect } from 'react';
// We use a local Router wrapper to prevent crashing if you drop this file into an App without one.
// If your App.js already has <BrowserRouter>, you can remove the <BrowserRouter> wrapper here.
import { Link } from 'react-router-dom';

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
    <div className="home-container">
      <style>{`
        /* --- CSS EMBEDDED TO FIX IMPORT ERROR --- */
        
        /* Hide Firebase Emulator Warning Banner */
        body > div[style*="position: fixed"][style*="top: 0"] {
          display: none !important;
        }
        
        /* Alternative selector for Firebase emulator banner */
        [data-testid="emulator-warning"],
        .firebase-emulator-warning {
          display: none !important;
        }
        
        /* FONTS */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        /* VARIABLES */
        :root {
          --bg-dark: #0a0a0a;
          --text-primary: #ffffff;
          --text-secondary:rgb(245, 249, 6);
          --accent-purple:rgb(136, 4, 251);
          --accent-pink: #ec4899;
          --accent-blue: #3b82f6;
          --glass-bg: rgba(255, 255, 255, 0.03);
          --glass-border: rgba(255, 255, 255, 0.08);
          --font-main: 'Inter', sans-serif;
        }

        /* RESET */
        * { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          background-color: var(--bg-dark);
          color: var(--text-primary);
          font-family: var(--font-main);
          overflow-x: hidden;
          -webkit-font-smoothing: antialiased;
          /* FIX: Force GPU layer to stop white glitching */
          transform: translateZ(0);
        }

        /* TEXTURE OVERLAY */
        .noise-overlay {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E");
          pointer-events: none;
          z-index: 9999;
          mix-blend-mode: overlay;
          transform: translate3d(0, 0, 0);
          will-change: transform;
        }

        /* GRADIENT ORBS */
        .gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.4;
          
          transform: translateZ(0);
          will-change: transform;
        }

        .orb-1 {
          width: 400px; height: 400px;
          background: var(--accent-purple);
          top: -100px; left: -100px;
          animation-delay: 0s;
        }

        .orb-2 {
          width: 500px; height: 500px;
          background: var(--accent-blue);
          bottom: 10%; right: -150px;
          animation-delay: -2s;
        }

        .orb-3 {
          width: 300px; height: 300px;
          background: var(--accent-pink);
          top: 40%; left: 20%;
          opacity: 0.2;
          animation-delay: -5s;
        }

        @keyframes floatOrb {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
          50% { transform: translate3d(30px, -50px, 0) scale(1.1); }
        }

        /* NAVBAR */
        .glass-nav {
          position: sticky; /* Ensures floating/sticky behavior */
          top: -1.5rem; 
          left: 0; 
          width: 100%;
          z-index: 1000; /* High Z-Index to stay on top */
          padding: 1.5rem 3rem;
          transition: all 0s ease;
          transform: translateZ(0);
          will-change: background, backdrop-filter;
        }

       

        .nav-inner {
          max-width: 1200px;
          position: relative;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-text { font-weight: 800; font-size: 2.5rem; letter-spacing: -1px; color: white;font-family: 'Inter' }
        .brand-dot { color: var(--accent-purple); font-size: 3rem; }

        .nav-links {
          display: flex;
          position: relative;
          gap: 2rem;
          background: rgba(255, 255, 255, 0.03);
          padding: 2rem 4rem;
          border-radius: 99px;
          border: 1px solid var(--glass-border);
          margin: 0 auto;
        }

        .nav-item {
          text-decoration: none;
          color: var(--text-secondary);
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.15s ease;
          position: relative;
          letter-spacing: 1px;
        }

        .nav-item:hover {
          color: white;
          text-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
        }

        .nav-auth { display: flex; gap: 1rem; }

        .auth-btn {
          text-decoration: none;
          padding: 0.6rem 1.4rem;
          border-radius: 99px;
          font-size: 0.85rem;
          font-weight: 700;
          transition: all 0.2s ease;
          letter-spacing: 0.5px;
        }

        .auth-btn.login { color: white; opacity: 0.8; }
        .auth-btn.login:hover { opacity: 1; color: var(--accent-purple); }

        .auth-btn.signup { background: white; color: black; }
        .auth-btn.signup:hover {
          transform: translateY(-2px);
          box-shadow: 0 0 20px rgba(255,255,255,0.25);
        }

        /* MOBILE MENU */
        .mobile-toggle { display: none; background: none; border: none; cursor: pointer; }

        .hamburger {
          width: 24px; height: 3px;
          background: white; position: relative;
          transition: all 0.3s;
        }
        .hamburger::before, .hamburger::after {
          content: ''; position: absolute;
          width: 24px; height: 2px; background: white;
          transition: all 0.3s;
        }
        .hamburger::before { top: -8px; }
        .hamburger::after { top: 8px; }
        .hamburger.open { background: transparent; }
        .hamburger.open::before { transform: rotate(45deg); top: 0; }
        .hamburger.open::after { transform: rotate(-45deg); top: 0; }

        .mobile-menu {
          position: fixed; top: 70px; left: 0; width: 100%;
          background: #0a0a0a;
          border-bottom: 1px solid var(--glass-border);
          padding: 2rem;
          display: flex; flex-direction: column; gap: 1.5rem;
          transform: translateY(-150%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 900;
        }
        .mobile-menu.open { transform: translateY(0); }
        .mobile-menu a {
          text-decoration: none; color: white; font-size: 1.2rem;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          padding-bottom: 0.5rem;
        }

        /* HERO SECTION */
        .hero-section {
          position: relative; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          text-align: center; padding: 120px 3rem 0;
          z-index: 1;
          margin-top: -12rem;
        }

        .hero-badge {
          display: inline-block; padding: 0.5rem 1.2rem;
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(252, 251, 253, 0.3);
          color: var(--accent-purple);
          border-radius: 99px;
          font-size: 0.55rem; font-weight: 400;
          margin-bottom: 2rem; text-transform: uppercase; letter-spacing: 1.5px;
        }

        .hero-title {
          font-size: 5.0rem; 
          line-height: 1.1; font-weight: 800; margin-bottom: 1.5rem;
          letter-spacing: -1.5px;
        }

        .text-gradient {
          background: linear-gradient(to right, var(--accent-blue), var(--accent-purple), var(--accent-pink));
          -webkit-background-clip: text;
          color: transparent;
        }

        .hero-subtitle {
          font-size: 1.5rem; /* Increased size for subtitle */
          color: var(--text-secondary);
          max-width: 700px; margin: 0 auto 3rem; line-height: 1.6;
        }

        .hero-actions { display: flex; gap: 1rem; justify-content: center; }

        .cta-btn {
          text-decoration: none; padding: 1.2rem 2.5rem;
          border-radius: 12px; font-weight: 600;
          transition: all 0.3s ease;
        }
        .cta-btn.primary { background: white; color: black; }
        .cta-btn.primary.glow:hover {
          box-shadow: 0 0 40px rgba(255, 255, 255, 0.25);
          transform: scale(1.02);
        }
        .cta-btn.outline {
          border: 1px solid rgba(255,255,255,0.2); color: white;
          background: rgba(255,255,255,0.02);
        }
        .cta-btn.outline:hover { background: rgba(255,255,255,0.1); border-color: white; }

        /* METRICS STRIP */
        .metrics-strip {
          display: flex; justify-content: center; gap: 4rem;
          padding: 3rem 2rem;
          border-top: 1px solid var(--glass-border);
          border-bottom: 1px solid var(--glass-border);
          background: rgba(0,0,0,0.4);
          backdrop-filter: blur(10px);
          margin-bottom: 6rem;
          transform: translateZ(0);
        }
        .metric-item { text-align: center; }
        .metric-val { display: block; font-size: 2.5rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
        .metric-lbl {
          color: var(--text-secondary); font-size: 0.9rem;
          text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
        }
        .metric-divider { width: 1px; background: var(--glass-border); }

        /* FEATURES GRID */
        .features-section { max-width: 1200px; margin: 0 auto 8rem; padding: 0 2rem; }
        .section-header { text-align: center; margin-bottom: 5rem; }
        .section-title { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; letter-spacing: -1px; }
        .section-desc { color: var(--text-secondary); font-size: 1.1rem; }

        .features-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--glass-border);
          padding: 3rem 2rem; border-radius: 24px;
          transition: transform 0.4s ease, border-color 0.4s ease;
          position: relative; overflow: hidden;
          will-change: transform;
          transform: translateZ(0);
        }
        .glass-card:hover {
          border-color: rgba(255,255,255,0.2);
          transform: translateY(-8px);
          background: rgba(255,255,255,0.04);
        }

        .icon-box {
          font-size: 3rem; margin-bottom: 2rem;
          background: rgba(255,255,255,0.05);
          width: 80px; height: 80px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 20px;
        }

        .feature-card h3 { margin-bottom: 1rem; font-size: 1.5rem; font-weight: 700; }
        .feature-card p {
          color: var(--text-secondary); margin-bottom: 2rem; line-height: 1.6;
        }
        .feature-link {
          text-decoration: none; color: var(--accent-blue);
          font-weight: 700; font-size: 0.95rem;
          display: inline-flex; align-items: center; gap: 0.5rem;
        }

        /* FAQ SECTION */
        .faq-section { max-width: 800px; margin: 0 auto 8rem; padding: 0 2rem; }
        .faq-container { padding: 3rem; border: 1px solid var(--glass-border); border-radius: 24px; background: rgba(255,255,255,0.02); }
        .faq-header { text-align: center; margin-bottom: 4rem; }

        .faq-item {
          border-bottom: 1px solid var(--glass-border);
          padding: 1.5rem 0; cursor: pointer;
        }
        .faq-question {
          display: flex; justify-content: space-between; align-items: center;
          font-weight: 600; font-size: 1.1rem;
        }
        .faq-toggle { font-size: 1.5rem; color: var(--text-secondary); }

        .faq-answer {
          max-height: 0; overflow: hidden;
          transition: max-height 0.3s ease, padding 0.3s ease;
          color: var(--text-secondary); line-height: 1.6;
        }
        .faq-item.active .faq-answer { max-height: 200px; padding-top: 1.5rem; }

        /* FOOTER */
        .site-footer {
          border-top: 1px solid var(--glass-border);
          background: black; padding: 6rem 2rem 2rem;
        }
        .footer-content {
          max-width: 1200px; margin: 0 auto 4rem;
          display: flex; justify-content: space-between;
          flex-wrap: wrap; gap: 4rem;
        }
        .footer-brand h3 { margin-bottom: 1.5rem; font-size: 1.5rem; letter-spacing: -1px; }
        .footer-brand p { color: var(--text-secondary); max-width: 300px; line-height: 1.6; }

        .footer-links { display: flex; gap: 5rem; }
        .link-col { display: flex; flex-direction: column; gap: 1rem; }
        .link-col h4 { color: white; margin-bottom: 0.5rem; font-weight: 700; letter-spacing: 0.5px; }
        .link-col a {
          text-decoration: none; color: var(--text-secondary);
          font-size: 0.95rem; transition: color 0.2s;
        }
        .link-col a:hover { color: white; }

        .footer-bottom {
          max-width: 1200px; margin: 0 auto;
          border-top: 1px solid var(--glass-border);
          padding-top: 2rem; display: flex;
          justify-content: space-between;
          color: #555; font-size: 0.85rem;
        }
        .socials { display: flex; gap: 1.5rem; color: #777; }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .hero-title { font-size: 4rem; } /* Adjusted for mobile */
          .desktop-only { display: none; }
          .mobile-toggle { display: block; }
          .metrics-strip { flex-direction: column; gap: 2rem; }
          .metric-divider { display: none; }
          .footer-content { flex-direction: column; gap: 3rem; }
          .footer-links { gap: 3rem; flex-wrap: wrap; }
          .nav-inner { justify-content: space-between; }
        }
      `}</style>
      
      {/* 1. TEXTURE & SHAPES BACKGROUND */}
      <div className="noise-overlay" />
      <div className="gradient-orb orb-1" />
      <div className="gradient-orb orb-2" />
      <div className="gradient-orb orb-3" />

      {/* 2. HOVER GLOSS NAVBAR */}
      <nav className={`glass-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-inner">
          <div className="nav-brand">
            <span className="brand-text">UNSPACE</span>
            <span className="brand-dot">.</span>
          </div>

          {/* Desktop Menu */}
          <div className="nav-links desktop-only">
            <Link to="/book-exchange" className="nav-item">BOOKX</Link>
            <Link to="/marketplace" className="nav-item">BUY & SELL</Link>
            <Link to="/community" className="nav-item">COMMUNITY</Link>
            <a href="#about" className="nav-item">ABOUT</a>
          </div>

          <div className="nav-auth desktop-only">
             <Link to="/signin" className="auth-btn login">LOG IN</Link>
             <Link to="/signup" className="auth-btn signup">SIGN UP</Link>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="mobile-toggle" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`} />
          </button>
        </div>

        {/* Mobile Dropdown */}
        <div className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
          <Link to="/book-exchange" onClick={() => setMobileMenuOpen(false)}>BOOKX</Link>
          <Link to="/marketplace" onClick={() => setMobileMenuOpen(false)}>BUY & SELL</Link>
          <Link to="/community" onClick={() => setMobileMenuOpen(false)}>COMMUNITY</Link>
          <a href="#about" onClick={() => setMobileMenuOpen(false)}>ABOUT</a>
          <div className="mobile-auth">
            <Link to="/signin" className="mobile-btn">LOG IN</Link>
            <Link to="/signup" className="mobile-btn primary">SIGN UP</Link>
          </div>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <header className="hero-section">
        <div className="hero-content">
          <div className="hero-badge">The #1 Campus Platform</div>
          <h1 className="hero-title">
            Connect.<br />
            <span className="text-gradient">Empower.</span><br />
            Thrive.
          </h1>
          <p className="hero-subtitle">
            The all-in-one ecosystem for students. Buy used books, sell dorm gear, 
            and find your people—all in one secure space.
          </p>
          <div className="hero-actions">
            <Link to="/marketplace" className="cta-btn primary glow">
              Explore Market
            </Link>
            <Link to="/community" className="cta-btn outline">
              Join Community
            </Link>
          </div>
        </div>
      </header>

      {/* 4. METRICS STRIP */}
      <div className="metrics-strip">
        <div className="metric-item">
          <span className="metric-val">15K+</span>
          <span className="metric-lbl">Students</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <span className="metric-val">50+</span>
          <span className="metric-lbl">Campuses</span>
        </div>
        <div className="metric-divider" />
        <div className="metric-item">
          <span className="metric-val">$1M+</span>
          <span className="metric-lbl">Saved</span>
        </div>
      </div>

      {/* 5. FEATURES GRID */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">The Ecosystem</h2>
          <p className="section-desc">Designed for the modern student lifestyle.</p>
        </div>

        <div className="features-grid">
          <div className="feature-card glass-card">
            <div className="icon-box book-icon">📚</div>
            <h3>BookX Exchange</h3>
            <p>Don't overpay at the bookstore. Find seniors selling the exact edition you need for half the price.</p>
            <Link to="/book-exchange" className="feature-link">Browse Books &rarr;</Link>
          </div>

          <div className="feature-card glass-card">
            <div className="icon-box market-icon">🛒</div>
            <h3>Student Marketplace</h3>
            <p>From mini-fridges to graphing calculators. Safe buying and selling within your campus network.</p>
            <Link to="/marketplace" className="feature-link">Start Selling &rarr;</Link>
          </div>

          <div className="feature-card glass-card">
            <div className="icon-box comms-icon">🤝</div>
            <h3>Community Hub</h3>
            <p>Find roommates, study groups, and campus events instantly. Your social life, organized.</p>
            <Link to="/community" className="feature-link">Connect &rarr;</Link>
          </div>
        </div>
      </section>

      {/* 6. FAQ SECTION */}
      <section className="faq-section">
        <div className="faq-container glass-card">
          <div className="faq-header">
            <h2>Common Questions</h2>
            <p>Everything you need to know about the platform.</p>
          </div>
          
          <div className="faq-list">
            {FAQ_ITEMS.map((item, index) => (
              <div 
                key={index} 
                className={`faq-item ${activeFaqIndex === index ? 'active' : ''}`}
                onClick={() => toggleFAQ(index)}
              >
                <div className="faq-question">
                  {item.question}
                  <span className="faq-toggle">{activeFaqIndex === index ? '−' : '+'}</span>
                </div>
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="site-footer" id="about">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>UNSPACE</h3>
            <p>Built by students, for students. <br/>Making campus life affordable and connected.</p>
          </div>
          
          <div className="footer-links">
            <div className="link-col">
              <h4>Platform</h4>
              <Link to="/book-exchange">BookX</Link>
              <Link to="/marketplace">Marketplace</Link>
              <Link to="/community">Community</Link>
            </div>
            <div className="link-col">
              <h4>Support</h4>
              <a href="/help">Help Center</a>
              <a href="/safety">Safety Guidelines</a>
              <a href="/contact">Contact Us</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Unspace Inc. All rights reserved.</p>
          <div className="socials">
            <span>Instagram</span>
            <span>Twitter</span>
            <span>TikTok</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Remove this Router wrapper completely
export default HomePage;