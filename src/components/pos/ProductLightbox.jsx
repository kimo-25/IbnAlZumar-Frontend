// File: src/components/pos/ProductLightbox.jsx
import { X } from 'lucide-react'

export default function ProductLightbox({ imageUrl, title, onClose }) {
  if (!imageUrl) return null

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      dir="rtl"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20 cursor-pointer"
        aria-label="إغلاق"
      >
        <X size={20} />
      </button>

      {title && (
        <span className="absolute top-4 right-4 max-w-[70%] truncate rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
          {title}
        </span>
      )}

      <img
        src={imageUrl}
        alt={title || 'صورة المنتج'}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
      />
    </div>
  )
}
