/**
 * SYNC-OS AUTH SHIELD: Orchestrates user identity and profile synchronization.
 * Interfaces with Firebase Auth for secure session management and data isolation.
 */
import React, { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '@/firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    uid: 'guest-student',
    displayName: 'Guest Student',
    email: 'guest@syncos.edu',
  } as any);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
      if (authenticatedUser) {
        const path = `users/${authenticatedUser.uid}`;
        try {
          // Sync user to Firestore
          const userRef = doc(db, 'users', authenticatedUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            await setDoc(userRef, {
              uid: authenticatedUser.uid,
              displayName: authenticatedUser.displayName,
              email: authenticatedUser.email,
              lastActive: new Date().toISOString()
            });
          }
          setUser(authenticatedUser);
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, path);
        }
      } else {
        // Keep mock user for prototyping if no one is logged in
        setUser({
          uid: 'guest-student',
          displayName: 'Guest Student',
          email: 'guest@syncos.edu',
        } as any);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const signOut = () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
