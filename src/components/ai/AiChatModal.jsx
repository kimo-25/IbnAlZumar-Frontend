import { useEffect, useRef, useState } from 'react'
import {
  Bot,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  Expand,
  FileUp,
  Loader2,
  Mic,
  PanelRightClose,
  Plus,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react'
import { sendAiChatMessage } from '../../api/AiApi'
import { useAuth } from '../../context/AuthContext'
import AssistantResponseRenderer from './AiResponseRenderer'

const QUICK_PROMPTS = [
  { label: 'الطلبات المعلقة', prompt: 'أظهر الطلبات المعلقة حالياً' },
  { label: 'تنبيهات المخزون', prompt: 'ما هي المنتجات التي أوشك مخزونها على النفاد؟' },
  { label: 'ملخص المبيعات', prompt: 'أعطني ملخص المبيعات لآخر 7 أيام' },
]

function AssistantAvatar({ small = false }) {
  return (
    <div className={`relative grid shrink-0 place-items-center rounded-2xl bg-amber text-graphite-950 shadow-[0_0_0_4px_rgba(242,169,0,0.12)] ${small ? 'h-8 w-8 rounded-xl' : 'h-10 w-10'}`}>
      <Bot size={small ? 16 : 19} strokeWidth={2.4} />
      <span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-graphite-900 bg-emerald-400" />
    </div>
  )
}

function ChatMessage({ message, onCopy }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex w-full gap-2.5 ${isUser ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
      {isUser ? (
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-graphite-200 text-xs font-bold text-graphite-700">أنت</div>
      ) : <AssistantAvatar small />}
      <div className={`max-w-[min(86%,620px)] ${isUser ? 'items-start' : 'items-end'}`}>
        <div className={`group relative rounded-2xl px-4 py-3 ${isUser ? 'rounded-se-md bg-graphite-900 text-white' : 'rounded-ss-md border border-graphite-200 bg-white'}`}>
          {isUser ? <p className="whitespace-pre-wrap text-[13px] leading-6" dir="auto">{message.content}</p> : <AssistantResponseRenderer content={message.content} />}
          {!isUser && (
            <button onClick={() => onCopy(message.content)} className="absolute -bottom-8 start-0 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-graphite-400 opacity-0 transition hover:bg-graphite-100 hover:text-graphite-700 group-hover:opacity-100" aria-label="نسخ الرد">
              {message.copied ? <Check size={12} /> : <Clipboard size={12} />}
              {message.copied ? 'تم النسخ' : 'نسخ'}
            </button>
          )}
          {!isUser && message.downloadUrl && (
            <a href={message.downloadUrl} download={message.downloadFileName || 'export.xlsx'} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber px-3 py-2 text-xs font-semibold text-graphite-950 transition hover:bg-amber-dark">
              <Download size={14} /> تحميل الملف {message.downloadFileName ? `(${message.downloadFileName})` : ''}
            </a>
          )}
        </div>
        <span className={`mt-1.5 block px-1 text-[10px] text-graphite-400 ${isUser ? 'text-start' : 'text-end'}`}>{isUser ? 'أنت' : 'مساعد ابن الزمر'}</span>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-2.5">
      <AssistantAvatar small />
      <div className="flex items-center gap-1.5 rounded-2xl rounded-ss-md border border-graphite-200 bg-white px-4 py-3.5">
        <span className="sr-only">المساعد يكتب</span>
        {[0, 1, 2].map((index) => <span key={index} className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-dark" style={{ animationDelay: `${index * 120}ms` }} />)}
      </div>
    </div>
  )
}

export default function AiChatModal() {
  const { isAuthenticated, hasRole, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-ai-chat', handleOpen)
    return () => window.removeEventListener('open-ai-chat', handleOpen)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 132)}px`
  }, [input])

  const isStaff = isAuthenticated && ['Admin', 'Moderator', 'Cashier', 'STORE_OWNER', 'ONLINE_MANAGER'].some((role) => hasRole(role))
  if (!isStaff) return null

  const showFinancialPrompt = hasRole('Admin') || hasRole('STORE_OWNER')
  const roleLabel = user?.role || user?.roles?.[0] || 'عضو فريق'

  async function handleSend(promptOverride) {
    const prompt = (promptOverride ?? input).trim()
    if (!prompt || isSending) return
    const history = messages.map(({ role, content }) => ({ role, content }))
    setMessages((current) => [...current, { role: 'user', content: prompt }])
    setInput('')
    setError(null)
    setIsSending(true)
    try {
      const response = await sendAiChatMessage(prompt, history)
      setMessages((current) => [...current, { role: 'assistant', content: response?.reply || 'لم يصل رد من المساعد.', downloadUrl: response?.downloadUrl, downloadFileName: response?.downloadFileName }])
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر الوصول للمساعد الذكي، حاول مرة أخرى.')
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleSend()
    }
  }

  function clearChat() {
    if (isSending) return
    setMessages([])
    setError(null)
  }

  async function copyMessage(content) {
    try {
      await navigator.clipboard.writeText(content)
      setMessages((current) => current.map((message) => message.content === content && message.role === 'assistant' ? { ...message, copied: true } : message))
      window.setTimeout(() => setMessages((current) => current.map((message) => message.content === content ? { ...message, copied: false } : message)), 1600)
    } catch { /* Clipboard access is optional. */ }
  }

  return (
    <div dir="rtl">
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 start-6 z-50 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-graphite-900 text-amber shadow-2xl shadow-graphite-950/25 transition duration-200 hover:-translate-y-1 hover:bg-graphite-800" aria-label="فتح المساعد الذكي">
          <Sparkles size={23} />
          <span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-emerald-400" />
        </button>
      )}

      {isOpen && <div className="fixed inset-0 z-40 bg-graphite-950/35 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} aria-hidden="true" />}

      {isOpen && (
        <section className={`fixed inset-y-0 start-0 z-50 flex w-full flex-col overflow-hidden border-e border-white/10 bg-canvas shadow-2xl transition-[width] duration-300 sm:inset-y-4 sm:start-4 sm:h-[calc(100vh-2rem)] sm:rounded-3xl ${isExpanded ? 'sm:w-[min(920px,calc(100vw-2rem))]' : 'sm:w-[min(500px,calc(100vw-2rem))]'}`} aria-label="مساعد ابن الزمر">
          <header className="shrink-0 bg-graphite-900 px-4 py-4 text-white sm:px-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <AssistantAvatar />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate font-display text-sm font-semibold">مساعد ابن الزمر</h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-medium text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> جاهز</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-white/50">مساعد العمليات · {roleLabel}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={clearChat} disabled={!messages.length || isSending} className="grid h-9 w-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30" aria-label="مسح المحادثة" title="مسح المحادثة"><Trash2 size={16} /></button>
                <button onClick={() => setIsExpanded((current) => !current)} className="hidden h-9 w-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white sm:grid" aria-label={isExpanded ? 'تصغير' : 'توسيع'} title={isExpanded ? 'تصغير' : 'توسيع'}>{isExpanded ? <PanelRightClose size={17} /> : <Expand size={16} />}</button>
                <button onClick={() => setIsOpen(false)} className="grid h-9 w-9 place-items-center rounded-xl text-white/55 transition hover:bg-white/10 hover:text-white" aria-label="إغلاق"><X size={18} /></button>
              </div>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center py-10 text-center">
                <div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-amber/20 bg-amber/10 text-amber-dark"><Sparkles size={28} /></div>
                <h3 className="font-display text-lg font-semibold text-graphite-950">كيف أساعدك اليوم؟</h3>
                <p className="mt-2 max-w-xs text-xs leading-6 text-graphite-500">اسألني عن الطلبات، المخزون{showFinancialPrompt ? '، المبيعات' : ''} أو أي من عمليات المتجر.</p>
                <div className="mt-6 flex max-w-md flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.filter((prompt) => showFinancialPrompt || prompt.label !== 'ملخص المبيعات').map((prompt) => <button key={prompt.label} onClick={() => handleSend(prompt.prompt)} className="group inline-flex items-center gap-1.5 rounded-full border border-graphite-200 bg-white px-3.5 py-2 text-xs font-medium text-graphite-700 shadow-subtle transition hover:-translate-y-0.5 hover:border-amber hover:text-graphite-950"><Plus size={13} className="text-amber-dark transition group-hover:rotate-90" />{prompt.label}</button>)}
                </div>
              </div>
            ) : <div className="space-y-5 pb-8">{messages.map((message, index) => <ChatMessage key={`${message.role}-${index}`} message={message} onCopy={copyMessage} />)}</div>}
            {isSending && <TypingIndicator />}
            {error && <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"><span>{error}</span><button onClick={() => setError(null)} aria-label="إغلاق التنبيه"><X size={14} /></button></div>}
          </div>

          <footer className="shrink-0 border-t border-graphite-200 bg-white/90 p-3 backdrop-blur sm:p-4">
            <div className="rounded-2xl border border-graphite-200 bg-canvas p-2 shadow-subtle transition focus-within:border-amber focus-within:ring-4 focus-within:ring-amber/10">
              <textarea ref={textareaRef} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleKeyDown} placeholder="اكتب رسالتك هنا..." rows={1} disabled={isSending} className="max-h-[132px] min-h-[28px] w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-7 text-graphite-900 outline-none placeholder:text-graphite-400 disabled:opacity-60" aria-label="رسالة المساعد" />
              <div className="mt-1 flex items-center justify-between gap-2 px-1">
                <div className="flex items-center gap-1">
                  <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-graphite-400 transition hover:bg-graphite-200 hover:text-graphite-700" aria-label="إرفاق ملف" title="إرفاق ملف (قريباً)"><FileUp size={16} /></button>
                  <button type="button" className="grid h-8 w-8 place-items-center rounded-lg text-graphite-400 transition hover:bg-graphite-200 hover:text-graphite-700" aria-label="الإملاء الصوتي" title="الإملاء الصوتي (قريباً)"><Mic size={16} /></button>
                  <span className="hidden text-[10px] text-graphite-400 sm:inline">Enter للإرسال · Shift + Enter لسطر جديد</span>
                </div>
                <button onClick={() => handleSend()} disabled={isSending || !input.trim()} className="grid h-9 w-9 place-items-center rounded-xl bg-graphite-900 text-amber shadow-lg shadow-graphite-900/15 transition hover:-translate-y-0.5 hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-35" aria-label="إرسال الرسالة">
                  {isSending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                </button>
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-graphite-400">قد يخطئ المساعد أحياناً، راجع المعلومات المهمة قبل اعتمادها.</p>
          </footer>
        </section>
      )}
    </div>
  )
}
