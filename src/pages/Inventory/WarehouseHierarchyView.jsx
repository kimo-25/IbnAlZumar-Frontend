// File: src/pages/admin/Inventory/WarehouseHierarchyView.jsx
import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  GitBranch,
  Store,
  Loader2,
  RefreshCw,
  AlertTriangle,
  CircleOff,
  CheckCircle2,
} from 'lucide-react'
import { getWarehouseHierarchy } from '../../../api/inventoryApi'

const TIER_META = {
  MainCentral: {
    label: 'مركزي رئيسي',
    icon: Building2,
    badgeClass: 'bg-graphite-900 text-white border-graphite-900',
    lineClass: 'border-graphite-300',
  },
  RegionalBranch: {
    label: 'فرع إقليمي',
    icon: GitBranch,
    badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
    lineClass: 'border-blue-200',
  },
  PosShelfLocation: {
    label: 'رف نقطة بيع',
    icon: Store,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    lineClass: 'border-amber-200',
  },
}

const TIER_ORDER = { MainCentral: 0, RegionalBranch: 1, PosShelfLocation: 2 }

// Backend serializes WarehouseTier as a string (e.g. "MainCentral") when the API's global
// JsonStringEnumConverter is on; `tierName` (Tier.ToString() computed server-side) is kept as a
// redundant fallback in the DTO in case it isn't.
function getTierKey(warehouse) {
  return warehouse?.tier || warehouse?.tierName || 'MainCentral'
}

function TierBadge({ tier }) {
  const meta = TIER_META[tier] || TIER_META.MainCentral
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[10px] font-bold ${meta.badgeClass}`}>
      <Icon size={11} />
      {meta.label}
    </span>
  )
}

function buildTree(warehouses) {
  const byId = new Map(warehouses.map((w) => [w.id, { ...w, children: [] }]))
  const roots = []

  byId.forEach((node) => {
    if (node.parentWarehouseId && byId.has(node.parentWarehouseId)) {
      byId.get(node.parentWarehouseId).children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortNodes = (nodes) => {
    nodes.sort((a, b) => {
      const ta = TIER_ORDER[getTierKey(a)] ?? 0
      const tb = TIER_ORDER[getTierKey(b)] ?? 0
      if (ta !== tb) return ta - tb
      return (a.name || '').localeCompare(b.name || '', 'ar')
    })
    nodes.forEach((n) => sortNodes(n.children))
  }
  sortNodes(roots)

  return roots
}

function WarehouseNode({ node, depth = 0 }) {
  const tier = getTierKey(node)
  const meta = TIER_META[tier] || TIER_META.MainCentral

  return (
    <div className={depth > 0 ? `ms-6 border-s-2 ${meta.lineClass} ps-4` : ''}>
      <div className="mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 shadow-xs">
        <span className="text-xs font-bold text-ink">{node.name}</span>
        <TierBadge tier={tier} />
        {node.isMainWarehouse && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
            <CheckCircle2 size={11} /> المستودع الافتراضي
          </span>
        )}
        {!node.isActive && (
          <span className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-danger">
            <CircleOff size={11} /> غير نشط
          </span>
        )}
        {node.parentWarehouseName && (
          <span className="text-[10px] text-ink-soft">تابع لـ: {node.parentWarehouseName}</span>
        )}
      </div>

      {node.children?.length > 0 && (
        <div>
          {node.children.map((child) => (
            <WarehouseNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function WarehouseHierarchyView() {
  const [warehouses, setWarehouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await getWarehouseHierarchy()
      setWarehouses(Array.isArray(data) ? data : [])
    } catch (err) {
      setError(err?.message || 'تعذر تحميل التسلسل الهرمي للمستودعات')
    } finally {
      setLoading(false)
    }
  }

  const tree = useMemo(() => buildTree(warehouses), [warehouses])

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-xs" dir="rtl">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-bold text-ink">
            <Building2 size={16} className="text-graphite-700" />
            التسلسل الهرمي للمستودعات
          </h3>
          <p className="mt-0.5 text-[11px] text-ink-soft">مركزي رئيسي ← فرع إقليمي ← رف نقطة بيع</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-[11px] font-bold text-ink-soft transition hover:bg-canvas disabled:opacity-60"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> تحديث
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-xs text-ink-soft">
          <Loader2 size={16} className="animate-spin" /> جاري التحميل...
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-danger">
          <AlertTriangle size={15} className="shrink-0" /> {error}
        </div>
      ) : tree.length === 0 ? (
        <div className="py-12 text-center text-xs text-ink-soft">لا توجد مستودعات نشطة لعرضها</div>
      ) : (
        <div>
          {tree.map((root) => (
            <WarehouseNode key={root.id} node={root} />
          ))}
        </div>
      )}
    </div>
  )
}