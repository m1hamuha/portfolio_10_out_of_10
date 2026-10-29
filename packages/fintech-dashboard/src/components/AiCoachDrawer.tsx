import React, { useState, useEffect, useRef } from 'react';
import { CoachContext, ChatMessage } from '../engine/types';
import { executeCopilotChat } from '../engine/openRouterClient';

interface AiCoachDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  context: CoachContext;
}

const QUICK_PROMPT_CHIPS = [
  'How do I extend runway by 6 months?',
  'Can we afford to hire 2 senior engineers?',
  'Audit software & OpEx spend for cuts',
  'Evaluate growth push vs default alive',
];

export const AiCoachDrawer: React.FC<AiCoachDrawerProps> = ({ isOpen, onClose, context }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('openrouter_api_key') || '';
      setApiKey(stored);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (!isOpen) return null;

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content: promptText.trim(),
      timestamp: Date.now(),
    };

    const assistantPlaceholderId = `msg-${Date.now()}-assistant`;
    const initialAssistantMsg: ChatMessage = {
      id: assistantPlaceholderId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      isSimulated: !apiKey,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMsg]);
    setInput('');
    setIsStreaming(true);

    try {
      const updatedMessages = [...messages, userMessage];
      const result = await executeCopilotChat(updatedMessages, context, {
        apiKey: apiKey || undefined,
        onChunk: (_chunk, fullTextSoFar) => {
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantPlaceholderId ? { ...m, content: fullTextSoFar } : m))
          );
        },
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantPlaceholderId
            ? { ...m, content: result.content, isSimulated: result.isSimulated, modelUsed: result.modelUsed }
            : m
        )
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantPlaceholderId
            ? { ...m, content: 'An unexpected error occurred. Local heuristics recovered.' }
            : m
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          zIndex: 998,
        }}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-label="AI Copilot Coach"
        aria-modal="true"
        data-testid="ai-coach-drawer"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 480,
          maxWidth: '100vw',
          backgroundColor: '#0d1117',
          borderLeft: '1px solid #30363d',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.5)',
        }}
      >
        {/* Header */}
        <header
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #30363d',
            backgroundColor: '#161b22',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 18 }}>🤖</span>
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#f0f6fc' }}>
                AI Financial Copilot
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  backgroundColor: apiKey ? '#3fb950' : '#e3b341',
                }}
              />
              <span style={{ fontSize: 11, color: '#8b949e' }}>
                {apiKey ? 'Live LLM (OpenRouter)' : 'Deterministic Heuristics (Offline)'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              title="API Key Settings"
              style={{
                background: 'none',
                border: '1px solid #30363d',
                borderRadius: 4,
                color: '#c9d1d9',
                padding: '4px 8px',
                cursor: 'pointer',
                fontSize: 12,
              }}
            >
              ⚙️
            </button>
            <button
              type="button"
              onClick={onClose}
              data-testid="close-ai-coach-btn"
              aria-label="Close AI Copilot Coach"
              style={{
                background: 'none',
                border: 'none',
                color: '#8b949e',
                fontSize: 20,
                cursor: 'pointer',
                padding: 4,
              }}
            >
              ✕
            </button>
          </div>
        </header>

        {/* Settings Sub-Panel */}
        {showSettings && (
          <div style={{ padding: 12, backgroundColor: '#21262d', borderBottom: '1px solid #30363d' }}>
            <label style={{ fontSize: 12, color: '#c9d1d9', display: 'block', marginBottom: 4 }}>
              OpenRouter API Key (Optional for live streaming):
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                localStorage.setItem('openrouter_api_key', e.target.value);
              }}
              placeholder="sk-or-v1-..."
              style={{
                width: '100%',
                padding: '6px 10px',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 4,
                color: '#c9d1d9',
                fontSize: 12,
                boxSizing: 'border-box',
              }}
            />
            <div style={{ fontSize: 11, color: '#8b949e', marginTop: 4 }}>
              Leave blank to run 100% offline via local deterministic financial heuristics.
            </div>
          </div>
        )}

        {/* Live Context Banner */}
        <div
          style={{
            padding: '10px 16px',
            backgroundColor: '#161b22',
            borderBottom: '1px solid #30363d',
            fontSize: 11,
            color: '#8b949e',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <span>Stage: <strong style={{ color: '#f0f6fc' }}>{context.activePresetName}</strong></span>
          <span>Cash: <strong style={{ color: '#58a6ff' }}>${(context.cashBalanceCents / 100).toLocaleString()}</strong></span>
          <span>Runway: <strong style={{ color: context.status === 'CRITICAL' ? '#f85149' : '#3fb950' }}>{context.status === 'DEFAULT_ALIVE' ? 'Default Alive' : `${context.runwayMonths.toFixed(1)} mo`}</strong></span>
        </div>

        {/* Messages Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {messages.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: '#8b949e' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>💡</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#c9d1d9', marginBottom: 4 }}>
                Ask your Financial Copilot
              </div>
              <div style={{ fontSize: 12, maxWidth: 300, margin: '0 auto', lineHeight: 1.5 }}>
                Get instant diagnosis, hiring impact calculations, and runway extension strategies.
              </div>
            </div>
          )}

          {/* Quick Prompt Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {QUICK_PROMPT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                data-testid={`prompt-chip-${idx}`}
                onClick={() => handleSendPrompt(chip)}
                disabled={isStreaming}
                style={{
                  backgroundColor: '#21262d',
                  border: '1px solid #30363d',
                  borderRadius: 16,
                  padding: '6px 12px',
                  fontSize: 12,
                  color: '#58a6ff',
                  cursor: isStreaming ? 'not-allowed' : 'pointer',
                  textAlign: 'left',
                }}
              >
                + {chip}
              </button>
            ))}
          </div>

          {/* Chat Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                backgroundColor: msg.role === 'user' ? '#1f6feb' : '#161b22',
                color: '#f0f6fc',
                borderRadius: 8,
                padding: '12px 14px',
                fontSize: 13,
                lineHeight: 1.5,
                border: msg.role === 'assistant' ? '1px solid #30363d' : 'none',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: msg.role === 'user' ? '#c9d1d9' : '#7ee787',
                  marginBottom: 6,
                  textTransform: 'uppercase',
                }}
              >
                {msg.role === 'user' ? 'You' : 'AI Copilot Coach'}
              </div>
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {msg.content || (isStreaming ? 'Analyzing financial telemetry...' : '')}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <footer
          style={{
            padding: 16,
            borderTop: '1px solid #30363d',
            backgroundColor: '#161b22',
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendPrompt(input);
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about runway, burn, or hiring..."
              disabled={isStreaming}
              aria-label="Message AI Copilot"
              data-testid="ai-coach-input"
              style={{
                flex: 1,
                padding: '10px 14px',
                backgroundColor: '#0d1117',
                border: '1px solid #30363d',
                borderRadius: 6,
                color: '#f0f6fc',
                fontSize: 13,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              data-testid="ai-coach-send-btn"
              disabled={isStreaming || !input.trim()}
              style={{
                padding: '10px 16px',
                backgroundColor: isStreaming || !input.trim() ? '#21262d' : '#238636',
                color: '#ffffff',
                border: 'none',
                borderRadius: 6,
                fontWeight: 600,
                fontSize: 13,
                cursor: isStreaming || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </footer>
      </aside>
    </>
  );
};
