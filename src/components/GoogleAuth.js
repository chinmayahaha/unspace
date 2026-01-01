import React from 'react';
import { GoogleAuthProvider, signInWithRedirect } from 'firebase/auth';
import { auth } from '../firebase';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './GoogleAuth.css';

const GoogleAuth = ({ onSuccess, onError, buttonText = "Continue with Google", className = "" }) => {
  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Add scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      const result = await signInWithRedirect(auth, provider);
      const user = result.user;
      
      // Extract user information
      const userData = {
        id: user.uid,
        email: user.email,
        name: user.displayName || user.email.split('@')[0],
        photoURL: user.photoURL,
        provider: 'google',
        signInTime: new Date().toISOString()
      };
      
      if (onSuccess) {
        onSuccess(userData);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      if (onError) {
        onError(error.message);
      }
    }
  };

  return (
    <button 
      type="button"
      onClick={handleGoogleSignIn}
      className={`google-auth-button ${className}`}
    >
      <FontAwesomeIcon icon={ICONS.GOOGLE_BRAND} className="google-icon" />
      <span>{buttonText}</span>
    </button>
  );
};

export default GoogleAuth;
