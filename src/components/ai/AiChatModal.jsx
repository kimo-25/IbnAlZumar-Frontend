import { useEffect, useRef, useState } from 'react'
import { Bot, Check, Clipboard, Download, Expand, FileUp, Loader2, Mic, PanelRightClose, Plus, Send, Sparkles, Trash2, X } from 'lucide-react'
import { streamAiChatMessage } from '../../api/AiApi'
import { useAuth } from '../../context/AuthContext'
import AssistantResponseRenderer from './AiResponseRenderer'

const QUICK_PROMPTS = [
  { label: 'الطلبات المعلقة', prompt: 'أظهر الطلبات المعلقة حالياً' },
  { label: 'تنبيهات المخزون', prompt: 'ما هي المنتجات التي أوشك مخزونها على النفاد؟' },
  { label: 'ملخص المبيعات', prompt: 'أعطني ملخص المبيعات لآخر 7 أيام' },
]
const ACCEPTED_FILES = '.pdf,.txt,.docx,.xlsx,.xls,image/jpeg,image/png,image/webp'

function AssistantAvatar({ small = false }) {
  return <div className={`relative grid shrink-0 place-items-center rounded-2xl bg-amber text-graphite-950 shadow-[0_0_0_4px_rgba(242,169,0,0.12)] ${small ? 'h-8 w-8 rounded-xl' : 'h-10 w-10'}`}><Bot size={small ? 16 : 19} strokeWidth={2.4} /><span className="absolute -bottom-0.5 -end-0.5 h-2.5 w-2.5 rounded-full border-2 border-graphite-900 bg-emerald-400" /></div>
}
function ChatMessage({ message, onCopy }) {
  const isUser = message.role === 'user'
  return <div className={`flex w-full gap-2.5 ${isUser ? 'flex-row-reverse justify-start' : 'justify-start'}`}>
    {isUser ? <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-graphite-200 text-xs font-bold text-graphite-700">أنت</div> : <AssistantAvatar small />}
    <div className="max-w-[min(86%,620px)]"><div className={`group relative rounded-2xl px-4 py-3 ${isUser ? 'rounded-se-md bg-graphite-900 text-white' : 'rounded-ss-md border border-graphite-200 bg-white'}`}>
      {isUser ? <><p className="whitespace-pre-wrap text-[13px] leading-6" dir="auto">{message.content}</p>{message.files?.length > 0 && <div className="mt-2 flex flex-wrap gap-1">{message.files.map((file) => <span key={file.name} className="rounded bg-white/10 px-2 py-1 text-[10px]">{file.name}</span>)}</div>}</> : <AssistantResponseRenderer content={message.content} />}
      {!isUser && <button onClick={() => onCopy(message.content)} className="absolute -bottom-8 start-0 inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] text-graphite-400 opacity-0 transition hover:bg-graphite-100 hover:text-graphite-700 group-hover:opacity-100" aria-label="نسخ الرد">{message.copied ? <Check size={12} /> : <Clipboard size={12} />}{message.copied ? 'تم النسخ' : 'نسخ'}</button>}
      {!isUser && message.downloadUrl && <a href={message.downloadUrl} download={message.downloadFileName || 'export.xlsx'} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 rounded-xl bg-amber px-3 py-2 text-xs font-semibold text-graphite-950"><Download size={14} /> تحميل الملف</a>}
    </div><span className={`mt-1.5 block px-1 text-[10px] text-graphite-400 ${isUser ? 'text-start' : 'text-end'}`}>{isUser ? 'أنت' : 'مساعد ابن الزمر'}</span></div>
  </div>
}
function TypingIndicator() { return <div className="flex items-start gap-2.5"><AssistantAvatar small /><div className="flex items-center gap-1.5 rounded-2xl rounded-ss-md border border-graphite-200 bg-white px-4 py-3.5"><span className="sr-only">المساعد يكتب</span>{[0, 1, 2].map((i) => <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber-dark" style={{ animationDelay: `${i * 120}ms` }} />)}</div></div> }

export default function AiChatModal() {
  const { isAuthenticated, hasRole, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false); const [isExpanded, setIsExpanded] = useState(false); const [messages, setMessages] = useState([]); const [input, setInput] = useState(''); const [files, setFiles] = useState([]); const [isSending, setIsSending] = useState(false); const [isRecording, setIsRecording] = useState(false); const [error, setError] = useState(null)
  const scrollRef = useRef(null); const textareaRef = useRef(null); const fileRef = useRef(null); const abortRef = useRef(null); const recorderRef = useRef(null); const recognitionRef = useRef(null)
  useEffect(() => { const open = () => setIsOpen(true); window.addEventListener('open-ai-chat', open); return () => window.removeEventListener('open-ai-chat', open) }, [])
  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }) }, [messages, isSending])
  useEffect(() => { if (textareaRef.current) { textareaRef.current.style.height = 'auto'; textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 132)}px` } }, [input])
  useEffect(() => () => { abortRef.current?.abort(); recorderRef.current?.stream?.getTracks().forEach((track) => track.stop()); recognitionRef.current?.stop() }, [])
  if (!isAuthenticated) return null
  const showFinancialPrompt = hasRole('Admin') || hasRole('STORE_OWNER')
  const roleLabel = user?.role || user?.roles?.[0] || 'عضو فريق'

  function selectFiles(event) { setFiles((current) => [...current, ...Array.from(event.target.files || [])].slice(0, 5)); event.target.value = '' }
  function removeFile(name) { setFiles((current) => current.filter((file) => file.name !== name)) }
  function toggleRecording() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (isRecording) { recognitionRef.current?.stop(); recorderRef.current?.stop(); setIsRecording(false); return }
    if (Recognition) { const recognition = new Recognition(); recognition.lang = 'ar-SA'; recognition.continuous = false; recognition.interimResults = true; recognition.onresult = (event) => setInput(Array.from(event.results).map((result) => result[0].transcript).join('')); recognition.onerror = () => setError('تعذر تشغيل الإملاء الصوتي.'); recognition.onend = () => setIsRecording(false); recognitionRef.current = recognition; recognition.start(); setIsRecording(true); return }
    if (!navigator.mediaDevices?.getUserMedia) { setError('الإملاء الصوتي غير مدعوم في هذا المتصفح.'); return }
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => { const recorder = new MediaRecorder(stream); recorder.stream = stream; recorderRef.current = recorder; recorder.start(); recorder.ondataavailable = () => {}; recorder.onstop = () => stream.getTracks().forEach((track) => track.stop()); setIsRecording(false) }).catch(() => setError('تعذر الوصول إلى الميكروفون.'))
    setIsRecording(true)
  }
  async function handleSend(promptOverride) {
    const prompt = (promptOverride ?? input).trim(); if ((!prompt && !files.length) || isSending) return
    const history = messages.map(({ role, content }) => ({ role, content })); const selectedFiles = files
    setMessages((current) => [...current, { role: 'user', content: prompt || 'مرفقات', files: selectedFiles }]); setInput(''); setFiles([]); setError(null); setIsSending(true)
    const assistantIndex = messages.length + 1; setMessages((current) => [...current, { role: 'assistant', content: '' }]); abortRef.current = new AbortController()
    try { const meta = await streamAiChatMessage(prompt || 'حلل الملفات المرفقة.', history, selectedFiles, { signal: abortRef.current.signal, onToken: (text) => setMessages((current) => current.map((m, i) => i === assistantIndex ? { ...m, content: m.content + text } : m)), onComplete: (data) => setMessages((current) => current.map((m, i) => i === assistantIndex ? { ...m, content: data.reply || m.content, downloadUrl: data.downloadUrl, downloadFileName: data.downloadFileName } : m)) }); if (meta?.reply) setMessages((current) => current.map((m, i) => i === assistantIndex ? { ...m, content: meta.reply, downloadUrl: meta.downloadUrl, downloadFileName: meta.downloadFileName } : m)) } catch (err) { if (err.name !== 'AbortError') { setError(err.message || 'تعذر الوصول للمساعد الذكي، حاول مرة أخرى.'); setMessages((current) => current.filter((_, i) => i !== assistantIndex)) } } finally { setIsSending(false); abortRef.current = null }
  }
  function copyMessage(content) { navigator.clipboard?.writeText(content).then(() => setMessages((current) => current.map((m) => m.content === content && m.role === 'assistant' ? { ...m, copied: true } : m))).catch(() => {}) }
  function clearChat() { if (!isSending) { setMessages([]); setError(null) } }
  return <div dir="rtl">
    {!isOpen && <button onClick={() => setIsOpen(true)} className="fixed bottom-6 start-6 z-50 grid h-14 w-14 place-items-center rounded-2xl border border-white/10 bg-graphite-900 text-amber shadow-2xl transition hover:-translate-y-1" aria-label="فتح المساعد الذكي"><Sparkles size={23} /><span className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-canvas bg-emerald-400" /></button>}
    {isOpen && <div className="fixed inset-0 z-40 bg-graphite-950/35 backdrop-blur-[2px]" onClick={() => setIsOpen(false)} />}
    {isOpen && <section className={`fixed inset-y-0 start-0 z-50 flex w-full flex-col overflow-hidden border-e border-white/10 bg-canvas shadow-2xl sm:inset-y-4 sm:start-4 sm:h-[calc(100vh-2rem)] sm:rounded-3xl ${isExpanded ? 'sm:w-[min(920px,calc(100vw-2rem))]' : 'sm:w-[min(500px,calc(100vw-2rem))]'}`} aria-label="مساعد ابن الزمر">
      <header className="shrink-0 bg-graphite-900 px-4 py-4 text-white"><div className="flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><AssistantAvatar /><div><h2 className="font-display text-sm font-semibold">مساعد ابن الزمر</h2><p className="mt-1 text-xs text-white/50">مساعد العمليات · {roleLabel}</p></div></div><div className="flex gap-1"><button onClick={clearChat} className="grid h-9 w-9 place-items-center text-white/55" aria-label="مسح المحادثة"><Trash2 size={16} /></button><button onClick={() => setIsExpanded((v) => !v)} className="hidden h-9 w-9 place-items-center text-white/55 sm:grid" aria-label="توسيع">{isExpanded ? <PanelRightClose size={17} /> : <Expand size={16} />}</button><button onClick={() => setIsOpen(false)} className="grid h-9 w-9 place-items-center text-white/55" aria-label="إغلاق"><X size={18} /></button></div></div></header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5 sm:px-5">{!messages.length ? <div className="flex min-h-full flex-col items-center justify-center py-10 text-center"><div className="mb-4 grid h-16 w-16 place-items-center rounded-3xl border border-amber/20 bg-amber/10 text-amber-dark"><Sparkles size={28} /></div><h3 className="font-display text-lg font-semibold">كيف أساعدك اليوم؟</h3><p className="mt-2 max-w-xs text-xs leading-6 text-graphite-500">اسألني عن الطلبات، المخزون{showFinancialPrompt ? '، المبيعات' : ''} أو عمليات المتجر.</p><div className="mt-6 flex flex-wrap justify-center gap-2">{QUICK_PROMPTS.filter((p) => showFinancialPrompt || p.label !== 'ملخص المبيعات').map((p) => <button key={p.label} onClick={() => handleSend(p.prompt)} className="inline-flex items-center gap-1.5 rounded-full border border-graphite-200 bg-white px-3.5 py-2 text-xs font-medium"><Plus size={13} className="text-amber-dark" />{p.label}</button>)}</div></div> : <div className="space-y-5 pb-8">{messages.map((m, i) => <ChatMessage key={`${m.role}-${i}`} message={m} onCopy={copyMessage} />)}</div>}{isSending && <TypingIndicator />}{error && <div className="mt-4 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs text-red-700"><span>{error}</span><button onClick={() => setError(null)} aria-label="إغلاق التنبيه"><X size={14} /></button></div>}</div>
      <footer className="shrink-0 border-t border-graphite-200 bg-white/90 p-3 sm:p-4"><div className="rounded-2xl border border-graphite-200 bg-canvas p-2 shadow-subtle focus-within:border-amber"><textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }} placeholder="اكتب رسالتك هنا..." rows={1} disabled={isSending} className="max-h-[132px] min-h-[28px] w-full resize-none border-0 bg-transparent px-2 py-1 text-sm leading-7 outline-none" aria-label="رسالة المساعد" />{files.length > 0 && <div className="flex flex-wrap gap-1 px-1 pb-1">{files.map((file) => <span key={file.name} className="inline-flex items-center gap-1 rounded-lg bg-graphite-200 px-2 py-1 text-[10px]">{file.name}<button onClick={() => removeFile(file.name)} aria-label={`إزالة ${file.name}`}><X size={11} /></button></span>)}</div>}<div className="mt-1 flex items-center justify-between px-1"><div className="flex items-center gap-1"><input ref={fileRef} type="file" accept={ACCEPTED_FILES} multiple hidden onChange={selectFiles} /><button type="button" onClick={() => fileRef.current?.click()} className="grid h-8 w-8 place-items-center text-graphite-400" aria-label="إرفاق ملف"><FileUp size={16} /></button><button type="button" onClick={toggleRecording} className={`grid h-8 w-8 place-items-center ${isRecording ? 'text-red-600' : 'text-graphite-400'}`} aria-label={isRecording ? 'إيقاف التسجيل' : 'الإملاء الصوتي'}><Mic size={16} /></button></div><button onClick={() => handleSend()} disabled={isSending || (!input.trim() && !files.length)} className="grid h-9 w-9 place-items-center rounded-xl bg-graphite-900 text-amber disabled:opacity-35" aria-label="إرسال الرسالة">{isSending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}</button></div></div><p className="mt-2 text-center text-[10px] text-graphite-400">Enter للإرسال · Shift + Enter لسطر جديد</p></footer>
    </section>}
  </div>
}