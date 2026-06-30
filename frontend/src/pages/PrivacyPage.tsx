export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <span className="font-extrabold text-heading tracking-tight">meytle</span>
          </a>
          <span className="text-xs text-muted">Privacy Policy</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-heading mb-2">Privacy Policy</h1>
          <p className="text-muted text-sm">How we collect, use, and protect your personal information</p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted">
            <span>Operated by <strong className="text-body">ZEPHYR GROUP OF COMPANIES LIMITED</strong></span>
            <span>Effective Date: <strong className="text-body">15 May 2025</strong></span>
          </div>
        </div>

        <div className="space-y-8 text-sm text-body leading-relaxed">
          <Section title="1. Overview">
            <p>Meytle (operated by ZEPHYR GROUP OF COMPANIES LIMITED) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, share, and protect personal information when you use the Meytle platform at meytle.com ("Platform"). It applies to all users globally, including New Zealand residents.</p>
            <p>This Policy is compliant with the New Zealand Privacy Act 2020 and, where applicable, the European Union General Data Protection Regulation (GDPR) and other relevant privacy laws.</p>
          </Section>

          <Section title="2. Information We Collect">
            <SubSection title="2.1 Information You Provide">
              <ul>
                <li>Account registration details (name, email address, date of birth, phone number);</li>
                <li>Profile information (photos, bio, location, availability, listed services);</li>
                <li>Identity verification documents (where required);</li>
                <li>Payment information (processed securely by third-party payment providers — we do not store full card details);</li>
                <li>Communications and messages sent through the Platform;</li>
                <li>Reviews, ratings, and feedback;</li>
                <li>Support requests and correspondence with us.</li>
              </ul>
            </SubSection>
            <SubSection title="2.2 Automatically Collected Information">
              <ul>
                <li>IP address, device identifiers, browser type, and operating system;</li>
                <li>Usage data including pages visited, features used, and session duration;</li>
                <li>Location data (where you permit this);</li>
                <li>Cookies and similar tracking technologies (see Section 8).</li>
              </ul>
            </SubSection>
            <SubSection title="2.3 From Third Parties">
              <ul>
                <li>Identity verification providers;</li>
                <li>Payment processors;</li>
                <li>Social login providers (if you choose to sign in via a third-party account).</li>
              </ul>
            </SubSection>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use your personal information for the following purposes:</p>
            <ul>
              <li>To create and manage your account;</li>
              <li>To facilitate connections between Clients and Companions;</li>
              <li>To process payments and transactions;</li>
              <li>To verify your identity and prevent fraud;</li>
              <li>To provide customer support;</li>
              <li>To send transactional notifications (booking confirmations, messages, etc.);</li>
              <li>To send marketing communications (with your consent where required);</li>
              <li>To improve and develop the Platform;</li>
              <li>To comply with our legal obligations;</li>
              <li>To enforce our Terms and Conditions and investigate policy violations;</li>
              <li>To protect the safety and security of users and the Platform.</li>
            </ul>
          </Section>

          <Section title="4. Legal Bases for Processing (GDPR)">
            <p>For users in the European Economic Area (EEA) and United Kingdom, we process personal data on the following legal bases:</p>
            <ul>
              <li><strong>Contract:</strong> Processing necessary to fulfil your account and booking arrangements;</li>
              <li><strong>Legitimate Interests:</strong> Platform security, fraud prevention, and service improvement;</li>
              <li><strong>Legal Obligation:</strong> Where required by applicable law;</li>
              <li><strong>Consent:</strong> For optional communications and non-essential cookies.</li>
            </ul>
          </Section>

          <Section title="5. Sharing Your Information">
            <SubSection title="5.1 With Other Users">
              Profile information you make public (such as your display name, profile photo, bio, and listed services) is visible to other users of the Platform.
            </SubSection>
            <SubSection title="5.2 With Service Providers">
              We share information with trusted third-party service providers who help us operate the Platform, including payment processors, cloud hosting providers, identity verification services, and analytics providers. These providers are contractually bound to protect your information.
            </SubSection>
            <SubSection title="5.3 Legal Requirements">
              We may disclose your information where required by law, court order, or government authority, including New Zealand law enforcement agencies.
            </SubSection>
            <SubSection title="5.4 Business Transfers">
              In the event of a merger, acquisition, or sale of all or part of our business, your information may be transferred to the relevant third party, subject to equivalent privacy protections.
            </SubSection>
            <SubSection title="5.5 We Do Not Sell Your Data">
              <strong>We do not sell, rent, or trade your personal information to third parties for their marketing purposes.</strong>
            </SubSection>
          </Section>

          <Section title="6. International Data Transfers">
            <p>As a global platform based in New Zealand, your information may be processed or stored in countries other than your country of residence. We take steps to ensure that any cross-border transfers comply with applicable privacy laws and that appropriate safeguards are in place.</p>
            <p>For transfers from the EEA, we rely on Standard Contractual Clauses or other approved transfer mechanisms.</p>
          </Section>

          <Section title="7. Data Retention">
            <p>We retain your personal information for as long as your account is active or as necessary to provide the Platform and fulfil the purposes described in this Policy. We also retain data as required by law (e.g., for tax, legal, and regulatory purposes).</p>
            <p>When you request account deletion, we will delete or anonymise your personal data within 30 days, except where retention is required by law.</p>
          </Section>

          <Section title="8. Cookies & Tracking">
            <p>We use cookies and similar technologies to:</p>
            <ul>
              <li>Maintain your login session;</li>
              <li>Remember your preferences;</li>
              <li>Analyse Platform usage and performance;</li>
              <li>Deliver relevant advertising (where applicable).</li>
            </ul>
            <p className="text-muted text-xs mt-2">You may control cookie preferences through your browser settings. Note that disabling certain cookies may affect Platform functionality.</p>
          </Section>

          <Section title="9. Your Privacy Rights">
            <SubSection title="9.1 New Zealand Residents (Privacy Act 2020)">
              You have the right to request access to, and correction of, any personal information we hold about you. To make a request, contact us at <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a>.
            </SubSection>
            <SubSection title="9.2 EEA/UK Residents (GDPR/UK GDPR)">
              <p>In addition to the above, you may have the right to:</p>
              <ul>
                <li>Erasure ('right to be forgotten') subject to legal obligations;</li>
                <li>Restriction of processing;</li>
                <li>Data portability;</li>
                <li>Object to processing based on legitimate interests;</li>
                <li>Withdraw consent at any time;</li>
                <li>Lodge a complaint with your local data protection authority.</li>
              </ul>
            </SubSection>
            <SubSection title="9.3 California Residents (CCPA)">
              California residents may have additional rights including the right to know, delete, and opt-out of sale of personal information. Contact us at <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a> to exercise these rights.
            </SubSection>
          </Section>

          <Section title="10. Data Security">
            <p>We implement industry-standard technical and organisational security measures including encryption in transit (TLS), encryption at rest, access controls, and regular security assessments.</p>
            <p>However, no online platform is completely secure. You use the Platform at your own risk and are responsible for maintaining the security of your account credentials.</p>
            <p>In the event of a data breach that is likely to cause serious harm, we will notify affected users and relevant authorities in accordance with the New Zealand Privacy Act 2020 and other applicable laws.</p>
          </Section>

          <Section title="11. Children's Privacy">
            The Platform is strictly for users aged 18 and over. We do not knowingly collect personal information from anyone under 18. If you believe a minor has registered on the Platform, please contact us at <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a>.
          </Section>

          <Section title="12. Third-Party Links">
            The Platform may contain links to third-party websites or services. This Privacy Policy does not apply to those third-party services. We encourage you to review the privacy policies of any third-party services you access.
          </Section>

          <Section title="13. Companion-Specific Privacy Notice">
            <p>As a Companion, certain information you provide (including your profile, service listings, location, and availability) is made publicly visible to Clients. You control what information you include in your public profile.</p>
            <p>Please be aware that any personal information you voluntarily share with Clients during bookings or communications is at your own discretion and risk. Meytle is not responsible for how Clients use information you share with them directly.</p>
          </Section>

          <Section title="14. Changes to This Policy">
            We may update this Privacy Policy from time to time. We will notify you of material changes by email or through a prominent notice on the Platform. Continued use of the Platform after changes take effect constitutes your acceptance of the updated Policy.
          </Section>

          <Section title="15. Contact & Complaints">
            <div className="bg-surface-alt rounded-xl p-5 space-y-1">
              <p className="font-semibold text-heading">Privacy Officer — Meytle</p>
              <p className="text-muted">ZEPHYR GROUP OF COMPANIES LIMITED</p>
              <p>Email: <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a></p>
              <p>Website: <a href="https://meytle.com" className="text-accent-green underline">meytle.com</a></p>
            </div>
            <p className="mt-3 text-xs text-muted">New Zealand residents also have the right to lodge a complaint with the Office of the Privacy Commissioner at <a href="https://www.privacy.org.nz" className="text-accent-green underline" target="_blank" rel="noopener noreferrer">www.privacy.org.nz</a>.</p>
          </Section>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border mt-12 py-6">
        <p className="text-center text-xs text-muted">© 2025 ZEPHYR GROUP OF COMPANIES LIMITED — Trading as Meytle</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-base font-bold text-heading mb-3 pb-2 border-b border-border">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-heading mb-1">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
