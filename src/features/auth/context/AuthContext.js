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
    // 1. Safety Check: If config is missing, stop to prevent crash
    if (!firebaseConfigured || !auth) {
      console.warn('⚠️ Firebase not configured. Auth listeners disabled.');
      setLoading(false);
      return;
    }

    // 2. Listener: Single source of truth (no localStorage needed)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'email',
        });

        // 3. Admin Check (UI Only)
        // WARNING: Real security must be in Firestore Rules (firestore.rules)
        try {
          const adminDocRef = doc(db, 'admins', firebaseUser.uid);
          const adminSnap = await getDoc(adminDocRef);
          setIsAdmin(adminSnap.exists());
        } catch (err) {
          console.error('Failed to check admin status:', err);
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
      // State updates automatically via listener
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
      {children}
    </AuthContext.Provider>
  );
};

