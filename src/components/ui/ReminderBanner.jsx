// File: src/components/ui/ReminderBanner.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getRandomReminder } from '../../api/reminders';
import { BookOpen, RefreshCw, X } from 'lucide-react';

// أذكار افتراضية محلية في حال عدم توفر الـ Backend أو حدوث خطأ في الشبكة
const FALLBACK_REMINDERS = [
  { text: "سُبْحَانَ اللَّهِ وَبِحَمْدِهِ ، سُبْحَانَ اللَّهِ الْعَظِيمِ", category: "ذكر", source: "حديث شريف" },
  { text: "اللَّهُمَّ أَعِنِّي عَلَى ذِكْرِكَ وَشُكْرِكَ وَحُسْنِ عِبَادَتِكَ", category: "دعاء", source: "حديث شريف" },
  { text: "لا حَوْلَ وَلا قُوَّةَ إِلاَّ بِاللَّهِ", category: "ذكر", source: "كنز من كنوز الجنة" },
  { text: "الْحَمْدُ لِلَّهِ حَمْدًا كَثِيرًا طَيِّبًا مُبَارَكًا فِيهِ", category: "ذكر", source: "حديث شريف" },
  { text: "رَبِّ اشْرَحْ لِي صَدْرِي وَيَسِّرْ لِي أَمْرِي", category: "آية كريمة", source: "سورة طه" }
];

const ReminderBanner = () => {
  const [reminder, setReminder] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReminder = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getRandomReminder();
      if (data && (data.text || data.content || data.message || data.title)) {
        setReminder(data);
      } else {
        // اختياري: اختيار ذكر عشوائي من الـ Fallback عند عدم إرجاع بيانات
        const randomFallback = FALLBACK_REMINDERS[Math.floor(Math.random() * FALLBACK_REMINDERS.length)];
        setReminder(randomFallback);
      }
    } catch (err) {
      const randomFallback = FALLBACK_REMINDERS[Math.floor(Math.random() * FALLBACK_REMINDERS.length)];
      setReminder(randomFallback);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReminder();

    // تحديث الذكر تلقائياً كل 60 ثانية (يمكنك تعديل الموعد أو إزالته حسب رغبتك)
    const interval = setInterval(() => {
      fetchReminder();
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchReminder]);

  if (!isVisible || !reminder) return null;

  const reminderText = reminder.text || reminder.content || reminder.title || reminder.message;

  return (
    <div className="fixed bottom-6 left-6 z-50 max-w-md w-full animate-fadeIn transition-all duration-300">
      <div className="rounded-2xl border border-border bg-surface/95 p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/50">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600">
            <BookOpen size={14} />
            <span>{reminder.category || 'آية كريمة / ذكر'}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={fetchReminder}
              disabled={isRefreshing}
              className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas hover:text-ink transition disabled:opacity-50"
              title="تحديث الذكر"
              aria-label="تحديث الذكر"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="rounded-lg p-1.5 text-ink-soft hover:bg-canvas hover:text-danger transition"
              title="إغلاق"
              aria-label="إغلاق"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="py-2 text-right">
          <p className="text-base font-medium text-ink leading-relaxed" dir="auto">
            {reminderText}
          </p>
          {reminder.source && (
            <p className="mt-2 text-xs text-emerald-600 font-semibold" dir="auto">
              {reminder.source}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderBanner;