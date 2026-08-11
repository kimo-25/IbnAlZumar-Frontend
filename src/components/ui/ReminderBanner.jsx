// File: src/components/ui/ReminderBanner.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getRandomReminder } from '../../api/reminders';
import { BookOpen, RefreshCw, X } from 'lucide-react';

const DISPLAY_DURATION = 10000;   
const INTERVAL_DURATION = 120000; 

const ReminderBanner = () => {
  const [reminder, setReminder] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchReminder = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await getRandomReminder();
      if (data && data.text) {
        setReminder(data);
      }
    } catch (err) {
      console.error("فشل في جلب الذكر من الـ API:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let timerHide;
    let intervalTimer;

    const showCycle = async () => {
      await fetchReminder();
      setIsVisible(true);

      timerHide = setTimeout(() => {
        setIsVisible(false);
      }, DISPLAY_DURATION);
    };

    showCycle();

    intervalTimer = setInterval(() => {
      showCycle();
    }, INTERVAL_DURATION);

    return () => {
      clearTimeout(timerHide);
      clearInterval(intervalTimer);
    };
  }, [fetchReminder]);

  if (!isVisible || !reminder) return null;

  // تحديد التصنيف بناءً على الـ Type أو Category القادم من الباك اند (مثلاً 1 لآية، 2 لذكر)
  const categoryLabel = reminder.category || (reminder.type === 1 ? 'آية كريمة' : 'ذكر / دعاء');

  return (
    <div className="fixed bottom-4 left-4 z-50 w-full max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-500">
      <div className="rounded-2xl border border-border bg-surface/95 p-3 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-border/50 pb-2 mb-2">
          <div className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600">
            <BookOpen size={12} />
            <span>{categoryLabel}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button
              onClick={fetchReminder}
              disabled={isRefreshing}
              className="rounded-lg p-1 text-ink-soft hover:bg-canvas hover:text-ink transition disabled:opacity-50"
              title="تحديث"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsVisible(false)}
              className="rounded-lg p-1 text-ink-soft hover:bg-canvas hover:text-danger transition"
              title="إغلاق"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="text-right">
          <p className="text-sm font-medium text-ink leading-relaxed" dir="auto">
            {reminder.text}
          </p>
          {(reminder.source || reminder.surahName) && (
            <p className="mt-1.5 text-[10px] text-emerald-600/80 font-semibold" dir="auto">
              {reminder.source} {reminder.surahName ? `(سورة ${reminder.surahName} - آية ${reminder.ayahNumber})` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReminderBanner;