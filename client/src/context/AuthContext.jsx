// src/context/AuthContext.jsx
// -----------------------------------------------------------------------
// The ONLY place in the app that talks to Firebase's auth methods
// directly. Every component uses the `useAuth()` hook instead - this
// keeps Firebase specifics out of pages/components entirely, so
// swapping auth providers later would only mean rewriting this file.
//
// Flow for every auth action:
//   1. Call the Firebase client SDK method (creates/verifies credentials)
//   2. Get the resulting Firebase ID token
//   3. Send that token to our backend, which verifies it, upserts the
//      Mongo user, and sets our own session cookie (Module 4)
//   4. Store the returned Mongo user profile in this context's state
// -----------------------------------------------------------------------

import { createContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from '../config/firebase.js';
import {
  registerWithBackend,
  loginWithBackend,
  googleLoginWithBackend,
  logoutFromBackend,
  fetchCurrentUser,
} from '../services/authApi.js';
import { setUnauthorizedHandler } from '../services/axiosInstance.js';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // On app load, check if a valid backend session cookie already exists
  // (e.g. the user refreshed the page) before Firebase even fires its
  // own auth-state event - this avoids a flash of "logged out" UI.
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const { data } = await fetchCurrentUser();
        setUser(data.data.user);
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  // If the backend ever responds 401 (session expired), clear local
  // state so ProtectedRoute redirects to /login automatically.
  useEffect(() => {
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  const register = useCallback(async (email, password, name) => {
    setAuthError(null);
    const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await credential.user.getIdToken();
    const { data } = await registerWithBackend(idToken, name);
    setUser(data.data.user);
  }, []);

  const login = useCallback(async (email, password) => {
    setAuthError(null);
    const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
    const idToken = await credential.user.getIdToken();
    const { data } = await loginWithBackend(idToken);
    setUser(data.data.user);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setAuthError(null);
    const credential = await signInWithPopup(firebaseAuth, googleProvider);
    const idToken = await credential.user.getIdToken();
    const { data } = await googleLoginWithBackend(idToken);
    setUser(data.data.user);
  }, []);

  const logout = useCallback(async () => {
    await signOut(firebaseAuth);
    await logoutFromBackend();
    setUser(null);
  }, []);

  // Keep Firebase's own token-refresh cycle observed, purely so we can
  // react to the user being signed out from ANOTHER tab.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (firebaseUser) => {
      if (!firebaseUser) setUser(null);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    authError,
    register,
    login,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
