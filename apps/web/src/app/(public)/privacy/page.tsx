import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <div className="mt-2 leading-relaxed text-foreground">{children}</div>
    </div>
  )
}

export default function PrivacyPage() {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-extrabold tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-3 text-sm text-foreground">Last updated: March 2026</p>

        <div className="mt-10 space-y-8">
          <Section title="1. What we collect">
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>Account information: name, email address, password (hashed)</li>
              <li>Workspace data: projects, thoughts, knowledge graph entries you create</li>
              <li>Usage data: API request counts, run metadata, timestamps</li>
              <li>Billing data: managed via Stripe; we do not store raw card numbers</li>
              <li>Log data: IP addresses, browser type, pages visited (standard server logs)</li>
            </ul>
          </Section>

          <Section title="2. How we use your data">
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>To provide and improve the Service</li>
              <li>To process billing and send receipts</li>
              <li>To send transactional emails (password reset, key alerts)</li>
              <li>To detect and prevent abuse</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell your data to third parties.</p>
          </Section>

          <Section title="3. Data storage and retention">
            <p>
              Workspace data is stored in Supabase (Postgres) hosted on Google Cloud. Thought and
              run data is retained according to your plan tier. Free plan: 30 days. Pro: 1 year.
              Enterprise: configurable.
            </p>
          </Section>

          <Section title="4. Data security">
            <p>
              We use TLS for data in transit and encryption at rest via GCP default storage
              encryption. API keys are stored as bcrypt hashes — only you can see the plaintext
              key at creation time.
            </p>
          </Section>

          <Section title="5. Third-party services">
            <p>We use the following sub-processors:</p>
            <ul className="mt-2 list-inside list-disc space-y-1">
              <li>
                <strong>Supabase</strong> — database and authentication
              </li>
              <li>
                <strong>Google Cloud Platform</strong> — compute and storage
              </li>
              <li>
                <strong>Stripe</strong> — payment processing
              </li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use session cookies for authentication and minimal analytics cookies to measure
              page traffic. We do not use cross-site tracking cookies.
            </p>
          </Section>

          <Section title="7. Your rights">
            <p>
              You may request access to, correction of, or deletion of your personal data at any
              time by emailing{' '}
              <a href="mailto:privacy@thoughtbox.dev" className="text-foreground hover:underline-thick hover:underline">
                privacy@thoughtbox.dev
              </a>
              . Account deletion removes all personally identifiable information within 30 days.
            </p>
          </Section>

          <Section title="8. Children">
            <p>
              The Service is not directed at children under 13. We do not knowingly collect data
              from children under 13.
            </p>
          </Section>

          <Section title="9. Changes to this policy">
            <p>
              We may update this Privacy Policy periodically. Material changes will be communicated
              via email at least 14 days before taking effect.
            </p>
          </Section>

          <Section title="10. Contact">
            <p>
              Privacy questions:{' '}
              <a href="mailto:privacy@thoughtbox.dev" className="text-foreground hover:underline-thick hover:underline">
                privacy@thoughtbox.dev
              </a>
            </p>
          </Section>
        </div>
      </div>
    </div>
  )
}
