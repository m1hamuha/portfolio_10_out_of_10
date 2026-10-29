/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "var(--paper)",
        surface: "var(--surface)",
        ink: "var(--ink)",
        "ink-2": "var(--ink-2)",
        line: "var(--line)",
        accent: "var(--accent)",
        "accent-ink": "var(--accent-ink)",
        "accent-soft": "var(--accent-soft)",
        "risk-high": "var(--risk-high)",
        "risk-med": "var(--risk-med)",
        "risk-low": "var(--risk-low)",
        ok: "var(--ok)",
      },
      fontFamily: {
        display: ["'Golos Text'", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,18,32,0.04), 0 8px 24px rgba(11,18,32,0.06)",
        lift: "0 2px 4px rgba(11,18,32,0.06), 0 18px 40px rgba(11,18,32,0.10)",
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};
