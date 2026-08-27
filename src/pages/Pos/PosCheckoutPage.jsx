// File: src/pages/Pos/PosCheckoutPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useAuth } from "../../context/AuthContext";
import Pagination from "../../components/ui/Pagination";
import { getCustomers, createCustomer } from "../../api/adminApi";
import VoiceAttendanceButton from './VoiceAttendanceButton';
import VoiceInvoiceButton from '../admin/VoiceInvoiceButton'

import {
  addLocalTransaction,
  getPendingTransactions,
  cacheProducts,
  getLocalProducts,
} from "../../db/db";

import { printInvoice } from "../../utils/printInvoice";
import {
  User,
  UserPlus,
  Search,
  Check,
  X,
  Plus,
  Minus,
  Trash2,
  LogOut,
  Receipt,
  Ban,
  Banknote,
  CreditCard,
  Smartphone,
  ImageOff,
  Wifi,
  WifiOff,
  ShoppingCart,
} from "lucide-react";

const TAX_RATE = 0.15;

// --- Backend enum values (kept in sync with Domain/Enums.cs) ---
const PAYMENT_METHOD = {
  CASH: 2,
  CREDIT_CARD: 3,
  INSTAPAY: 4,
};
const ORDER_SOURCE_IN_STORE = 2;

const PAYMENT_LABELS = {
  [PAYMENT_METHOD.CASH]: "كاش",
  [PAYMENT_METHOD.CREDIT_CARD]: "بطاقة إئتمان",
  [PAYMENT_METHOD.INSTAPAY]: "محفظة إلكترونية",
};

export default function PosCheckoutPage() {
  const isOnline = useOnlineStatus();
  const { logout } = useAuth();
  const searchInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [discountType, setDiscountType] = useState("Fixed");
  const [discountValue, setDiscountValue] = useState(0);

  // إدارة اختيار وإضافة العملاء للكاشير
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // null = عميل نقدي
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phoneNumber: "" });
  const [customerSearch, setCustomerSearch] = useState("");

  // نوافذ الهيدر
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  // نافذة حاسبة الكاش
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    loadProducts(currentPage);
  }, [currentPage]);

  useEffect(() => {
    loadPending();
    loadCustomersList();
    searchInputRef.current?.focus();
  }, []);

  async function loadCustomersList() {
    try {
      const data = await getCustomers();
      const list = Array.isArray(data) ? data : (data.items || data.data || []);
      setCustomers(list);
    } catch (err) {
      console.warn("تعذر جلب قائمة العملاء في الكاشير", err);
    }
  }

  async function loadPending() {
    const items = await getPendingTransactions();
    setPendingCount(items.length);
  }

  async function loadProducts(page = 1) {
    try {
      const response = await axiosInstance.get("/Products", {
        params: {
          pageNumber: page,
          pageSize: 30,
        },
      });

      const data = response.data.items || [];
      setProducts(data);
      setTotalPages(response.data.totalPages || 1);
      await cacheProducts(data);
    } catch (err) {
      const localProducts = await getLocalProducts();
      setProducts(localProducts);
      setTotalPages(1);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.nameAr?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCustomers = customers.filter(
    (c) =>
      (c.fullName || c.name || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phoneNumber || c.phone || "").includes(customerSearch)
  );

  const addToCart = (product) => {
    const exists = cart.find((x) => x.id === product.id);

    if (exists) {
      setCart(
        cart.map((x) =>
          x.id === product.id
            ? { ...x, quantity: x.quantity + 1 }
            : x
        )
      );
      return;
    }

    setCart([
      ...cart,
      {
        ...product,
        quantity: 1,
      },
    ]);
  };

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      setCart(cart.filter((x) => x.id !== productId));
      return;
    }

    setCart(
      cart.map((x) =>
        x.id === productId
          ? { ...x, quantity: qty }
          : x
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter((x) => x.id !== productId));
  };

  // بحث السكانر: لو المستخدم ضرب Enter وفي منتج واحد مطابق تماماً للباركود/الـ SKU، ضيفه فوراً
  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    const term = search.trim().toLowerCase();
    if (!term) return;

    const exactMatch = products.find(
      (p) => p.sku?.toLowerCase() === term || p.barcode?.toLowerCase() === term
    );

    if (exactMatch) {
      addToCart(exactMatch);
      setSearch("");
    }
  };

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + (item.sellingPrice || 0) * item.quantity,
        0
      ),
    [cart]
  );

  const normalizedDiscountValue = Math.max(Number(discountValue) || 0, 0);
  const safeDiscount = Math.min(discountType === "Percentage" ? subtotal * Math.min(normalizedDiscountValue, 100) / 100 : normalizedDiscountValue, subtotal);
  const discountPercentage = subtotal > 0 ? (safeDiscount / subtotal) * 100 : 0;
  const discountedSubtotal = Math.max(subtotal - safeDiscount, 0);
  const tax = discountedSubtotal * TAX_RATE;
  const total = discountedSubtotal + tax;

  const cashReceivedNumber = Number(cashReceived) || 0;
  const changeDue = cashReceivedNumber - total;

  async function handleQuickAddCustomer(e) {
    e.preventDefault();
    if (!newCustomer.fullName.trim()) return;

    try {
      const created = await createCustomer({
        fullName: newCustomer.fullName.trim(),
        name: newCustomer.fullName.trim(),
        phoneNumber: newCustomer.phoneNumber.trim(),
        phone: newCustomer.phoneNumber.trim(),
      });

      const added = created.data || created;
      setSelectedCustomer(added);
      setNewCustomer({ fullName: "", phoneNumber: "" });
      setIsAddingNewCustomer(false);
      await loadCustomersList();
    } catch (err) {
      alert("حدث خطأ أثناء إضافة العميل الجدد.");
    }
  }

  // --- تسجيل مصروف ---
  async function handleSubmitExpense(e) {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) return;

    setExpenseSubmitting(true);
    try {
      await axiosInstance.post("/Expenses", {
        amount,
        notes: expenseNotes.trim(),
      });
      setExpenseAmount("");
      setExpenseNotes("");
      setShowExpenseModal(false);
      alert("تم تسجيل المصروف بنجاح");
    } catch (err) {
      console.error(err);
      alert("تعذر تسجيل المصروف، حاول مرة أخرى.");
    } finally {
      setExpenseSubmitting(false);
    }
  }

  // --- تسجيل خروج ---
  function handleLogout() {
    logout();
    window.location.assign(import.meta.env.BASE_URL + "login");
  }

  // بناء الـ payload بالظبط زي CreateOrderDto.cs ومنفذه فعلياً (أونلاين/أوفلاين)
  async function submitOrder(paymentMethod) {
    if (!cart.length) return;

    const invoice = {
      customerName: selectedCustomer
        ? (selectedCustomer.fullName || selectedCustomer.name || "عميل نقدي")
        : "عميل نقدي",
      customerPhone: selectedCustomer
        ? (selectedCustomer.phoneNumber || selectedCustomer.phone || "")
        : "",
      customerId: selectedCustomer ? (selectedCustomer.id || selectedCustomer.Id) : null,
      paymentMethod,
      orderSource: ORDER_SOURCE_IN_STORE,
      discountType,
      discountValue: normalizedDiscountValue,
      discountAmount: safeDiscount,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
      })),
    };

    setIsCheckingOut(true);
    try {
      if (isOnline) {
        await axiosInstance.post("/Orders", invoice);
      } else {
        await addLocalTransaction(invoice);
        const pending = await getPendingTransactions();
        setPendingCount(pending.length);
      }

      handlePrint(paymentMethod);
      alert("تم إنشاء الفاتورة بنجاح");
      setCart([]);
      setSelectedCustomer(null);
      setDiscountValue(0);
      setDiscountType("Fixed");
      setShowCashModal(false);
      setCashReceived("");
    } catch (err) {
      console.error(err);
      alert("تعذر حفظ الفاتورة، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsCheckingOut(false);
    }
  }

  // كاش بيفتح نافذة الحاسبة الأول، بطاقة/محفظة بتتنفذ على طول
  function handlePaymentSelect(paymentMethod) {
    if (!cart.length) return;
    if (paymentMethod === PAYMENT_METHOD.CASH) {
      setCashReceived("");
      setShowCashModal(true);
      return;
    }
    submitOrder(paymentMethod);
  }

  const handlePrint = (paymentMethod) => {
    printInvoice(
      {
        orderNumber: `POS-${Date.now()}`,
        createdAt: new Date().toISOString(),
        paymentMethod: PAYMENT_LABELS[paymentMethod] || "CASH",
        subtotal,
        discount: safeDiscount,
        tax,
        total,
        shippingCost: 0,
        items: cart.map((item) => ({
          productId: item.id,
          productName: item.nameAr || item.name,
          name: item.nameAr || item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.sellingPrice,
        })),
      },
      {
        fullName: selectedCustomer ? (selectedCustomer.fullName || selectedCustomer.name) : "عميل نقدي",
        phone: selectedCustomer ? (selectedCustomer.phoneNumber || selectedCustomer.phone) : "-",
        email: "",
      },
      true
    );
  };

  return (
    <div className="min-h-screen bg-canvas" dir="rtl">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-30 bg-surface border-b border-border px-4 md:px-6 py-3 flex items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
            P
          </div>
          <div>
            <h1 className="font-black text-ink text-sm leading-none">Store POS</h1>
            <span
              className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isOnline
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-rose-100 text-rose-700"
              }`}
            >
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? "متصل" : `أوفلاين • ${pendingCount} معلقة`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <VoiceInvoiceButton />
          <VoiceAttendanceButton />

          <button
            type="button"
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-canvas hover:bg-amber/10 text-ink text-xs font-bold px-3 py-2 transition cursor-pointer"
          >
            <Receipt size={14} className="text-amber-dark" />
            <span className="hidden sm:inline">تسجيل مصروف</span>
          </button>

          <button
            type="button"
            onClick={() => setShowModifyModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-canvas hover:bg-canvas/70 text-ink text-xs font-bold px-3 py-2 transition cursor-pointer"
          >
            <Ban size={14} className="text-ink-soft" />
            <span className="hidden sm:inline">تعديل / إلغاء طلب</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-3 py-2 transition cursor-pointer"
          >
            <LogOut size={14} />
            <span className="hidden sm:inline">تسجيل خروج</span>
          </button>
        </div>
      </header>

      {/* ===== Main Layout ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 md:p-6">
        {/* ---------- Left: Product Grid (≈70%) ---------- */}
        <div className="lg:col-span-7 space-y-4">
          <div className="sticky top-[68px] z-20 bg-canvas pb-1">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="امسح الباركود أو ابحث بالاسم / SKU..."
                className="w-full border border-border rounded-2xl p-3.5 pr-11 text-sm bg-surface shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredProducts.map((product) => (
              <button
                type="button"
                key={product.id}
                onClick={() => addToCart(product)}
                className="group relative bg-surface border border-emerald-100 rounded-2xl overflow-hidden text-right transition hover:border-emerald-400 hover:shadow-md active:scale-[0.97] cursor-pointer"
              >
                <div className="aspect-square bg-emerald-50 flex items-center justify-center overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.nameAr || product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <ImageOff size={26} className="text-emerald-300" />
                  )}
                </div>

                <div className="p-2.5 space-y-0.5">
                  <h3 className="font-bold text-xs text-ink truncate">
                    {product.nameAr || product.name}
                  </h3>
                  <p className="text-[10px] text-ink-soft font-mono truncate">
                    {product.sku || "—"}
                  </p>
                  <p className="text-emerald-700 font-black text-sm font-mono pt-0.5">
                    {product.sellingPrice} ج.م
                  </p>
                </div>

                <span className="absolute top-2 left-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Plus size={14} />
                </span>
              </button>
            ))}

            {filteredProducts.length === 0 && (
              <div className="col-span-full text-center py-16 text-ink-soft text-sm">
                لا توجد منتجات مطابقة للبحث
              </div>
            )}
          </div>

          <div className="mt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* ---------- Right: Cart & Checkout (≈30%) ---------- */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-[68px] bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-ink border-b border-border pb-2 flex items-center gap-1.5">
              <ShoppingCart size={15} className="text-emerald-600" />
              تفاصيل الطلب والعميل
            </h2>

            {/* Customer Selection Section */}
            <div className="bg-canvas border border-border rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-ink flex items-center gap-1.5">
                  <User size={14} className="text-amber-dark" />
                  العميل المحدد:
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCustomer(!isAddingNewCustomer)}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <UserPlus size={12} />
                  {isAddingNewCustomer ? "إلغاء" : "عميل جديد"}
                </button>
              </div>

              {isAddingNewCustomer ? (
                <form onSubmit={handleQuickAddCustomer} className="space-y-2 pt-1">
                  <input
                    type="text"
                    required
                    placeholder="اسم العميل"
                    value={newCustomer.fullName}
                    onChange={(e) => setNewCustomer({ ...newCustomer, fullName: e.target.value })}
                    className="w-full border border-border rounded-lg p-1.5 text-xs bg-surface outline-none"
                  />
                  <input
                    type="text"
                    placeholder="رقم الهاتف (اختياري)"
                    value={newCustomer.phoneNumber}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phoneNumber: e.target.value })}
                    className="w-full border border-border rounded-lg p-1.5 text-xs bg-surface outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 text-white text-xs font-bold py-1.5 rounded-lg hover:bg-emerald-700 transition cursor-pointer"
                  >
                    حفظ واختيار
                  </button>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedCustomer(null)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        selectedCustomer === null
                          ? "bg-amber/15 border-amber text-amber-dark"
                          : "bg-surface border-border text-ink-soft hover:bg-canvas"
                      }`}
                    >
                      عميل نقدي / معروض
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="ابحث عن عميل مسجل..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 pr-7 text-xs bg-surface outline-none"
                    />
                    <Search size={12} className="absolute right-2 top-2.5 text-ink-soft" />
                  </div>

                  {customerSearch && (
                    <div className="max-h-32 overflow-y-auto border border-border rounded-lg bg-surface divide-y divide-border">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-2 text-[11px] text-ink-soft text-center">لا يوجد عملاء مطابقين</div>
                      ) : (
                        filteredCustomers.map((c) => (
                          <button
                            type="button"
                            key={c.id || c.Id}
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerSearch("");
                            }}
                            className="w-full p-2 text-right text-xs hover:bg-canvas flex justify-between items-center cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-ink">{c.fullName || c.name}</div>
                              <div className="text-[10px] text-ink-soft">{c.phoneNumber || c.phone || "بدون رقم"}</div>
                            </div>
                            {(selectedCustomer?.id === c.id || selectedCustomer?.Id === c.Id) && (
                              <Check size={14} className="text-emerald-600" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}

                  {selectedCustomer && (
                    <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-emerald-900">{selectedCustomer.fullName || selectedCustomer.name}</span>
                        <span className="block text-[10px] text-emerald-700">{selectedCustomer.phoneNumber || selectedCustomer.phone}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(null)}
                        className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        إزالة
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="max-h-60 overflow-y-auto space-y-2 divide-y divide-border pl-1">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink-soft flex flex-col items-center gap-1.5">
                  <ShoppingCart size={22} className="text-border" />
                  السلة فارغة حالياً
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pt-2 flex justify-between items-center text-xs gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-ink truncate">{item.nameAr || item.name}</div>
                      <div className="text-ink-soft text-[10px] font-mono">{item.sellingPrice} ج.م</div>
                    </div>

                    <div className="flex gap-1 items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity - 1)}
                        className="w-6 h-6 bg-canvas border border-border rounded-lg flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-mono font-bold text-xs w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.id, item.quantity + 1)}
                        className="w-6 h-6 bg-canvas border border-border rounded-lg flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Discount Input */}
            <div className="space-y-2 rounded-xl border border-border bg-canvas p-2.5">
              <p className="text-xs font-bold text-ink">الخصم</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-ink-soft">المبلغ (ج.م)<input type="number" min="0" step="0.01" value={discountType === "Fixed" ? discountValue : safeDiscount.toFixed(2)} onChange={(e) => { setDiscountType("Fixed"); setDiscountValue(e.target.value) }} className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500" /></label>
                <label className="text-[11px] text-ink-soft">النسبة (%)<input type="number" min="0" max="100" step="0.01" value={discountType === "Percentage" ? discountValue : discountPercentage.toFixed(2)} onChange={(e) => { setDiscountType("Percentage"); setDiscountValue(e.target.value) }} className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500" /></label>
              </div>
              <p className="text-[10px] text-ink-soft">سيتم تطبيق خصم {safeDiscount.toFixed(2)} ج.م ({discountPercentage.toFixed(2)}%)</p>
            </div>

            <hr className="border-border" />

            {/* Subtotal & Totals */}
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-ink-soft">
                <span>المبلغ الجزئي:</span>
                <span className="font-mono">{subtotal.toFixed(2)} ج.م</span>
              </div>
              {safeDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>الخصم:</span>
                  <span className="font-mono">- {safeDiscount.toFixed(2)} ج.م</span>
                </div>
              )}
              <div className="flex justify-between text-ink-soft">
                <span>القيمة المضافة (15%):</span>
                <span className="font-mono">{tax.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-ink pt-1 border-t border-border">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-emerald-700">{total.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Checkout: Payment Method Grid */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              <button
                type="button"
                onClick={() => handlePaymentSelect(PAYMENT_METHOD.CASH)}
                disabled={!cart.length || isCheckingOut}
                className="flex flex-col items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Banknote size={18} />
                <span className="text-[11px] font-bold">كاش</span>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentSelect(PAYMENT_METHOD.CREDIT_CARD)}
                disabled={!cart.length || isCheckingOut}
                className="flex flex-col items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white rounded-xl py-3 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CreditCard size={18} />
                <span className="text-[11px] font-bold">بطاقة</span>
              </button>

              <button
                type="button"
                onClick={() => handlePaymentSelect(PAYMENT_METHOD.INSTAPAY)}
                disabled={!cart.length || isCheckingOut}
                className="flex flex-col items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white rounded-xl py-3 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Smartphone size={18} />
                <span className="text-[11px] font-bold">محفظة</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Modal: تسجيل مصروف ===== */}
      {showExpenseModal && (
        <ModalShell onClose={() => setShowExpenseModal(false)} title="تسجيل مصروف" icon={<Receipt size={16} className="text-amber-dark" />}>
          <form onSubmit={handleSubmitExpense} className="space-y-3">
            <div>
              <label className="text-xs font-bold text-ink block mb-1">المبلغ (ج.م)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                autoFocus
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                className="w-full border border-border rounded-xl p-2.5 text-sm bg-canvas outline-none font-mono focus:border-emerald-500"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-ink block mb-1">ملاحظات</label>
              <textarea
                value={expenseNotes}
                onChange={(e) => setExpenseNotes(e.target.value)}
                rows={3}
                className="w-full border border-border rounded-xl p-2.5 text-sm bg-canvas outline-none resize-none focus:border-emerald-500"
                placeholder="سبب المصروف..."
              />
            </div>
            <button
              type="submit"
              disabled={expenseSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2.5 rounded-xl transition cursor-pointer disabled:opacity-50"
            >
              {expenseSubmitting ? "جاري الحفظ..." : "حفظ المصروف"}
            </button>
          </form>
        </ModalShell>
      )}

      {/* ===== Modal: تعديل / إلغاء طلب ===== */}
      {showModifyModal && (
        <ModalShell onClose={() => setShowModifyModal(false)} title="تعديل / إلغاء طلب" icon={<Ban size={16} className="text-ink-soft" />}>
          <p className="text-sm text-ink-soft leading-relaxed">
            لتعديل أو إلغاء طلب يرجى التوجه لصفحة العمليات
          </p>
          <button
            type="button"
            onClick={() => setShowModifyModal(false)}
            className="mt-4 w-full bg-canvas border border-border hover:bg-border/30 text-ink font-bold text-sm py-2.5 rounded-xl transition cursor-pointer"
          >
            حسناً
          </button>
        </ModalShell>
      )}

      {/* ===== Modal: حاسبة الكاش ===== */}
      {showCashModal && (
        <ModalShell onClose={() => setShowCashModal(false)} title="الدفع نقداً" icon={<Banknote size={16} className="text-emerald-600" />}>
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-ink-soft">
              <span>الإجمالي المطلوب:</span>
              <span className="font-mono font-bold text-ink">{total.toFixed(2)} ج.م</span>
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1">المبلغ المستلم من العميل</label>
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                className="w-full border border-border rounded-xl p-3 text-lg font-mono font-bold bg-canvas outline-none focus:border-emerald-500 text-center"
                placeholder="0.00"
              />
            </div>

            <div
              className={`rounded-xl p-4 text-center ${
                changeDue >= 0 ? "bg-emerald-50 border border-emerald-200" : "bg-rose-50 border border-rose-200"
              }`}
            >
              <div className="text-xs font-bold text-ink-soft mb-1">الباقي للعميل</div>
              <div
                className={`text-3xl font-black font-mono ${
                  changeDue >= 0 ? "text-emerald-700" : "text-rose-600"
                }`}
              >
                {changeDue >= 0 ? changeDue.toFixed(2) : "0.00"} ج.م
              </div>
              {changeDue < 0 && (
                <div className="text-[11px] text-rose-600 font-bold mt-1">
                  المبلغ المستلم أقل من الإجمالي بـ {Math.abs(changeDue).toFixed(2)} ج.م
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={isCheckingOut || cashReceivedNumber < total}
              onClick={() => submitOrder(PAYMENT_METHOD.CASH)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? "جاري التنفيذ..." : "تأكيد وطباعة الفاتورة"}
            </button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

// نافذة عامة تستخدم في كل مودالز الصفحة
function ModalShell({ title, icon, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl shadow-lg w-full max-w-sm p-5"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-ink flex items-center gap-1.5">
            {icon}
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-ink-soft hover:bg-canvas transition cursor-pointer"
          >
            <X size={15} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}