import { useCallback, useRef, useState } from 'react'
import { Mic, Square, Loader2, CheckCircle2, XCircle, Fingerprint } from 'lucide-react'
import { enrollVoice } from '../../api/adminApi'
import { convertBlobToWav } from '../../utils/audioToWav'

const MAX_RECORDING_MS = 8000

/**
 * زر تسجيل البصمة الصوتية لأول مرة للموظف/المشرف الحالي.
 * يرسل تسجيلاً صوتياً بصيغة WAV إلى:
 *   POST /api/attendance/enroll-voice
 *
 * الحالات: idle -> recording -> processing -> success | error
 *
 * الاستخدام:
 *   import VoiceEnrollmentButton from '../../components/admin/VoiceEnrollmentButton'
 *   ...
 *   <VoiceEnrollmentButton />
 */
export default function VoiceEnrollmentButton() {
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
    }, 5000)
  }, [])

  const handleRecordingStopped = useCallback(async () => {
    setStatus('processing')

    const rawBlob = new Blob(chunksRef.current, { type: 'audio/webm' })
    chunksRef.current = []
    cleanupStream()

    try {
      // تحويل التسجيل إلى WAV لضمان التوافق مع خدمة التعرف على الصوت والـ backend
      const wavBlob = await convertBlobToWav(rawBlob)

      const result = await enrollVoice(wavBlob, 'enroll.wav')

      if (result?.success === false) {
        setStatus('error')
        setFeedback({
          title: 'تعذر حفظ البصمة الصوتية',
          message: result?.message || 'حاول تسجيل صوتك مرة أخرى بوضوح أكبر.'
        })
      } else {
        setStatus('success')
        setFeedback({
          title: 'تم حفظ بصمتك الصوتية بنجاح',
          message: result?.message || 'يمكنك الآن استخدام صوتك لتسجيل الحضور والانصراف.'
        })
      }
    } catch (err) {
      setStatus('error')
      setFeedback({
        title: 'حدث خطأ',
        message: err?.response?.data?.message || err?.message || 'تعذر الاتصال بخدمة تسجيل البصمة الصوتية، حاول مرة أخرى.'
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

  const statusLabel =
    status === 'recording'
      ? 'جاري التسجيل... اضغط للإيقاف'
      : status === 'processing'
        ? 'جاري حفظ البصمة الصوتية...'
        : status === 'success'
          ? 'تم التسجيل، يمكنك إعادة التسجيل في أي وقت'
          : 'جاهز للتسجيل'

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <Fingerprint size={20} className="text-graphite-900" />
        <h2 className="text-lg font-semibold text-ink">البصمة الصوتية للحضور والانصراف</h2>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        سجّل صوتك مرة واحدة (٥-٨ ثوانٍ بجملة واضحة) لتتمكن لاحقاً من تسجيل حضورك وانصرافك بصوتك من شاشة الكاشير.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={handleClick}
          disabled={isBusy}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md transition ${
            status === 'recording'
              ? 'animate-pulse bg-red-600 hover:bg-red-700'
              : isBusy
                ? 'cursor-not-allowed bg-graphite-400'
                : 'bg-graphite-900 hover:bg-amber hover:text-graphite-900'
          }`}
          aria-label="تسجيل البصمة الصوتية"
        >
          {status === 'processing' ? (
            <Loader2 size={22} className="animate-spin" />
          ) : status === 'recording' ? (
            <Square size={20} />
          ) : (
            <Mic size={22} />
          )}
        </button>

        <div className="flex-1">
          <p className="text-sm font-medium text-ink">{statusLabel}</p>

          {feedback && (
            <div
              className={`mt-2 rounded-lg border p-3 text-sm shadow-sm ${
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
            </div>
          )}
        </div>
      </div>
    </div>
  )
}