import axiosInstance from './axiosInstance'
import { secureAuthStorage } from '../utils/secureStorage'
import { getStoredAuth } from '../utils/auth'
import { clearSessionAndRedirect } from './axiosInstance'

function buildChatFormData(prompt, history = [], files = []) {
  const formData = new FormData()
  formData.append('prompt', prompt)
  formData.append('historyJson', JSON.stringify(history))
  files.filter(Boolean).forEach((file) => formData.append('files', file, file.name))
  return formData
}

export async function sendAiChatMessage(prompt, history = [], files = []) {
  const response = await axiosInstance.post('/Ai/chat', buildChatFormData(prompt, history, files), {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return response.data
}

/**
 * Streams SSE events from the assistant. onToken receives incremental text;
 * onComplete receives the final metadata payload.
 */
export async function streamAiChatMessage(prompt, history = [], files = [], { signal, onToken, onComplete } = {}) {
  const auth = secureAuthStorage.get() || getStoredAuth()
  const response = await fetch(`${axiosInstance.defaults.baseURL}/Ai/chat/stream`, {
    method: 'POST',
    body: buildChatFormData(prompt, history, files),
    credentials: 'include',
    signal,
    headers: auth?.token ? { Authorization: `Bearer ${auth.token}` } : {},
  })

  if (!response.ok) {
    if (response.status === 401) clearSessionAndRedirect()
    let message = `AI request failed (${response.status})`
    try { message = (await response.json()).message || message } catch { /* non-JSON error */ }
    const error = new Error(message)
    error.status = response.status
    throw error
  }
  if (!response.body) throw new Error('Streaming is not supported by this browser.')

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let finalData = null
  const consume = (raw) => {
    buffer += raw
    const frames = buffer.split('\n\n')
    buffer = frames.pop() || ''
    frames.forEach((frame) => {
      const data = frame.split('\n').filter((line) => line.startsWith('data:')).map((line) => line.slice(5).trim()).join('\n')
      if (!data) return
      try {
        const payload = JSON.parse(data)
        if (payload.type === 'token') onToken?.(payload.text || '')
        if (payload.type === 'complete') { finalData = payload; onComplete?.(payload) }
        if (payload.type === 'error') throw new Error(payload.message || 'AI streaming failed')
      } catch (error) {
        if (error instanceof SyntaxError) return
        throw error
      }
    })
  }
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    consume(decoder.decode(value, { stream: true }))
  }
  consume(decoder.decode())
  return finalData
}
