import { useCallback, useEffect, useRef, useState } from 'react'
import { Mic, Square, Loader2, CheckCircle2, XCircle, ReceiptText } from 'lucide-react'
import { sendVoiceCommand } from '../../api/adminApi'

/**
 * زر إنشاء فاتورة / إضافة منتج بالأمر الصوتي، للاستخدام من شاشة الكاشير.
 *
 * الآلية:
 *   1) يشغّل SpeechRecognition الخاصة بالمتصفح (مجانية، بدون أي سيرفر خارجي)
 *      بلغة عربية مصرية (ar-EG) ويعرض النص أثناء الكلام مباشرة (interim results).
 *   2) عند توقف الكاشير عن الكلام (onresult نهائي) أو ضغط زر الإيقاف، يرسل
 *      النص النهائي إلى: POST /api/ai/voice-command
 *   3) يعرض تفاصيل الفاتورة المنشأة عند النجاح، أو رسالة الخطأ (مثلاً منتج
 *      لم يتم التعرف عليه) عند الفشل.
 *
 * الحالات: idle -> listening -> processing -> success | error
 *
 * الاستخدام:
 *   import VoiceInvoiceButton from '../../components/admin/VoiceInvoiceButton'
 *   ...
 *   <VoiceInvoiceButton />
 */
export default function VoiceInvoiceButton() {
  const [status, setStatus] = useState('idle') // idle | listening | processing | success | error
  const [transcript, setTranscript] = useState('')
  const [result, setResult] = useState(null)
  const [feedback, setFeedback] = useState(null)
  const [isSupported, setIsSupported] = useState(true)

  const recognitionRef = useRef(null)
  const feedbackTimeoutRef = useRef(null)
  const finalTranscriptRef = useRef('')

  useEffect(() => {
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognitionClass) {
      setIsSupported(false)
      return
    }

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ar-EG'
    recognition.continuous = true
    recognition.interimResults = true

    recognition.onresult = (event) => {
      let interim = ''
      let final = finalTranscriptRef.current

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const chunk = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          final += `${chunk} `
        } else {
          interim += chunk
        }
      }

      finalTranscriptRef.current = final
      setTranscript((final + interim).trim())
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      setStatus('error')
      setFeedback({
        title: 'تعذر الوصول للمايكروفون',
        message: 'يرجى السماح باستخدام المايكروفون من إعدادات المتصفح والمحاولة مرة أخرى.'
      })
      scheduleFeedbackReset()
    }

    recognition.onend = () => {
      // لو المستخدم لسه في وضع الاستماع ولقفلت الجلسة تلقائياً من المتصفح
      setStatus((current) => (current === 'listening' ? 'idle' : current))
    }

    recognitionRef.current = recognition

    return () => {
      recognition.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const scheduleFeedbackReset = useCallback(() => {
    if (feedbackTimeoutRef.current) {
      clearTimeout(feedbackTimeoutRef.current)
    }
    feedbackTimeoutRef.current = setTimeout(() => {
      setStatus('idle')
      setFeedback(null)
      setResult(null)
      setTranscript('')
    }, 8000)
  }, [])

  const submitCommand = useCallback(async (text) => {
    if (!text || !text.trim()) {
      setStatus('idle')
      return
    }

    setStatus('processing')

    try {
      const data = await sendVoiceCommand(text.trim())

      if (data?.success === false) {
        setStatus('error')
        setResult(data)
        setFeedback({
          title: 'تعذر تنفيذ الأمر',
          message: data?.message || 'حاول إعادة صياغة الأمر بوضوح أكبر.'
        })
      } else {
        setStatus('success')
        setResult(data)
        setFeedback({
          title: data?.action === 'AddProduct' ? 'تم إضافة المنتج' : 'تم إنشاء الفاتورة',
          message: data?.message || 'تمت العملية بنجاح.'
        })
      }
    } catch (err) {
      setStatus('error')
      setFeedback({
        title: 'حدث خطأ',
        message:
          err?.response?.data?.message ||
          err?.message ||
          'تعذر الاتصال بخدمة الأوامر الصوتية، حاول مرة أخرى.'
      })
    }

    scheduleFeedbackReset()
  }, [scheduleFeedbackReset])

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return

    finalTranscriptRef.current = ''
    setTranscript('')
    setResult(null)
    setFeedback(null)

    try {
      recognitionRef.current.start()
      setStatus('listening')
    } catch {
      // recognition.start() بيرمي خطأ لو كانت شغالة بالفعل - نتجاهله بأمان
    }
  }, [])

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return
    recognitionRef.current.stop()
    submitCommand(finalTranscriptRef.current || transcript)
  }, [submitCommand, transcript])

  const handleClick = () => {
    if (status === 'idle' || status === 'success' || status === 'error') {
      startListening()
    } else if (status === 'listening') {
      stopListening()
    }
  }

  const isBusy = status === 'processing'

  const statusLabel =
    status === 'listening'
      ? 'جاري الاستماع... اضغط للإيقاف وإرسال الأمر'
      : status === 'processing'
        ? 'جاري تنفيذ الأمر...'
        : status === 'success'
          ? 'تم تنفيذ الأمر، يمكنك تسجيل أمر جديد'
          : status === 'error'
            ? 'حاول مرة أخرى'
            : 'جاهز لاستقبال أمرك الصوتي'

  if (!isSupported) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <ReceiptText size={20} className="text-graphite-900" />
          <h2 className="text-lg font-semibold text-ink">فاتورة بالأمر الصوتي</h2>
        </div>
        <p className="mt-2 text-sm text-red-600">
          هذا المتصفح لا يدعم التعرف على الصوت (Speech Recognition). يرجى استخدام Google Chrome لتفعيل هذه الميزة.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-6 shadow-sm">
      <div className="flex items-center gap-2">
        <ReceiptText size={20} className="text-graphite-900" />
        <h2 className="text-lg font-semibold text-ink">فاتورة بالأمر الصوتي</h2>
      </div>
      <p className="mt-1 text-xs text-ink-soft">
        اضغط وابدأ الكلام مباشرة، مثال: «اعمل فاتورة بيع لعميل اسمه أحمد منتج صابون بكمية 3»، ثم اضغط للإيقاف.
      </p>

      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={handleClick}
          disabled={isBusy}
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-white shadow-md transition ${
            status === 'listening'
              ? 'animate-pulse bg-red-600 hover:bg-red-700'
              : isBusy
                ? 'cursor-not-allowed bg-graphite-400'
                : 'bg-graphite-900 hover:bg-amber hover:text-graphite-900'
          }`}
          aria-label="تسجيل أمر صوتي"
        >
          {status === 'processing' ? (
            <Loader2 size={22} className="animate-spin" />
          ) : status === 'listening' ? (
            <Square size={20} />
          ) : (
            <Mic size={22} />
          )}
        </button>

        <div className="flex-1">
          <p className="text-sm font-medium text-ink">{statusLabel}</p>

          {(status === 'listening' || status === 'processing') && transcript && (
            <div className="mt-2 rounded-lg border border-graphite-200 bg-graphite-50 p-3 text-sm text-graphite-700">
              {transcript}
            </div>
          )}

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

              {status === 'success' && result?.action === 'CreateInvoice' && result?.data && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-green-900">
                  <dt className="font-medium">رقم الفاتورة</dt>
                  <dd>{result.data.orderNumber}</dd>
                  <dt className="font-medium">العميل</dt>
                  <dd>{result.data.customerName}</dd>
                  <dt className="font-medium">الإجمالي</dt>
                  <dd>{Number(result.data.totalAmount).toFixed(2)}</dd>
                </dl>
              )}

              {status === 'error' && result?.parsedCommand?.items?.length > 0 && (
                <ul className="mt-2 list-inside list-disc text-xs">
                  {result.parsedCommand.items.map((item, index) => (
                    <li key={index}>
                      {item.productNameRaw} × {item.quantity}
                      {item.matchedProductName ? ` — مطابق: ${item.matchedProductName}` : ' — لم يتم التعرف عليه'}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}