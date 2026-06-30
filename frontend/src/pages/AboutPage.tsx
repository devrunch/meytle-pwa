export function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center">
              <span className="text-white font-black text-sm">M</span>
            </div>
            <span className="font-extrabold text-heading tracking-tight">meytle</span>
          </a>
          <span className="text-xs text-muted">About</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold text-heading mb-4">About Meytle</h1>
        <p className="text-lg text-muted mb-10">Meaningful companionship for every experience.</p>

        <div className="space-y-8 text-sm text-body leading-relaxed">
          <section>
            <h2 className="text-base font-bold text-heading mb-3">What is Meytle?</h2>
            <p>Meytle is a platform that connects people with professional companions for social experiences, outings, events, and everyday activities. Whether you need someone to explore a new city with, attend an event, or simply share a meal, Meytle makes it easy to find the right companion for the moment.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-heading mb-3">Our Mission</h2>
            <p>We believe that meaningful human connection should be accessible to everyone. Our mission is to reduce social isolation, support independence, and create opportunities for genuine experiences — one booking at a time.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-heading mb-3">Safety & Trust</h2>
            <p>Every companion on Meytle goes through an onboarding process including identity verification and agreement to our Companion Standards. We are committed to maintaining a safe, respectful, and professional environment for both clients and companions.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-heading mb-3">Who Operates Meytle?</h2>
            <p>Meytle is operated by <strong>ZEPHYR GROUP OF COMPANIES LIMITED</strong>, a company registered in New Zealand. We are building Meytle to be a global platform rooted in trust, transparency, and real human value.</p>
          </section>

          <section>
            <h2 className="text-base font-bold text-heading mb-3">Get in Touch</h2>
            <p>Questions, feedback, or partnership enquiries? Reach us at <a href="mailto:hello@meytle.com" className="text-[#2563EB] underline">hello@meytle.com</a>.</p>
          </section>
        </div>
      </div>

      <div className="border-t border-border mt-12 py-6">
        <p className="text-center text-xs text-muted">© 2025 ZEPHYR GROUP OF COMPANIES LIMITED — Trading as Meytle</p>
      </div>
    </div>
  );
}
