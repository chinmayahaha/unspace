import React, { useState } from 'react';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // No special backend function needed; this is a native Firebase call
      await sendPasswordResetEmail(auth, email);
      setMessage('Recovery link sent! Please check your inbox.');
    } catch (err) {
      setError('Could not find an account with that email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        .auth-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, #0f172a, #1e293b, #000000);
          font-family: 'Inter', sans-serif;
          padding: 20px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          text-align: center;
        }

        .auth-header h2 { color: #f8fafc; margin-bottom: 8px; font-weight: 800; }
        .auth-header p { color: #94a3b8; margin-bottom: 24px; font-size: 0.9rem; }

        .form-group { text-align: left; margin-bottom: 20px; }
        .form-group label { display: block; color: #e2e8f0; font-size: 0.85rem; margin-bottom: 8px; }
        
        .form-group input {
          width: 100%;
          padding: 12px;
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: #fff;
        }

        .status-msg { font-size: 0.85rem; padding: 10px; border-radius: 8px; margin-bottom: 20px; }
        .success { background: rgba(16, 185, 129, 0.1); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
        .error { background: rgba(239, 68, 68, 0.1); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.2); }

        .reset-btn {
          width: 100%;
          padding: 14px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .back-link { margin-top: 24px; display: block; color: #38bdf8; text-decoration: none; font-size: 0.85rem; }
      `}</style>

      <div className="auth-container">
        <div className="glass-card">
          <div className="auth-header">
            <h2>Recover Account</h2>
            <p>We'll send a reset link to your email</p>
          </div>

          {message && <div className="status-msg success">{message}</div>}
          {error && <div className="status-msg error">{error}</div>}

          <form onSubmit={handleReset}>
            <div className="form-group">
              <label>Email Address</label>
              <input 
                type="email" 
                placeholder="university@email.edu" 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="reset-btn" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Email'}
            </button>
          </form>

          <Link to="/signin" className="back-link">Return to Sign In</Link>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;