import { useEffect, useRef, useState } from 'react';

export default function FastChangeModal({ open, total, onConfirm, onClose }) {
  const [received, setReceived] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReceived('');
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  if (!open) return null;

  const receivedNum = Number(received) || 0;
  const change = receivedNum - total;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-2xl border border-border bg-surface p-5 shadow-xl">
        <h3 className="mb-4 text-lg font-bold">الدفع النقدي</h3>

        <div className="mb-3 flex justify-between text-sm">
          <span>الإجمالي</span>
          <span className="font-mono font-bold">{total.toFixed(2)}</span>
        </div>

        <input
          ref={inputRef}
          value={received}
          onChange={(e) => setReceived(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onConfirm({ received: receivedNum, change });
            if (e.key === 'Escape') onClose();
          }}
          className="mb-3 w-full rounded-lg border border-border px-3 py-2 font-mono text-lg"
          placeholder="المبلغ المستلم"
          type="number"
        />

        <div className="mb-4 flex gap-2">
          {[50, 100, 200].map((v) => (
            <button
              key={v}
              onClick={() => setReceived(String(v))}
              className="rounded-lg border border-border px-3 py-1 text-sm"
            >
              {v}
            </button>
          ))}
        </div>

        <div className="mb-4 flex justify-between text-sm">
          <span>الباقي</span>
          <span className={change >= 0 ? 'text-success' : 'text-danger'}>
            {change.toFixed(2)}
          </span>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border px-4 py-2">
            إلغاء
          </button>
          <button
            disabled={change < 0}
            onClick={() => onConfirm({ received: receivedNum, change })}
            className="rounded-lg bg-amber px-4 py-2 text-white disabled:opacity-50"
          >
            تأكيد
          </button>
        </div>
      </div>
    </div>
  );
}