import Link from 'next/link'

interface Category {
  name: string
  courseTemplateId: number
  description?: string
}

interface Props {
  heading?: string
  categories: Category[]
}

export function CourseCategories({ heading, categories }: Props) {
  return (
    <section className="py-24 px-18" style={{ background: 'var(--navy)' }}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5 text-[11px] font-bold tracking-[0.12em] uppercase text-[#00C4FF] mb-3">
          <span className="block w-6 h-0.5 bg-[#00C4FF]" />
          Utbildningar
        </div>
        <h2 className="font-condensed font-bold uppercase leading-none tracking-tight text-white mb-12"
          style={{ fontSize: 'clamp(36px, 4vw, 52px)' }}>
          {heading ?? 'Våra utbildningsområden'}
        </h2>

        <div className="grid grid-cols-4 gap-4">
          {categories.map((cat, i) => (
            <CategoryCard key={cat.name} cat={cat} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CategoryCard({ cat, index }: { cat: { name: string; courseTemplateId: number; description?: string }; index: number }) {
  return (
    <Link
      href={cat.courseTemplateId ? `/kurser?category=${encodeURIComponent(cat.name)}` : '/kurser'}
      className="block p-7 rounded-lg transition-all hover:-translate-y-0.5 group"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="text-[11px] font-bold tracking-[0.1em] uppercase mb-4 opacity-70 text-[#00C4FF]">
        {String(index + 1).padStart(2, '0')}
      </div>
      <div className="font-condensed font-bold text-[22px] uppercase text-white leading-tight tracking-wide mb-2.5">
        {cat.name}
      </div>
      {cat.description && (
        <div className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>
          {cat.description}
        </div>
      )}
      <div className="mt-5 text-[11px] font-bold tracking-widest uppercase text-[#00C4FF] opacity-70">
        Läs mer →
      </div>
    </Link>
  )
}
