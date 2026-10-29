"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
      <main style={{ maxWidth: 400, textAlign: "center" }}>
        <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 8 }}>Error</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 32, lineHeight: 1.6 }}>
          An unexpected error occurred. You can try again, or head back to the
          app.
        </p>
        <button
          onClick={reset}
          style={{
            backgroundColor: "#238636",
            color: "#ffffff",
            border: "none",
            borderRadius: 6,
            padding: "10px 20px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          Try again
        </button>
        <div>
          <a
            href="/"
            style={{
              color: "#58a6ff",
              textDecoration: "none",
              fontSize: 14,
            }}
          >
            ← Back to Home
          </a>
        </div>
      </main>
    </div>
  );
}
