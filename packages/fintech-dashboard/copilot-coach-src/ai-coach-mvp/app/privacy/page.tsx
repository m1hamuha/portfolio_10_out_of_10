import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How AI CopilotCoach collects, uses, and protects your data when you use our developer coaching service.',
};

export default function PrivacyPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0d1117",
        color: "#c9d1d9",
        lineHeight: 1.6,
      }}
    >
      <main
        style={{
          maxWidth: 800,
          margin: "0 auto",
          padding: "48px 24px",
        }}
      >
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#ffffff", marginBottom: 24 }}>
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 32 }}>
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            1. Introduction
          </h2>
          <p style={{ marginBottom: 16 }}>
            Welcome to AI CopilotCoach ("we," "our," or "us"). We are committed to protecting your
            personal information and your right to privacy. This Privacy Policy explains how we
            collect, use, disclose, and safeguard your information when you use our service.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            2. Information We Collect
          </h2>
          <p style={{ marginBottom: 16 }}>
            We collect information that you provide directly to us, including:
          </p>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li>Account information (GitHub username, email)</li>
            <li>Messages and conversations with our AI coach</li>
            <li>Feedback you provide about our service</li>
            <li>Usage data and analytics</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            3. How We Use Your Information
          </h2>
          <p style={{ marginBottom: 16 }}>
            We use the information we collect to:
          </p>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li>Provide and improve our AI coaching services</li>
            <li>Process and store your conversations</li>
            <li>Track usage and calculate API costs</li>
            <li>Respond to your comments and questions</li>
            <li>Comply with legal obligations</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            4. Data Storage and Security
          </h2>
          <p style={{ marginBottom: 16 }}>
            Your data is stored in secure databases and is protected through industry-standard
            security measures. We use PostgreSQL for data storage and implement encryption
            for data in transit and at rest.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            5. Third-Party Services
          </h2>
          <p style={{ marginBottom: 16 }}>
            We use the following third-party services:
          </p>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li><strong>GitHub</strong> - OAuth authentication</li>
            <li><strong>OpenRouter</strong> - AI model API (data may be processed by their servers)</li>
            <li><strong>Vercel</strong> - Hosting and deployment</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            6. Your Rights (GDPR)
          </h2>
          <p style={{ marginBottom: 16 }}>
            If you are located in the European Economic Area (EEA), you have certain rights:
          </p>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li><strong>Access:</strong> You can request a copy of your personal data</li>
            <li><strong>Rectification:</strong> You can correct inaccurate data</li>
            <li><strong>Erasure:</strong> You can request deletion of your data</li>
            <li><strong>Portability:</strong> You can request a copy of your data in a machine-readable format</li>
            <li><strong>Objection:</strong> You can object to processing of your data</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            7. Data Retention
          </h2>
          <p style={{ marginBottom: 16 }}>
            We retain your personal data for as long as your account is active or as needed to
            provide you services. Request logs and audit data are automatically cleaned up after
            30 days. You can request deletion of your account and all associated data at any time.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            8. Children's Privacy
          </h2>
          <p style={{ marginBottom: 16 }}>
            Our service is not intended for use by individuals under the age of 16. We do not
            knowingly collect personal information from children.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            9. Changes to This Policy
          </h2>
          <p style={{ marginBottom: 16 }}>
            We may update this Privacy Policy from time to time. We will notify you of any
            changes by posting the new Privacy Policy on this page and updating the "Last
            updated" date.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            10. Contact Us
          </h2>
          <p style={{ marginBottom: 16 }}>
            If you have any questions about this Privacy Policy or our data practices, please
            contact us through the GitHub repository or via email.
          </p>
        </section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid #30363d" }}>
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
