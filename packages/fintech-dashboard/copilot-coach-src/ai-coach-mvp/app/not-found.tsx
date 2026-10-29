import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Page Not Found',
  description: 'The page you are looking for does not exist or has moved.',
};

export default function NotFound() {
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
        <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 8 }}>404</p>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", marginBottom: 16 }}>
          Page not found
        </h1>
        <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 32, lineHeight: 1.6 }}>
          The page you are looking for does not exist or has moved. Check the
          address, or head back to the app.
        </p>
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
      </main>
    </div>
  );
}
