import { useCallback, useRef, useState } from 'react'
import { Mic, Square, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { processVoiceAttendance } from '../../api/adminApi'

const MAX_RECORDING_MS = 6000

/**
 * زر مايكروفون مستقل لتسجيل الحضور/الانصراف بالصوت، جاهز للوضع داخل
 * PosCheckoutPage.jsx (أو أي مكان آخر في شاشة الكاشير).
 *
 * الاستخدام:
 *   import VoiceAttendanceButton from '../../components/pos/VoiceAttendanceButton'
 *   ...
 *   <VoiceAttendanceButton />
 */
export default function VoiceAttendanceButton() {
  const [status, setStatus] = useState('idle') // idle | recording | processing | success | error
  const [feedback, setFeedback] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const autoStopTimeoutRef = useRef(null)
  const feedbackTimeoutRef = useRef(null)

  const cleanupStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  const scheduleFeedbackReset = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setStatus('idle')
      setFeedback(null)
    }, 4000)
  }, [])

  const handleRecordingStopped = useCallback(async () => {
    setStatus('processing')

    const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
    chunksRef.current = []
    cleanupStream()

    try {
      const result = await processVoiceAttendance(audioBlob, '', 'attendance.webm')

      if (result?.success) {
        setStatus('success')
        setFeedback({
          title: result.action === 'CheckIn' ? 'تم تسجيل الحضور' : 'تم تسجيل الانصراف',
          message: result.message,
          workedHours: result.workedHours
        })
      } else {
        setStatus('error')
        setFeedback({
          title: 'لم يتم التعرف على الصوت',
          message: result?.message || 'حاول مرة أخرى بصوت أوضح.'
        })
      }
    } catch (err) {
      setStatus('error')
      setFeedback({
        title: 'حدث خطأ',
        message: err?.response?.data?.message || 'تعذر الاتصال بخدمة الحضور، حاول مرة أخرى.'
      })
    }

    scheduleFeedbackReset()
  }, [cleanupStream, scheduleFeedbackReset])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }
      recorder.onstop = handleRecordingStopped

      recorder.start()
      setStatus('recording')
      setFeedback(null)

      autoStopTimeoutRef.current = setTimeout(() => {
        if (mediaRecorderRef.current?.state === 'recording') {
          mediaRecorderRef.current.stop()
        }
      }, MAX_RECORDING_MS)
    } catch (err) {
      setStatus('error')
      setFeedback({
        title: 'تعذر الوصول للمايكروفون',
        message: 'يرجى السماح باستخدام المايكروفون من إعدادات المتصفح.'
      })
      scheduleFeedbackReset()
    }
  }, [handleRecordingStopped, scheduleFeedbackReset])

  const stopRecording = useCallback(() => {
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current)
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const handleClick = () => {
    if (status === 'idle' || status === 'success' || status === 'error') {
      startRecording()
    } else if (status === 'recording') {
      stopRecording()
    }
  }

  const isBusy = status === 'processing'

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isBusy}
        className={`flex h-14 w-14 items-center justify-center rounded-full text-white shadow-md transition ${
          status === 'recording'
            ? 'animate-pulse bg-red-600 hover:bg-red-700'
            : isBusy
              ? 'cursor-not-allowed bg-graphite-400'
              : 'bg-graphite-900 hover:bg-amber hover:text-graphite-900'
        }`}
        aria-label="تسجيل الحضور والانصراف بالصوت"
      >
        {status === 'processing' ? (
          <Loader2 size={22} className="animate-spin" />
        ) : status === 'recording' ? (
          <Square size={20} />
        ) : (
          <Mic size={22} />
        )}
      </button>

      <span className="text-xs text-graphite-500">
        {status === 'recording'
          ? 'جاري التسجيل... اضغط للإيقاف'
          : status === 'processing'
            ? 'جاري التحقق من الصوت...'
            : 'الحضور / الانصراف بالصوت'}
      </span>

      {feedback && (
        <div
          className={`mt-1 w-64 rounded-lg border p-3 text-sm shadow-sm ${
            status === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2 font-medium">
            {status === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {feedback.title}
          </div>
          <p className="mt-1 text-xs">{feedback.message}</p>
          {typeof feedback.workedHours === 'number' && (
            <p className="mt-1 text-xs font-medium">
              إجمالي ساعات العمل: {feedback.workedHours.toFixed(2)} ساعة
            </p>
          )}
        </div>
      )}
    </div>
  )
}
