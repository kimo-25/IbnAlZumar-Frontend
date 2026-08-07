import { getImageUrl } from '../../utils/imageHelper'

export default function ProductImageGallery({ images = [], activeImage, onSelect }) {
  const safeImages = images.filter(Boolean)
  const mainImage = activeImage || safeImages[0]

  return (
    <div className="space-y-3">
      <div className="group overflow-hidden rounded-2xl border border-border bg-surface shadow-subtle">
        <div className="overflow-hidden">
          <img
            src={getImageUrl(mainImage)}
            alt="صورة المنتج الرئيسية"
            className="aspect-square w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
          />
        </div>
      </div>

      {safeImages.length > 1 && (
        <div className="grid grid-cols-4 gap-3">
          {safeImages.slice(0, 8).map((image, index) => {
            const isActive = image === mainImage
            return (
              <button
                key={`${image}-${index}`}
                onClick={() => onSelect?.(image)}
                className={`overflow-hidden rounded-xl border transition ${
                  isActive ? 'border-amber ring-2 ring-amber/20' : 'border-border hover:border-amber/50'
                }`}
                aria-label={`عرض الصورة ${index + 1}`}
              >
                <img src={getImageUrl(image)} alt="صورة مصغرة للمنتج" className="aspect-square w-full object-cover" />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}