// src/pages/Dashboard.jsx
// -----------------------------------------------------------------------
// The real home base: a grid of independent widgets, each talking
// directly to its own REST endpoints (Modules 12-20) - none of this
// depends on chat/voice, matching each module's original "usable
// outside of chat too" design goal.
// -----------------------------------------------------------------------

import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Button } from '../components/common/Button.jsx';
import { RemindersWidget } from '../components/agents/RemindersWidget.jsx';
import { CalendarWidget } from '../components/agents/CalendarWidget.jsx';
import { PdfWidget } from '../components/agents/PdfWidget.jsx';
import { SystemAgentWidget } from '../components/agents/SystemAgentWidget.jsx';
import { MemoryWidget } from '../components/agents/MemoryWidget.jsx';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [calendarToast, setCalendarToast] = useState(null);

  // The Calendar OAuth callback (Module 13) redirects the browser here
  // with ?calendarConnected=true/false - surface that as a one-time toast,
  // then clean the query param so it doesn't persist on refresh.
  useEffect(() => {
    const connected = searchParams.get('calendarConnected');
    if (connected === 'true') setCalendarToast({ type: 'success', message: 'Google Calendar connected.' });
    else if (connected === 'false') setCalendarToast({ type: 'error', message: 'Could not connect Google Calendar. Please try again.' });

    if (connected) {
      searchParams.delete('calendarConnected');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-void">
      <header className="flex items-center justify-between border-b border-hairline px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-nova-amber shadow-glow" />
          <span className="font-display text-lg font-semibold">NOVA</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-ink-muted">Hi, {user?.name}</span>
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      {calendarToast && (
        <div
          className={`mx-6 mt-4 rounded-lg border px-4 py-2.5 text-sm ${
            calendarToast.type === 'success'
              ? 'border-signal-violet/30 bg-signal-violet/10 text-signal-violet'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {calendarToast.message}
        </div>
      )}

      <main className="px-6 py-8">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <h1 className="font-display text-2xl font-semibold">Where should we start?</h1>
          <Link to="/chat">
            <Button>Talk to Nova</Button>
          </Link>
        </div>

        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
          <RemindersWidget />
          <CalendarWidget />
          <PdfWidget />
          <SystemAgentWidget />
          <div className="md:col-span-2">
            <MemoryWidget />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
