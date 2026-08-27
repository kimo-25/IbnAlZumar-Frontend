// File: src/utils/mediaUrl.js
import { getApiBaseUrl } from './imageHelper'

function getApiOrigin() {
  const base = getApiBaseUrl() || ''
  try {
    return new URL(base).origin
  } catch {
    return base.replace(/\/api\/?$/i, '')
  }
}

/**
 * يحوّل أي قيمة إلى رابط مطلق مع تصحيح المسار لضمان توجيهه لمجلد الشحن/الصيانة
 */
export function toAbsoluteMediaUrl(url) {
  if (!url) return null
  const trimmed = String(url).trim()
  if (!trimmed) return null

  if (trimmed.startsWith('data:')) return trimmed

  const origin = getApiOrigin().replace(/\/+$/, '')

  let path
  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed)
      path = `${parsed.pathname}${parsed.search || ''}`
    } catch {
      path = trimmed
    }
  } else if (trimmed.startsWith('//')) {
    try {
      const parsed = new URL(`https:${trimmed}`)
      path = `${parsed.pathname}${parsed.search || ''}`
    } catch {
      path = trimmed
    }
  } else {
    path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  }

  // ================= Fix Core: تصحيح المسار لو كان ينقصه /uploads =================
  if (!path.startsWith('/uploads/')) {
    // لو المسار عبارة عن اسم صورة مباشرة أو بدون /uploads/
    const cleanFileName = path.startsWith('/') ? path.slice(1) : path
    path = `/uploads/maintenance/${cleanFileName}`
  }

  return `${origin}${path}`
}

/**
 * يقرأ رابط صورة واحدة (أول صورة) من الكائن القادم من الـ API.
 * محتفظ بيها لأي استخدام قديم/مكان لسه محتاج صورة واحدة فقط.
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

/**
 * يقرأ كل صور طلب الصيانة (مصفوفة imageUrls القادمة من الـ API) ويحولها لروابط
 * مطلقة صحيحة. لو الـ API القديم أرجع صورة واحدة فقط (imageUrl) بيرجعها كمصفوفة
 * من عنصر واحد كـ fallback، عشان مفيش استجابة تفضل من غير صور.
 */
export function resolveMaintenanceImageUrls(request) {
  if (!request) return []

  const rawList = request.imageUrls ?? request.ImageUrls ?? null

  let list = []
  if (Array.isArray(rawList) && rawList.length > 0) {
    list = rawList
  } else {
    const single =
      request.imageUrl ??
      request.ImageUrl ??
      request.image ??
      request.Image ??
      request.imagePath ??
      request.ImagePath ??
      null
    list = single ? [single] : []
  }

  return list.map((u) => toAbsoluteMediaUrl(u)).filter(Boolean)
}