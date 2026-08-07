// File: src/pages/Reports/ReportsPage.jsx
import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Package, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  ArrowUpRight, 
  Filter,
  CheckCircle2,
  Download
} from 'lucide-react'
import { formatCurrency } from '../../utils/catalog'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('sales') // 'sales' | 'inventory' | 'financial'
  const [dateRange, setDateRange] = useState('this_month')

  // بيانات افتراضية للتقارير والتحليلات
  const salesSummary = {
    totalRevenue: 245800,
    totalOrdersCount: 342,
    averageOrderValue: 718,
    growthRate: '+14.2%'
  }

  const inventorySummary = {
    totalSkus: 1250,
    lowStockCount: 14,
    outOfStockCount: 3,
    totalWarehouseValue: 1850000
  }

  // طباعة أو تصدير التقارير الرسمية المعتمدة
  function handleExportReport() {
    const printWin = window.open('', '_blank', 'width=850,height=900')
    if (!printWin) {
      alert('يرجى السماح بالنوافذ المنبثقة لتصدير أو طباعة التقرير.')
      return
    }

    const title = reportType === 'sales' ? 'تقرير المبيعات والطلب الإلكتروني' : reportType === 'inventory' ? 'تقرير جرد المخزون والعدد' : 'التقرير المالي العام'
    const dateStr = new Date().toLocaleDateString('ar-EG')

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>${title} - ${dateStr}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 30px; color: #0f172a; direction: rtl; background: #fff; }
          .card { max-width: 780px; margin: auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 32px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 24px; }
          .title { font-size: 20px; font-weight: 800; color: #0f172a; }
          .sub { font-size: 12px; color: #475569; margin-top: 2px; }
          .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 24px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 10px; }
          .box-title { font-size: 11px; font-weight: 700; color: #64748b; margin-bottom: 6px; }
          .box-value { font-size: 18px; font-weight: 800; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px 14px; font-size: 12.5px; text-align: right; }
          th { background: #0f172a; color: #fff; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div class="title">مجموعة ابن الزمر — ${title}</div>
              <div class="sub">تاريخ إصدار التقرير: ${dateStr} | الفترة: ${dateRange === 'this_month' ? 'الشهر الحالي' : 'السنة الحالية'}</div>
            </div>
            <div style="text-align: left;">
              <div style="font-weight: 800; font-size: 15px;">EBN ELZAMER</div>
              <div style="font-size: 10px; color: #64748b;">Industrial Supply & Workshop Tools</div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <div class="box-title">إجمالي العائدات والقيمة</div>
              <div class="box-value">${formatCurrency(reportType === 'sales' ? salesSummary.totalRevenue : inventorySummary.totalWarehouseValue)}</div>
            </div>
            <div class="box">
              <div class="box-title">معدل النشاط والتدفق</div>
              <div class="box-value" style="color: #059669;">${reportType === 'sales' ? salesSummary.growthRate : 'مستقر وآمن'}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>مؤشر الأداء الرئيسي (KPI)</th>
                <th>القيمة الرقمية المسجلة</th>
                <th>الحالة التشغيلية</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>حجم المعاملات والطلبات المكتملة</td>
                <td>${reportType === 'sales' ? `${salesSummary.totalOrdersCount} طلب` : `${inventorySummary.totalSkus} صنف`}</td>
                <td>معتمد ومطابق</td>
              </tr>
              <tr>
                <td>مؤشر الموثوقية والكفاءة التشغيلية</td>
                <td>99.4%</td>
                <td>ممتاز</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            هذا المستند صادر رسمياً من نظام التقارير الإدارية بمتجر ابن الزمر للعدد ومستلزمات الورش.
          </div>
        </div>
        <script>window.onload = function() { window.print(); window.close(); }</script>
      </body>
      </html>
    `

    printWin.document.write(html)
    printWin.document.close()
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {/* ترويسة صفحة التقارير */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <BarChart3 className="text-emerald-600" size={24} />
            التقارير والتحليلات الشاملة
          </h1>
          <p className="text-xs text-ink-soft mt-1">استعراض تقارير المبيعات، حركة المخزون، والأداء المالي لمتجر ابن الزمر</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportReport}
            className="inline-flex items-center gap-2 rounded-xl bg-surface border border-border px-4 py-2 text-xs font-semibold text-ink shadow-xs hover:bg-canvas transition"
          >
            <Printer size={14} /> طباعة أو تصدير التقرير
          </button>
        </div>
      </div>

      {/* تبويبات اختيار نوع التقرير */}
      <div className="flex gap-2 border-b border-border pb-3">
        <button
          onClick={() => setReportType('sales')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            reportType === 'sales' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          تقارير المبيعات
        </button>
        <button
          onClick={() => setReportType('inventory')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            reportType === 'inventory' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          تقارير المخزون والعدد
        </button>
        <button
          onClick={() => setReportType('financial')}
          className={`rounded-xl px-4 py-2 text-xs font-bold transition ${
            reportType === 'financial' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-surface text-ink-soft hover:text-ink'
          }`}
        >
          التقارير المالية والأرباح
        </button>
      </div>

      {/* المحتوى حسب التبويب النشط */}
      {reportType === 'sales' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">إجمالي مبيعات الأونلاين</span>
              <div className="mt-2 text-xl font-bold font-mono text-ink">{formatCurrency(salesSummary.totalRevenue)}</div>
              <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-block flex items-center gap-1">
                <ArrowUpRight size={12} /> {salesSummary.growthRate} نمو عن الفترة السابقة
              </span>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">إجمالي الطلبات المكتملة</span>
              <div className="mt-2 text-xl font-bold font-mono text-ink">{salesSummary.totalOrdersCount} طلب</div>
              <span className="text-[10px] text-ink-soft mt-1 inline-block">حسب الطلبات المؤكدة</span>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">متوسط قيمة الطلب الواحد</span>
              <div className="mt-2 text-xl font-bold font-mono text-ink">{formatCurrency(salesSummary.averageOrderValue)}</div>
              <span className="text-[10px] text-ink-soft mt-1 inline-block">لكل عملية بيع</span>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">معدل رضا العملاء</span>
              <div className="mt-2 text-xl font-bold font-mono text-emerald-600">98.5%</div>
              <span className="text-[10px] text-ink-soft mt-1 inline-block">تقييمات متميزة</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h3 className="text-sm font-bold text-ink mb-4">تحليل حركة الطلبات الشهرية</h3>
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl bg-canvas text-ink-soft text-xs">
              [مخطط بياني تفاعلي يوضح تصاعد مبيعات العدد ومستلزمات الورش]
            </div>
          </div>
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">إجمالي الأصناف (SKUs)</span>
              <div className="mt-2 text-xl font-bold font-mono text-ink">{inventorySummary.totalSkus} صنف</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">أصناف قاربت على النفاد</span>
              <div className="mt-2 text-xl font-bold font-mono text-amber-900">{inventorySummary.lowStockCount} أصناف</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">أصناف نفدت تماماً</span>
              <div className="mt-2 text-xl font-bold font-mono text-danger">{inventorySummary.outOfStockCount} أصناف</div>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
              <span className="text-xs font-semibold text-ink-soft">إجمالي قيمة المخزون</span>
              <div className="mt-2 text-xl font-bold font-mono text-emerald-600">{formatCurrency(inventorySummary.totalWarehouseValue)}</div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'financial' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
            <h3 className="text-sm font-bold text-ink mb-2">الملخص المالي والضريبي لمتجر ابن الزمر</h3>
            <p className="text-xs text-ink-soft leading-relaxed mb-4">
              يعرض هذا القسم إيرادات الفروع، وعمليات الدفع الإلكتروني مقابل الدفع عند الاستلام، والالتزامات الضريبية الشهرية.
            </p>
            <div className="p-4 rounded-xl bg-canvas border border-border flex items-center justify-between text-xs">
              <span className="font-semibold text-ink">صافي الأرباح التشغيلية المقدرة</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">{formatCurrency(112000)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}