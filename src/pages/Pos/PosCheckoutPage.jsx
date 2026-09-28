// File: src/pages/Pos/PosCheckoutPage.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useAuth } from "../../context/AuthContext";
import { getCustomers, createCustomer } from "../../api/adminApi";
import { searchPosProducts, PRICING_TIER, PRICING_TIER_LABELS } from "../../api/posApi";
import VoiceAttendanceButton from './VoiceAttendanceButton';
import VoiceInvoiceButton from '../admin/VoiceInvoiceButton'
import ProductLightbox from "../../components/pos/ProductLightbox";
import VariantUnitPickerModal from "../../components/pos/VariantUnitPickerModal";
import CreateMaintenanceTicketModal from "../../components/operations/CreateMaintenanceTicketModal";
import { findBaseUnit } from "../../utils/pos/unitPricing";

import {
  addLocalTransaction,
  getPendingTransactions,
  cacheProducts,
  getLocalProducts,
} from "../../db/db";

import { printInvoice, PRINT_FORMAT, PRINT_FORMAT_LABELS } from "../../utils/print";
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
  ZoomIn,
  Printer,
  Barcode,
  Layers,
  Wrench,
} from "lucide-react";

// H-08: this is a CLIENT-SIDE ESTIMATE ONLY, used before checkout for the
// live running total and the cash-change calculator (the cashier needs a
// number instantly, before the order exists on the server). It is kept in
// sync with the server's authoritative rate (OrderService.EgyptVatRate,
// 14%) — it was previously hardcoded to 15%, which didn't match anything
// the backend actually charged. Once an order is created online, the
// printed invoice uses the server's real TaxAmount/TotalAmount instead of
// this estimate — see handlePrint().
const ESTIMATED_TAX_RATE = 0.14;

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

const PRINT_FORMAT_OPTIONS = [PRINT_FORMAT.THERMAL_80, PRINT_FORMAT.THERMAL_58, PRINT_FORMAT.A4, PRINT_FORMAT.A5];

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
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [discountType, setDiscountType] = useState("Fixed");
  const [discountValue, setDiscountValue] = useState(0);

  // Phase 1: pricing tier (Retail/FirstWholesale/Wholesale) selected for this sale, and
  // the print format the cashier wants for the next receipt (thermal80/58, A4, A5).
  const [pricingTier, setPricingTier] = useState(PRICING_TIER.RETAIL);
  const [printFormat, setPrintFormat] = useState(PRINT_FORMAT.THERMAL_80);

  // Phase 1: full-screen image preview + the variant/unit picker for products that have
  // more than one variant and/or more than one sell unit.
  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [pickerProduct, setPickerProduct] = useState(null);

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
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [printMaintenanceLabel, setPrintMaintenanceLabel] = useState(false);

  // نافذة حاسبة الكاش
  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    loadProducts(currentPage, search, pricingTier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pricingTier]);

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

  // Phase 1: switched from the raw /Products list to the POS-optimized /Pos/products
  // endpoint, which returns each product's variants, unit conversions, and configured
  // pricing-tier price breaks in the same round trip (see PosCatalogService).
  async function loadProducts(page = 1, query = "", tier = pricingTier) {
    setLoadingProducts(true);
    try {
      const data = await searchPosProducts({ query, tier, pageNumber: page, pageSize: 30 });
      const items = data.items || [];
      setProducts(items);
      setTotalPages(data.totalPages || 1);
      await cacheProducts(items);
    } catch (err) {
      const localProducts = await getLocalProducts();
      setProducts(localProducts);
      setTotalPages(1);
    } finally {
      setLoadingProducts(false);
    }
  }

  // بحث السيرفر عند الكتابة (debounced) — السكانر ما زال يعتمد على handleSearchKeyDown
  // للإضافة الفورية عند تطابق الباركود/الـ SKU بالكامل.
  useEffect(() => {
    const timeout = setTimeout(() => {
      setCurrentPage(1);
      loadProducts(1, search, pricingTier);
    }, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filteredCustomers = customers.filter(
    (c) =>
      (c.fullName || c.name || "").toLowerCase().includes(customerSearch.toLowerCase()) ||
      (c.phoneNumber || c.phone || "").includes(customerSearch)
  );

  // منتج بدون متغيّرات وبوحدة بيع واحدة (أو بدون تعريف وحدات) بيتضاف للسلة فوراً؛
  // غير كده بتتفتح نافذة اختيار المتغيّر/الوحدة/الكمية.
  function needsPicker(product) {
    const hasVariants = (product.variants || []).length > 0;
    const hasMultipleUnits = (product.units || []).length > 1;
    return hasVariants || hasMultipleUnits;
  }

  function addSimpleProductToCart(product) {
    const baseUnit = findBaseUnit(product.units);
    addResolvedLineToCart(product, {
      variant: null,
      unit: baseUnit || { fromUnit: "قطعة", toUnit: "قطعة", factor: 1, isBaseUnit: true },
      quantity: 1,
      quantityInBaseUnit: 1,
      unitPrice: product.sellingPrice,
      lineTotal: product.sellingPrice,
    });
  }

  function handleTileClick(product) {
    if (needsPicker(product)) {
      setPickerProduct(product);
      return;
    }
    addSimpleProductToCart(product);
  }

  // يضيف سطر سلة محلول بالكامل (سعر + وحدة + متغيّر) — نفس الشكل سواء جه من الإضافة
  // المباشرة أو من نافذة الاختيار.
  function addResolvedLineToCart(product, resolved) {
    const cartLineId = `${product.id}-${resolved.variant?.id || "base"}-${resolved.unit?.id || resolved.unit?.fromUnit}`;

    setCart((prev) => {
      const existing = prev.find((x) => x.cartLineId === cartLineId);
      if (existing) {
        const newQuantity = existing.quantity + resolved.quantity;
        return prev.map((x) =>
          x.cartLineId === cartLineId
            ? {
                ...x,
                quantity: newQuantity,
                quantityInBaseUnit: newQuantity * (existing.unit?.factor || 1),
              }
            : x
        );
      }

      return [
        ...prev,
        {
          cartLineId,
          id: product.id,
          productId: product.id,
          name: product.name,
          nameAr: product.nameAr,
          sku: resolved.variant?.sku || product.sku,
          imageUrl: product.imageUrl,
          variant: resolved.variant,
          unit: resolved.unit,
          quantity: resolved.quantity,
          quantityInBaseUnit: resolved.quantityInBaseUnit,
          unitPrice: resolved.unitPrice,
        },
      ];
    });
  }

  function handlePickerConfirm(resolved) {
    addResolvedLineToCart(pickerProduct, resolved);
    setPickerProduct(null);
  }

  const updateQty = (cartLineId, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((x) => x.cartLineId !== cartLineId));
      return;
    }

    setCart((prev) =>
      prev.map((x) =>
        x.cartLineId === cartLineId
          ? { ...x, quantity: qty, quantityInBaseUnit: qty * (x.unit?.factor || 1) }
          : x
      )
    );
  };

  const removeFromCart = (cartLineId) => {
    setCart((prev) => prev.filter((x) => x.cartLineId !== cartLineId));
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
      handleTileClick(exactMatch);
      setSearch("");
    }
  };

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + (item.unitPrice || 0) * item.quantityInBaseUnit, 0),
    [cart]
  );

  const normalizedDiscountValue = Math.max(Number(discountValue) || 0, 0);
  const safeDiscount = Math.min(discountType === "Percentage" ? subtotal * Math.min(normalizedDiscountValue, 100) / 100 : normalizedDiscountValue, subtotal);
  const discountPercentage = subtotal > 0 ? (safeDiscount / subtotal) * 100 : 0;
  const discountedSubtotal = Math.max(subtotal - safeDiscount, 0);
  // H-08: estimate only — see ESTIMATED_TAX_RATE comment above.
  const tax = discountedSubtotal * ESTIMATED_TAX_RATE;
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
      // H-09: the backend now honestly returns 501 while Expense persistence
      // isn't wired up yet, instead of a fake 200 OK. Tell the cashier the
      // truth instead of pretending it was saved — and don't clear their
      // input, since nothing was actually recorded.
      if (err?.response?.status === 501) {
        alert("ميزة تسجيل المصاريف غير مفعّلة على السيرفر بعد. لم يتم حفظ هذا المصروف.");
      } else {
        console.error(err);
        alert("تعذر تسجيل المصروف، حاول مرة أخرى.");
      }
    } finally {
      setExpenseSubmitting(false);
    }
  }

  // --- تسجيل خروج ---
  function handleLogout() {
    logout();
    window.location.assign(import.meta.env.BASE_URL + "login");
  }

  // بناء الـ payload بالظبط زي CreateOrderDto.cs ومنفذه فعلياً (أونلاين/أوفلاين).
  // Phase 1: كل سطر بيُرسل بكمية الوحدة الأساسية (quantityInBaseUnit) لأن المخزون بالكامل
  // مخزّن بالوحدة الأساسية فقط (UnitConversion) — التحويل يحصل هنا عند حد الـ DTO فقط.
  // pricingTier مُرسلة كحقل إضافي؛ الباك إند الحالي يتجاهله لحد ما يتم دمج Order.PricingTier
  // (راجع BACKEND_CHANGES.md → "OrderService integration").
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
      pricingTier,
      discountType,
      discountValue: normalizedDiscountValue,
      discountAmount: safeDiscount,
      items: cart.map((item) => ({
        productId: item.productId,
        productVariantId: item.variant?.id || null,
        quantity: item.quantityInBaseUnit,
        unitPrice: item.unitPrice,
      })),
    };

    setIsCheckingOut(true);
    try {
      // H-08: when online, the server is the source of truth for tax/total
      // (OrderService.CreateAsync computes TaxAmount/TotalAmount server-side —
      // the client's estimated `tax`/`total` above are never sent or trusted).
      // We capture the real response and use it for the printed invoice.
      let serverOrder = null;

      if (isOnline) {
        const response = await axiosInstance.post("/Orders", invoice);
        serverOrder = response.data;
      } else {
        // Offline: no server figures exist yet — the order is settled for
        // real during the next sync. The printed receipt below falls back
        // to the local estimate in this case only.
        await addLocalTransaction(invoice);
        const pending = await getPendingTransactions();
        setPendingCount(pending.length);
      }

      handlePrint(paymentMethod, serverOrder);
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

  // H-08: prefers the server's authoritative figures (serverOrder) whenever
  // we have them — i.e. whenever the order was created online. Only falls
  // back to the local estimate for offline-queued orders, where no server
  // response exists yet.
  const handlePrint = (paymentMethod, serverOrder) => {
    const printSubtotal = serverOrder?.subTotal ?? subtotal;
    const printDiscount = serverOrder?.discountAmount ?? safeDiscount;
    const printTax = serverOrder?.taxAmount ?? tax;
    const printTotal = serverOrder?.totalAmount ?? total;

    printInvoice(
      {
        orderNumber: serverOrder?.orderNumber || `POS-${Date.now()}`,
        createdAt: serverOrder?.createdAt || new Date().toISOString(),
        paymentMethod: PAYMENT_LABELS[paymentMethod] || "CASH",
        subtotal: printSubtotal,
        discount: printDiscount,
        tax: printTax,
        total: printTotal,
        shippingCost: 0,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.nameAr || item.name,
          name: [item.nameAr || item.name, item.variant ? `(${[item.variant.color, item.variant.size].filter(Boolean).join(" / ")})` : null]
            .filter(Boolean)
            .join(" "),
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      {
        fullName: selectedCustomer ? (selectedCustomer.fullName || selectedCustomer.name) : "عميل نقدي",
        phone: selectedCustomer ? (selectedCustomer.phoneNumber || selectedCustomer.phone) : "-",
        email: "",
      },
      { format: printFormat }
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
            onClick={() => setShowMaintenanceModal(true)}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-emerald-700 cursor-pointer"
          >
            <Wrench size={14} />
            <span className="hidden sm:inline">تذكرة صيانة جديدة</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPrintMaintenanceLabel(true);
              setShowMaintenanceModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100 cursor-pointer"
          >
            <Barcode size={14} />
            <span className="hidden sm:inline">طبع باركود الجهاز</span>
          </button>

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
        {/* ---------- Left: Product Grid (≈70%) — Horizontal Grid View ---------- */}
        <div className="lg:col-span-7 space-y-4">
          <div className="sticky top-[68px] z-20 bg-canvas pb-1 space-y-2">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="امسح الباركود أو ابحث بالاسم / SKU..."
                className="w-full border border-border rounded-2xl p-3.5 pr-11 text-sm bg-surface shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoFocus
              />
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            </div>

            {/* Phase 1: pricing-tier selector — changes which price breaks the grid/cart resolve against */}
            <div className="flex items-center gap-2">
              <Layers size={13} className="text-ink-soft shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                {[PRICING_TIER.RETAIL, PRICING_TIER.FIRST_WHOLESALE, PRICING_TIER.WHOLESALE, PRICING_TIER.DISTRIBUTOR].map((tierValue) => (
                  <button
                    key={tierValue}
                    type="button"
                    onClick={() => setPricingTier(tierValue)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                      pricingTier === tierValue
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-surface border-border text-ink-soft hover:border-emerald-300"
                    }`}
                  >
                    {PRICING_TIER_LABELS[tierValue]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Horizontal Grid View: scrolls sideways instead of wrapping into vertical rows,
              so the cashier can flick through a wide, fixed-height strip of product tiles. */}
          <div className="flex gap-3 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth">
            {products.map((product) => (
              <div
                key={product.id}
                className="group relative w-40 shrink-0 snap-start rounded-2xl border border-emerald-100 bg-surface overflow-hidden text-right transition hover:border-emerald-400 hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => handleTileClick(product)}
                  className="block w-full text-right cursor-pointer active:scale-[0.97] transition"
                >
                  <div className="relative aspect-square bg-emerald-50 flex items-center justify-center overflow-hidden">
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

                    {product.quantityOnHand <= 0 && product.trackInventory && (
                      <span className="absolute top-1.5 right-1.5 rounded-full bg-rose-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
                        نفذ
                      </span>
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
                    {(product.variants?.length > 0 || product.units?.length > 1) && (
                      <span className="inline-block rounded-full bg-amber/15 px-1.5 py-0.5 text-[9px] font-bold text-amber-dark">
                        اختر التفاصيل
                      </span>
                    )}
                  </div>
                </button>

                {product.imageUrl && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxProduct(product);
                    }}
                    className="absolute top-2 left-2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-black/60 cursor-pointer"
                    aria-label="تكبير الصورة"
                  >
                    <ZoomIn size={14} />
                  </button>
                )}

                <span className="absolute bottom-[74px] left-2 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition pointer-events-none">
                  <Plus size={14} />
                </span>
              </div>
            ))}

            {!loadingProducts && products.length === 0 && (
              <div className="w-full text-center py-16 text-ink-soft text-sm">
                لا توجد منتجات مطابقة للبحث
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-40 hover:bg-canvas transition cursor-pointer"
            >
              السابق
            </button>
            <span className="text-xs font-bold text-ink-soft">صفحة {currentPage} من {totalPages}</span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-40 hover:bg-canvas transition cursor-pointer"
            >
              التالي
            </button>
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
                  <div key={item.cartLineId} className="pt-2 flex justify-between items-center text-xs gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-ink truncate">{item.nameAr || item.name}</div>
                      {item.variant && (
                        <div className="text-[10px] text-emerald-700 truncate">
                          {[item.variant.color, item.variant.size, item.variant.material].filter(Boolean).join(" / ")}
                        </div>
                      )}
                      <div className="text-ink-soft text-[10px] font-mono">
                        {item.unitPrice.toFixed(2)} ج.م / {item.unit?.fromUnit || "قطعة"}
                      </div>
                    </div>

                    <div className="flex gap-1 items-center shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.cartLineId, item.quantity - 1)}
                        className="w-6 h-6 bg-canvas border border-border rounded-lg flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition cursor-pointer"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="font-mono font-bold text-xs w-5 text-center">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.cartLineId, item.quantity + 1)}
                        className="w-6 h-6 bg-canvas border border-border rounded-lg flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                      >
                        <Plus size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.cartLineId)}
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

            {/* Phase 1: print-format selector */}
            <div className="space-y-2 rounded-xl border border-border bg-canvas p-2.5">
              <p className="flex items-center gap-1.5 text-xs font-bold text-ink">
                <Printer size={13} className="text-ink-soft" />
                صيغة الطباعة
              </p>
              <div className="grid grid-cols-4 gap-1.5">
                {PRINT_FORMAT_OPTIONS.map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setPrintFormat(format)}
                    className={`rounded-lg py-1.5 text-[10px] font-bold border transition cursor-pointer ${
                      printFormat === format
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-surface border-border text-ink-soft hover:border-emerald-300"
                    }`}
                  >
                    {PRINT_FORMAT_LABELS[format]}
                  </button>
                ))}
              </div>
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
                <span>القيمة المضافة ({(ESTIMATED_TAX_RATE * 100).toFixed(0)}% تقديري):</span>
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

      {/* ===== Phase 1: نافذة اختيار المتغيّر/الوحدة/الكمية ===== */}
      {pickerProduct && (
        <VariantUnitPickerModal
          product={pickerProduct}
          tier={pricingTier}
          onConfirm={handlePickerConfirm}
          onClose={() => setPickerProduct(null)}
        />
      )}

      {/* ===== Phase 1: تكبير صورة المنتج ===== */}
      {lightboxProduct && (
        <ProductLightbox
          imageUrl={lightboxProduct.imageUrl}
          title={lightboxProduct.nameAr || lightboxProduct.name}
          onClose={() => setLightboxProduct(null)}
        />
      )}

      <CreateMaintenanceTicketModal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false);
          setPrintMaintenanceLabel(false);
        }}
        customers={customers}
        onCreated={() => {}}
        defaultPrintLabel={printMaintenanceLabel}
      />
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
