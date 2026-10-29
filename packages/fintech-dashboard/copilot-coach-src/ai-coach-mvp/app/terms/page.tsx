import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'The terms and conditions governing your use of AI CopilotCoach, the AI-powered developer coaching service.',
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: "#8b949e", marginBottom: 32 }}>
          Last updated: {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
        </p>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            1. Acceptance of Terms
          </h2>
          <p style={{ marginBottom: 16 }}>
            By accessing and using AI CopilotCoach, you accept and agree to be bound by the
            terms and provisions of this agreement. If you do not agree to abide by these
            terms, please do not use this service.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            2. Description of Service
          </h2>
          <p style={{ marginBottom: 16 }}>
            AI CopilotCoach is an AI-powered coding assistance platform that provides code
            reviews, coaching, and feedback to help developers improve their coding skills.
            The service uses artificial intelligence and may not always provide accurate
            or optimal advice.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            3. User Accounts
          </h2>
          <p style={{ marginBottom: 16 }}>
            To use our service, you must sign in using your GitHub account. By using GitHub
            OAuth, you authorize us to access certain basic information from your GitHub profile.
            You are responsible for maintaining the confidentiality of your account and for
            all activities that occur under your account.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            4. Acceptable Use
          </h2>
          <p style={{ marginBottom: 16 }}>
            You agree to use our service only for lawful purposes and in accordance with these
            Terms. You agree NOT to:
          </p>
          <ul style={{ paddingLeft: 24, marginBottom: 16 }}>
            <li>Use the service for any illegal or unauthorized purpose</li>
            <li>Attempt to gain unauthorized access to our systems or networks</li>
            <li>Use the service to generate harmful, malicious, or illegal content</li>
            <li>Interfere with or disrupt the service or servers</li>
            <li>Reverse engineer, decompile, or attempt to derive the source code</li>
            <li>Use automated systems to access the service without permission</li>
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            5. Intellectual Property
          </h2>
          <p style={{ marginBottom: 16 }}>
            <strong>Your Content:</strong> You retain ownership of any code, data, or content
            you submit to the service. By submitting content, you grant us a license to use,
            store, and process your content solely for the purpose of providing our services.
          </p>
          <p style={{ marginBottom: 16 }}>
            <strong>Our Content:</strong> The service, including its design, logos, trademarks,
            and underlying technology, are owned by us and are protected by intellectual
            property laws.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            6. AI Service Disclaimer
          </h2>
          <p style={{ marginBottom: 16 }}>
            AI CopilotCoach uses artificial intelligence to provide coding assistance. While we
            strive for accuracy, we cannot guarantee that the AI's suggestions, reviews, or
            feedback will be correct, optimal, or free of errors. You should always verify
            any code suggestions before implementing them in production systems.
          </p>
          <p style={{ marginBottom: 16 }}>
            We are not responsible for any damages, losses, or costs resulting from your use
            of the AI service, including but not limited to code defects, security vulnerabilities,
            or business losses.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            7. Limitation of Liability
          </h2>
          <p style={{ marginBottom: 16 }}>
            To the maximum extent permitted by law, AI CopilotCoach shall not be liable for
            any indirect, incidental, special, consequential, or punitive damages, or any loss
            of profits or revenues, whether incurred directly or indirectly, or any loss of
            data, use, goodwill, or other intangible losses resulting from your use of the service.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            8. Termination
          </h2>
          <p style={{ marginBottom: 16 }}>
            We may terminate or suspend your account and access to the service immediately,
            without prior notice or liability, for any reason, including breach of these Terms.
            Upon termination, your right to use the service will cease immediately.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            9. Changes to Terms
          </h2>
          <p style={{ marginBottom: 16 }}>
            We reserve the right to modify or replace these Terms at any time. If a revision is
            material, we will provide notice prior to any new terms taking effect. Your continued
            use of the service after such changes constitutes acceptance of the new Terms.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            10. Governing Law
          </h2>
          <p style={{ marginBottom: 16 }}>
            These Terms shall be governed by and construed in accordance with applicable laws,
            without regard to conflict of law principles.
          </p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, color: "#ffffff", marginBottom: 16 }}>
            11. Contact Information
          </h2>
          <p style={{ marginBottom: 16 }}>
            If you have any questions about these Terms, please contact us through the GitHub
            repository.
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
