import { z } from 'zod';

/**
 * Sanitizes string input to prevent XSS
 * Removes script tags and dangerous HTML entities
 * @param {string} str 
 * @returns {string}
 */
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};

// Common price validation (positive numbers, max 2 decimals)
const priceSchema = z.number()
  .positive('السعر يجب أن يكون موجباً')
  .max(9999999.99, 'السعر كبير جداً')
  .refine(val => Number.isFinite(val), 'السعر يجب أن يكون رقماً صالحاً');

// Product Validation Schema
export const productSchema = z.object({
  name: z.string()
    .min(3, 'اسم المنتج يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'اسم المنتج طويل جداً')
    .transform(sanitizeString),
  
  description: z.string()
    .max(1000, 'الوصف طويل جداً')
    .transform(sanitizeString)
    .optional(),
  
  price: priceSchema,
  
  stock: z.number()
    .int('الكمية يجب أن تكون رقماً صحيحاً')
    .nonnegative('الكمية لا يمكن أن تكون سالبة')
    .max(100000, 'الكمية كبيرة جداً'),
  
  categoryId: z.string()
    .min(1, 'يجب اختيار قسم للمنتج')
    .or(z.number().transform(String)),
  
  image: z.any().optional(), // Can be File object or URL string
  
  sku: z.string()
    .max(50, 'رمز المنتج طويل جداً')
    .transform(sanitizeString)
    .optional(),
  
  isActive: z.boolean().default(true)
});

// Customer Validation Schema
export const customerSchema = z.object({
  name: z.string()
    .min(3, 'اسم العميل يجب أن يكون 3 أحرف على الأقل')
    .max(100, 'اسم العميل طويل جداً')
    .transform(sanitizeString),
  
  phone: z.string()
    .min(10, 'رقم الهاتف غير صالح')
    .max(15, 'رقم الهاتف طويل جداً')
    .regex(/^[\d\s\-\+()]+$/, 'رقم الهاتف يحتوي على أحرف غير مسموحة')
    .transform(sanitizeString),
  
  email: z.string()
    .email('البريد الإلكتروني غير صالح')
    .or(z.literal(''))
    .transform(sanitizeString)
    .optional(),
  
  address: z.string()
    .max(200, 'العنوان طويل جداً')
    .transform(sanitizeString)
    .optional(),
  
  notes: z.string()
    .max(500, 'الملاحظات طويلة جداً')
    .transform(sanitizeString)
    .optional()
});

// Category Validation Schema
export const categorySchema = z.object({
  name: z.string()
    .min(2, 'اسم القسم يجب أن يكون حرفين على الأقل')
    .max(50, 'اسم القسم طويل جداً')
    .transform(sanitizeString),
  
  description: z.string()
    .max(200, 'الوصف طويل جداً')
    .transform(sanitizeString)
    .optional(),
  
  image: z.any().optional()
});

// Maintenance Request Schema
export const maintenanceSchema = z.object({
  customerId: z.string().min(1, 'يجب اختيار عميل'),
  deviceId: z.string().min(1, 'يجب اختيار جهاز'),
  issueDescription: z.string()
    .min(10, 'وصف المشكلة قصير جداً')
    .max(500, 'الوصف طويل جداً')
    .transform(sanitizeString),
  images: z.array(z.any()).optional(), // Array of File objects or URLs
  priority: z.enum(['low', 'medium', 'high']).default('medium')
});

/**
 * Validates data against schema
 * @param {Object} data - Data to validate
 * @param {ZodSchema} schema - Zod schema to use
 * @returns {{ success: boolean, data?: any, errors?: string[] }}
 */
export const validateData = (data, schema) => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => err.message);
      return { success: false, data: null, errors: errorMessages };
    }
    return { success: false, data: null, errors: ['خطأ غير متوقع في التحقق'] };
  }
};

// Convenience validation functions
export const validateProduct = (data) => validateData(data, productSchema);
export const validateCustomer = (data) => validateData(data, customerSchema);
export const validateCategory = (data) => validateData(data, categorySchema);
export const validateMaintenance = (data) => validateData(data, maintenanceSchema);

export default {
  validateProduct,
  validateCustomer,
  validateCategory,
  validateMaintenance,
  productSchema,
  customerSchema,
  categorySchema,
  maintenanceSchema
};