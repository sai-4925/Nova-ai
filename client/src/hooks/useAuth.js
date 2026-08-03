// src/hooks/useAuth.js
// -----------------------------------------------------------------------
// Thin accessor hook so components write `const { user } = useAuth()`
// instead of importing AuthContext + useContext everywhere. Throws a
// clear error if used outside <AuthProvider> rather than silently
// returning null and causing a confusing downstream crash.
// -----------------------------------------------------------------------

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};
