import { useEffect, useState } from 'react'
import { Wallet, CalendarRange } from 'lucide-react'
import { getPayrollSummary } from '../../api/adminApi'

function getDefaultRange() {
  const today = new Date()
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const toIso = (date) => date.toISOString().slice(0, 10)
  return { startDate: toIso(firstOfMonth), endDate: toIso(today) }
}

export default function PayrollPage() {
  const [range, setRange] = useState(getDefaultRange())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchSummary = async (params) => {
    setLoading(true)
    setError(null)
    try {
      const data = await getPayrollSummary(params)
      setRows(Array.isArray(data) ? data : [])
    } catch (err) {
      setError('تعذر تحميل بيانات الرواتب.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary(range)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilter = (event) => {
    event.preventDefault()
    fetchSummary(range)
  }

  const totalSalary = rows.reduce((sum, row) => sum + Number(row.totalSalary || 0), 0)

  return (
    <div className="p-5">
      <div className="mb-5 flex items-center gap-2">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber text-graphite-900">
          <Wallet size={20} />
        </div>
        <h1 className="font-display text-xl font-semibold text-graphite-900">تقرير الرواتب والحضور</h1>
      </div>

      <form
        onSubmit={handleFilter}
        className="mb-5 flex flex-wrap items-end gap-3 rounded-lg border border-graphite-200 bg-white p-4"
      >
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-graphite-500">من تاريخ</label>
          <input
            type="date"
            value={range.startDate}
            onChange={(event) => setRange((prev) => ({ ...prev, startDate: event.target.value }))}
            className="rounded-md border border-graphite-200 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-graphite-500">إلى تاريخ</label>
          <input
            type="date"
            value={range.endDate}
            onChange={(event) => setRange((prev) => ({ ...prev, endDate: event.target.value }))}
            className="rounded-md border border-graphite-200 px-3 py-2 text-sm"
          />
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 rounded-md bg-graphite-900 px-4 py-2 text-sm font-medium text-white hover:bg-amber hover:text-graphite-900"
        >
          <CalendarRange size={16} />
          عرض التقرير
        </button>
      </form>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="overflow-x-auto rounded-lg border border-graphite-200 bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-graphite-50 text-xs uppercase text-graphite-500">
            <tr>
              <th className="px-4 py-3 text-start">اسم الموظف</th>
              <th className="px-4 py-3 text-start">أجر الساعة</th>
              <th className="px-4 py-3 text-start">إجمالي الساعات</th>
              <th className="px-4 py-3 text-start">إجمالي المستحقات</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-graphite-400">
                  جاري التحميل...
                </td>
              </tr>
            )}
            {!loading && rows.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-graphite-400">
                  لا توجد بيانات لهذه الفترة.
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.userId} className="border-t border-graphite-100">
                  <td className="px-4 py-3 font-medium text-graphite-900">{row.fullName}</td>
                  <td className="px-4 py-3">{Number(row.hourlyRate).toFixed(2)}</td>
                  <td className="px-4 py-3">{Number(row.totalHours).toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold">{Number(row.totalSalary).toFixed(2)}</td>
                </tr>
              ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr className="border-t border-graphite-200 bg-graphite-50 font-semibold">
                <td className="px-4 py-3" colSpan={3}>
                  الإجمالي
                </td>
                <td className="px-4 py-3">{totalSalary.toFixed(2)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
