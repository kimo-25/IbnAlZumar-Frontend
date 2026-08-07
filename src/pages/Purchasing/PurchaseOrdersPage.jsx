// File: src/pages/Admin/PurchasingPage.jsx
import { useState, useEffect } from 'react'
import { 
  ShoppingBag, 
  Truck, 
  Plus, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  RefreshCw,
  Printer,
  Building,
  DollarSign,
  PackageCheck
} from 'lucide-react'
import { formatCurrency } from '../../utils/catalog'

export default function PurchasingPage() {
  const [purchaseOrders, setPurchaseOrders] = useState([
    {
      id: 1,
      poNumber: 'PO-2026-001',
      supplierName: 'شركة النيل للعدد اليدوية والمعدات الثقيلة',
      supplierPhone: '+20 100 555 4321',
      itemsCount: 15,
      totalCost: 45000,
      status: 'تم الاستلام والتخزين',
      createdAt: '2026-08-01'
    },
    {
      id: 2,
      poNumber: 'PO-2026-002',
      supplierName: 'مؤسسة الهندسية العالمية لمستلزمات الورش',
      supplierPhone: '+20 122 888 9911',
      itemsCount: 8,
      totalCost: 28500,
      status: 'قيد الشحن والتوريد',
      createdAt: '2026-08-04'
    }
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // نموذج إضافة طلب شراء جديد من مورد
  const [newPo, setNewPo] = useState({
    supplierName: '',
    supplierPhone: '',
    itemsSummary: '',
    totalCost: ''
  })

  function handleCreatePo(e) {
    e.preventDefault()
    if (!newPo.supplierName || !newPo.totalCost) {
      alert('يرجى إدخال اسم المورد وتكلفة أمر الشراء على الأقل.')
      return
    }

    const created = {
      id: Date.now(),
      poNumber: `PO-2026-00${purchaseOrders.length + 1}`,
      supplierName: newPo.supplierName,
      supplierPhone: newPo.supplierPhone || 'غير محدد',
      itemsCount: 5,
      totalCost: Number(newPo.totalCost),
      status: 'قيد المراجعة والتأكيد',
      createdAt: new Date().toISOString().split('T')[0]
    }

    setPurchaseOrders([created, ...purchaseOrders])
    setNewPo({ supplierName: '', supplierPhone: '', itemsSummary: '', totalCost: '' })
    setShowAddModal(false)
  }

  // طباعة فاتورة أمر الشراء للمورد
  function handlePrintPo(po) {
    const printWin = window.open('', '_blank', 'width=800,height=850')
    if (!printWin) {
      alert('يرجى السماح بالنوافذ المنبثقة لطباعة أمر الشراء.')
      return
    }

    const html = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <title>أمر شراء مورد - ${po.poNumber}</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Cairo', sans-serif; padding: 30px; color: #0f172a; direction: rtl; background: #fff; }
          .card { max-width: 750px; margin: auto; border: 1px solid #cbd5e1; border-radius: 12px; padding: 30px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 15px; margin-bottom: 20px; }
          .title { font-size: 22px; font-weight: 800; color: #0f172a; }
          .sub { font-size: 12px; color: #475569; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 8px; font-size: 13px; }
          .box-title { font-weight: 700; color: #64748b; font-size: 11px; margin-bottom: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 12.5px; text-align: right; }
          th { background: #0f172a; color: #fff; }
          .total { margin-top: 15px; text-align: left; font-size: 16px; font-weight: 800; color: #059669; }
          .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div>
              <div class="title">أمر شراء مخزون (Purchase Order)</div>
              <div class="sub">رقم المستند: ${po.poNumber} | التاريخ: ${po.createdAt}</div>
            </div>
            <div style="text-align: left;">
              <div style="font-weight: 800; font-size: 16px;">مجموعة ابن الزمر</div>
              <div style="font-size: 11px; color: #64748b;">قسم إدارة المشتريات وسلاسل الإمداد</div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <div class="box-title">بيانات المورد</div>
              <div style="font-weight: 750;">${po.supplierName}</div>
              <div style="color: #64748b; margin-top: 4px;">الهاتف: ${po.supplierPhone}</div>
            </div>
            <div class="box">
              <div class="box-title">حالة التوريد والدفع</div>
              <div style="font-weight: 750; color: #059669;">${po.status}</div>
              <div style="color: #64748b; margin-top: 4px;">طريقة الدفع: تحويل بنكي / آجل معتمد</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>بيان الصنف والعدد المطلوبة</th>
                <th>الكمية المقدرة</th>
                <th>القيمة الإجمالية</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>توريد معدات ورش وعدد أصلية طبقاً للمواصفات المعتمدة</td>
                <td>${po.itemsCount} صنف رئيسي</td>
                <td>EGP ${po.totalCost.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div class="total">
            إجمالي أمر الشراء: EGP ${po.totalCost.toLocaleString()}
          </div>

          <div class="footer">
            هذا المستند صادر إلكترونياً من نظام إدارة المشتريات بمتجر ابن الزمر ولا يحتاج إلى ختم مادي إن كان مرسلاً عبر القنوات المعتمدة.
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
      {/* ترويسة صفحة المشتريات */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
            <ShoppingBag className="text-emerald-600" size={24} />
            إدارة المشتريات وتوريدات الموردين
          </h1>
          <p className="text-xs text-ink-soft mt-1">متابعة أوامر الشراء (Purchase Orders) لتجديد مخزون الورش والعدد</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            <Plus size={14} /> إضافة أمر شراء جديد
          </button>
        </div>
      </div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-soft text-xs font-semibold">
            <span>إجمالي أوامر الشراء</span>
            <FileText size={16} className="text-blue-600" />
          </div>
          <div className="mt-3 text-xl font-bold font-mono text-ink">{purchaseOrders.length} أوامر</div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-soft text-xs font-semibold">
            <span>إجمالي قيمة التوريدات</span>
            <DollarSign size={16} className="text-emerald-600" />
          </div>
          <div className="mt-3 text-xl font-bold font-mono text-ink">
            {formatCurrency(purchaseOrders.reduce((sum, p) => sum + p.totalCost, 0))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-xs">
          <div className="flex items-center justify-between text-ink-soft text-xs font-semibold">
            <span>حالة المخزون العام</span>
            <PackageCheck size={16} className="text-amber-900" />
          </div>
          <div className="mt-3 text-xl font-bold text-emerald-600">مستقر ومحدث</div>
        </div>
      </div>

      {/* جدول أوامر الشراء */}
      <div className="rounded-2xl border border-border bg-surface shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-canvas border-b border-border text-ink-soft font-semibold">
              <tr>
                <th className="p-4">رقم أمر الشراء</th>
                <th className="p-4">المورد المسؤول</th>
                <th className="p-4">عدد الأصناف</th>
                <th className="p-4">التكلفة الإجمالية</th>
                <th className="p-4">حالة التوريد</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {purchaseOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-ink-soft">
                    لا توجد أوامر شراء مسجلة حتى الآن.
                  </td>
                </tr>
              ) : (
                purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-canvas/50 transition">
                    <td className="p-4 font-mono font-bold text-emerald-600">{po.poNumber}</td>
                    <td className="p-4">
                      <div className="font-bold text-ink">{po.supplierName}</div>
                      <div className="font-mono text-[11px] text-ink-soft">{po.supplierPhone}</div>
                    </td>
                    <td className="p-4 font-mono text-ink">{po.itemsCount} أصناف</td>
                    <td className="p-4 font-mono font-bold text-ink">{formatCurrency(po.totalCost)}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold text-emerald-800">
                        <CheckCircle2 size={12} />
                        {po.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handlePrintPo(po)}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-semibold text-ink hover:bg-canvas transition"
                        title="طباعة مستند أمر الشراء"
                      >
                        <Printer size={12} /> طباعة المستند
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* مودال إضافة أمر شراء جديد */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface border border-border p-6 shadow-xl">
            <h3 className="text-lg font-bold text-ink mb-4">إضافة أمر شراء جديد لمورد</h3>
            <form onSubmit={handleCreatePo} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">اسم المورد أو الشركة</label>
                <input
                  type="text"
                  required
                  value={newPo.supplierName}
                  onChange={(e) => setNewPo({ ...newPo, supplierName: e.target.value })}
                  placeholder="مثال: شركة النيل للعدد"
                  className="w-full rounded-xl border border-border bg-canvas p-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">هاتف المورد</label>
                <input
                  type="text"
                  value={newPo.supplierPhone}
                  onChange={(e) => setNewPo({ ...newPo, supplierPhone: e.target.value })}
                  placeholder="+20 ..."
                  className="w-full rounded-xl border border-border bg-canvas p-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">التكلفة الإجمالية (جنيه)</label>
                <input
                  type="number"
                  required
                  value={newPo.totalCost}
                  onChange={(e) => setNewPo({ ...newPo, totalCost: e.target.value })}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-border bg-canvas p-2.5 text-xs text-ink focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-ink hover:bg-canvas transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                >
                  حفظ وإنشاء الأمر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}