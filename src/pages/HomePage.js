// src/pages/HomePage.js
import React, { useState } from 'react';
import './HomePage.css';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';

const FAQ_ITEMS = [
  {
    question: 'What kind of brands do you work with?',
    answer:
      'We partner with early-stage and established brands in tech, culture, and hospitality who see their website as a flagship experience, not a brochure.',
  },
  {
    question: 'What is your typical project timeline?',
    answer:
      'Most projects run between 6–10 weeks from discovery to launch, depending on scope, content readiness, and integrations.',
  },
  {
    question: 'Do you handle development as well as design?',
    answer:
      'Yes. Our team designs and builds responsive, production-ready websites in modern stacks, working closely with your team on handoff or ongoing support.',
  },
  {
    question: 'How do we start a project together?',
    answer:
      'Share a short project brief via our contact form. We’ll follow up within 24 hours with a fit assessment and options for a kickoff call.',
  },
];

const HomePage = () => {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFAQ = (index) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <main className="lux-home" aria-label="Studio Unspace homepage">
      {/* Editorial Navbar */}
      <header className="lux-nav-shell">
        <nav className="lux-nav" aria-label="Primary">
          <div className="lux-nav-brand">
            Studio <span>Unspace</span>
          </div>
          <ul className="lux-nav-links">
            <li>
              <a href="#work">Work</a>
            </li>
            <li>
              <a href="#studio">Studio</a>
            </li>
            <li>
              <a href="#contact">Contact</a>
            </li>
          </ul>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="lux-hero" id="top">
        <div className="lux-hero-inner">
          <p className="lux-eyebrow">Luxury web design studio — global, remote, meticulous.</p>
          <h1 className="lux-hero-title">Digital Silence</h1>
          <p className="lux-hero-subtitle">
            We design quietly confident websites for brands who need their presence to feel like a printed magazine:
            slow, deliberate and impossibly polished.
          </p>
          <div className="lux-hero-actions">
            <Link to="/marketplace" className="lux-btn lux-btn-outline">
              View selected work
            </Link>
            <Link to="/adsx/submit" className="lux-btn lux-btn-ghost">
              Request a project
            </Link>
          </div>
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="lux-metrics" aria-label="Studio metrics">
        <div className="lux-metric">
          <span className="lux-metric-label">Clients</span>
          <span className="lux-metric-value">40+</span>
        </div>
        <div className="lux-metric">
          <span className="lux-metric-label">Years in practice</span>
          <span className="lux-metric-value">7</span>
        </div>
        <div className="lux-metric">
          <span className="lux-metric-label">Launches</span>
          <span className="lux-metric-value">120</span>
        </div>
        <div className="lux-metric">
          <span className="lux-metric-label">Repeat partners</span>
          <span className="lux-metric-value">82%</span>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="lux-section lux-feature-section" id="work">
        <header className="lux-section-header">
          <p className="lux-section-kicker">What we craft</p>
          <h2 className="lux-section-title">Quietly radical websites</h2>
        </header>

        <div className="lux-feature-grid">
          <article className="lux-card">
            <div className="lux-card-icon">
              <FontAwesomeIcon icon={ICONS.STAR} />
            </div>
            <h3 className="lux-card-title">Editorial brand sites</h3>
            <p className="lux-card-body">
              Magazine-inspired layouts with cinematic typography, built to slow visitors down and let your work
              breathe.
            </p>
          </article>

          <article className="lux-card">
            <div className="lux-card-icon">
              <FontAwesomeIcon icon={ICONS.BOOK} />
            </div>
            <h3 className="lux-card-title">Immersive case studies</h3>
            <p className="lux-card-body">
              Narrative-driven project pages that weave motion, copy and detail into a single continuous story.
            </p>
          </article>

          <article className="lux-card">
            <div className="lux-card-icon">
              <FontAwesomeIcon icon={ICONS.BULLHORN} />
            </div>
            <h3 className="lux-card-title">Conversion-quiet funnels</h3>
            <p className="lux-card-body">
              Thoughtful, low-noise flows that favor clarity over clutter while still guiding visitors to act.
            </p>
          </article>
        </div>
      </section>

      {/* FAQ / Studio Section */}
      <section className="lux-section lux-faq-section" id="studio">
        <header className="lux-section-header">
          <p className="lux-section-kicker">Studio notes</p>
          <h2 className="lux-section-title">Questions, answered slowly</h2>
        </header>

        <div className="lux-faq-layout">
          <div className="lux-faq-intro">
            <p>
              Every engagement begins with a listening phase. We map your voice, your boundaries and the rhythm of your
              brand before we move a single pixel.
            </p>
            <p>
              The result: websites that feel inevitable — as if they should always have looked this way.
            </p>
          </div>

          <div className="lux-faq-list" aria-label="Frequently asked questions">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <article key={item.question} className={`lux-faq-item ${isOpen ? 'is-open' : ''}`}>
                  <button
                    type="button"
                    className="lux-faq-trigger"
                    onClick={() => toggleFAQ(index)}
                    aria-expanded={isOpen}
                  >
                    <span className="lux-faq-question">{item.question}</span>
                    <span className="lux-faq-icon" aria-hidden="true">
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>
                  <div className="lux-faq-panel">
                    <p className="lux-faq-answer">{item.answer}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* About + Contact Anchor */}
      <section className="lux-section lux-about-section" id="about">
        <header className="lux-section-header">
          <p className="lux-section-kicker">About</p>
          <h2 className="lux-section-title">A small studio with a long view</h2>
        </header>
        <div className="lux-about-body">
          <p>
            Unspace is a two-person studio working across time zones. We work with one primary client at a time, giving
            your launch the kind of focus that rarely exists in larger teams.
          </p>
          <p id="contact">
            For new commissions, we review projects twice a month. Share a short brief and we’ll let you know where you
            fit in our calendar.
          </p>
        </div>
      </section>

      {/* Floating gloss quick menu */}
      <nav className="lux-float-menu" aria-label="Secondary quick links">
        <Link to="/book-exchange" className="lux-float-link">
          BookX
        </Link>
        <Link to="/marketplace" className="lux-float-link">
          Buy &amp; Sell
        </Link>
        <Link to="/community" className="lux-float-link">
          Community
        </Link>
        <a href="#about" className="lux-float-link">
          About
        </a>
      </nav>
    </main>
  );
};

export default HomePage;