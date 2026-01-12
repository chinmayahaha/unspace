/* src/features/auth/pages/SignUp.js */
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../../../config/icons';

const SignUp = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreedToTerms: false // New State for Checkbox
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 1. VALIDATION: Check Terms
    if (!formData.agreedToTerms) {
      setError("You must agree to the Terms of Service to join.");
      return;
    }

    // 2. VALIDATION: Passwords Match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // 3. CRITICAL VALIDATION: University Email Only
    // This blocks gmail, yahoo, or any other uni
    if (!formData.email.toLowerCase().endsWith('@pondiuni.ac.in')) {
      setError("Access Denied: You must use your university email (@pondiuni.ac.in).");
      return;
    }

    setLoading(true);

    try {
      // A. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // B. Update Display Name
      await updateProfile(user, { displayName: formData.fullName });

      // C. Create User Document in Firestore
      // We store the email explicitly to query against it later if needed
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName: formData.fullName,
        email: formData.email,
        role: 'student', // Default role
        uniVerified: true, // They passed the domain check
        createdAt: new Date(),
        agreedToTermsAt: new Date() // Audit trail for legal
      });

      // D. Redirect
      navigate('/dashboard');

    } catch (err) {
      console.error("Signup Error:", err);
      // Friendly error messages
      if (err.code === 'auth/email-already-in-use') {
        setError("This email is already registered. Try logging in.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters.");
      } else {
        setError("Failed to create account. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <div className="w-full max-w-md">
        
        {/* LOGO HEADER */}
        <div className="text-center mb-8">
          <Link to="/" className="text-3xl font-bold text-white tracking-tighter">
            UNSPACE<span className="text-primary">.</span>
          </Link>
          <p className="text-muted mt-2">Join the exclusive Pondicherry University network.</p>
        </div>

        <div className="lux-card p-8 border border-white/10 shadow-2xl bg-[#0a0a0a]">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Create Student Account</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-200 p-3 rounded-lg text-sm mb-6 flex items-start gap-2">
              <FontAwesomeIcon icon={ICONS.EXCLAMATION_TRIANGLE || 'exclamation-circle'} className="mt-1" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1 uppercase">Full Name</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                className="lux-input w-full"
                placeholder="e.g. Rahul Kumar"
                required
              />
            </div>

            {/* Email - WITH HINT */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1 uppercase">University Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="lux-input w-full"
                placeholder="id@pondiuni.ac.in"
                required
              />
              <p className="text-[10px] text-primary mt-1 opacity-80">
                * Must end in @pondiuni.ac.in
              </p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1 uppercase">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="lux-input w-full"
                placeholder="••••••"
                required
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-muted mb-1 uppercase">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="lux-input w-full"
                placeholder="••••••"
                required
              />
            </div>

            {/* TERMS CHECKBOX */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                name="agreedToTerms"
                checked={formData.agreedToTerms}
                onChange={handleChange}
                id="terms"
                className="mt-1 cursor-pointer accent-primary h-4 w-4"
              />
              <label htmlFor="terms" className="text-sm text-muted cursor-pointer select-none">
                I agree to the <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms of Service</Link> and confirm I am a student of this university.
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="lux-btn-primary w-full py-3 mt-4 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Sign Up'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/signin" className="text-white hover:text-primary transition-colors font-bold">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;