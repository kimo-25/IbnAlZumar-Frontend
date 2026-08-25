import { AlertTriangle, CheckCircle2, Package, XCircle } from 'lucide-react'

const PRODUCT_KEYS = ['products', 'items', 'lowStockItems', 'inventory', 'المنتجات', 'الأصناف']

function getValue(item, keys) {
  if (!item || typeof item !== 'object') return ''
  const key = Object.keys(item).find((candidate) => keys.includes(candidate.toLowerCase()))
  return key ? item[key] : ''
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—'
  return new Intl.NumberFormat('ar-EG').format(Number(value))
}

function normalizeStatus(status, quantity) {
  const value = String(status || '').toLowerCase()
  if (value.includes('out') || value.includes('نفد') || value.includes('منتهي') || Number(quantity) === 0) {
    return { label: 'منتهي', tone: 'danger', icon: XCircle }
  }
  if (value.includes('low') || value.includes('منخفض') || value.includes('قليل') || Number(quantity) <= 5) {
    return { label: 'منخفض', tone: 'warning', icon: AlertTriangle }
  }
  return { label: 'متوفر', tone: 'success', icon: CheckCircle2 }
}

export function ProductInventoryCard({ item }) {
  const name = getValue(item, ['name', 'productname', 'product', 'title', 'اسم المنتج', 'اسم الصنف']) || 'منتج غير محدد'
  const sku = getValue(item, ['sku', 'code', 'productsku', 'رمز المنتج', 'الرمز'])
  const quantity = getValue(item, ['quantity', 'stock', 'stockquantity', 'available', 'الكمية', 'المخزون'])
  const rawStatus = getValue(item, ['status', 'stockstatus', 'الحالة'])
  const status = normalizeStatus(rawStatus, quantity)
  const StatusIcon = status.icon

  const statusClasses = {
    danger: 'border-red-200 bg-red-50 text-red-700',
    warning: 'border-amber-200 bg-amber-50 text-amber-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }

  return (
    <article className="rounded-2xl border border-graphite-200 bg-white p-3 shadow-subtle">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-graphite-900 text-amber">
            <Package size={17} />
          </div>
          <div className="min-w-0">
            <h4 className="truncate text-sm font-semibold text-graphite-900" dir="auto">{String(name)}</h4>
            {sku && <code className="mt-1 inline-flex rounded-md bg-graphite-100 px-1.5 py-0.5 font-mono text-[10px] text-graphite-700" dir="ltr">{String(sku)}</code>}
          </div>
        </div>
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold ${statusClasses[status.tone]}`}>
          <StatusIcon size={12} />
          {status.label}
        </span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-graphite-100 pt-2.5 text-xs text-graphite-500">
        <span>الكمية الحالية</span>
        <strong className="font-display text-sm text-graphite-900" dir="ltr">{formatNumber(quantity)}</strong>
      </div>
    </article>
  )
}

function inlineMarkdown(value) {
  const tokens = String(value).split(/(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__)/g)
  return tokens.map((token, index) => {
    if (token.startsWith('`') && token.endsWith('`')) {
      return <code key={index} className="rounded-md bg-graphite-100 px-1.5 py-0.5 font-mono text-[0.85em] text-graphite-800" dir="ltr">{token.slice(1, -1)}</code>
    }
    if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      return <strong key={index} className="font-bold text-graphite-950">{token.slice(2, -2)}</strong>
    }
    return <span key={index}>{token}</span>
  })
}

function parseTable(lines) {
  if (lines.length < 2 || !lines[1].includes('|')) return null
  const clean = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim())
  const headers = clean(lines[0])
  const rows = lines.slice(2).filter((line) => line.includes('|')).map(clean)
  if (!headers.length || !rows.length) return null
  return (
    <div className="my-2 overflow-hidden rounded-xl border border-graphite-200 bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full text-right text-xs">
          <thead className="bg-graphite-100 text-graphite-700">
            <tr>{headers.map((header, index) => <th key={index} className="whitespace-nowrap px-3 py-2 font-semibold">{inlineMarkdown(header)}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-graphite-100">
            {rows.map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-graphite-50">{headers.map((_, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-3 py-2 text-graphite-700" dir={cellIndex === 0 ? 'auto' : 'ltr'}>{inlineMarkdown(row[cellIndex] || '—')}</td>)}</tr>)}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function tryParseStructured(value) {
  if (typeof value !== 'string') return value
  const candidate = value.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  if (!/^[\[{]/.test(candidate)) return null
  try { return JSON.parse(candidate) } catch { return null }
}

function findProducts(value) {
  const parsed = tryParseStructured(value)
  if (Array.isArray(parsed)) return parsed
  if (parsed && typeof parsed === 'object') {
    const key = Object.keys(parsed).find((candidate) => PRODUCT_KEYS.includes(candidate.toLowerCase()))
    if (key && Array.isArray(parsed[key])) return parsed[key]
  }
  return null
}

function MarkdownContent({ content }) {
  const lines = String(content || '').split('\n')
  const blocks = []
  let current = []
  let inCode = false
  let codeLanguage = ''

  const flush = () => { if (current.length) { blocks.push({ type: 'text', lines: current }); current = [] } }
  lines.forEach((line) => {
    if (line.trim().startsWith('```')) {
      if (inCode) { blocks.push({ type: 'code', lines: current, language: codeLanguage }); current = []; inCode = false }
      else { flush(); inCode = true; codeLanguage = line.trim().slice(3) }
    } else if (inCode) current.push(line)
    else current.push(line)
  })
  flush()

  return <div className="space-y-2.5 text-[13px] leading-7 text-graphite-700">
    {blocks.map((block, blockIndex) => {
      if (block.type === 'code') return <pre key={blockIndex} className="overflow-x-auto rounded-xl bg-graphite-950 p-3 text-left font-mono text-xs leading-6 text-white/90" dir="ltr"><code>{block.lines.join('\n')}</code></pre>
      const table = parseTable(block.lines)
      if (table) return <div key={blockIndex}>{table}</div>
      const elements = []
      block.lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return
        if (/^#{1,3}\s/.test(trimmed)) elements.push(<h3 key={index} className="pt-1 font-semibold text-graphite-950">{inlineMarkdown(trimmed.replace(/^#{1,3}\s/, ''))}</h3>)
        else if (/^[-*•]\s/.test(trimmed)) elements.push(<div key={index} className="flex items-start gap-2"><span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-amber" /> <span>{inlineMarkdown(trimmed.replace(/^[-*•]\s/, ''))}</span></div>)
        else if (/^\d+[.)]\s/.test(trimmed)) elements.push(<div key={index} className="flex items-start gap-2"><span className="font-display font-semibold text-amber-dark" dir="ltr">{trimmed.match(/^\d+[.)]/)[0]}</span><span>{inlineMarkdown(trimmed.replace(/^\d+[.)]\s/, ''))}</span></div>)
        else elements.push(<p key={index}>{inlineMarkdown(line)}</p>)
      })
      return <div key={blockIndex}>{elements}</div>
    })}
  </div>
}

export default function AssistantResponseRenderer({ content }) {
  const products = findProducts(content)
  if (products?.length) {
    return <div className="space-y-2.5">{products.map((item, index) => <ProductInventoryCard key={index} item={item} />)}</div>
  }
  return <MarkdownContent content={content} />
}

export { inlineMarkdown }
