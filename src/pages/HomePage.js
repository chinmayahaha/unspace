// src/components/HomePage.js
import React, { useEffect, useState } from 'react';
import './HomePage.css';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '../firebase';
import { httpsCallable } from 'firebase/functions';

// Import Font Awesome components
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';

const HomePage = () => {
  // State for carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const [activeNav, setActiveNav] = useState('home');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gclid = params.get('gclid') || '';
    console.log('GCLID:', gclid); // Log the GCLID value
    localStorage.setItem('gclid', gclid);
  }, []);
  


  const slides = [
    {
      icon: ['fab', 'react'],
      title: 'React',
      description: 'Build interactive UIs with ease using React’s component-based architecture.',
    },
    {
      icon: ['fab', 'google'],
      title: 'Google Cloud',
      description: 'Leverage scalable cloud infrastructure and services to deploy your applications.',
    },
    {
      icon: 'database', // Placeholder for Firebase
      title: 'Firebase',
      description: 'Utilize real-time databases and authentication services to manage your backend effortlessly.',
    },
    {
      icon: ['fab', 'github'],
      title: 'GitHub',
      description: 'Collaborate and manage your codebase efficiently with GitHub’s version control system.',
    },
    {
      icon: ['fab', 'python'],
      title: 'Python',
      description: 'Implement robust backend logic and data processing with Python’s versatile capabilities.',
    },
  ];

  const messages = [
    "Explore more ways to build—whether it's in the mountains, by the beach, or right in your apartment.",
    'Discover new horizons with AI-powered backend development.',
    'Unleash your creativity wherever you are.',
  ];

  const episodes = [
    {
      title: 'Introduction to Backend Development',
      description: 'Kickstart your journey by understanding the fundamentals of backend development.',
      videoId: 'dQw4w9WgXcQ', // Replace with actual YouTube video ID
    },
  ];

  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change slide every 5 seconds

    return () => {
      clearInterval(slideInterval);
    };
  }, [slides.length]);

  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveNav(id);
    }
  };

  const handleNavClick = (id) => {
    scrollToSection(id);
  };

  return (
    <div className="unauth-homepage">
      {/* Section Navigation */}
      <nav className="unauth-section-nav">
        <div className="unauth-section-nav-content">
          <ul className="unauth-section-nav-links">
            <li
              className={activeNav === 'BuyXSell' ? 'active' : ''}
              onClick={() => handleNavClick('BuyXSell')}
            >
              BuyXSell
            </li>
            <li
              className={activeNav === 'Events' ? 'active' : ''}
              onClick={() => handleNavClick('Events')}
            >
              Events
            </li>
            <li
              className={activeNav === 'BookX' ? 'active' : ''}
              onClick={() => handleNavClick('BookX')}
            >
              BookX
            </li>
            <li
              className={activeNav === 'Community' ? 'active' : ''}
              onClick={() => handleNavClick('Community')}
            >
              Community
            </li>
            <li
              className={activeNav === 'cta' ? 'active' : ''}
              onClick={() => handleNavClick('cta')}
            >
              Get Started
            </li>
          </ul>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="unauth-hero-section" id="home">
        <div className="unauth-hero-content">
          <h1>
            <FontAwesomeIcon icon={ICONS.ROBOT} className="unauth-header-icon" /> UnSpace
          </h1>
          <p>Leverage the power of AI backend development process.</p>
          <Link to="/signup" className="unauth-cta-button">
            Let's get started ☕
          </Link>
          {/* Quick links to sample listings */}
          <div style={{ marginTop: 12 }}>
            <Link to="/listing/example-listing-123" className="unauth-link">View sample listing</Link>
          </div>
          {/* Function test button (local emulator friendly) */}
          <div style={{ marginTop: 12 }}>
            <button
              onClick={async () => {
                try {
                  const fn = httpsCallable(functions, 'contactSeller');
                  const res = await fn({ listingId: 'example-listing-123', message: 'Testing from HomePage' });
                  alert(JSON.stringify(res.data));
                } catch (err) {
                  console.error('Function test failed', err);
                  alert('Function test failed: ' + (err?.message || err?.code || err));
                }
              }}
            >
              Test contactSeller (emulator)
            </button>
          </div>
        </div>
      </header>
      {/* Scrolling Text Banner */}
      <section className="unauth-scrolling-banner">
        <div className="scrolling-text">
          {messages.map((message, index) => (
            <span key={index}>{message}</span>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section className="unauth-features" id="features">
        <h2>Features</h2>
        <div className="unauth-features-grid">
          <div className="unauth-feature-item">
            <FontAwesomeIcon icon={ICONS.MAGIC} size="3x" className="unauth-feature-icon" />
            <h3>AI Automation</h3>
            <p>Automate repetitive tasks and focus on what matters most.</p>
          </div>
          <div className="unauth-feature-item">
            <FontAwesomeIcon icon={ICONS.CODE} size="3x" className="unauth-feature-icon" />
            <h3>Code Generation</h3>
            <p>Generate high-quality code snippets tailored to your needs.</p>
          </div>
          <div className="unauth-feature-item">
            <FontAwesomeIcon icon={ICONS.MOBILE_ALT} size="3x" className="unauth-feature-icon" />
            <h3>Responsive Design</h3>
            <p>Create applications that look stunning on any device.</p>
          </div>
        </div>
      </section>

      {/* Parallax Section */}
      <section className="unauth-parallax">
        <div className="unauth-parallax-content">
          <h2>Seamless Integration</h2>
          <p>Integrate with your favorite tools and platforms effortlessly.</p>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="unauth-tech-stack" id="tech-stack">
        <h2>Our Tech Stack</h2>
        <div className="unauth-tech-stack-icons">
          {slides.map((tech, index) => (
            <div className="unauth-tech-item" key={index}>
              <FontAwesomeIcon icon={tech.icon} size="4x" className="unauth-tech-icon" />
              <p>{tech.title}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Episodes Section */}
      <section className="unauth-episodes" id="episodes">
        <h2>Episodes</h2>
        <div className="unauth-episodes-grid">
          {episodes.map((episode, index) => (
            <div className="unauth-episode-item" key={index}>
              <h3>{episode.title}</h3>
              <p>{episode.description}</p>
              <div className="unauth-video-container">
                <iframe
                  width="100%"
                  height="200"
                  src={`https://www.youtube.com/embed/${episode.videoId}`}
                  title={episode.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="unauth-testimonials" id="testimonials">
        <h2>What Developers Are Saying</h2>
        <div className="unauth-testimonials-grid">
          <div className="unauth-testimonial-item">
            <p>"This series has been a game-changer for my backend development skills."</p>
            <h4>- Alex Johnson</h4>
          </div>
          <div className="unauth-testimonial-item">
            <p>"The step-by-step tutorials make complex concepts easy to grasp."</p>
            <h4>- Maria Gomez</h4>
          </div>
          <div className="unauth-testimonial-item">
            <p>"I love how the series integrates AI tools to streamline the development process."</p>
            <h4>- Liam Smith</h4>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="unauth-cta" id="cta">
        <h2>Ready to Transform Your Backend Development?</h2>
        <Link to="/signup" className="unauth-cta-button">
          Sign Up Now
        </Link>
      </section>

      {/* Footer */}
      <footer className="unauth-footer">
        <div className="unauth-footer-content">
          <p>&copy; {new Date().getFullYear()} YourApp. All rights reserved.</p>
          <ul className="unauth-footer-links">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
            <li>Contact Us</li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;