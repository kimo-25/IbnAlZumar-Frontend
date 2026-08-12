// File: src/utils/imageHelper.js

// صورة افتراضية محترفة ومناسبة للمتجر في حال فشل تحميل الصورة
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop';

// رابط سيرفر Azure الأساسي للإنتاج في حال لم يتم قراءة متغيرات البيئة على GitHub Pages
const DEFAULT_PROD_API_URL = 'https://ibnalzumar-api-bub8fyaceheggxec.southafricanorth-01.azurewebsites.net/api';
const DEFAULT_DEV_API_URL = 'https://localhost:7223/api';

/**
 * الحصول على رابط الـ API الأساسي شاملاً /api مع الحماية ضد التكرار
 * @returns {string} - رابط الـ API
 */
export function getApiBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  let url = envUrl || (import.meta.env.DEV ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL);
  
  // التأكد من إزالة أي سلاشات زائدة أو /api مكررة من النهاية أولاً
  url = url.replace(/\/+$/, '').replace(/\/api\/?$/i, '');
  
  // إعادة إضافة /api مرة واحدة فقط بشكل مضمون
  return `${url}/api`;
}

/**
 * استخراج الـ Origin الخاص بالسيرفر بدون /api (للصور والملفات الثابتة)
 * @returns {string}
 */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/i, '');
}

/**
 * الحصول على الرابط الكامل للصورة مع التعامل مع الروابط النسبية والكاملة
 * وتوفير صورة افتراضية في حال عدم توفر الصورة
 * @param {string|object} imageInput - مسار أو رابط الصورة، أو كائن المنتج مباشرة
 * @returns {string} - الرابط الكامل أو صورة Placeholder افتراضية
 */
export function getImageUrl(imageInput) {
  // 1. Handling Null or Undefined
  if (!imageInput) return FALLBACK_IMAGE;

  let imagePath = imageInput;

  // 2. إذا تم إرسال كائن المنتج بالكامل بدلاً من النص
  if (typeof imageInput === 'object') {
    imagePath = getProductImagePath(imageInput);
  }

  // 3. حماية التأكد من أن المسار نص وغير فارغ
  if (typeof imagePath !== 'string') {
    return FALLBACK_IMAGE;
  }

  const trimmed = imagePath.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  // 4. إذا كان الرابط يبدأ بـ http أو https أو blob أو data فهو رابط خارجي مكتمل
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // 5. الحصول على الـ Origin الخاص بسيرفر Azure للصور وتنظيف المسارات
  const apiOrigin = getApiOrigin();
  let cleanPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');

  // 6. توجيه المسارات القصيرة (أسماء الصور مباشرة) إلى مجلد التخزين الصحيح في الباك إند
  if (!cleanPath.startsWith('uploads/')) {
    cleanPath = `uploads/products/${cleanPath}`;
  }

  return `${apiOrigin}/${cleanPath}`;
}

/**
 * استخراج مسار الصورة من كائن المنتج الذكي
 * @param {object|string} product - كائن المنتج أو مسار الصورة المباشر
 * @returns {string} - المسار المباشر قبل المعالجة
 */
export function getProductImagePath(product) {
  if (!product) return FALLBACK_IMAGE;

  if (typeof product === 'string') return product;

  if (product.primaryImage) return product.primaryImage;

  const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
  if (defaultVariant?.imageUrl) return defaultVariant.imageUrl;

  if (product.imageUrl) return product.imageUrl;

  return FALLBACK_IMAGE;
}

/**
 * الحصول على رابط الصورة البديلة مباشرة
 */
export function getProductImageFallbackUrl() {
  return FALLBACK_IMAGE;
}

/**
 * التعامل مع أخطاء تحميل الصور وعرض صورة بديلة مباشرة على عنصر الـ img
 * @param {Event} e - حدث الخطأ للـ Image
 */
export function handleImageError(e) {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMAGE;
}