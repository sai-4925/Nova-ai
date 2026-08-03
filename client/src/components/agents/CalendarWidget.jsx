// src/components/agents/CalendarWidget.jsx
// -----------------------------------------------------------------------
// Reuses the backend's own clear "you haven't connected Google Calendar
// yet" error message (Module 13) to detect the not-connected state,
// rather than a separate status check - one source of truth for that
// message instead of two places that could drift out of sync.
// -----------------------------------------------------------------------

import { useEffect, useState } from 'react';
import * as calendarApi from '../../services/calendarApi.js';
import { Card } from '../common/Card.jsx';
import { Button } from '../common/Button.jsx';
import { Loader } from '../common/Loader.jsx';

export const CalendarWidget = () => {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [needsConnection, setNeedsConnection] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const { data } = await calendarApi.listEvents();
      setEvents(data.data.events);
      setNeedsConnection(false);
    } catch (err) {
      const message = err.response?.data?.message || '';
      if (message.includes("haven't connected")) {
        setNeedsConnection(true);
      } else {
        setError('Could not load calendar events.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConnect = async () => {
    const { data } = await calendarApi.getGoogleAuthUrl();
    window.location.href = data.data.url; // full redirect to Google's consent screen
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;
    try {
      await calendarApi.createEvent({
        title,
        startISO: new Date(start).toISOString(),
        endISO: new Date(end).toISOString(),
      });
      setTitle('');
      setStart('');
      setEnd('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create event.');
    }
  };

  const handleDelete = async (googleEventId) => {
    await calendarApi.deleteEvent(googleEventId);
    setEvents((prev) => prev.filter((e) => e.id !== googleEventId));
  };

  if (isLoading) {
    return (
      <Card title="Calendar">
        <Loader label="Loading calendar..." />
      </Card>
    );
  }

  if (needsConnection) {
    return (
      <Card title="Calendar">
        <p className="mb-3 text-sm text-ink-muted">Connect your Google Calendar to let Nova view and manage events.</p>
        <Button onClick={handleConnect}>Connect Google Calendar</Button>
      </Card>
    );
  }

  return (
    <Card
      title="Calendar"
      action={
        <button onClick={() => setShowForm((v) => !v)} className="text-xs font-medium text-nova-amber hover:text-nova-amber-bright">
          {showForm ? 'Cancel' : '+ New'}
        </button>
      }
    >
      {showForm && (
        <form onSubmit={handleCreate} className="mb-4 space-y-2 rounded-lg border border-hairline bg-void p-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-nova-amber"
          />
          <div className="flex gap-2">
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-1/2 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:border-nova-amber"
            />
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-1/2 rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:border-nova-amber"
            />
          </div>
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      )}

      {error && <p className="mb-2 text-sm text-red-300">{error}</p>}

      {events.length === 0 ? (
        <p className="text-sm text-ink-faint">No upcoming events.</p>
      ) : (
        <ul className="space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 text-sm">
              <div>
                <p className="text-ink">{e.summary}</p>
                <p className="text-xs text-ink-faint">
                  {new Date(e.start?.dateTime || e.start?.date).toLocaleString()}
                </p>
              </div>
              <button onClick={() => handleDelete(e.id)} className="text-ink-faint hover:text-red-400" aria-label={`Delete ${e.summary}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
