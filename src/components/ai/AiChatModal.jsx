// File: src/components/ai/AiChatModal.jsx
import { useEffect, useRef, useState } from 'react'
import { Bot, Download, Loader2, Send, Sparkles, X } from 'lucide-react'
import { sendAiChatMessage } from '../api/AiApi'
import { useAuth } from '../../context/AuthContext'

const QUICK_PROMPTS = [
  { label: 'الطلبات المعلقة', prompt: 'أظهر الطلبات المعلقة حالياً' },
  { label: 'تنبيهات المخزون', prompt: 'ما هي المنتجات التي أوشك مخزونها على النفاد؟' },
  { label: 'ملخص المبيعات', prompt: 'أعطني ملخص المبيعات لآخر 7 أيام' },
]

/** Turns a handful of light markdown conventions (bold, bullets, line breaks) into JSX. */
function formatAssistantText(text) {
  if (!text) return null

  return text.split('\n').map((line, lineIdx) => {
    const trimmed = line.trim()
    const isBullet = trimmed.startsWith('- ') || trimmed.startsWith('• ')
    const content = isBullet ? trimmed.slice(2) : line

    const parts = content.split(/(\*\*[^*]+\*\*)/g).map((chunk, i) =>
      chunk.startsWith('**') && chunk.endsWith('**') ? (
        <strong key={i} className="font-semibold text-graphite-900">
          {chunk.slice(2, -2)}
        </strong>
      ) : (
        <span key={i}>{chunk}</span>
      )
    )

    if (isBullet) {
      return (
        <li key={lineIdx} className="ms-4 list-disc">
          {parts}
        </li>
      )
    }

    return (
      <p key={lineIdx} className={lineIdx > 0 ? 'mt-1.5' : ''}>
        {parts}
      </p>
    )
  })
}

function ChatBubble({ role, content, downloadUrl, downloadFileName }) {
  const isUser = role === 'user'
  return (
    <div className={`flex flex-col ${isUser ? 'items-start' : 'items-end'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
          isUser
            ? 'rounded-ss-sm bg-graphite-100 text-graphite-900'
            : 'rounded-se-sm bg-graphite-900 text-white'
        }`}
      >
        {isUser ? content : formatAssistantText(content)}
        
        {!isUser && downloadUrl && (
          <div className="mt-3 pt-2 border-t border-white/20">
            <a
              href={downloadUrl}
              download={downloadFileName || 'export.xlsx'}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-amber px-3 py-1.5 text-xs font-semibold text-graphite-900 transition hover:bg-amber-400"
            >
              <Download size={14} />
              تحميل الملف {downloadFileName ? `(${downloadFileName})` : ''}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-se-sm bg-graphite-900 px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-bounce rounded-full bg-amber"
            style={{ animationDelay: `${i * 120}ms` }}
          />
        ))}
      </div>
    </div>
  )
}

export default function AiChatModal() {
  const { isAuthenticated, hasRole, user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState(null)
  const scrollRef = useRef(null)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-ai-chat', handleOpen)
    return () => window.removeEventListener('open-ai-chat', handleOpen)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  const isStaff =
    isAuthenticated &&
    (hasRole('Admin') || hasRole('Moderator') || hasRole('Cashier') || hasRole('STORE_OWNER') || hasRole('ONLINE_MANAGER'))

  if (!isStaff) return null

  const showFinancialPrompt = hasRole('Admin') || hasRole('STORE_OWNER')

  async function handleSend(promptOverride) {
    const prompt = (promptOverride ?? input).trim()
    if (!prompt || isSending) return

    const history = messages.map((m) => ({ role: m.role, content: m.content }))
    const nextMessages = [...messages, { role: 'user', content: prompt }]

    setMessages(nextMessages)
    setInput('')
    setError(null)
    setIsSending(true)

    try {
      const { reply, downloadUrl, downloadFileName } = await sendAiChatMessage(prompt, history)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, downloadUrl, downloadFileName }
      ])
    } catch (err) {
      setError(err?.message || 'تعذر الوصول للمساعد الذكي، حاول مرة أخرى.')
    } finally {
      setIsSending(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <>
      {/* Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 start-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-graphite-900 text-amber shadow-xl transition hover:scale-105 hover:bg-graphite-800"
          aria-label="فتح المساعد الذكي"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Panel */}
      {isOpen && (
        <div
          dir="rtl"
          className="fixed bottom-6 start-6 z-50 flex h-[min(640px,80vh)] w-[min(380px,90vw)] flex-col overflow-hidden rounded-2xl border border-graphite-200 bg-canvas shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between bg-graphite-900 px-4 py-3.5 text-white">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-amber text-graphite-900">
                <Bot size={16} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">مساعد ابن الزمر</p>
                <p className="text-xs leading-tight text-white/50">
                  {user?.role ? `صلاحية: ${user.role}` : 'مساعد ذكي'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/60 transition hover:text-white"
              aria-label="إغلاق"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-center text-sm text-graphite-500">
                  اسأل عن الطلبات، المخزون{showFinancialPrompt ? '، أو المبيعات' : ''} — وسأساعدك فوراً.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {QUICK_PROMPTS.filter((q) => showFinancialPrompt || q.label !== 'ملخص المبيعات').map((q) => (
                    <button
                      key={q.label}
                      onClick={() => handleSend(q.prompt)}
                      className="rounded-full border border-graphite-200 bg-white px-3 py-1.5 text-xs font-medium text-graphite-700 transition hover:border-amber hover:text-graphite-900"
                    >
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, idx) => (
              <ChatBubble
                key={idx}
                role={m.role}
                content={m.content}
                downloadUrl={m.downloadUrl}
                downloadFileName={m.downloadFileName}
              />
            ))}

            {isSending && <TypingIndicator />}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">{error}</p>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-graphite-200 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="اكتب رسالتك..."
                rows={1}
                disabled={isSending}
                className="max-h-28 flex-1 resize-none rounded-xl border border-graphite-200 bg-canvas px-3 py-2 text-sm text-graphite-900 outline-none focus:border-amber disabled:opacity-60"
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || !input.trim()}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-graphite-900 text-amber transition hover:bg-graphite-800 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="إرسال"
              >
                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}