export default function TrustBar() {
  const items = [
    { icon: '🌿', title: 'Safe Materials', sub: 'Tested quality essentials' },
    { icon: '🚚', title: 'Fast Delivery', sub: 'Across Kenya' },
    { icon: '✅', title: 'Parent Approved', sub: 'Trusted by families' },
    { icon: '🔒', title: 'Secure Checkout', sub: 'M-Pesa protected' },
  ];

  return (
    <div className="w-full bg-[#F0E8DE] border-t border-[#D8C9B8]">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-16 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3"
          >
            <span className="text-xl flex-shrink-0">{item.icon}</span>
            <div>
              <p className="text-xs font-semibold text-[#2C1810] leading-tight">{item.title}</p>
              <p className="text-[11px] text-[#8A7060] leading-tight">{item.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
