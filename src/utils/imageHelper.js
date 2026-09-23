// File: src/utils/imageHelper.js

// صورة افتراضية محترفة ومناسبة للمتجر في حال فشل تحميل الصورة
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=600&auto=format&fit=crop';

// رابط سيرفر Azure الأساسي للإنتاج في حال عدم قراءة متغيرات البيئة
export const DEFAULT_PROD_API_URL = 'https://ibnal-ibnalzumar-api-ddf9h3cdafc6bxat.francecentral-01.azurewebsites.net/api';
const DEFAULT_DEV_API_URL = 'https://localhost:7223/api';

/**
 * تطبيع رابط API إلى أصل واحد ينتهي بـ /api، مهما كان شكل قيمة البيئة.
 * يعالج /api و /api/ المكررة، والسلاشات الزائدة، والمسافات.
 */
export function normalizeApiBaseUrl(value) {
  const fallback = import.meta.env.DEV ? DEFAULT_DEV_API_URL : DEFAULT_PROD_API_URL;
  let url = String(value || fallback).trim().replace(/\\/g, '/').replace(/\/+$/, '');

  // إزالة أي عدد من مقاطع /api في النهاية ثم إضافته مرة واحدة فقط.
  url = url.replace(/(?:\/api)+$/i, '');
  return `${url}/api`;
}

/**
 * الحصول على رابط الـ API الأساسي شاملاً /api.
 */
export function getApiBaseUrl() {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL);
}

/**
 * استخراج الـ Origin الخاص بالسيرفر بدون /api (للصور والملفات الثابتة).
 */
export function getApiOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/i, '');
}

/**
 * الحصول على الرابط الكامل للصورة مع دعم جميع الأنواع (منتجات، صيانة، أقسام).
 */
export function getImageUrl(imageInput, imageType = 'product', isAbsolute = false) {
  if (!imageInput) return FALLBACK_IMAGE;

  let imagePath = imageInput;
  if (typeof imageInput === 'object') imagePath = getProductImagePath(imageInput);
  if (typeof imagePath !== 'string') return FALLBACK_IMAGE;

  const trimmed = imagePath.trim();
  if (!trimmed) return FALLBACK_IMAGE;

  if (
    isAbsolute ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  const apiOrigin = getApiOrigin();
  const cleanPath = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');

  if (cleanPath.startsWith('api/')) return `${apiOrigin}/${cleanPath.replace(/^api\//, '')}`;
  if (cleanPath.includes('uploads/')) return `${apiOrigin}/${cleanPath}`;

  let uploadSubFolder = 'products';
  switch (imageType) {
    case 'maintenance':
    case 'inquiry':
      uploadSubFolder = 'maintenance';
      break;
    case 'category':
      uploadSubFolder = 'categories';
      break;
    case 'profile':
    case 'user':
      uploadSubFolder = 'profiles';
      break;
    default:
      break;
  }

  const fileName = cleanPath.split('/').pop();
  return `${apiOrigin}/uploads/${uploadSubFolder}/${fileName}`;
}

export function getProductImagePath(product) {
  if (!product) return FALLBACK_IMAGE;
  if (typeof product === 'string') return product;

  if (product.mainImageUrl) return product.mainImageUrl;
  if (product.imageUrl) return product.imageUrl;
  if (product.primaryImage) return product.primaryImage;

  const defaultVariant = product.variants?.find((v) => v.isDefault) || product.variants?.[0];
  if (defaultVariant?.imageUrl) return defaultVariant.imageUrl;

  return FALLBACK_IMAGE;
}

export function handleImageError(e) {
  e.target.onerror = null;
  e.target.src = FALLBACK_IMAGE;
}

export function getProductImageFallbackUrl() {
  return FALLBACK_IMAGE;
}

export default {
  getImageUrl,
  getProductImagePath,
  getApiBaseUrl,
  getApiOrigin,
  normalizeApiBaseUrl,
  handleImageError,
  getProductImageFallbackUrl,
};
