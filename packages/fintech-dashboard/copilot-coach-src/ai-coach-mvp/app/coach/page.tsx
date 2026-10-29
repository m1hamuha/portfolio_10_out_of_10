"use client";

import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { openRouterModels, type ModelId } from "@/lib/openrouter";
import { clientLogger } from "@/lib/client-logger";

interface Conversation {
  id: string;
  title: string;
  goal: string | null;
  model: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

export default function CoachPage() {
  const [goal, setGoal] = useState("");
  const [context, setContext] = useState("");
  const [model, setModel] = useState<ModelId>("gpt-4o-mini");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showConversations, setShowConversations] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    isLoading,
    setMessages,
    error,
    reload,
  } = useChat({
    body: { goal, context, model },
  });

  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await fetch("/api/conversations");
      const data = await res.json();
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      clientLogger.error("Failed to load conversations", error);
    }
  };

  const createConversation = async (title: string) => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, goal, context }),
    });
    const data = await res.json();
    return data.conversation;
  };

  const loadConversation = async (id: string) => {
    try {
      const res = await fetch(`/api/conversations/${id}/messages`);
      const data = await res.json();
      if (data.messages) {
        const formattedMessages = data.messages.map((m: { id: string; role: string; content: string }) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }));
        setMessages(formattedMessages);
        setCurrentConversationId(id);
        setGoal(data.conversation.goal || "");
        setContext(data.conversation.context || "");
        setModel((data.conversation.model as ModelId) || "gpt-4o-mini");
        setIsNewChat(false);
        setShowConversations(false);
      }
    } catch (error) {
      clientLogger.error("Failed to load conversation", error);
    }
  };

  const deleteConversation = async (id: string) => {
    if (!confirm("Delete this conversation?")) return;
    await fetch(`/api/conversations?id=${id}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (currentConversationId === id) {
      setMessages([]);
      setCurrentConversationId(null);
      setIsNewChat(true);
      setGoal("");
      setContext("");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (isNewChat && !currentConversationId) {
      const title = input.slice(0, 50) + (input.length > 50 ? "..." : "");
      const conversation = await createConversation(title);
      setCurrentConversationId(conversation.id);
      setIsNewChat(false);
    }

    handleSubmit(e);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setIsNewChat(true);
    setGoal("");
    setContext("");
    setModel("gpt-4o-mini");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const modelOptions = Object.entries(openRouterModels).map(([key, info]) => ({
    value: key,
    label: `${info.name} (${info.provider})`,
  }));

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#0d1117" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: showConversations ? 280 : 0,
          backgroundColor: "#161b22",
          borderRight: "1px solid #30363d",
          transition: "width 0.2s",
          overflow: "hidden",
          // When collapsed, hide from tab order + screen readers so the
          // off-screen New Chat / conversation / delete controls aren't
          // keyboard-focusable or announced (WCAG 2.4.3 / 4.1.2).
          visibility: showConversations ? "visible" : "hidden",
        }}
      >
        <div style={{ padding: 16 }}>
          <button
            onClick={startNewChat}
            style={{
              width: "100%",
              padding: "10px 16px",
              backgroundColor: "#238636",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            + New Chat
          </button>

          <div style={{ fontSize: 12, color: "#8b949e", marginBottom: 8 }}>
            Recent Conversations
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {conversations.length === 0 && (
              <div style={{ fontSize: 13, color: "#8b949e", padding: "8px 12px", lineHeight: 1.5 }}>
                No conversations yet. Start a new chat to get coaching.
              </div>
            )}
            {conversations.map((conv) => (
              <div
                key={conv.id}
                style={{
                  padding: "10px 12px",
                  backgroundColor:
                    currentConversationId === conv.id ? "#21262d" : "transparent",
                  borderRadius: 6,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => loadConversation(conv.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      loadConversation(conv.id);
                    }
                  }}
                  aria-current={currentConversationId === conv.id ? "true" : undefined}
                  aria-label={`Open conversation: ${conv.title}`}
                  style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      color: "#c9d1d9",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {conv.title}
                  </div>
                  <div style={{ fontSize: 11, color: "#8b949e", marginTop: 2 }}>
                    {formatDate(conv.updatedAt)}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  aria-label={`Delete conversation: ${conv.title}`}
                  title="Delete conversation"
                  style={{
                    background: "none",
                    border: "none",
                    color: "#8b949e",
                    cursor: "pointer",
                    padding: 4,
                    fontSize: 16,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <header
          style={{
            padding: "12px 24px",
            borderBottom: "1px solid #30363d",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#0d1117",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => setShowConversations(!showConversations)}
              aria-label={showConversations ? "Hide conversations sidebar" : "Show conversations sidebar"}
              aria-expanded={showConversations}
              title="Toggle conversations"
              style={{
                background: "none",
                border: "none",
                color: "#c9d1d9",
                cursor: "pointer",
                padding: 8,
                fontSize: 20,
              }}
            >
              ☰
            </button>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: "#ffffff", margin: 0 }}>
              AI CopilotCoach
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href="/analytics"
              style={{
                color: "#8b949e",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Analytics
            </a>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as ModelId)}
              aria-label="Select AI model"
              title="Select AI model"
              style={{
                padding: "8px 12px",
                backgroundColor: "#21262d",
                color: "#c9d1d9",
                border: "1px solid #30363d",
                borderRadius: 6,
                fontSize: 13,
              }}
            >
              {modelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            <a
              href="/api/auth/logout"
              style={{
                color: "#8b949e",
                textDecoration: "none",
                fontSize: 14,
              }}
            >
              Sign Out
            </a>
          </div>
        </header>

        {/* Chat Area */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px 0",
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
            {/* Goal & Context */}
            {!messages.length && (
              <div style={{ marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <label
                    htmlFor="coaching-goal"
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#c9d1d9",
                      marginBottom: 6,
                    }}
                  >
                    Coaching Goal
                  </label>
                  <input
                    id="coaching-goal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Help me improve my React code, Review my algorithm solution..."
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      backgroundColor: "#21262d",
                      color: "#c9d1d9",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      fontSize: 14,
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    htmlFor="coaching-context"
                    style={{
                      display: "block",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#c9d1d9",
                      marginBottom: 6,
                    }}
                  >
                    Context (code, diff, or description)
                  </label>
                  <textarea
                    id="coaching-context"
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Paste your code, diff, or describe what you're working on..."
                    rows={8}
                    spellCheck={false}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      backgroundColor: "#21262d",
                      color: "#c9d1d9",
                      border: "1px solid #30363d",
                      borderRadius: 6,
                      fontSize: 14,
                      resize: "vertical",
                      fontFamily: "monospace",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>
            )}

            {/* Messages */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "16px 20px",
                    backgroundColor: m.role === "user" ? "#21262d" : "#161b22",
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: m.role === "user" ? "#58a6ff" : "#7ee787",
                      marginBottom: 8,
                      textTransform: "uppercase",
                    }}
                  >
                    {m.role === "user" ? "You" : "AI Coach"}
                  </div>
                  <div
                    style={{
                      color: "#c9d1d9",
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      fontSize: 14,
                    }}
                  >
                    {m.parts.map((p, i) =>
                      p.type === "text" ? <span key={i}>{p.text}</span> : null
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div
                  role="status"
                  aria-live="polite"
                  style={{
                    padding: "16px 20px",
                    backgroundColor: "#161b22",
                    borderRadius: 8,
                    color: "#8b949e",
                    fontSize: 14,
                  }}
                >
                  Thinking...
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  style={{
                    padding: "16px 20px",
                    backgroundColor: "#21262d",
                    border: "1px solid #f85149",
                    borderRadius: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 16,
                  }}
                >
                  <div style={{ color: "#f85149", fontSize: 14, lineHeight: 1.5 }}>
                    Something went wrong while contacting the AI coach. Please try
                    again.
                  </div>
                  <button
                    onClick={() => reload()}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: "#238636",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: 6,
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Retry
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Input */}
        <div
          style={{
            padding: "24px",
            borderTop: "1px solid #30363d",
            backgroundColor: "#0d1117",
          }}
        >
          <form
            onSubmit={handleFormSubmit}
            style={{ maxWidth: 900, margin: "0 auto" }}
          >
            <div style={{ display: "flex", gap: 12 }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                aria-label="Message the AI coach"
                placeholder="Ask what to improve, or describe your coding challenge..."
                style={{
                  flex: 1,
                  padding: "14px 18px",
                  backgroundColor: "#21262d",
                  color: "#c9d1d9",
                  border: "1px solid #30363d",
                  borderRadius: 8,
                  fontSize: 14,
                }}
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                style={{
                  padding: "14px 28px",
                  backgroundColor: isLoading || !input.trim() ? "#21262d" : "#238636",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: 8,
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: isLoading || !input.trim() ? "not-allowed" : "pointer",
                }}
              >
                {isLoading ? "..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
