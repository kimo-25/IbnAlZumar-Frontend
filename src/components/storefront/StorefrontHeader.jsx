// File: src/components/storefront/StorefrontHeader.jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ChevronDown, Grid2X2, Languages, LogIn, LogOut, Menu, Mic, MicOff, Search, ShoppingCart, Store, UserCircle2, Wrench, X } from 'lucide-react'
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  
  const recognitionRef = useRef(null)
  const categoriesMenuRef = useRef(null)

  // منع السكرول في الخلفية عند فتح قائمة الموبايل
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

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
        setIsMobileMenuOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location.pathname])

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
    setIsMobileMenuOpen(false)

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
    <header className="border-b border-border bg-surface/95 shadow-subtle backdrop-blur relative z-40">
      <div className="mx-auto max-w-7xl px-3 py-3 sm:px-6">
        {/* الصف العلوي: اللوجو وأزرار التحكم */}
        <div className="flex items-center justify-between gap-2">
          
          {/* الجانب الأيمن للموبايل: زر الهامبرجر والشعار */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="inline-flex lg:hidden items-center justify-center rounded-xl border border-border bg-surface p-2 text-ink shadow-subtle transition hover:border-amber"
              aria-label="فتح القائمة الرئيسية"
            >
              <Menu size={20} />
            </button>

            {/* الشعار والاسم */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              <div className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-graphite-900 text-amber shadow-subtle">
                <Wrench size={18} strokeWidth={2.5} />
              </div>
              <div className="leading-tight">
                <span className="block font-display text-sm sm:text-base font-semibold tracking-tight text-ink" dir="auto">
                  ابن الزمر
                </span>
                <span className="text-[10px] sm:text-[11px] font-medium uppercase tracking-[0.2em] text-ink-soft">Industrial Supply</span>
              </div>
            </Link>
          </div>

          {/* أزرار الإجراءات للشاشات الكبيرة */}
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

          {/* أزرار الموبايل السريعة (اللغة والسلة فقط) */}
          <div className="flex items-center gap-1.5 lg:hidden">
            <button
              type="button"
              onClick={toggleLanguage}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink shadow-subtle transition hover:border-amber"
              aria-label="تبديل اللغة"
            >
              <Languages size={14} />
              <span>{languageLabel}</span>
            </button>
            <button
              type="button"
              onClick={openCart}
              className="relative inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs font-medium text-ink shadow-subtle transition hover:border-amber"
              aria-label="فتح السلة"
            >
              <ShoppingCart size={14} />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-amber px-0.5 font-mono text-[10px] font-semibold text-graphite-900">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* شريط البحث */}
        <div className="mt-3 relative w-full">
          <Search size={18} className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="ابحث بالكود SKU أو اسم المنتج..."
            className="w-full rounded-2xl border border-border bg-canvas py-3 pl-11 pr-11 text-xs sm:text-sm text-ink shadow-subtle outline-none transition placeholder:text-ink-soft/65 focus:border-amber focus:bg-surface focus:ring-2 focus:ring-amber/20"
            dir={language === 'en' ? 'ltr' : 'rtl'}
          />
          <button
            type="button"
            onClick={handleVoiceSearch}
            disabled={!speechRecognition}
            className={`absolute left-2 top-1/2 -translate-y-1/2 rounded-xl border p-1.5 sm:p-2 transition ${listeningStyle} disabled:cursor-not-allowed disabled:opacity-50`}
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

        {/* التصنيفات وحالة البحث */}
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2" ref={categoriesMenuRef}>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsCategoriesOpen((current) => !current)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-subtle transition hover:bg-graphite-800"
              aria-haspopup="menu"
              aria-expanded={isCategoriesOpen}
            >
              <Grid2X2 size={16} />
              <span>التصنيفات</span>
              <ChevronDown size={14} className={`transition ${isCategoriesOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCategoriesOpen && (
              <div className="absolute right-0 sm:right-auto sm:left-0 top-full z-30 mt-2 w-full sm:w-[28rem] rounded-2xl border border-border bg-surface p-3 shadow-2xl">
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
                      className="rounded-xl border border-border bg-canvas px-3 py-2.5 text-right text-xs sm:text-sm font-medium text-ink transition hover:border-amber hover:bg-surface"
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-ink-soft text-center sm:text-right">
            {searchInput.trim() ? `بحث نشط: ${searchInput.trim()}` : 'استخدم البحث السريع أو اختر القسم المناسب.'}
          </p>
        </div>
      </div>

      {/* قائمة الموبايل الجانبية (Mobile Drawer) بدون سكرول وبلور للخلفية */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* الخلفية المعتمة مع البلور */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-md transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* محتوى القائمة بدون شريط تمرير ظاهر */}
          <div className="relative ml-auto w-80 max-w-[85%] bg-surface border-r border-border shadow-2xl flex flex-col h-screen z-10 p-5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            
            {/* رأس القائمة الجانبية */}
            <div className="flex items-center justify-between pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-xl bg-graphite-900 text-amber">
                  <Wrench size={18} strokeWidth={2.5} />
                </div>
                <div>
                  <span className="block font-display font-semibold text-ink text-sm">ابن الزمر</span>
                  <span className="text-[10px] text-ink-soft uppercase tracking-wider">Industrial Supply</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-xl text-ink-soft hover:bg-canvas hover:text-ink transition border border-border"
                aria-label="إغلاق القائمة"
              >
                <X size={18} />
              </button>
            </div>

            {/* قسم الحساب والتسجيل */}
            <div className="py-4 border-b border-border shrink-0">
              {isAuthenticated ? (
                <div className="flex flex-col gap-2">
                  <Link 
                    to="/admin/login" 
                    className="flex items-center gap-2.5 rounded-xl bg-canvas px-3.5 py-3 text-sm font-semibold text-ink border border-border hover:border-amber transition"
                  >
                    <UserCircle2 size={18} className="text-amber" />
                    <span className="truncate">{user?.fullName || 'حسابي'}</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => { logout(); setIsMobileMenuOpen(false); }}
                    className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 transition"
                  >
                    <LogOut size={16} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <Link 
                    to="/admin/login" 
                    className="flex items-center justify-center gap-2 rounded-xl bg-graphite-900 px-4 py-3 text-sm font-semibold text-white shadow-subtle hover:bg-graphite-800 transition"
                  >
                    <LogIn size={16} className="text-amber" />
                    <span>تسجيل الدخول / الاشتراك</span>
                  </Link>
                  <Link 
                    to="/admin/login" 
                    className="flex items-center justify-center gap-2 rounded-xl border border-border bg-canvas px-4 py-2.5 text-sm font-medium text-ink hover:border-amber transition"
                  >
                    <UserCircle2 size={16} />
                    <span>حسابي</span>
                  </Link>
                </div>
              )}
            </div>

            {/* الأقسام والتصنيفات */}
            <div className="py-4 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-widest text-ink-soft mb-3">
                الأقسام والتصنيفات السريعة
              </span>
              <div className="grid gap-2">
                {CATEGORY_LINKS.map((category) => (
                  <button
                    key={category.label}
                    type="button"
                    onClick={() => handleCategorySelect(category)}
                    className="w-full text-right rounded-xl border border-border bg-canvas px-3.5 py-3 text-xs sm:text-sm font-medium text-ink hover:border-amber hover:bg-surface transition flex items-center justify-between"
                  >
                    <span>{category.label}</span>
                    <Store size={14} className="text-ink-soft" />
                  </button>
                ))}
              </div>
            </div>

            {/* تذييل القائمة (تبديل اللغة) */}
            <div className="pt-4 pb-6 border-t border-border flex items-center justify-between shrink-0">
              <span className="text-xs text-ink-soft font-medium">اللغة الحالية: {languageLabel}</span>
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-canvas px-3 py-1.5 text-xs font-semibold text-ink hover:border-amber transition"
              >
                <Languages size={14} />
                <span>{language === 'ar' ? 'English' : 'عربي'}</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </header>
  )
}ح