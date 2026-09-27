// File: src/api/translationApi.js
import axiosInstance from './axiosInstance'

export async function translateText(text, sourceLanguage, targetLanguage) {
  const response = await axiosInstance.post('/v1/translation/translate', {
    text,
    sourceLanguage,
    targetLanguage,
  })
  return response.data
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
