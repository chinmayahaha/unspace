import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import GoogleAuth from '../components/GoogleAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { ICONS } from '../config/icons';
import './SignIn.css';

const SignIn = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error || 'Failed to sign in');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <FontAwesomeIcon icon={ICONS.ROBOT} className="signin-icon" />
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="signin-form">
          {error && <div className="error-message">{error}</div>}
          
          {/* Google Auth */}
          <GoogleAuth 
            onSuccess={async (googleUserData) => {
              const result = await signInWithGoogle(googleUserData);
              if (result.success) {
                navigate('/dashboard');
              } else {
                setError(result.error || 'Google sign-in failed');
              }
            }}
            onError={(error) => setError(error)}
            buttonText="Sign in with Google"
          />
          
          <div className="divider">
            <span>or</span>
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="password-input">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <FontAwesomeIcon icon={showPassword ? ICONS.EYE_SLASH : ICONS.EYE} />
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            className="signin-button"
            disabled={loading}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="signin-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup" className="signin-link">
              Sign up here
            </Link>
          </p>
          <p>
            <Link to="/" className="signin-link">
              ← Back to Home
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
