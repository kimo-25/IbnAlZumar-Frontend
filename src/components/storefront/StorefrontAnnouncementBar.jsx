import { Link } from 'react-router-dom'
import { Truck } from 'lucide-react'

export default function StorefrontAnnouncementBar() {
  return (
    <div className="border-b border-amber/20 bg-graphite-900 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6 sm:text-sm">
        <div className="flex items-center gap-2 font-medium">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-amber text-graphite-900">
            <Truck size={14} strokeWidth={2.5} />
          </span>
          <span>شحن مجاني للطلبات فوق 3000 جنيه</span>
        </div>

        <Link to="/checkout" className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-white/15">
          اطلب الآن
        </Link>
      </div>
    </div>
  )
}