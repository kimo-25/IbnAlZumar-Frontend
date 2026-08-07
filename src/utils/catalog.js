import { getApiBaseUrl, getProductImageFallbackUrl } from './imageHelper'

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------
const API_BASE_URL = getApiBaseUrl()

const currencyFormatter = new Intl.NumberFormat('ar-EG', {
  style: 'currency',
  currency: 'EGP',
  maximumFractionDigits: 0,
})

export function formatCurrency(value) {
  const numericValue = Number(value)
  return currencyFormatter.format(Number.isFinite(numericValue) ? numericValue : 0)
}

export function asArray(value) {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return Array.isArray(value.items) ? value.items : Array.isArray(value.data) ? value.data : []
}

function readFirst(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

function readString(...values) {
  const value = readFirst(...values)
  return value == null ? '' : String(value).trim()
}

function normalizeImageUrl(url) {
  let trimmed = readString(url)
  // حماية من الأخطاء والتأكد من إن المتغير نصي
  if (!trimmed || typeof trimmed !== 'string') return ''

  trimmed = trimmed.replace(/\\/g, '/')

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed
  }

  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${API_BASE_URL}${cleanPath}`
}

function readNumber(...values) {
  const value = readFirst(...values)
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function readOptionalNumber(...values) {
  const value = readFirst(...values)
  if (value === undefined || value === null || value === '') return undefined
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : undefined
}

function resolvePriceFields(source = {}) {
  const originalPrice = readOptionalNumber(
    source.originalPrice,
    source.OriginalPrice,
    source.listPrice,
    source.ListPrice,
    source.regularPrice,
    source.RegularPrice,
    source.basePrice,
    source.BasePrice,
    source.sellingPrice,
    source.SellingPrice,
    source.price,
    source.Price
  )
  const discountPercentage =
    readOptionalNumber(
      source.discountPercentage,
      source.DiscountPercentage,
      source.discountPercent,
      source.DiscountPercent,
      source.discount,
      source.Discount
    ) ?? 0

  const explicitPrice = readOptionalNumber(
    source.price,
    source.Price,
    source.sellingPrice,
    source.SellingPrice
  )

  const computedOriginal = originalPrice ?? explicitPrice ?? 0
  const computedPrice =
    explicitPrice ??
    (discountPercentage > 0 ? Math.max(0, computedOriginal - (computedOriginal * discountPercentage) / 100) : computedOriginal)

  return {
    originalPrice: computedOriginal,
    discountPercentage,
    price: computedPrice,
  }
}

function normalizeAttributeSource(variant, key) {
  const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
  return readString(
    variant?.[key],
    variant?.[capitalizedKey],
    variant?.attributes?.[key],
    variant?.Attributes?.[key],
    variant?.variantAttributes?.[key],
    variant?.options?.[key],
    variant?.[`${key}Name`],
    variant?.[`${capitalizedKey}Name`],
    variant?.[`${key}_name`]
  )
}

function normalizeSpecsSource(specs) {
  if (!specs) return []
  if (Array.isArray(specs)) {
    return specs
      .map((item) => ({
        key: readString(item?.key, item?.Key, item?.label, item?.Label, item?.name, item?.Name),
        label: readString(item?.label, item?.Label, item?.name, item?.Name, item?.key, item?.Key),
        value: readString(item?.value, item?.Value, item?.text, item?.Text, item?.description, item?.Description),
      }))
      .filter((item) => item.key || item.label || item.value)
  }

  return Object.entries(specs).map(([label, value]) => ({
    key: label,
    label,
    value: Array.isArray(value) ? value.join(', ') : readString(value),
  }))
}

function parseDescriptionSpecs(description) {
  const text = readString(description)
  if (!text) return []

  return text
    .split(/[;\n]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const separatorIndex = part.indexOf(':')
      if (separatorIndex === -1) return null

      const key = part.slice(0, separatorIndex).trim()
      const value = part.slice(separatorIndex + 1).trim()
      if (!key || !value) return null

      return { key, label: key, value }
    })
    .filter(Boolean)
}

export function normalizeVariant(variant = {}) {
  const priceFields = resolvePriceFields(variant)
  const attributes = {
    color: normalizeAttributeSource(variant, 'color'),
    finish: normalizeAttributeSource(variant, 'finish'),
    size: normalizeAttributeSource(variant, 'size'),
    material: normalizeAttributeSource(variant, 'material'),
  }

  const imageUrl = normalizeImageUrl(readString(variant.imageUrl, variant.ImageUrl, variant.image, variant.Image, variant.imagePath, variant.ImagePath, variant.thumbnailUrl, variant.ThumbnailUrl, variant.filePath, variant.FilePath, variant.url, variant.Url)) || getProductImageFallbackUrl()

  return {
    ...variant,
    id: readFirst(variant.id, variant.Id, variant.variantId, variant.VariantId, variant.productVariantId, variant.ProductVariantId, variant.sku, variant.Sku),
    sku: readString(variant.sku, variant.Sku, variant.code, variant.Code, variant.variantSku, variant.VariantSku),
    name: readString(variant.name, variant.Name, variant.variantName, variant.VariantName),
    ...priceFields,
    imageUrl,
    stock: readNumber(variant.stock, variant.Stock, variant.inStock, variant.InStock, variant.quantityOnHand, variant.QuantityOnHand),
    isDefault: Boolean(variant.isDefault || variant.Default),
    attributes,
    specs: normalizeSpecsSource(variant.specs || variant.Specs || variant.specifications || variant.Specifications || variant.specification),
  }
}

export function normalizeProduct(rawProduct = {}) {
  const product =
    rawProduct?.data && (rawProduct.data.id || rawProduct.data.Id || rawProduct.data.name || rawProduct.data.Name) ? rawProduct.data :
    rawProduct?.product && (rawProduct.product.id || rawProduct.product.Id || rawProduct.product.name || rawProduct.product.Name) ? rawProduct.product :
    rawProduct?.item && (rawProduct.item.id || rawProduct.item.Id) ? rawProduct.item :
    rawProduct?.result && (rawProduct.result.id || rawProduct.result.Id) ? rawProduct.result :
    rawProduct

  const variants = asArray(
    product.variants || product.Variants || product.variantList || product.VariantList || product.productVariants || product.ProductVariants
  ).map(normalizeVariant)

  const gallery = asArray(
    product.galleryImages || product.GalleryImages || product.images || product.Images || product.imageUrls || product.ImageUrls || product.media || product.Media || product.productImages || product.ProductImages || product.attachments || product.Attachments
  ).map((item) => normalizeImageUrl(readString(item?.url, item?.Url, item?.imageUrl, item?.ImageUrl, item?.imagePath, item?.ImagePath, item?.src, item, item?.filePath, item?.FilePath)))
   .filter(Boolean)

  const priceFields = resolvePriceFields(product)

  let baseImage = normalizeImageUrl(
    readString(
      product.imageUrl,
      product.ImageUrl,
      product.image,
      product.Image,
      product.imagePath,
      product.ImagePath,
      product.productImage,
      product.ProductImage,
      product.mainImageUrl,
      product.MainImageUrl,
      product.thumbnailUrl,
      product.ThumbnailUrl,
      product.thumbnail,
      product.Thumbnail,
      product.filePath,
      product.FilePath,
      product.fileUrl,
      product.FileUrl,
      product.url,
      product.Url,
      product.photo,
      product.Photo,
      product.picture,
      product.Picture
    )
  )

  if (!baseImage && gallery.length > 0) {
    baseImage = gallery[0]
  }

  if (!baseImage && variants.length > 0) {
    const variantWithImage = variants.find((v) => v.imageUrl)
    if (variantWithImage) {
      baseImage = variantWithImage.imageUrl
    }
  }

  if (!baseImage) {
    baseImage = getProductImageFallbackUrl()
  }

  if (baseImage && !gallery.includes(baseImage)) {
    gallery.unshift(baseImage)
  }

  return {
    ...product,
    id: readFirst(product.id, product.Id, product.productId, product.ProductId, product.sku, product.Sku),
    sku: readString(product.sku, product.Sku, product.code, product.Code),
    name: readString(
      product.nameAr,
      product.NameAr,
      product.arabicName,
      product.ArabicName,
      product.name,
      product.Name,
      product.productName,
      product.ProductName
    ),
    nameAr: readString(
      product.nameAr,
      product.NameAr,
      product.arabicName,
      product.ArabicName
    ),
    nameEn: readString(
      product.name,
      product.Name,
      product.productName,
      product.ProductName,
      product.englishName,
      product.EnglishName
    ),
    description: readString(product.description, product.Description, product.descriptionAr, product.DescriptionAr),
    brand: readString(product.brand, product.Brand, product.brandName, product.BrandName),
    category: readString(
      product.category?.name,
      product.Category?.Name,
      product.category?.title,
      product.Category?.Title,
      product.categoryName,
      product.CategoryName,
      product.category
    ),
    categoryId: readFirst(product.category?.id, product.Category?.Id, product.categoryId, product.CategoryId),
    material: readString(product.material, product.Material, product.materialName, product.MaterialName),
    finish: readString(product.finish, product.Finish, product.finishName, product.FinishName),
    ...priceFields,
    imageUrl: baseImage,
    image: baseImage,
    inStock: product.inStock !== false && product.IsInStock !== false,
    isAvailableOnline: product.isAvailableOnline !== false && product.IsAvailableOnline !== false,
    variants,
    gallery,
    specs: [
      ...parseDescriptionSpecs(product.description || product.Description),
      ...normalizeSpecsSource(product.specs || product.Specs || product.specifications || product.Specifications || product.attributes || product.Attributes),
    ],
  }
}

export function normalizeProductsResponse(data) {
  return asArray(data).map(normalizeProduct)
}

export function normalizeCategoriesResponse(data) {
  return asArray(data)
}

export function resolveVariantByAttributes(variants, selectedAttributes) {
  if (!variants.length) return null

  const keys = Object.keys(selectedAttributes || {}).filter((key) => selectedAttributes[key])
  if (!keys.length) {
    return variants.find((variant) => variant.isDefault) || variants[0]
  }

  return (
    variants.find((variant) =>
      keys.every((key) => String(variant.attributes?.[key] || '').toLowerCase() === String(selectedAttributes[key]).toLowerCase())
    ) || variants.find((variant) => variant.isDefault) || variants[0]
  )
}

export function buildVariantLabel(variant) {
  if (!variant) return ''
  const parts = [variant.attributes?.color, variant.attributes?.finish, variant.attributes?.size, variant.attributes?.material]
    .map((part) => readString(part))
    .filter(Boolean)
  return parts.join(' · ')
}

export function collectUniqueValues(products, key) {
  const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
  return Array.from(
    new Set(
      products
        .map((product) => readString(product?.[key], product?.[capitalizedKey], product?.[`${key}Name`], product?.[`${capitalizedKey}Name`]))
        .filter(Boolean)
    )
  ).sort((a, b) => a.localeCompare(b, 'ar'))
}