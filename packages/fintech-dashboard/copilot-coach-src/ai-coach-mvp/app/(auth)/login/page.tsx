"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const handleSignIn = async () => {
    setLoading(true);
    setError(false);
    try {
      await signIn("github", { callbackUrl: "/coach" });
    } catch {
      // Without this, a failed sign-in leaves the button disabled on
      // "Signing in..." forever with no way to retry.
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0d1117",
      color: "#c9d1d9",
    }}>
      <main style={{
        textAlign: "center",
        padding: "48px",
        maxWidth: "400px",
        width: "100%",
      }}>
        <h1 style={{
          fontSize: "32px",
          fontWeight: "600",
          marginBottom: "16px",
          color: "#ffffff",
        }}>
          AI CopilotCoach
        </h1>
        <p style={{
          fontSize: "16px",
          marginBottom: "32px",
          color: "#8b949e",
        }}>
          Get AI-powered code reviews and coaching to level up your development skills.
        </p>
        <button
          onClick={handleSignIn}
          disabled={loading}
          aria-busy={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            padding: "14px 24px",
            fontSize: "16px",
            fontWeight: "600",
            borderRadius: "6px",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            backgroundColor: loading ? "#21262d" : "#238636",
            color: "#ffffff",
            transition: "background-color 0.2s",
          }}
        >
          {loading ? (
            <span>Signing in...</span>
          ) : (
            <>
              <svg aria-hidden="true" focusable="false" height="20" viewBox="0 0 16 16" width="20" fill="currentColor" style={{ marginRight: "8px" }}>
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
              </svg>
              Sign in with GitHub
            </>
          )}
        </button>
        {error && (
          <p role="alert" style={{
            fontSize: "14px",
            marginTop: "16px",
            color: "#f85149",
          }}>
            Sign-in didn&apos;t go through. Check your connection and try again.
          </p>
        )}
        <p style={{
          fontSize: "12px",
          marginTop: "24px",
          color: "#787f89",
        }}>
          By signing in, you agree to our{" "}
          <a href="/terms" style={{ color: "#58a6ff", textDecoration: "underline" }}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" style={{ color: "#58a6ff", textDecoration: "underline" }}>
            Privacy Policy
          </a>.
        </p>
      </main>
    </div>
  );
}
