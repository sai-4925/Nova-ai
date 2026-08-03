// src/components/agents/MemoryWidget.jsx
import { useEffect, useState } from 'react';
import * as memoryApi from '../../services/memoryApi.js';
import { Card } from '../common/Card.jsx';
import { Loader } from '../common/Loader.jsx';

export const MemoryWidget = () => {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    memoryApi
      .listMemories()
      .then(({ data }) => setMemories(data.data.memories))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id) => {
    await memoryApi.deleteMemory(id);
    setMemories((prev) => prev.filter((m) => m._id !== id));
  };

  return (
    <Card title="What Nova Remembers">
      {isLoading ? (
        <Loader label="Loading memories..." />
      ) : memories.length === 0 ? (
        <p className="text-sm text-ink-faint">Nova hasn't learned anything long-term about you yet - keep chatting.</p>
      ) : (
        <ul className="space-y-2">
          {memories.map((m) => (
            <li key={m._id} className="flex items-center justify-between rounded-lg bg-surface-raised px-3 py-2 text-sm">
              <span className="text-ink">{m.content}</span>
              <button onClick={() => handleDelete(m._id)} className="text-ink-faint hover:text-red-400" aria-label="Forget this">
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
