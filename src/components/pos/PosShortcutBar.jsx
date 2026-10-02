// File: src/components/pos/PosShortcutBar.jsx
import { Keyboard } from 'lucide-react';

const SHORTCUTS = [
  { keys: ['F1'], label: 'بحث / باركود' },
  { keys: ['F2'], label: 'دفع نقدي' },
  { keys: ['F3'], label: 'عميل' },
  { keys: ['F4'], label: 'خصم' },
  { keys: ['F8'], label: 'تعليق' },
  { keys: ['F9'], label: 'صوتي' },
  { keys: ['↑', '↓'], label: 'تنقّل' },
  { keys: ['+', '−'], label: 'كمية' },
  { keys: ['Del'], label: 'حذف' },
];

function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1 rounded border border-border bg-canvas text-[10px] font-mono font-bold text-ink leading-none">
      {children}
    </kbd>
  );
}

export default function PosShortcutBar() {
  return (
    <div
      dir="rtl"
      role="note"
      aria-label="اختصارات لوحة المفاتيح"
      className="fixed bottom-0 inset-x-0 z-40 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border bg-surface/95 px-4 py-1.5 text-[11px] text-ink-soft backdrop-blur"
    >
      <span className="inline-flex items-center gap-1.5 text-ink font-bold">
        <Keyboard size={13} />
        اختصارات
      </span>
      {SHORTCUTS.map((s) => (
        <span key={s.label} className="inline-flex items-center gap-1">
          <span className="inline-flex items-center gap-0.5">
            {s.keys.map((k) => (
              <Kbd key={k}>{k}</Kbd>
            ))}
          </span>
          <span>{s.label}</span>
        </span>
      ))}
    </div>
  );
}