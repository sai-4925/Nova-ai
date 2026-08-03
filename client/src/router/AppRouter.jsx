// src/router/AppRouter.jsx
// -----------------------------------------------------------------------
// Single place defining every route in the app. Protected routes are
// nested under <ProtectedRoute /> so adding a new authenticated page
// later (ChatPage, Settings, etc.) never requires re-adding the auth
// check - just another child route here.
// -----------------------------------------------------------------------

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute.jsx';
import Login from '../pages/Login.jsx';
import Register from '../pages/Register.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import ChatPage from '../pages/ChatPage.jsx';

export const AppRouter = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />

    <Route element={<ProtectedRoute />}>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/chat" element={<ChatPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
