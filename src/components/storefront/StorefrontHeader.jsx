// File: src/components/storefront/StorefrontHeader.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Grid2X2, Languages, LogIn, LogOut, Mic, MicOff, Search, ShoppingCart, Store, UserCircle2, Wrench } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useLanguage } from '../../context/LanguageContext'
import { useStorefrontSearch } from '../../context/StorefrontSearchContext'

const CATEGORY_LINKS = [
  { label: 'عدد وأدوات', query: 'عدد وأدوات' },
  { label: 'مستلزمات الهواء', query: 'مستلزمات الهواء' },
  { label: 'مستلزمات الكهرباء', query: 'مستلزمات الكهرباء' },
  { label: 'مستلزمات السباكة', query: 'مستلزمات السباكة' },
  { label: 'معدات السلامة', query: 'معدات السلامة' },
  { label: 'مواد التشطيبات', query: 'مواد التشطيبات' },
]

export default function StorefrontHeader() {
  const { itemCount, openCart } = useCart()
  const { user, isAuthenticated, logout } = useAuth()
  const { searchInput, setSearchInput } = useStorefrontSearch()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [isListening, setIsListening] = useState(false)
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false)
  const recognitionRef = useRef(null)
  const categoriesMenuRef = useRef(null)

  const speechRecognition = useMemo(() => {
    if (typeof window === 'undefined') return null
    return window.SpeechRecognition || window.webkitSpeechRecognition || null
  }, [])

  useEffect(() => {
    if (!speechRecognition) return undefined

    const recognition = new speechRecognition()
    recognition.lang = 'ar-EG'
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onstart = () => setIsListening(true)
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim()
      if (transcript) {
        setSearchInput(transcript)
      }
    }

    recognitionRef.current = recognition

    return () => {
      recognitionRef.current?.abort?.()
      recognitionRef.current = null
    }
  }, [speechRecognition, setSearchInput])

  useEffect(() => {
    function handlePointerDown(event) {
      if (categoriesMenuRef.current && !categoriesMenuRef.current.contains(event.target)) {
        setIsCategoriesOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsCategoriesOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function handleVoiceSearch() {
    const recognition = recognitionRef.current
    if (!recognition) return

    if (isListening) {
      recognition.stop()
      return
    }

    recognition.lang = language === 'en' ? 'en-US' : 'ar-EG'
    try {
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }

  function handleCategorySelect(category) {
    setSearchInput(category.query)
    setIsCategoriesOpen(false)

    if (location.pathname !== '/') {
      navigate('/')
      return
    }

    window.setTimeout(() => {
      document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 0)
  }

  const languageLabel = language === 'ar' ? 'AR' : 'EN'
  const listeningStyle = isListening ? 'border-danger/40 bg-danger/10 text-danger shadow-[0_0_0_4px_rgba(214,69,69,0.12)]' : 'text-ink-soft hover:bg-canvas hover:text-ink'

  return (
    <header className="border-b border-border bg-surface/95 shadow-subtle backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-3 lg:shrink-0">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-graphite-900 text-amber shadow-subtle">
                <Wrench size={18} strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <span className="block font-display text-base font-semibold tracking-tight text-ink" dir="auto">
                  ابن الزمر
                </span>
                <span className="text-[11px] font-medium uppercase tracking-[0.24em] text-ink-soft">Industrial Supply</span>
              </div>
            </Link>

            <div className="flex items-center gap-2 lg:hidden">
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-ink shadow-subtle transition hover:border-amber"
                aria-label="تبديل اللغة"
                title="تبديل اللغة"
              >
                <Languages size={16} />
                <span>{languageLabel}</span>
              </button>
              <button
                type="button"
                onClick={openCart}
                className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-medium text-ink shadow-subtle transition hover:border-amber"
                aria-label="فتح السلة"
              >
                <ShoppingCart size={16} />
                {itemCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1 font-mono text-xs font-semibold text-graphite-900">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          <div className="relative flex-1 lg:max-w-3xl">
            <Search size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="ابحث بالكود SKU أو اسم المنتج..."
              className="w-full rounded-2xl border border-border bg-canvas py-3.5 pl-12 pr-12 text-sm text-ink shadow-subtle outline-none transition placeholder:text-ink-soft/65 focus:border-amber focus:bg-surface focus:ring-2 focus:ring-amber/20"
              dir={language === 'en' ? 'ltr' : 'rtl'}
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              disabled={!speechRecognition}
              className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-xl border p-2 transition ${listeningStyle} disabled:cursor-not-allowed disabled:opacity-50`}
              aria-label={isListening ? 'إيقاف الإملاء الصوتي' : 'بدء البحث الصوتي'}
              title={speechRecognition ? (isListening ? 'إيقاف البحث الصوتي' : 'بحث صوتي') : 'البحث الصوتي غير مدعوم'}
            >
              {isListening ? (
                <span className="relative inline-flex h-4 w-4 items-center justify-center">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger/70" />
                  <span className="absolute h-2 w-2 rounded-full bg-danger" />
                  <MicOff size={16} className="relative text-danger" />
                </span>
              ) : (
                <Mic size={16} />
              )}
            </button>
          </div>

          <div className="hidden items-center gap-2 lg:flex">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm font-medium text-ink shadow-subtle transition hover:border-amber"
              aria-label="تبديل اللغة"
              title="تبديل اللغة"
            >
              <Languages size={18} />
              <span>{languageLabel}</span>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-canvas px-3 py-2 shadow-subtle">
                <Link to="/admin/login" className="inline-flex items-center gap-2 rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-ink transition hover:border-amber hover:bg-canvas">
                  <UserCircle2 size={18} />
                  <span className="max-w-40 truncate" dir="auto">
                    {user?.fullName || 'حسابي'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition hover:text-danger"
                  aria-label="تسجيل الخروج"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border border-border bg-canvas px-3 py-2 shadow-subtle">
                <Link to="/admin/login" className="inline-flex items-center gap-2 rounded-xl bg-graphite-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-graphite-800">
                  <LogIn size={16} />
                  <span>تسجيل الدخول / الاشتراك</span>
                </Link>
                <Link to="/admin/login" className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-ink-soft transition hover:bg-surface hover:text-ink">
                  <UserCircle2 size={16} />
                  <span>حسابي</span>
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={openCart}
              className="relative inline-flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-subtle transition hover:border-amber"
              aria-label="فتح السلة"
            >
              <ShoppingCart size={18} />
              <span>السلة</span>
              {itemCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-amber px-1 font-mono text-xs font-semibold text-graphite-900">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2" ref={categoriesMenuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((current) => !current)}
              className="inline-flex items-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-sm font-semibold text-white shadow-subtle transition hover:bg-graphite-800"
              aria-haspopup="menu"
              aria-expanded={isCategoriesOpen}
            >
              <Grid2X2 size={18} />
              <span>التصنيفات</span>
              <ChevronDown size={16} className={`transition ${isCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoriesOpen && (
              <div className="absolute right-0 top-full z-20 mt-2 w-[min(92vw,28rem)] rounded-2xl border border-border bg-surface p-3 shadow-2xl">
                <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-ink-soft">
                  <Store size={14} />
                  <span>تصفح سريع</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {CATEGORY_LINKS.map((category) => (
                    <button
                      key={category.label}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className="rounded-xl border border-border bg-canvas px-3 py-3 text-right text-sm font-medium text-ink transition hover:border-amber hover:bg-surface"
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="hidden text-sm text-ink-soft md:block">
            {searchInput.trim() ? `بحث نشط: ${searchInput.trim()}` : 'استخدم البحث السريع أو اختر القسم المناسب.'}
          </p>
        </div>
      </div>
    </header>
  )
}
