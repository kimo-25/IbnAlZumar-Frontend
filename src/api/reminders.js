// File: src/api/reminders.js
import axiosInstance from './axiosInstance'

// 🟢 العرض العام للزوار
export const getRandomReminder = async () => {
  try {
    const response = await axiosInstance.get('/Reminders/random')
    return response.data
  } catch (error) {
    console.warn("[Reminders] Could not fetch random reminder:", error.message)
    return null
  }
}

// 🔵 لوحة التحكم (Admin & Moderator)
export const getAllRemindersAdmin = async () => {
  const response = await axiosInstance.get('/Reminders/admin/all')
  return response.data
}

export const createReminderAdmin = async (dto) => {
  const response = await axiosInstance.post('/Reminders/admin', dto)
  return response.data
}

export const updateReminderAdmin = async (id, dto) => {
  const response = await axiosInstance.put(`/Reminders/admin/${id}`, dto)
  return response.data
}

export const toggleReminderStatusAdmin = async (id) => {
  const response = await axiosInstance.patch(`/Reminders/admin/${id}/toggle-status`)
  return response.data
}

export const deleteReminderAdmin = async (id) => {
  const response = await axiosInstance.delete(`/Reminders/admin/${id}`)
  return response.data
}