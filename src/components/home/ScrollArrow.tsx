'use client'

export function ScrollArrow() {
  return (
    <button
      onClick={() => document.getElementById('kommande-kurser')?.scrollIntoView({ behavior: 'smooth' })}
      className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer group"
      aria-label="Scrolla ner"
    >
      <span className="text-[10px] font-bold tracking-[0.15em] uppercase"
        style={{ color: 'rgba(255,255,255,0.35)' }}>
        Utforska
      </span>
      <svg
        width="20" height="20" viewBox="0 0 20 20" fill="none"
        stroke="rgba(255,255,255,0.5)" strokeWidth="2"
        className="animate-bounce-slow group-hover:stroke-white transition-colors"
      >
        <path d="M4 7l6 6 6-6" />
      </svg>
    </button>
  )
}
