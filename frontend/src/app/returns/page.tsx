export default function ReturnsPage() {
  return (
    <div className="pb-20 pt-10">
      <div className="container-shell">
        <header className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--text-secondary)]">Customer Care</p>
          <h1 className="font-display mt-2 text-[48px] text-[var(--text-primary)]">Order Support</h1>
          <p className="mt-3 max-w-3xl text-[18px] text-[var(--text-secondary)]">
            If there is any issue with your order, our team will review and assist quickly through our support channels.
          </p>
        </header>

        <div className="card-soft space-y-5 p-6 md:p-8">
          <section>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">When to contact support</h2>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">
              Reach out if an item arrives damaged, incorrect, incomplete, or if delivery needs urgent attention.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">What to include</h2>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">
              Share your order number, phone number used at checkout, and clear photos where applicable so we can resolve faster.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Resolution process</h2>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">
              Each case is reviewed by support and confirmed directly with you before next steps are completed.
            </p>
          </section>

          <section>
            <h2 className="text-[22px] font-semibold text-[var(--text-primary)]">Contact</h2>
            <p className="mt-2 text-[16px] text-[var(--text-secondary)]">Email: malaikanest7@gmail.com</p>
            <p className="text-[16px] text-[var(--text-secondary)]">Phone / WhatsApp: +254 726 771 321</p>
          </section>
        </div>
      </div>
    </div>
  )
}

