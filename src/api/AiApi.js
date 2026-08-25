// File: src/api/aiApi.js
import axiosInstance from './axiosInstance'

/**
 * Sends a chat turn to the backend AI assistant.
 * Role-based tool access is enforced server-side from the JWT — this layer
 * just carries the prompt + prior turns, nothing else.
 *
 * @param {string} prompt - The user's new message.
 * @param {{role: 'user'|'assistant', content: string}[]} history - Prior turns, oldest first.
 * @returns {Promise<{reply: string, toolsUsed: string[]}>}
 */
export async function sendAiChatMessage(prompt, history = []) {
  const { data } = await axiosInstance.post('/ai/chat', { prompt, history })
  return data
}