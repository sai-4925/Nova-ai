// src/App.jsx
// -----------------------------------------------------------------------
// Root component: wraps the entire route tree with global providers.
// AuthProvider must wrap BrowserRouter's contents (not the other way
// round) so useNavigate/useAuth can both be used together in pages.
// -----------------------------------------------------------------------

import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { AppRouter } from './router/AppRouter.jsx';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
