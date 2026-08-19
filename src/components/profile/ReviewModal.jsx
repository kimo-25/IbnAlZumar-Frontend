import {
  useEffect,
  useState
} from 'react'

import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Send,
  Star
} from 'lucide-react'

export default function ReviewModal({
  isOpen,
  item,
  onClose,
  onSubmit
}) {
  const [rating, setRating] = useState(5)

  const [comment, setComment] = useState('')

  const [submitting, setSubmitting] =
    useState(false)

  const [status, setStatus] = useState({
    success: null,
    error: null
  })

  useEffect(() => {
    if (isOpen) {
      setRating(5)
      setComment('')
      setStatus({
        success: null,
        error: null
      })
    }
  }, [isOpen])

  if (!isOpen) {
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSubmitting(true)

    setStatus({
      success: null,
      error: null
    })

    try {
      await onSubmit({
        productId:
          item?.productId || item?.id,
        rating,
        comment
      })

      setStatus({
        success:
          'تم إرسال تقييمك بنجاح! شكراً لمشاركتك.',
        error: null
      })

      setTimeout(onClose, 1800)
    } catch (err) {
      setStatus({
        success: null,
        error:
          err.response?.data?.message ||
          err.message ||
          'تعذر إرسال التقييم حالياً.'
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-border relative"
      >
        <h3 className="text-lg font-bold text-ink mb-1">
          إضافة تقييم للمنتج
        </h3>

        <p className="text-xs text-ink-soft mb-4">
          المنتج:{' '}
          <span className="font-semibold text-ink">
            {item?.productName || item?.name}
          </span>
        </p>

        {status.success ? (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 size={18} />
            <span>{status.success}</span>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            {status.error && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{status.error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-ink mb-2">
                تقييمك بالنجوم:
              </label>

              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(
                  (star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() =>
                        setRating(star)
                      }
                      className="p-1 hover:scale-110 transition cursor-pointer"
                    >
                      <Star
                        size={24}
                        className={
                          star <= rating
                            ? 'fill-amber text-amber'
                            : 'text-border'
                        }
                      />
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                تعليقك / رأيك بالمنتج:
              </label>

              <textarea
                rows={3}
                disabled={submitting}
                value={comment}
                onChange={(e) =>
                  setComment(e.target.value)
                }
                className="w-full rounded-xl border border-border bg-canvas p-3 text-sm text-ink outline-none focus:border-amber transition resize-none disabled:opacity-60"
                placeholder="اكتب انطباعك عن جودة المنتج والتوصيل..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <Send size={16} />
              )}

              إرسال التقييم
            </button>
          </form>
        )}
      </div>
    </div>
  )
}