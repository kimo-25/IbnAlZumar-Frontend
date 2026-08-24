// File: src/utils/mediaUrl.js
import { getApiBaseUrl } from './imageHelper'

// Frontend is static-hosted on GitHub Pages and has no relationship to the
// API's domain. If the backend ever returns a relative path like
// "/uploads/maintenance/file.png" instead of a full URL, the browser would
// resolve it against the GitHub Pages origin and 404. This guarantees an
// absolute URL pointing at the API host either way.
function getApiOrigin() {
  const base = getApiBaseUrl() || ''
  try {
    return new URL(base).origin
  } catch {
    // Fallback: strip a trailing /api (or /api/) segment if URL parsing fails.
    return base.replace(/\/api\/?$/i, '')
  }
}

/**
 * يحوّل أي قيمة (مسار نسبي أو رابط مطلق قديم) إلى رابط كامل ومضمون يعتمد
 * دائماً على الـ API Origin الحالي والصحيح.
 *
 * السبب: بعض الطلبات القديمة كانت مخزّنة في قاعدة البيانات بروابط مطلقة
 * (https://host-قديم-أو-خاطئ/uploads/...) تم بناؤها وقت الرفع اعتماداً على
 * Request.Host، والذي قد يختلف بين البيئات (Dev/Prod) أو خلف أي reverse
 * proxy. لو اكتفينا بإرجاع الرابط المطلق كما هو، هيفضل يعطي 404 للأبد حتى
 * لو الملف موجود فعلياً على السيرفر الصحيح.
 *
 * الحل: نستخرج الـ path بس من القيمة المخزّنة (سواء كانت رابط مطلق أو
 * مسار نسبي)، ونعيد بناء الرابط دائماً فوق الـ Origin الحالي والصحيح
 * للـ API. هذا يصلّح الحالتين معاً: الروابط الجديدة (نسبية) والقديمة
 * (مطلقة بـ Host قديم/خاطئ)، طالما الملف فعلاً موجود بنفس المسار على
 * السيرفر الحالي.
 */
export function toAbsoluteMediaUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (!trimmed) return null

  // Data URIs (صور base64) تُرجع كما هي، لا علاقة لها بأي Host.
  if (trimmed.startsWith('data:')) return trimmed

  const origin = getApiOrigin().replace(/\/+$/, '')

  let path
  if (/^https?:\/\//i.test(trimmed)) {
    // رابط مطلق (قديم أو جديد) — نستخرج الـ path فقط ونتجاهل الـ Host المخزّن.
    try {
      const parsed = new URL(trimmed)
      path = `${parsed.pathname}${parsed.search || ''}`
    } catch {
      path = trimmed
    }
  } else if (trimmed.startsWith('//')) {
    // رابط protocol-relative
    try {
      const parsed = new URL(`https:${trimmed}`)
      path = `${parsed.pathname}${parsed.search || ''}`
    } catch {
      path = trimmed
    }
  } else {
    // مسار نسبي عادي
    path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }

  return `${origin}${path}`
}

/**
 * يقرأ رابط صورة طلب صيانة من الكائن القادم من الـ API، مع تغطية كل
 * الأسماء المحتملة للحقل (حسب الـ endpoint: القائمة أو تفاصيل الطلب)
 * بدل الاعتماد على اسم واحد فقط قد يختلف بين الاستجابات.
 */
export function resolveMaintenanceImageUrl(request) {
  if (!request) return null
  const raw =
    request.imageUrl ??
    request.ImageUrl ??
    request.image ??
    request.Image ??
    request.imagePath ??
    request.ImagePath ??
    null
  return toAbsoluteMediaUrl(raw)
}