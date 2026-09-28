import { useEffect, useMemo, useState } from 'react'
import { AlertCircle, Loader2, Printer, User, X } from 'lucide-react'
import { createMaintenanceTicket, getMaintenanceReceipt } from '../../api/maintenanceWorkflowApi'
import { openPrintWindow } from '../../utils/print/shared'
import { renderMaintenanceReceipt } from '../../utils/print/renderMaintenanceReceipt'

const EMPTY_FORM = {
  customerId: '',
  guestName: '',
  guestPhone: '',
  deliveryMethod: '1',
  problemDescription: '',
  images: [],
  printReceipt: false,
}

function getCustomerId(customer) {
  return customer?.id ?? customer?.Id
}

export default function CreateMaintenanceTicketModal({ isOpen, onClose, customers = [], onCreated }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [customerSearch, setCustomerSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen) return
    setForm(EMPTY_FORM)
    setCustomerSearch('')
    setError(null)
  }, [isOpen])

  const filteredCustomers = useMemo(() => {
    const query = customerSearch.trim().toLowerCase()
    if (!query) return customers.slice(0, 8)
    return customers.filter((customer) => {
      const name = customer.fullName || customer.name || ''
      const phone = customer.phoneNumber || customer.phone || ''
      return name.toLowerCase().includes(query) || phone.includes(query)
    }).slice(0, 8)
  }, [customers, customerSearch])

  if (!isOpen) return null

  const selectedCustomer = customers.find((customer) => String(getCustomerId(customer)) === String(form.customerId))

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleCustomerSelect(customer) {
    updateField('customerId', String(getCustomerId(customer)))
    setCustomerSearch('')
  }

  function resetToGuest() {
    setForm((current) => ({ ...current, customerId: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError(null)

    if (!form.problemDescription.trim()) {
      setError('يرجى كتابة وصف المشكلة.')
      return
    }
    if (!form.customerId && (!form.guestName.trim() || !form.guestPhone.trim())) {
      setError('يرجى اختيار عميل أو إدخال اسم ورقم هاتف الزائر.')
      return
    }

    setSubmitting(true)
    try {
      const created = await createMaintenanceTicket({
        Description: form.problemDescription.trim(),
        DeliveryMethod: Number(form.deliveryMethod),
        Image: form.images.length === 1 ? form.images[0] : null,
        Images: form.images.length > 1 ? form.images : [],
      })

      const ticket = created?.data || created
      if (created?.message) alert(created.message)
      await onCreated?.(ticket)
      if (form.printReceipt) {
        const ticketId = ticket?.id ?? ticket?.Id
        const receipt = ticketId ? await getMaintenanceReceipt(ticketId) : ticket
        openPrintWindow(renderMaintenanceReceipt(receipt))
      }

      onClose()
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'تعذر إنشاء تذكرة الصيانة.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" dir="rtl" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-5 shadow-2xl">
        <button type="button" onClick={onClose} className="absolute left-4 top-4 rounded-lg p-1 text-ink-soft hover:bg-canvas hover:text-ink cursor-pointer" aria-label="إغلاق">
          <X size={18} />
        </button>
        <div className="mb-5 flex items-center gap-2 border-b border-border pb-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><User size={17} /></div>
          <div>
            <h2 className="text-base font-black text-ink">إنشاء تذكرة صيانة</h2>
            <p className="text-[11px] text-ink-soft">لعميل مسجل أو زائر من المحل</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs font-semibold text-rose-700">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-xl border border-border bg-canvas p-3">
            <div className="mb-2 flex items-center justify-between">
              <label className="text-xs font-bold text-ink">العميل</label>
              {form.customerId && <button type="button" onClick={resetToGuest} className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer">استخدام زائر</button>}
            </div>
            {selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-2 text-xs">
                <div><strong className="text-emerald-900">{selectedCustomer.fullName || selectedCustomer.name}</strong><span className="block text-[10px] text-emerald-700">{selectedCustomer.phoneNumber || selectedCustomer.phone || 'بدون رقم'}</span></div>
                <button type="button" onClick={resetToGuest} className="text-[10px] font-bold text-rose-600 cursor-pointer">إزالة</button>
              </div>
            ) : (
              <>
                <input type="search" value={customerSearch} onChange={(event) => setCustomerSearch(event.target.value)} placeholder="ابحث باسم العميل أو الهاتف" className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:border-emerald-500" />
                {filteredCustomers.length > 0 && (
                  <div className="mt-2 max-h-28 overflow-y-auto divide-y divide-border rounded-lg border border-border bg-surface">
                    {filteredCustomers.map((customer) => (
                      <button key={getCustomerId(customer)} type="button" onClick={() => handleCustomerSelect(customer)} className="w-full p-2 text-right text-xs hover:bg-canvas cursor-pointer">
                        <strong className="text-ink">{customer.fullName || customer.name}</strong><span className="mr-2 text-[10px] text-ink-soft">{customer.phoneNumber || customer.phone || 'بدون رقم'}</span>
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-bold text-ink-soft">اسم الزائر<input required={!form.customerId} value={form.guestName} onChange={(event) => updateField('guestName', event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:border-emerald-500" /></label>
                  <label className="text-[11px] font-bold text-ink-soft">رقم الهاتف<input required={!form.customerId} value={form.guestPhone} onChange={(event) => updateField('guestPhone', event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:border-emerald-500" /></label>
                </div>
              </>
            )}
          </div>

          <label className="block text-xs font-bold text-ink">طريقة التسليم<select value={form.deliveryMethod} onChange={(event) => updateField('deliveryMethod', event.target.value)} className="mt-1 w-full rounded-lg border border-border bg-surface p-2.5 text-xs outline-none focus:border-emerald-500"><option value="1">CustomerDropOff - العميل يحضر الجهاز</option><option value="2">CompanyPickup - استلام عبر الشركة</option></select></label>
          <label className="block text-xs font-bold text-ink">وصف المشكلة <span className="text-rose-600">*</span><textarea required value={form.problemDescription} onChange={(event) => updateField('problemDescription', event.target.value)} rows={4} className="mt-1 w-full resize-y rounded-lg border border-border bg-surface p-2.5 text-xs outline-none focus:border-emerald-500" /></label>
          <label className="block text-[11px] font-bold text-ink-soft">صور المشكلة (اختياري)<input type="file" accept="image/*" multiple onChange={(event) => updateField('images', Array.from(event.target.files || []))} className="mt-1 block w-full rounded-lg border border-border bg-surface p-2 text-xs file:mr-2 file:rounded-md file:border-0 file:bg-emerald-100 file:px-2 file:py-1 file:text-xs file:font-bold file:text-emerald-700" /></label>
          <label className="flex items-center gap-2 rounded-lg border border-border bg-canvas p-2.5 text-xs font-bold text-ink cursor-pointer"><input type="checkbox" checked={form.printReceipt} onChange={(event) => updateField('printReceipt', event.target.checked)} className="accent-emerald-600" /><Printer size={14} className="text-ink-soft" />طباعة إيصال A5 بعد الإنشاء</label>
          <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60 cursor-pointer">{submitting && <Loader2 size={14} className="animate-spin" />}إنشاء التذكرة</button>
        </form>
      </div>
    </div>
  )
}
