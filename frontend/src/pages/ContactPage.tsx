export function ContactPage() {
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
          <span className="text-xs text-muted">Contact</span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-extrabold text-heading mb-4">Contact Us</h1>
        <p className="text-muted text-sm mb-10">We'd love to hear from you. Reach out for support, partnerships, or general enquiries.</p>

        <div className="space-y-6">
          <div className="bg-surface-alt rounded-2xl p-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-heading uppercase tracking-wider mb-1">General Enquiries</p>
              <a href="mailto:hello@meytle.com" className="text-[#2563EB] underline text-sm">hello@meytle.com</a>
            </div>
            <div>
              <p className="text-xs font-bold text-heading uppercase tracking-wider mb-1">Support</p>
              <a href="mailto:support@meytle.com" className="text-[#2563EB] underline text-sm">support@meytle.com</a>
            </div>
            <div>
              <p className="text-xs font-bold text-heading uppercase tracking-wider mb-1">Legal & Privacy</p>
              <a href="mailto:legal@meytle.com" className="text-[#2563EB] underline text-sm">legal@meytle.com</a>
            </div>
            <div>
              <p className="text-xs font-bold text-heading uppercase tracking-wider mb-1">Partnerships</p>
              <a href="mailto:partnerships@meytle.com" className="text-[#2563EB] underline text-sm">partnerships@meytle.com</a>
            </div>
          </div>

          <div className="bg-surface-alt rounded-2xl p-6">
            <p className="text-xs font-bold text-heading uppercase tracking-wider mb-2">Registered Office</p>
            <p className="text-sm text-muted">ZEPHYR GROUP OF COMPANIES LIMITED<br />New Zealand</p>
          </div>

          <p className="text-xs text-muted">We aim to respond to all enquiries within 2 business days.</p>
        </div>
      </div>

      <div className="border-t border-border mt-12 py-6">
        <p className="text-center text-xs text-muted">© 2025 ZEPHYR GROUP OF COMPANIES LIMITED — Trading as Meytle</p>
      </div>
    </div>
  );
}
