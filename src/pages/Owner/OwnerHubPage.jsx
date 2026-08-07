// File: src/pages/Owner/OwnerHubPage.jsx
import { useState, useEffect } from 'react'
import { 
  ShieldCheck, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Building2, 
  Settings, 
  Loader2, 
  AlertCircle 
} from 'lucide-react'
import Card from '../../components/ui/Card'
import { formatCurrency } from '../../utils/catalog'

export default function OwnerHubPage() {
  const [stats, setStats] = useState({
    totalRevenue: 142500,
    totalOrders: 320,
    activeAdmins: 4,
    branchesCount: 2
  })
  const [loading, setLoading] = useState(false)

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* ترويسة لوحة المالك */}
      <div className="border-b border-border pb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" size={24} />
          <h1 className="text-2xl font-bold text-ink">لوحة تحكم المالك والتقارير المالية</h1>
        </div>
        <p className="text-xs text-ink-soft mt-1">إشراف كامل على إيرادات وأداء متجر ابن الزمر وفروع الورش</p>
      </div>

      {/* بطاقات الإحصائيات العليا */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">إجمالي المبيعات</span>
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-4 text-xl font-bold font-mono text-ink">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block">+12.4% عن الشهر السابق</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">إجمالي الطلبات</span>
            <div className="h-9 w-9 rounded-xl bg-amber/10 flex items-center justify-center text-amber-900">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4 text-xl font-bold font-mono text-ink">
            {stats.totalOrders} طلب
          </div>
          <span className="text-[10px] text-ink-soft mt-1 inline-block">مكتملة ومؤكدة</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">فريق العمل والإدارة</span>
            <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-4 text-xl font-bold font-mono text-ink">
            {stats.activeAdmins} مشرف نشط
          </div>
          <span className="text-[10px] text-ink-soft mt-1 inline-block">صلاحيات كاملة وعمليات</span>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-soft">الفروع والمخازن</span>
            <div className="h-9 w-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-4 text-xl font-bold font-mono text-ink">
            {stats.branchesCount} فروع رئيسية
          </div>
          <span className="text-[10px] text-ink-soft mt-1 inline-block">مرتبطة بنظام الكاشير (POS)</span>
        </div>
      </div>

      {/* تقارير وإعدادات متقدمة للمالك */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="صلاحيات الأمان والتحكم الإداري">
          <p className="text-xs text-ink-soft leading-relaxed">
            تتيح لك هذه اللوحة مراقبة وتفويض المديرين ومسؤولي العمليات (Online Managers) وتعديل صلاحيات الوصول للجداول المالية ومخزون العدد ومستلزمات الورش.
          </p>
        </Card>
        <Card title="التقارير المالية والضريبية">
          <p className="text-xs text-ink-soft leading-relaxed">
            مراجعة فواتير المبيعات الصادرة، والضرائب المقررة، وإ,ردات فروع ابن الزمر مع إمكانية تصدير التقارير بصيغة معتمدة.
          </p>
        </Card>
      </div>
    </div>
  )
}