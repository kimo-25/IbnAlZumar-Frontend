// صورة افتراضية محترفة ومناسبة للمتجر في حال فشل تحميل الصورة
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop';

/**
 * الحصول على رابط الـ API الأساسي من متغيرات البيئة
 * @returns {string} - رابط الـ API
 */
export function getApiBaseUrl() {
  const url = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5211';
  return url.replace(/\/+$/, ''); // تنظيف السلاش الأخيرة
}

/**
 * الحصول على الرابط الكامل للصورة مع التعامل مع الروابط النسبية والكاملة
 * وتوفير صورة افتراضية في حال عدم توفر الصورة
 * @param {string} imagePath - مسار أو رابط الصورة القادم من الـ Backend
 * @returns {string} - الرابط الكامل أو صورة Placeholder افتراضية
 */
export function getImageUrl(imagePath) {
  // حماية التأكد من أن المسار نص وغير فارغ
  if (!imagePath || typeof imagePath !== 'string') {
    return FALLBACK_IMAGE;
  }

  const trimmed = imagePath.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  // إذا كان الرابط يبدأ بـ http أو https أو blob أو data فهو رابط خارجي مكتمل
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // الحصول على رابط الـ API الأساسي وتنظيف المسارات
  const apiBaseUrl = getApiBaseUrl();
  const cleanPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');

  return `${apiBaseUrl}/${cleanPath}`;
}

/**
 * دالة مساعدة مطابقة لـ getImageUrl لتجنب أخطاء الاستيراد في المكونات
 */
export function getProductImagePath(imagePath) {
  return getImageUrl(imagePath);
}

/**
 * الحصول على رابط الصورة البديلة مباشرة
 */
export function getProductImageFallbackUrl() {
  return FALLBACK_IMAGE;
}

/**
 * التعامل مع أخطاء تحميل الصور وعرض صورة بديلة (Fallback) مباشرة على عنصر الـ img
 * @param {Event} e - حدث الخطأ للـ Image
 */
export function handleImageError(e) {
  e.target.onerror = null; // لمنع التكرار اللانهائي في حال فشل الصورة البديلة أيضاً
  e.target.src = FALLBACK_IMAGE;
}