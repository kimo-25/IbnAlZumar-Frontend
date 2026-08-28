import { useEffect, useRef, useState } from 'react'
import { Loader2, Mic, Square, X } from 'lucide-react'
import { enrollVoice } from '../../api/adminApi'
import { convertBlobToWav } from '../../utils/audioToWav'

export default function AdminVoiceEnrollModal({ userId, employeeName, onClose, onSuccess }) {
  const [recording, setRecording] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  useEffect(() => () => streamRef.current?.getTracks().forEach((track) => track.stop()), [])

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (event) => event.data.size && chunksRef.current.push(event.data)
      recorder.onstop = async () => {
        setBusy(true)
        try {
          const wav = await convertBlobToWav(new Blob(chunksRef.current, { type: recorder.mimeType }))
          const result = await enrollVoice(wav, 'employee-enrollment.wav', userId)
          setMessage(result.message || 'تم تسجيل البصمة بنجاح.')
          if (result.success) onSuccess?.(result)
        } catch (error) {
          setMessage(error?.response?.data?.message || error.message || 'تعذر تسجيل البصمة.')
        } finally {
          setBusy(false)
          stream.getTracks().forEach((track) => track.stop())
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording(true)
      setMessage('تحدث لمدة ثانية إلى ثلاث ثوانٍ بوضوح، ثم اضغط للإيقاف.')
    } catch {
      setMessage('تعذر الوصول إلى الميكروفون. تحقق من إذن المتصفح.')
    }
  }

  const stop = () => {
    if (!recorderRef.current || recorderRef.current.state === 'inactive') return
    recorderRef.current.stop()
    setRecording(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">تسجيل بصمة {employeeName || 'الموظف'}</h2>
          <button type="button" onClick={onClose} disabled={busy} aria-label="إغلاق"><X size={20} /></button>
        </div>
        <p className="mt-2 text-sm text-gray-600">ضع الميكروفون قريباً من الموظف وسجّل صوتاً واضحاً في مكان هادئ.</p>
        {message && <p className="mt-4 rounded-lg bg-gray-100 p-3 text-sm">{message}</p>}
        <button type="button" onClick={recording ? stop : start} disabled={busy} className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-full bg-gray-900 text-white disabled:opacity-50">
          {busy ? <Loader2 className="animate-spin" /> : recording ? <Square /> : <Mic />}
        </button>
        <p className="mt-3 text-center text-xs text-gray-500">{recording ? 'اضغط للإيقاف والإرسال' : 'اضغط لبدء التسجيل'}</p>
      </div>
    </div>
  )
}
