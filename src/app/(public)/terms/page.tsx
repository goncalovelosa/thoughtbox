import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 text-foreground leading-relaxed">{children}</div>
    </div>
  )
}

export default function TermsPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Terms of Service</h1>
        <p className="mt-3 text-sm text-foreground">Last updated: March 2026</p>

        <div className="mt-10 space-y-8 text-foreground">
          <Section title="1. Acceptance of terms">
            <p>
              By accessing or using Thoughtbox (&quot;the Service&quot;), you agree to be bound by
              these Terms of Service. If you do not agree, do not use the Service.
            </p>
          </Section>

          <Section title="2. Description of service">
            <p>
              Thoughtbox provides persistent external memory infrastructure for AI agents via the
              Model Context Protocol (MCP). The Service includes API access, a web dashboard, and
              related tooling.
            </p>
          </Section>

          <Section title="3. Account registration">
            <p>
              You must create an account to use the Service. You are responsible for maintaining the
              confidentiality of your credentials and for all activity under your account.
            </p>
          </Section>

          <Section title="4. API key security">
            <p>
              API keys are credentials that grant access to your workspace data. Keep them secret.
              Thoughtbox is not liable for unauthorized access resulting from key exposure. Revoke
              compromised keys immediately via the dashboard.
            </p>
          </Section>

          <Section title="5. Acceptable use">
            <p>
              You agree not to use the Service to store unlawful content, to attempt unauthorized
              access to other users&apos; data, to reverse-engineer the Service, or to interfere
              with its operation.
            </p>
          </Section>

          <Section title="6. Data and privacy">
            <p>
              Your use of the Service is also governed by our{' '}
              <a href="/privacy" className="text-foreground hover:underline-thick hover:underline">
                Privacy Policy
              </a>
              . You retain ownership of data you submit to the Service.
            </p>
          </Section>

          <Section title="7. Service availability">
            <p>
              We strive for high availability but do not guarantee uninterrupted access. Planned
              maintenance will be communicated in advance where feasible.
            </p>
          </Section>

          <Section title="8. Billing">
            <p>
              Paid plans are billed in advance. All fees are non-refundable except as required by
              law. We reserve the right to change pricing with 30 days&apos; notice.
            </p>
          </Section>

          <Section title="9. Termination">
            <p>
              We may terminate or suspend your account for violations of these Terms. You may cancel
              your account at any time from the billing settings page.
            </p>
          </Section>

          <Section title="10. Limitation of liability">
            <p>
              To the maximum extent permitted by law, Thoughtbox is not liable for indirect,
              incidental, or consequential damages arising from your use of the Service.
            </p>
          </Section>

          <Section title="11. Changes to terms">
            <p>
              We may update these Terms periodically. Continued use after changes constitutes
              acceptance. Material changes will be communicated by email.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              Questions about these Terms?{' '}
              <a href="mailto:legal@thoughtbox.dev" className="text-foreground hover:underline-thick hover:underline">
                legal@thoughtbox.dev
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
