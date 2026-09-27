// File: src/api/translationApi.js
import axiosInstance from './axiosInstance'

export async function translateText(text, sourceLanguage, targetLanguage) {
  try {
    const response = await axiosInstance.post('/v1/translation/translate', {
      text,
      sourceLanguage,
      targetLanguage,
    })

    if (response.data?.success && response.data.translatedText != null) {
      return response.data
    }
  } catch (error) {
    console.warn('Backend translation failed, using MyMemory fallback:', error)
  }

  const fallbackResponse = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceLanguage}|${targetLanguage}`,
  )
  if (!fallbackResponse.ok) {
    throw new Error(`Translation fallback failed with status ${fallbackResponse.status}`)
  }

  const fallbackData = await fallbackResponse.json()
  const translatedText = fallbackData?.responseData?.translatedText
  if (translatedText == null) {
    throw new Error('Translation fallback returned no translated text')
  }

  return { translatedText, success: true }
}

/**
 * Manual "translate now" trigger for the product/category edit forms.
 * overwrite=false (default): fills only whichever of Name/NameAr is currently empty.
 * overwrite=true: explicit user consent to replace BOTH sides with a fresh translation.
 */
export async function translateProductNow(productId, overwrite = false) {
  const response = await axiosInstance.post(`/products/${productId}/translate`, null, {
    params: { overwrite },
  })
  return response.data
}

export async function translateCategoryNow(categoryId, overwrite = false) {
  const response = await axiosInstance.post(`/categories/${categoryId}/translate`, null, {
    params: { overwrite },
  })
  return response.data
}
