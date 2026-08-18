// Single source of truth for "what can Nova do?"
export const AGENT_METADATA = {
  name: 'NOVA AI',
  version: '1.0.0',
  description:
    'A voice-controlled multi-agent personal assistant built with LangGraph.',

  agents: [
    {
      id: 'email',
      name: 'Email Agent',
      capabilities: ['send email', 'read inbox', 'summarize emails'],
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Agent',
      capabilities: ['send message', 'search contacts', 'read recent chats'],
    },
    {
      id: 'reminder',
      name: 'Reminder Agent',
      capabilities: ['create reminder', 'list reminders', 'delete reminder'],
    },
    {
      id: 'calendar',
      name: 'Calendar Agent',
      capabilities: ['create event', 'list events', 'delete event'],
    },
    {
      id: 'weather',
      name: 'Weather Agent',
      capabilities: ['current weather by city'],
    },
    {
      id: 'search',
      name: 'Search Agent',
      capabilities: ['web search', 'summarize results'],
    },
    {
      id: 'pdf',
      name: 'PDF / RAG Agent',
      capabilities: ['upload PDF', 'ask questions about documents'],
    },
    {
      id: 'research',
      name: 'Research Agent',
      capabilities: ['multi-source research', 'cited summaries'],
    },
    {
      id: 'coding',
      name: 'Coding Agent',
      capabilities: ['explain code', 'generate code', 'debug'],
    },
    {
      id: 'system',
      name: 'System Agent',
      capabilities: [
        'open apps',
        'screenshot',
        'type text',
        'hotkeys',
        'click',
        'create files/folders',
        'shutdown/restart',
      ],
    },
    {
      id: 'memory',
      name: 'Memory',
      capabilities: ['short-term chat memory', 'long-term facts'],
    },
  ],
get agentCount() {
  return this.agents.length;
},

listAgentNames() {
  return this.agents.map((a) => a.name);
},

/** "11 agents: Email Agent, WhatsApp Agent, ..." */
countWithNames() {
  return `Nova has ${this.agentCount} agents: ${this.listAgentNames().join(', ')}.`;
},

/** Full detail list */
summary() {
  const lines = this.agents.map(
    (a, i) => `${i + 1}. ${a.name} — ${a.capabilities.join(', ')}`
  );
  return [
    `Nova has ${this.agentCount} agents:`,
    ...lines,
  ].join('\n');
},
}