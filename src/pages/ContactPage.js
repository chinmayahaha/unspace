/* src/pages/ContactPage.js */
import React, { useState } from 'react';
 // Ensure you have icons like ENVELOPE, BUG, USER_SLASH imported

const ContactPage = () => {
  const [topic, setTopic] = useState('general');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    // In a real app, this would send an email or save to Firestore 'tickets' collection
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center pr-6 pb-20">
        <div className="lux-card p-10 text-center max-w-lg">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-white mb-2">Message Received</h2>
          <p className="text-muted mb-6">Thanks for reaching out. Our student support team will check this within 24 hours.</p>
          <button onClick={() => setSubmitted(false)} className="text-primary hover:underline">Send another message</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pr-6 text-white pb-20">
      
      {/* HEADER */}
      <div className="mb-10">
        <h1 className="lux-title text-4xl">Contact Support</h1>
        <p className="lux-subtitle">We are here to help. What's on your mind?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT: OPTIONS */}
        <div className="space-y-4">
            <button 
                onClick={() => setTopic('general')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${topic === 'general' ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'}`}
            >
                <h3 className="font-bold mb-1">General Help</h3>
                <p className="text-xs opacity-70">Questions about how the app works.</p>
            </button>

            <button 
                onClick={() => setTopic('bug')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${topic === 'bug' ? 'bg-primary/20 border-primary text-white' : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'}`}
            >
                <h3 className="font-bold mb-1">Report a Bug</h3>
                <p className="text-xs opacity-70">Something is broken or crashing.</p>
            </button>

            <button 
                onClick={() => setTopic('report_user')}
                className={`w-full p-4 rounded-xl border text-left transition-all ${topic === 'report_user' ? 'bg-red-500/20 border-red-500 text-red-200' : 'bg-white/5 border-white/10 text-muted hover:bg-white/10'}`}
            >
                <h3 className="font-bold mb-1">Report a User/Scam</h3>
                <p className="text-xs opacity-70">Safety concern or suspicious activity.</p>
            </button>
        </div>

        {/* RIGHT: FORM */}
        <div className="md:col-span-2">
            <div className="lux-card p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {topic === 'report_user' && (
                        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg text-red-200 text-sm mb-6">
                            <span className="font-bold">Safety First:</span> If you are in immediate danger, please contact campus security or local authorities directly.
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-muted mb-2 uppercase">Your Name</label>
                        <input type="text" className="lux-input w-full" placeholder="John Doe" required />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-muted mb-2 uppercase">Your Email</label>
                        <input type="email" className="lux-input w-full" placeholder="john@university.edu" required />
                    </div>

                    {topic === 'report_user' && (
                        <div>
                            <label className="block text-xs font-bold text-red-400 mb-2 uppercase">Offending User / Item URL</label>
                            <input type="text" className="lux-input w-full border-red-900 focus:border-red-500" placeholder="Paste link to profile or item..." />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-muted mb-2 uppercase">Message</label>
                        <textarea 
                            className="lux-input w-full" 
                            rows="6" 
                            placeholder={topic === 'bug' ? "Describe steps to reproduce the error..." : "How can we help?"}
                            required
                        ></textarea>
                    </div>

                    <button type="submit" className={`w-full py-3 rounded-xl font-bold transition-colors ${topic === 'report_user' ? 'bg-red-600 hover:bg-red-500 text-white' : 'lux-btn-primary'}`}>
                        {topic === 'report_user' ? 'Submit Report' : 'Send Message'}
                    </button>

                </form>
            </div>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;