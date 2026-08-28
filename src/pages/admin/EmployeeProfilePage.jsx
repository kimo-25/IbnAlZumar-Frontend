import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getEmployeeProfileSummary, updateEmployeeHourlyRate } from '../../api/adminApi'
import AdminVoiceEnrollModal from './AdminVoiceEnrollModal'

export default function EmployeeProfilePage() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [rate, setRate] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showEnroll, setShowEnroll] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      const data = await getEmployeeProfileSummary(userId)
      setProfile(data)
      setRate(data.hourlyRate ?? '')
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'تعذر تحميل ملف الموظف.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [userId])

  const saveRate = async (event) => {
    event.preventDefault()
    try {
      setSaving(true)
      await updateEmployeeHourlyRate(userId, rate)
      await load()
    } catch (err) {
      setError(err?.response?.data?.message || err.message || 'تعذر تحديث الأجر.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-6">جاري تحميل ملف الموظف...</div>
  if (!profile) return <div className="p-6 text-red-600">{error || 'لم يتم العثور على الموظف.'}</div>

  return (
    <main className="space-y-6 p-6" dir="rtl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><button type="button" onClick={() => navigate(-1)} className="text-sm text-gray-500">العودة</button><h1 className="mt-2 text-2xl font-bold">ملف {profile.fullName}</h1><p className="text-sm text-gray-500">{profile.email || profile.username}</p></div>
        <button type="button" onClick={() => setShowEnroll(true)} className="rounded-lg bg-gray-900 px-4 py-2 text-sm text-white">{profile.isVoiceEnrolled ? 'إعادة تسجيل البصمة' : 'تسجيل بصمة الصوت'}</button>
      </div>
      {error && <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="إجمالي الساعات" value={`${profile.totalWorkedHours} ساعة`} />
        <Metric label="إجمالي الدقائق" value={profile.totalWorkedMinutes} />
        <Metric label="المستحقات" value={`${Number(profile.calculatedSalary).toFixed(2)}`} />
        <Metric label="مرات الحضور" value={profile.attendanceCount} />
      </section>
      <form onSubmit={saveRate} className="flex max-w-xl flex-wrap items-end gap-3 rounded-xl border bg-white p-4 shadow-sm">
        <label className="flex-1 text-sm font-medium">الأجر بالساعة<input type="number" min="0" step="0.01" value={rate} onChange={(event) => setRate(event.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
        <button type="submit" disabled={saving} className="rounded-lg bg-amber-400 px-4 py-2 font-medium disabled:opacity-50">{saving ? 'جاري الحفظ...' : 'حفظ الأجر'}</button>
      </form>
      <div className="overflow-x-auto rounded-xl border bg-white shadow-sm"><table className="min-w-full text-right text-sm"><thead className="bg-gray-50"><tr><th className="p-3">التاريخ</th><th className="p-3">الدخول</th><th className="p-3">الخروج</th><th className="p-3">الدقائق</th><th className="p-3">طريقة التحقق</th><th className="p-3">الحالة</th></tr></thead><tbody>{profile.attendance.map((log) => <tr key={log.id} className="border-t"><td className="p-3">{new Date(log.checkInTime).toLocaleDateString('ar-EG')}</td><td className="p-3">{new Date(log.checkInTime).toLocaleTimeString('ar-EG')}</td><td className="p-3">{log.checkOutTime ? new Date(log.checkOutTime).toLocaleTimeString('ar-EG') : 'مفتوح'}</td><td className="p-3">{log.workedMinutes ?? '—'}</td><td className="p-3">{log.verificationMethod === 'Voice' ? 'صوتية' : 'يدوية'}</td><td className="p-3">{log.status}</td></tr>)}</tbody></table>{profile.attendance.length === 0 && <p className="p-6 text-center text-gray-500">لا يوجد سجل حضور.</p>}</div>
      {showEnroll && <AdminVoiceEnrollModal userId={userId} employeeName={profile.fullName} onClose={() => setShowEnroll(false)} onSuccess={() => { setShowEnroll(false); load() }} />}
    </main>
  )
}

function Metric({ label, value }) { return <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-sm text-gray-500">{label}</p><p className="mt-2 text-2xl font-bold">{value}</p></div> }
