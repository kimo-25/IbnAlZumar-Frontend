// File: src/utils/pos/paymentOptions.js
// Server payment-method values (unchanged) + the brand-themed buttons on the cashier screen.

export const PAYMENT_METHOD = {
  CASH: 2,
  CREDIT_CARD: 3,
  INSTAPAY: 4,
};

// Apple Pay has no PaymentMethod value on the API yet. It is settled on the bank card terminal, so it is
// recorded as CREDIT_CARD until the backend enum gets its own value — then change ONLY this line.
// (The receipt still prints "Apple Pay".)
export const APPLE_PAY_SERVER_METHOD = PAYMENT_METHOD.CREDIT_CARD;

export const PAYMENT_OPTIONS = [
  { key: "cash", serverMethod: PAYMENT_METHOD.CASH, label: "كاش", receiptLabel: "كاش", hint: "F2" },
  { key: "card", serverMethod: PAYMENT_METHOD.CREDIT_CARD, label: "بنك مصر", receiptLabel: "بطاقة (بنك مصر)", hint: "فيزا / ماستركارد" },
  { key: "instapay", serverMethod: PAYMENT_METHOD.INSTAPAY, label: "إنستا باي", receiptLabel: "إنستا باي", hint: "تحويل فوري" },
  { key: "applepay", serverMethod: APPLE_PAY_SERVER_METHOD, label: "Apple Pay", receiptLabel: "Apple Pay", hint: "NFC" },
];

export const PAYMENT_BY_KEY = Object.fromEntries(PAYMENT_OPTIONS.map((o) => [o.key, o]));

// Fallback when a caller only knows the server value.
export const PAYMENT_LABEL_BY_METHOD = {
  [PAYMENT_METHOD.CASH]: "كاش",
  [PAYMENT_METHOD.CREDIT_CARD]: "بطاقة (بنك مصر)",
  [PAYMENT_METHOD.INSTAPAY]: "إنستا باي",
};
