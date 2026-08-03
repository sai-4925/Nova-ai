// src/components/agents/SystemAgentWidget.jsx
// -----------------------------------------------------------------------
// Generates a pairing token (Module 19) for the local companion app and
// polls connection status - the token is shown ONCE after generation,
// matching the backend's design (it's meant to be copied into the
// companion's config.json, not stored/displayed persistently client-side).
// -----------------------------------------------------------------------

import { useEffect, useState } from 'react';
import * as systemApi from '../../services/systemApi.js';
import { Card } from '../common/Card.jsx';
import { Button } from '../common/Button.jsx';

export const SystemAgentWidget = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [token, setToken] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const checkStatus = async () => {
    try {
      const { data } = await systemApi.getCompanionStatus();
      setIsConnected(data.data.connected);
    } catch {
      // Non-critical - status just stays at its last known value.
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data } = await systemApi.createPairingToken();
      setToken(data.data.token);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card title="System Agent">
      <div className="mb-3 flex items-center gap-2 text-sm">
        <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-signal-violet shadow-glow-violet' : 'bg-ink-faint'}`} />
        <span className="text-ink-muted">{isConnected ? 'Companion app connected' : 'Companion app not connected'}</span>
      </div>

      <p className="mb-3 text-xs text-ink-faint">
        Lets Nova open apps, take screenshots, or shut down/restart your computer via a small app you run locally.
      </p>

      {token ? (
        <div className="space-y-2">
          <p className="text-xs text-ink-muted">Paste this into your companion app's config.json, then restart it:</p>
          <code className="block break-all rounded-lg bg-void px-3 py-2 text-xs text-nova-amber">{token}</code>
        </div>
      ) : (
        <Button onClick={handleGenerate} isLoading={isGenerating} variant="secondary" className="w-full">
          Generate pairing token
        </Button>
      )}
    </Card>
  );
};
