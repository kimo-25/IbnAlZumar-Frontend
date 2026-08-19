import { Check, Ban, Loader2 } from 'lucide-react'
import { TRACKING_STEPS } from '../../utils/customerProfileHelpers'

export default function TrackingProgress({
  currentStep,
  onCancel,
  isCanceling
}) {
  if (currentStep === -1) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs sm:text-sm text-rose-700 flex items-center justify-between">
        <span>تم إلغاء هذا الطلب. إذا كان لديك أي استفسار يرجى التواصل مع الدعم الفني.</span>
      </div>
    )
  }

  const stepsList = TRACKING_STEPS || []
  const totalSteps = stepsList.length > 1 ? stepsList.length - 1 : 1

  const progressPercentage = Math.max(
    0,
    Math.min(
      100,
      ((currentStep - 1) / totalSteps) * 100
    )
  )

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between mb-5">
        <span className="text-xs sm:text-sm font-bold text-ink">
          تتبع مراحل الشحنة
        </span>

        {currentStep === 1 && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isCanceling}
            className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isCanceling ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              <Ban size={14} />
            )}
            إلغاء الطلب
          </button>
        )}
      </div>

      <div className="relative py-2">
        {/* Progress Bar Line */}
        <div className="absolute top-4 right-6 left-6 h-0.5 bg-border -z-0">
          <div
            className="h-full bg-emerald-600 transition-all duration-500 ease-out"
            style={{
              width: `${progressPercentage}%`
            }}
          />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-5 gap-1 text-center relative z-10">
          {stepsList.map((s) => {
            const isCompleted = currentStep >= s.step
            const isCurrent = currentStep === s.step

            return (
              <div
                key={s.step}
                className="flex flex-col items-center"
              >
                <div
                  className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-surface text-ink-soft border border-border'
                  } ${
                    isCurrent
                      ? 'ring-4 ring-emerald-100 border-emerald-600 scale-105'
                      : ''
                  }`}
                >
                  {isCompleted ? (
                    <Check size={16} />
                  ) : (
                    s.step
                  )}
                </div>

                <span
                  className={`mt-2 text-[10px] sm:text-[11px] leading-tight ${
                    isCompleted
                      ? 'text-emerald-700 font-bold'
                      : 'text-ink-soft'
                  }`}
                >
                  {s.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}