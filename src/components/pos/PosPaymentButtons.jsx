// File: src/components/pos/PosPaymentButtons.jsx
// Brand-themed payment buttons: Cash (green) · Banque Misr card (maroon + Visa/Mastercard) ·
// InstaPay (violet→pink gradient) · Apple Pay (black).
import { Banknote, Smartphone, CreditCard } from "lucide-react";
import { PAYMENT_OPTIONS } from "../../utils/pos/paymentOptions";

// Apple logo (24×24 path)
const APPLE_PATH =
  "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701";

const THEME = {
  cash: { background: "linear-gradient(135deg,#047857,#10b981)" },
  card: { background: "linear-gradient(135deg,#6b0f2a,#a3192f)" }, // Banque Misr maroon-red
  instapay: { background: "linear-gradient(135deg,#6d28d9,#c026d3 55%,#ec4899)" },
  applepay: { background: "#000000" },
};

function Icon({ k }) {
  if (k === "cash") return <Banknote size={20} aria-hidden />;
  if (k === "instapay") return <Smartphone size={20} aria-hidden />;
  if (k === "applepay")
    return (
      <span className="flex items-center gap-0.5" aria-hidden>
        <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
          <path d={APPLE_PATH} />
        </svg>
        <span className="text-[15px] font-semibold leading-none tracking-tight">Pay</span>
      </span>
    );
  // Banque Misr card: card icon + Visa / Mastercard marks
  return (
    <span className="flex items-center gap-1.5" aria-hidden>
      <CreditCard size={18} />
      <span className="rounded-[3px] bg-white px-1 text-[9px] font-black italic leading-4 text-[#1a1f71]">VISA</span>
      <svg viewBox="0 0 24 16" width="22" height="14">
        <circle cx="8" cy="8" r="7" fill="#eb001b" />
        <circle cx="16" cy="8" r="7" fill="#f79e1b" fillOpacity=".92" />
      </svg>
    </span>
  );
}

export default function PosPaymentButtons({ disabled, onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-2 pt-1">
      {PAYMENT_OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          data-pay={o.key}
          disabled={disabled}
          onClick={() => onSelect(o.key)}
          style={THEME[o.key]}
          className="flex min-h-[64px] flex-col items-center justify-center gap-1 rounded-xl px-2 py-2.5 text-white shadow-sm ring-1 ring-black/10 transition hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Icon k={o.key} />
          <span className="text-[12px] font-bold leading-none">{o.label}</span>
          <span className="text-[9px] font-medium leading-none text-white/75">{o.hint}</span>
        </button>
      ))}
    </div>
  );
}
