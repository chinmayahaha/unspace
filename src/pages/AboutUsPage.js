/* src/pages/AboutUsPage.js */
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons'; // Ensure this path is correct

const AboutUsPage = () => {
  // Fallback arrays if some icons are missing in your config
  const values = [
    { name: "Innovation", icon: ICONS.LIGHTBULB || 'lightbulb' },
    { name: "Quality", icon: ICONS.STAR || 'star' },
    { name: "Sustainability", icon: ICONS.LEAF || 'leaf' },
    { name: "Customer Focus", icon: ICONS.HEADSET || 'headset' },
    { name: "Transparency", icon: ICONS.EYE || 'eye' },
  ];

  const features = [
    {
      title: "Campus Marketplace",
      desc: "Buy and resell books, electronics, furniture, and essentials securely within the campus network.",
      icon: ICONS.STORE || 'store'
    },
    {
      title: "Community Platform",
      desc: "Connect, interact, and collaborate with fellow students to build a strong campus ecosystem.",
      icon: ICONS.USERS || 'users'
    },
    {
      title: "Book Exchange",
      desc: "Affordable sharing of academic resources. Save money and reduce waste by swapping textbooks.",
      icon: ICONS.BOOK || 'book'
    },
    {
      title: "Lost and Found",
      desc: "Report and recover misplaced items efficiently. Never lose your valuables permanently again.",
      icon: ICONS.SEARCH || 'search'
    }
  ];

  return (
    <div className="min-h-screen w-full pr-6 pb-20 text-white">
      {/* HEADER */}
      <div className="mb-12 text-center max-w-3xl mx-auto">
        <p className="text-primary font-semibold tracking-widest uppercase text-sm mb-3">Innovate. Elevate. Explore.</p>
        <h1 className="lux-title text-5xl md:text-6xl mb-4">About Project Unspace</h1>
        <p className="lux-subtitle mx-auto">
          UNSPACE is a smart campus platform designed to simplify student life by creating a centralized digital space for buying, selling, exchanging, and connecting within the university community.
        </p>
      </div>

      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* VISION & MISSION SECTION */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="lux-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={ICONS.EYE || 'eye'} className="text-2xl text-primary" />
              <h2 className="text-2xl font-bold font-heading text-white">Our Vision</h2>
            </div>
            <p className="text-muted leading-relaxed">
              To build a connected and sustainable campus environment where students can easily access resources, share knowledge, and collaborate through a single trusted platform.
            </p>
          </div>
          
          <div className="lux-card p-8">
            <div className="flex items-center gap-3 mb-4">
              <FontAwesomeIcon icon={ICONS.ROCKET || 'rocket'} className="text-2xl text-primary" />
              <h2 className="text-2xl font-bold font-heading text-white">Our Mission</h2>
            </div>
            <p className="text-muted leading-relaxed">
              To simplify campus life by delivering innovative digital services that improve accessibility, encourage resource sharing, and strengthen student engagement.
            </p>
          </div>
        </div>

        {/* WHAT WE DO SECTION */}
        <div className="pt-6">
          <h2 className="text-3xl font-bold font-heading text-center mb-8 text-white">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="lux-card p-6 flex gap-4 items-start">
                <div className="bg-white/5 p-3 rounded-xl border border-white/10 mt-1">
                  <FontAwesomeIcon icon={feature.icon} className="text-xl text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-heading mb-2 text-white">{feature.title}</h3>
                  <p className="text-muted leading-relaxed text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CORE VALUES SECTION */}
        <div className="lux-card p-8 mt-12">
          <h2 className="text-2xl font-bold font-heading mb-6 text-center text-primary">Core Values</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {values.map((value, index) => (
              <div key={index} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                <FontAwesomeIcon icon={value.icon} className="text-primary" />
                <span className="font-semibold text-white">{value.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* WHY CHOOSE US & FEATURES SPLIT */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Why Choose Us */}
          <div className="lux-card p-8 border-l-4 border-l-primary flex flex-col justify-center">
            <h2 className="text-2xl font-bold font-heading mb-4 text-white">Why Choose Us?</h2>
            <p className="text-muted leading-relaxed">
              UNSPACE combines multiple campus services into one user-friendly platform, improving efficiency, affordability, and convenience for students. We promote sustainability and build a connected student ecosystem.
            </p>
          </div>

          {/* Project Features List */}
          <div className="lux-card p-8">
            <h2 className="text-2xl font-bold font-heading mb-4 text-white">Project Features</h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Easy-to-use marketplace</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Student community network</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Affordable book exchange</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Lost and found system</span>
              </li>
              <li className="flex gap-3">
                <span className="text-green-400 font-bold">✓</span>
                <span>Secure interface</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CONNECT WITH US */}
        <div className="lux-card p-8 mt-8 text-center bg-gradient-to-b from-white/5 to-transparent">
          <h2 className="text-2xl font-bold font-heading mb-4 text-white">Connect With Us</h2>
          <p className="text-muted mb-6">Have questions or feedback? Reach out to our team.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="https://www.instagram.com/unspace_pu/" target="_blank" rel="noreferrer" className="lux-btn-secondary">
              <FontAwesomeIcon icon={ICONS.INSTAGRAM || 'instagram'} /> Follow on Instagram
            </a>
            <a href="mailto:unspace.pu@gmail.com" className="lux-btn-secondary">
              <FontAwesomeIcon icon={ICONS.ENVELOPE || 'envelope'} /> Email Support
            </a>
          </div>
        </div>

        {/* CTA BUTTON */}
        <div className="text-center mt-12">
            <Link to="/dashboard">
                <button className="lux-btn-primary">Explore Unspace</button>
            </Link>
        </div>

      </div>
    </div>
  );
};

export default AboutUsPage;