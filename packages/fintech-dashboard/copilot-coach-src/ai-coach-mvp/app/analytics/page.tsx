"use client";

import { useState, useEffect } from "react";
import { openRouterModels, type ModelId } from "@/lib/openrouter";

interface AnalyticsData {
  summary: {
    totalMessages: number;
    totalCost: number;
    totalTokens: number;
    averageRating: number | null;
    totalFeedbackCount: number;
  };
  modelBreakdown: {
    model: ModelId;
    modelName: string;
    count: number;
    tokens: number;
    cost: number;
  }[];
  recentActivity: {
    id: string;
    role: string;
    preview: string;
    model: string;
    tokens: number;
    cost: number;
    createdAt: string;
  }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analytics");
      const result = await res.json();
      if (result.error) {
        setError(result.error.message);
      } else {
        setData(result);
      }
    } catch {
      setError("Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("en-US").format(num);
  };

  if (loading) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          color: "#c9d1d9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#0d1117",
          color: "#c9d1d9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <div
          role="alert"
          style={{
            maxWidth: 420,
            backgroundColor: "#161b22",
            border: "1px solid #f85149",
            borderRadius: 8,
            padding: 24,
            textAlign: "center",
          }}
        >
          <div style={{ color: "#f85149", fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
            Couldn&apos;t load your analytics. {error}
          </div>
          <button
            onClick={loadAnalytics}
            style={{
              padding: "8px 16px",
              backgroundColor: "#238636",
              color: "#ffffff",
              border: "none",
              borderRadius: 6,
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0d1117", color: "#c9d1d9" }}>
      {/* Header */}
      <header
        style={{
          padding: "16px 24px",
          borderBottom: "1px solid #30363d",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Analytics Dashboard</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <a
            href="/coach"
            style={{
              color: "#58a6ff",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to Coach
          </a>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: 24 }}>
        {/* Summary Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: 8,
              padding: 20,
              border: "1px solid #30363d",
            }}
          >
            <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 4 }}>
              Total Messages
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#ffffff" }}>
              {formatNumber(data?.summary.totalMessages || 0)}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: 8,
              padding: 20,
              border: "1px solid #30363d",
            }}
          >
            <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 4 }}>
              Total Cost
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#f0883e" }}>
              {formatCurrency(data?.summary.totalCost || 0)}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: 8,
              padding: 20,
              border: "1px solid #30363d",
            }}
          >
            <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 4 }}>
              Total Tokens
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#a371f7" }}>
              {formatNumber(data?.summary.totalTokens || 0)}
            </div>
          </div>

          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: 8,
              padding: 20,
              border: "1px solid #30363d",
            }}
          >
            <div style={{ fontSize: 13, color: "#8b949e", marginBottom: 4 }}>
              Average Rating
            </div>
            <div style={{ fontSize: 28, fontWeight: 600, color: "#7ee787" }}>
              {data?.summary.averageRating
                ? data.summary.averageRating.toFixed(1)
                : "—"}
            </div>
            {data?.summary.totalFeedbackCount ? (
              <div style={{ fontSize: 12, color: "#8b949e", marginTop: 4 }}>
                {formatNumber(data.summary.totalFeedbackCount)} ratings
              </div>
            ) : null}
          </div>
        </div>

        {/* Model Breakdown */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#ffffff" }}>
            Usage by Model
          </h2>
          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: 8,
              border: "1px solid #30363d",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #30363d" }}>
                  <th
                    style={{
                      textAlign: "left",
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#8b949e",
                    }}
                  >
                    Model
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#8b949e",
                    }}
                  >
                    Messages
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#8b949e",
                    }}
                  >
                    Tokens
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#8b949e",
                    }}
                  >
                    Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.modelBreakdown.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      style={{ padding: 40, textAlign: "center", color: "#8b949e" }}
                    >
                      No usage data yet. Start a conversation in the Coach!
                    </td>
                  </tr>
                )}
                {data?.modelBreakdown.map((item) => (
                  <tr key={item.model} style={{ borderBottom: "1px solid #21262d" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: 500, color: "#ffffff" }}>{item.modelName}</div>
                      <div style={{ fontSize: 12, color: "#8b949e" }}>{item.model}</div>
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "12px 16px",
                        color: "#c9d1d9",
                      }}
                    >
                      {formatNumber(item.count)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "12px 16px",
                        color: "#c9d1d9",
                      }}
                    >
                      {formatNumber(item.tokens)}
                    </td>
                    <td
                      style={{
                        textAlign: "right",
                        padding: "12px 16px",
                        color: "#f0883e",
                        fontWeight: 500,
                      }}
                    >
                      {formatCurrency(item.cost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#ffffff" }}>
            Recent Activity
          </h2>
          <div
            style={{
              backgroundColor: "#161b22",
              borderRadius: 8,
              border: "1px solid #30363d",
            }}
          >
            {data?.recentActivity.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#8b949e" }}>
                No activity yet. Start a conversation in the Coach!
              </div>
            ) : (
              data?.recentActivity.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: "16px 20px",
                    borderBottom: "1px solid #21262d",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 16,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      backgroundColor: item.role === "user" ? "#21262d" : "#238636",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 14,
                      fontWeight: 600,
                      color: item.role === "user" ? "#58a6ff" : "#ffffff",
                      flexShrink: 0,
                    }}
                  >
                    {item.role === "user" ? "U" : "AI"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 13,
                          color: item.role === "user" ? "#58a6ff" : "#7ee787",
                          fontWeight: 500,
                        }}
                      >
                        {item.role === "user" ? "You" : "AI Coach"}
                      </span>
                      <span style={{ fontSize: 12, color: "#8b949e" }}>
                        {formatDate(item.createdAt)}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "#c9d1d9",
                        marginBottom: 8,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {item.preview}
                    </div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <span style={{ fontSize: 12, color: "#8b949e" }}>
                        Model: {openRouterModels[item.model as ModelId]?.name || item.model}
                      </span>
                      <span style={{ fontSize: 12, color: "#8b949e" }}>
                        {formatNumber(item.tokens)} tokens
                      </span>
                      <span style={{ fontSize: 12, color: "#f0883e" }}>
                        {formatCurrency(item.cost)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
