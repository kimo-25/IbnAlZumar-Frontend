// File: src/components/profile/AddressManager.jsx
import { useState } from 'react'
import { MapPin, Plus, Trash2, CheckCircle2 } from 'lucide-react'

export default function AddressManager({ addresses = [], onSaveAddresses }) {
  const [list, setList] = useState(addresses)
  const [newAddress, setNewAddress] = useState({ title: '', city: '', details: '', isDefault: false })
  const [isAdding, setIsAdding] = useState(false)

  const handleAdd = (e) => {
    e.preventDefault()
    if (!newAddress.details || !newAddress.city) return

    const updated = list.map(item => newAddress.isDefault ? { ...item, isDefault: false } : item)
    const newList = [...updated, { ...newAddress, id: Date.now() }]
    setList(newList)
    onSaveAddresses(newList)
    setNewAddress({ title: '', city: '', details: '', isDefault: false })
    setIsAdding(false)
  }

  const handleDelete = (id) => {
    const newList = list.filter(item => item.id !== id)
    setList(newList)
    onSaveAddresses(newList)
  }

  const handleSetDefault = (id) => {
    const newList = list.map(item => ({ ...item, isDefault: item.id === id }))
    setList(newList)
    onSaveAddresses(newList)
  }

  return (
    <div className="space-y-4 text-right" dir="rtl">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-ink flex items-center gap-2">
          <MapPin size={18} className="text-emerald-600" />
          <span>دفتر العناوين المحفوظة</span>
        </h3>
        <button
          type="button"
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200"
        >
          <Plus size={14} />
          <span>إضافة عنوان جديد</span>
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleAdd} className="p-4 rounded-xl border border-border bg-canvas space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="اسم العنوان (مثال: المنزل، العمل)"
              value={newAddress.title}
              onChange={(e) => setNewAddress({ ...newAddress, title: e.target.value })}
              className="rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:border-emerald-600"
              required
            />
            <input
              type="text"
              placeholder="المحافظة / المدينة"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              className="rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:border-emerald-600"
              required
            />
          </div>
          <textarea
            placeholder="العنوان التفصيلي (الشارع، رقم المبنى، الشقة)"
            value={newAddress.details}
            onChange={(e) => setNewAddress({ ...newAddress, details: e.target.value })}
            className="w-full rounded-lg border border-border bg-surface p-2 text-xs outline-none focus:border-emerald-600 resize-none"
            rows={2}
            required
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer">
              <input
                type="checkbox"
                checked={newAddress.isDefault}
                onChange={(e) => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                className="rounded border-border text-emerald-600 focus:ring-emerald-500"
              />
              تعيين كعنوان افتراضي للشحن
            </label>
            <button type="submit" className="bg-emerald-600 text-white text-xs px-4 py-1.5 rounded-lg font-semibold hover:bg-emerald-700">
              حفظ العنوان
            </button>
          </div>
        </form>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((item) => (
          <div key={item.id} className={`p-3.5 rounded-xl border ${item.isDefault ? 'border-emerald-500 bg-emerald-50/20' : 'border-border bg-surface'} relative flex flex-col justify-between`}>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-xs text-ink">{item.title || 'عنوان شحن'}</span>
                {item.isDefault && (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 size={10} /> افتراضي
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft">{item.city} - {item.details}</p>
            </div>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50 text-[11px]">
              {!item.isDefault && (
                <button type="button" onClick={() => handleSetDefault(item.id)} className="text-emerald-600 font-semibold hover:underline">
                  تعيين كافتراضي
                </button>
              )}
              <button type="button" onClick={() => handleDelete(item.id)} className="text-rose-600 hover:text-rose-700 mr-auto">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}