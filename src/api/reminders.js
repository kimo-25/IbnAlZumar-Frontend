// File: src/services/reminders.js
import axiosInstance from '../api/axiosInstance'

export const getReminders = async () => {
  try {
    const response = await axiosInstance.get('/Reminders')
    return response.data
  } catch (error) {
    // Silent catch للزائر حتى لا تظهر أخطاء حمراء في الكونسول لو كانت المحظورة للأدمن فقط
    console.warn("[Reminders] Guest or unauthorized fetch ignored:", error.message)
    return []
  }
}