const ICONS: Record<string, React.ReactNode> = {
  certificate: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  location: <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>,
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  people: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>,
}

export function UspBar({ items }: { items: { label: string; icon: string }[] }) {
  return (
    <div className="px-18 border-b" style={{ background: 'var(--gray-bg, #F0F3F7)', borderColor: '#DDE4ED' }}>
      <div className="max-w-6xl mx-auto flex items-stretch">
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3.5 py-5 flex-1"
            style={{
              paddingRight: i < items.length - 1 ? '40px' : 0,
              marginRight: i < items.length - 1 ? '40px' : 0,
              borderRight: i < items.length - 1 ? '1px solid #DDE4ED' : 'none'
            }}>
            <div className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded"
              style={{ background: 'var(--navy)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                stroke="#00C4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                {ICONS[item.icon] ?? ICONS.certificate}
              </svg>
            </div>
            <strong className="block text-[13px] font-semibold" style={{ color: 'var(--navy)' }}>
              {item.label}
            </strong>
          </div>
        ))}
      </div>
    </div>
  )
}
