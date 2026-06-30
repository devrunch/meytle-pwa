export function TermsPage() {
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
          <span className="text-xs text-muted">Terms & Conditions</span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-heading mb-2">Terms & Conditions</h1>
          <p className="text-muted text-sm">Please read these terms carefully before using Meytle</p>
          <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted">
            <span>Operated by <strong className="text-body">ZEPHYR GROUP OF COMPANIES LIMITED</strong></span>
            <span>Effective Date: <strong className="text-body">15 May 2025</strong></span>
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-body leading-relaxed space-y-8">
          <Section title="1. Introduction & Acceptance">
            <p>These Terms and Conditions ("Terms") govern your access to and use of the Meytle platform, website, and mobile application (collectively, the "Platform") operated by ZEPHYR GROUP OF COMPANIES LIMITED, a company incorporated in New Zealand ("we", "us", or "our").</p>
            <p>By registering an account, browsing, or otherwise using the Platform, you agree to be legally bound by these Terms. If you do not agree, you must immediately discontinue use of the Platform.</p>
            <p>These Terms apply to all users including Clients (those seeking companion services) and Companions (those offering companion services). Where provisions apply specifically to one user type, this is stated explicitly.</p>
          </Section>

          <Section title="2. Definitions">
            <dl className="space-y-2">
              {[
                ['"Platform"', 'The Meytle website at meytle.com, mobile applications, and any related services.'],
                ['"Client"', 'Any registered user who searches for, browses, or books Companion services.'],
                ['"Companion"', 'Any registered user who lists, offers, or provides companion services through the Platform.'],
                ['"Listing"', 'Any service advertisement, profile, or offer posted by a Companion on the Platform.'],
                ['"Booking"', 'A confirmed arrangement between a Client and a Companion facilitated through the Platform.'],
                ['"Service Agreement"', 'The contract formed directly between a Client and a Companion upon a confirmed Booking.'],
                ['"Content"', 'Any text, images, videos, or other material uploaded or shared on the Platform.'],
              ].map(([term, def]) => (
                <div key={term} className="flex gap-2">
                  <dt className="font-semibold shrink-0">{term}</dt>
                  <dd className="text-muted">{def}</dd>
                </div>
              ))}
            </dl>
          </Section>

          <Section title="3. The Platform — Marketplace Only">
            <SubSection title="3.1 Nature of the Platform">
              Meytle is a technology marketplace platform that enables Clients and Companions to connect, communicate, and arrange companion services. Meytle is NOT a party to any Service Agreement between Clients and Companions.
            </SubSection>
            <SubSection title="3.2 No Employment or Agency Relationship">
              Nothing in these Terms creates an employment, agency, franchise, joint venture, or partnership relationship between Meytle and any Companion. Companions are independent service providers solely responsible for their own conduct, services, taxes, insurance, and legal compliance.
            </SubSection>
            <SubSection title="3.3 No Control Over Services">
              Meytle does not direct, supervise, control, or manage the services provided by Companions. We do not verify the accuracy of any Companion's descriptions, qualifications, or representations beyond basic identity verification (where offered).
            </SubSection>
          </Section>

          <Section title="4. Eligibility">
            <ul>
              <li>You must be at least 18 years of age to register or use the Platform in any capacity.</li>
              <li>By using the Platform, you represent and warrant that you are legally capable of entering into binding contracts in your jurisdiction.</li>
              <li>You must not use the Platform if doing so would violate any laws in your jurisdiction.</li>
              <li>Meytle reserves the right to refuse access or terminate any account at its sole discretion.</li>
            </ul>
          </Section>

          <Section title="5. Registration & Account Security">
            <SubSection title="5.1 Account Creation">
              You agree to provide accurate, current, and complete information when registering. You are responsible for maintaining the confidentiality of your login credentials.
            </SubSection>
            <SubSection title="5.2 Account Responsibility">
              You are solely responsible for all activity that occurs under your account. You must notify us immediately at <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a> if you suspect unauthorised access.
            </SubSection>
            <SubSection title="5.3 One Account Per Person">
              Each individual may maintain only one active account. Creating multiple accounts to circumvent bans or restrictions is prohibited.
            </SubSection>
          </Section>

          <Section title="6. Companion Obligations">
            <SubSection title="6.1 Accurate Listings">
              Companions must ensure all Listings are accurate, truthful, and not misleading. Misrepresentation of services, identity, or qualifications is grounds for immediate account termination.
            </SubSection>
            <SubSection title="6.2 Legal Compliance">
              Companions are solely responsible for ensuring that the services they offer and provide are lawful in the jurisdiction(s) where those services are delivered.
            </SubSection>
            <SubSection title="6.3 Tax Obligations">
              <p>Companions are solely responsible for all tax obligations arising from income earned through the Platform. This includes:</p>
              <ul>
                <li>New Zealand Goods and Services Tax (GST) where applicable;</li>
                <li>New Zealand income tax and any required filing with Inland Revenue (IRD);</li>
                <li>Any foreign income tax, withholding tax, VAT, or other fiscal obligation.</li>
              </ul>
              <p className="text-muted text-xs mt-2">Meytle does not withhold taxes on behalf of Companions and assumes no liability for any Companion's failure to meet tax obligations. Seek independent tax advice.</p>
            </SubSection>
            <SubSection title="6.4 Insurance">
              Companions are strongly advised to obtain appropriate professional liability, public liability, and/or personal accident insurance. The Platform provides no insurance coverage for Companions or their activities.
            </SubSection>
            <SubSection title="6.5 Prohibited Services">
              Companions must not offer, advertise, or provide any services that are illegal, sexually explicit, discriminatory, or otherwise in violation of these Terms or applicable law. Violations will result in immediate account suspension and may be reported to relevant authorities.
            </SubSection>
          </Section>

          <Section title="7. Client Obligations">
            <ul>
              <li>Clients must treat Companions with respect and dignity at all times.</li>
              <li>Clients must not request, solicit, or coerce Companions to provide services outside the scope of agreed Listings.</li>
              <li>Clients are responsible for verifying that any Booking they make complies with the laws of their jurisdiction.</li>
              <li>Clients must not engage in any harassment, abuse, threatening, or discriminatory conduct.</li>
              <li>Clients accept full responsibility for their conduct during any Booking or service interaction.</li>
            </ul>
          </Section>

          <Section title="8. Platform Liability Limitations">
            <SubSection title="8.1 No Warranty">
              THE PLATFORM IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. TO THE MAXIMUM EXTENT PERMITTED BY NEW ZEALAND LAW, ZEPHYR GROUP OF COMPANIES LIMITED EXPRESSLY DISCLAIMS ALL WARRANTIES, EXPRESS OR IMPLIED.
            </SubSection>
            <SubSection title="8.2 No Liability for User Actions">
              <p>Meytle is not responsible or liable for:</p>
              <ul>
                <li>The conduct, actions, or representations of any Client or Companion;</li>
                <li>The quality, safety, legality, or suitability of any services offered by Companions;</li>
                <li>Any physical, emotional, financial, or other harm arising from a Booking;</li>
                <li>Any disputes between Clients and Companions;</li>
                <li>Any Companion's failure to comply with tax, legal, or regulatory obligations.</li>
              </ul>
            </SubSection>
            <SubSection title="8.3 Limitation of Liability">
              To the maximum extent permitted by applicable law, ZEPHYR GROUP OF COMPANIES LIMITED's total aggregate liability shall not exceed the total fees paid by that user to Meytle in the three (3) months preceding the event, or NZD $100, whichever is greater.
            </SubSection>
            <SubSection title="8.4 Exclusion of Consequential Loss">
              In no event shall we be liable for any indirect, incidental, special, punitive, or consequential damages, including loss of profits, loss of data, or business interruption.
            </SubSection>
          </Section>

          <Section title="9. Indemnification">
            <p>You agree to defend, indemnify, and hold harmless ZEPHYR GROUP OF COMPANIES LIMITED, its directors, officers, employees, and agents from and against any claims, damages, losses, liabilities, costs, and expenses arising out of or related to:</p>
            <ul>
              <li>Your use of or access to the Platform;</li>
              <li>Your violation of these Terms or any applicable law;</li>
              <li>Any services you provide or receive through the Platform;</li>
              <li>Any Content you post on the Platform.</li>
            </ul>
          </Section>

          <Section title="10. Payments & Fees">
            <SubSection title="10.1 Platform Fees">
              Meytle may charge service fees to Clients, Companions, or both. Current fee structures are set out on the Platform and may be updated from time to time with reasonable notice.
            </SubSection>
            <SubSection title="10.2 Payment Processing">
              Payments may be processed by third-party payment providers. By making or receiving payments on the Platform, you agree to the terms of the applicable payment processor.
            </SubSection>
            <SubSection title="10.3 Refunds & Disputes">
              Meytle facilitates disputes between Clients and Companions in good faith but makes no guarantee of refunds. Refund eligibility is assessed on a case-by-case basis and is subject to our Refund Policy.
            </SubSection>
          </Section>

          <Section title="11. Prohibited Conduct">
            <p>Users must not, under any circumstances:</p>
            <ul>
              <li>Engage in or facilitate any illegal activity through the Platform;</li>
              <li>Post false, misleading, defamatory, or fraudulent content;</li>
              <li>Solicit or engage in any form of human trafficking, exploitation, or coercion;</li>
              <li>Use the Platform to arrange any sexually explicit services (where illegal);</li>
              <li>Attempt to circumvent Platform fees by taking transactions off-platform;</li>
              <li>Scrape, harvest, or collect user data without authorisation;</li>
              <li>Transmit malware, viruses, or other harmful code;</li>
              <li>Impersonate any person or entity;</li>
              <li>Harass, threaten, or abuse other users;</li>
              <li>Create fake reviews, ratings, or endorsements.</li>
            </ul>
          </Section>

          <Section title="12. Content & Intellectual Property">
            <SubSection title="12.1 Your Content">
              You retain ownership of Content you post but grant Meytle a worldwide, royalty-free, non-exclusive licence to use, reproduce, display, and distribute your Content solely to operate and promote the Platform.
            </SubSection>
            <SubSection title="12.2 Platform IP">
              All intellectual property in the Platform — including its name, logo, design, software, and content created by Meytle — is owned by ZEPHYR GROUP OF COMPANIES LIMITED. You may not reproduce, distribute, or create derivative works without express written permission.
            </SubSection>
          </Section>

          <Section title="13. Privacy">
            Your use of the Platform is also governed by our Privacy Policy, which forms part of these Terms. Please review our Privacy Policy at <a href="https://meytle.com/privacy" className="text-accent-green underline">meytle.com/privacy</a>.
          </Section>

          <Section title="14. Dispute Resolution">
            <SubSection title="14.1 Between Users">
              Meytle encourages Clients and Companions to resolve disputes directly. We may, at our discretion, provide mediation support but are not obligated to do so.
            </SubSection>
            <SubSection title="14.2 With the Platform">
              If you have a dispute with Meytle, please contact us first at <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a>. We will attempt to resolve disputes informally within 30 days.
            </SubSection>
            <SubSection title="14.3 Governing Law & Jurisdiction">
              These Terms are governed by the laws of New Zealand. You agree to submit to the non-exclusive jurisdiction of the New Zealand courts.
            </SubSection>
          </Section>

          <Section title="15. Termination">
            We may suspend or terminate your account at any time, with or without notice, for any violation of these Terms or conduct that we determine to be harmful. You may terminate your account at any time by contacting <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a>.
          </Section>

          <Section title="16. Modifications to Terms">
            We reserve the right to update these Terms at any time. We will notify users of material changes via email or a prominent notice on the Platform at least 14 days before changes take effect. Continued use after the effective date constitutes acceptance.
          </Section>

          <Section title="17. Contact Us">
            <div className="bg-surface-alt rounded-xl p-5 text-sm space-y-1">
              <p className="font-semibold text-heading">Meytle — Legal Department</p>
              <p className="text-muted">Operated by: ZEPHYR GROUP OF COMPANIES LIMITED</p>
              <p>Email: <a href="mailto:legal@meytle.com" className="text-accent-green underline">legal@meytle.com</a></p>
              <p>Website: <a href="https://meytle.com" className="text-accent-green underline">meytle.com</a></p>
            </div>
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
      <div className="space-y-3 text-sm text-body">{children}</div>
    </section>
  );
}

function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <h3 className="text-sm font-semibold text-heading mb-1">{title}</h3>
      <div className="text-sm text-body space-y-2">{children}</div>
    </div>
  );
}
