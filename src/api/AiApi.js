import axiosInstance from './axiosInstance'

export async function sendAiChatMessage(prompt, history = [], files = []) {
  const formData = new FormData()
  
  formData.append('prompt', prompt)
  formData.append('historyJson', JSON.stringify(history))
  
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('files', file)
    })
  }

  // التعديل هنا: استخدام /Ai/chat بدلاً من /api/Ai/chat لمنع تكرار كلمة api
  const response = await axiosInstance.post('/Ai/chat', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })

  return response.data
}