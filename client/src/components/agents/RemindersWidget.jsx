// src/components/agents/RemindersWidget.jsx
import { useEffect, useState } from 'react';
import * as reminderApi from '../../services/reminderApi.js';
import { Card } from '../common/Card.jsx';
import { Button } from '../common/Button.jsx';
import { Loader } from '../common/Loader.jsx';

export const RemindersWidget = () => {
  const [reminders, setReminders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [remindAt, setRemindAt] = useState('');

  const load = async () => {
    try {
      const { data } = await reminderApi.listReminders();
      setReminders(data.data.reminders);
    } catch {
      setError('Could not load reminders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim() || !remindAt) return;
    try {
      await reminderApi.createReminder({ title, remindAt: new Date(remindAt).toISOString() });
      setTitle('');
      setRemindAt('');
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create reminder.');
    }
  };

  const handleDelete = async (id) => {
    await reminderApi.deleteReminder(id);
    setReminders((prev) => prev.filter((r) => r._id !== id));
  };

  return (
    <Card
      title="Reminders"
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
            placeholder="Remind me to..."
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-nova-amber"
          />
          <input
            type="datetime-local"
            value={remindAt}
            onChange={(e) => setRemindAt(e.target.value)}
            className="w-full rounded-md border border-hairline bg-surface px-3 py-2 text-sm text-ink focus:border-nova-amber"
          />
          <Button type="submit" className="w-full">
            Create
          </Button>
        </form>
      )}

      {isLoading ? (
        <Loader label="Loading reminders..." />
      ) : error ? (
        <p className="text-sm text-red-300">{error}</p>
      ) : reminders.length === 0 ? (
        <p className="text-sm text-ink-faint">No upcoming reminders.</p>
      ) : (
        <ul className="space-y-2">
          {reminders.map((r) => (
            <li key={r._id} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 text-sm">
              <div>
                <p className="text-ink">{r.title}</p>
                <p className="text-xs text-ink-faint">{new Date(r.remindAt).toLocaleString()}</p>
              </div>
              <button onClick={() => handleDelete(r._id)} className="text-ink-faint hover:text-red-400" aria-label={`Delete ${r.title}`}>
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
