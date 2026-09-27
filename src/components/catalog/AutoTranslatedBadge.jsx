// File: src/components/catalog/AutoTranslatedBadge.jsx
import { useState } from 'react'
import { Languages, Loader2, RefreshCw, AlertCircle } from 'lucide-react'
import { translateProductNow, translateCategoryNow } from '../../api/translationApi'

/**
 * Drop into any product or category edit form, next to the Name/NameAr fields.
 *
 * Props:
 *  - entityType: 'product' | 'category'
 *  - entityId: number
 *  - isAutoTranslated: current IsAutoTranslated flag from the loaded entity
 *  - onTranslated(result): called with the TranslationResultDto after a successful call, so the
 *    parent form can refresh its Name/NameAr inputs from result.name / result.nameAr.
 */
export default function AutoTranslatedBadge({ entityType, entityId, isAutoTranslated, onTranslated }) {
  const [translating, setTranslating] = useState(false)
  const [error, setError] = useState(null)

  async function handleTranslateNow(overwrite) {
    setTranslating(true)
    setError(null)
    try {
      const translateFn = entityType === 'category' ? translateCategoryNow : translateProductNow
      const result = await translateFn(entityId, overwrite)
      if (!result.translationApplied) {
        setError(result.message || 'تعذر تنفيذ الترجمة.')
      }
      onTranslated?.(result)
    } catch (err) {
      setError(err?.message || 'تعذر الاتصال بخدمة الترجمة.')
    } finally {
      setTranslating(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2" dir="rtl">
      {isAutoTranslated && (
        <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
          <Languages size={12} />
          مُترجم تلقائياً
        </span>
      )}

      <button
        type="button"
        onClick={() => handleTranslateNow(false)}
        disabled={translating}
        title="يملأ الحقل الفارغ فقط (عربي أو إنجليزي) دون التأثير على أي نص أدخله مستخدم بشرياً"
        className="inline-flex items-center gap-1.5 rounded-full border border-border bg-canvas px-2.5 py-1 text-[11px] font-bold text-ink-soft transition hover:bg-surface disabled:opacity-50 cursor-pointer"
      >
        {translating ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
        ترجمة الحقل الفارغ
      </button>

      <button
        type="button"
        onClick={() => handleTranslateNow(true)}
        disabled={translating}
        title="يستبدل كلا الحقلين بترجمة جديدة، حتى لو كانا معبّأين بالفعل"
        className="inline-flex items-center gap-1.5 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-1 text-[11px] font-bold text-amber-dark transition hover:bg-amber/20 disabled:opacity-50 cursor-pointer"
      >
        {translating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
        إعادة ترجمة الكل
      </button>

      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
          <AlertCircle size={12} />
          {error}
        </span>
      )}
    </div>
  )
}
