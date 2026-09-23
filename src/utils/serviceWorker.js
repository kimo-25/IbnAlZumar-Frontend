const API_CACHE_NAME_PATTERN = /api|workbox-runtime/i

/**
 * يطلب من Service Worker التحديث ويحذف أي كاش runtime قديم خاص بالـ API.
 * طلبات API نفسها مضبوطة في Workbox على NetworkOnly، لذلك لا تُخزّن أخطاءً قديمة.
 */
export async function refreshServiceWorkerAndApiCaches() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

  try {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.update()))

    const cacheNames = await caches.keys()
    await Promise.all(
      cacheNames
        .filter((cacheName) => API_CACHE_NAME_PATTERN.test(cacheName))
        .map((cacheName) => caches.delete(cacheName)),
    )
  } catch (error) {
    // فشل تنظيف الكاش لا يجب أن يمنع تشغيل واجهة التطبيق.
    if (import.meta.env.DEV) console.warn('Service Worker cache refresh skipped:', error)
  }
}
