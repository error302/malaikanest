import { Shield, Truck, CheckCircle, Lock } from 'lucide-react';

const TRUST_ITEMS = [
  { Icon: Shield, title: 'Safe Materials', sub: 'Tested quality essentials' },
  { Icon: Truck, title: 'Fast Delivery', sub: 'Across Kenya' },
  { Icon: CheckCircle, title: 'Parent Approved', sub: 'Trusted by families' },
  { Icon: Lock, title: 'Secure Checkout', sub: 'M-Pesa protected' },
];

export default function TrustBar() {
  return (
    <div className="w-full bg-[#F0E8DE] border-t border-[#D8C9B8]">
      <div className="max-w-[1380px] mx-auto px-6 lg:px-16 py-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {TRUST_ITEMS.map(({ Icon, title, sub }) => (
          <div key={title} className="flex items-center gap-3">
            <Icon className="w-5 h-5 text-[#C4704A] flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-[#2C1810] leading-tight">{title}</p>
              <p className="text-[11px] text-[#8A7060] leading-tight">{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
