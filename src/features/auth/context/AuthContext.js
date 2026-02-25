import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  GoogleAuthProvider, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, db, firebaseConfigured } from '../../../firebase';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!firebaseConfigured || !auth) {
      console.warn('Firebase not configured. Auth listeners disabled.');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'email',
        });

        // FIX: Check admin status via custom token claim (set by makeMeAdmin function)
        // This avoids a direct Firestore read that fails due to missing security rules
        try {
          // Force-refresh to get the latest custom claims
          const idTokenResult = await firebaseUser.getIdTokenResult(true);
          setIsAdmin(idTokenResult.claims.admin === true);
        } catch (err) {
          // Silently fail — user is simply not an admin
          setIsAdmin(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    if (!auth) return { success: false, error: 'Firebase config missing' };
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, credential };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, name) => {
    if (!auth) return { success: false, error: 'Firebase config missing' };
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      return { success: true, userCredential };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async () => {
    if (!auth) return { success: false, error: 'Firebase config missing' };
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return { success: true, result };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {/* FIX: Don't render children until auth state is resolved.
          This prevents ALL child components from firing requests before
          auth is ready, eliminating 401 errors on page load. */}
      {!loading && children}
    </AuthContext.Provider>
  );
};