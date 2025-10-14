import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
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
    // Listen for Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
          photoURL: firebaseUser.photoURL,
          provider: firebaseUser.providerData[0]?.providerId || 'email',
          signInTime: new Date().toISOString()
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));

        // Check if the user is an admin by reading a Firestore doc at admins/{uid}
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
        localStorage.removeItem('user');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      // Simulate API call - replace with actual authentication
      if (email && password) {
        const userData = {
          id: Date.now(),
          email,
          name: email.split('@')[0],
          signInTime: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email, password, name) => {
    try {
      // Simulate API call - replace with actual registration
      if (email && password && name) {
        const userData = {
          id: Date.now(),
          email,
          name,
          signUpTime: new Date().toISOString()
        };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return { success: true };
      }
      return { success: false, error: 'All fields are required' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signInWithGoogle = async (googleUserData) => {
    try {
      setUser(googleUserData);
      localStorage.setItem('user', JSON.stringify(googleUserData));
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = {
    user,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
    loading,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
