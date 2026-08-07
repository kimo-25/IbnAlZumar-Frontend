// File: src/services/reminders.js
import axiosInstance from '../api/axiosInstance'

export const getRandomReminder = async () => {
  try {
    const response = await axiosInstance.get('/Reminders/random')
    return response.data
  } catch (error) {
    console.warn("[Reminders] Could not fetch random reminder:", error.message)
    return null
  }
}