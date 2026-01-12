/* src/pages/TermsPage.js */
import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons'; // Ensure this path is correct

const TermsPage = () => {
  return (
    <div className="min-h-screen w-full pr-6 pb-20 text-white">
      {/* HEADER */}
      <div className="mb-10 text-center max-w-2xl mx-auto">
        <h1 className="lux-title text-5xl mb-4">Terms of Service</h1>
        <p className="lux-subtitle">Last Updated: January 2026</p>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* SECTION 1: INTRO */}
        <div className="lux-card p-8">
            <h2 className="text-2xl font-bold font-heading mb-4 text-primary">1. Welcome to Unspace</h2>
            <p className="text-muted leading-relaxed">
                Unspace is a platform designed exclusively for students to connect, trade, and collaborate. 
                By using our services (Marketplace, Book Exchange, AdsX, Community), you agree to these terms. 
                We are a facilitator of transactions, not a party to them.
            </p>
        </div>

        {/* SECTION 2: CONDUCT */}
        <div className="lux-card p-8">
            <h2 className="text-2xl font-bold font-heading mb-4 text-primary">2. User Conduct</h2>
            <ul className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                    <span className="text-red-400 font-bold">×</span>
                    <span>No harassment, hate speech, or bullying in Community posts.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-red-400 font-bold">×</span>
                    <span>No selling illegal items, drugs, weapons, or stolen goods.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>Be honest about the condition of books and items you sell.</span>
                </li>
                <li className="flex gap-3">
                    <span className="text-green-400 font-bold">✓</span>
                    <span>Respect the privacy and safety of other students during meetups.</span>
                </li>
            </ul>
        </div>

        {/* SECTION 3: SAFETY */}
        <div className="lux-card p-8 border-l-4 border-l-red-500">
            <div className="flex items-center gap-3 mb-4">
                <FontAwesomeIcon icon={ICONS.SHIELD || 'shield-alt'} className="text-2xl text-red-500" />
                <h2 className="text-2xl font-bold font-heading text-white">3. Safety & Liability</h2>
            </div>
            <p className="text-muted mb-4">
                Unspace is not responsible for the quality, safety, or legality of items sold. 
                Transactions happen offline.
            </p>
            <div className="bg-white/5 p-4 rounded-lg">
                <h3 className="font-bold text-white mb-2">Campus Meetup Rules:</h3>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                    <li>Always meet in public campus areas (Libraries, Cafeterias).</li>
                    <li>Never meet in private dorm rooms or off-campus apartments alone.</li>
                    <li>Inspect items thoroughly before paying.</li>
                </ul>
            </div>
        </div>

        {/* SECTION 4: ACCOUNT TERMINATION */}
        <div className="lux-card p-8">
            <h2 className="text-2xl font-bold font-heading mb-4 text-primary">4. Account Termination</h2>
            <p className="text-muted">
                We reserve the right to ban any user who violates these terms, engages in fraud, or threatens the safety of the community.
            </p>
        </div>

        <div className="text-center mt-12">
            <Link to="/dashboard">
                <button className="lux-btn-secondary">Accept & Continue to Dashboard</button>
            </Link>
        </div>

      </div>
    </div>
  );
};

export default TermsPage;