// File: src/pages/Pos/PosCheckoutPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { useAuth } from "../../context/AuthContext";
import { getCustomers, createCustomer } from "../../api/adminApi";
import {
  searchPosProducts,
  getResolvedUnitPrice,
  PRICING_TIER,
  PRICING_TIER_LABELS,
} from "../../api/posApi";
import usePosKeyboardShortcuts from "../../hooks/usePosKeyboardShortcuts";
import { playScanSuccess, playScanError } from "../../utils/pos/feedback";
import PosShortcutBar from "../../components/pos/PosShortcutBar";
import VoiceAttendanceButton from './VoiceAttendanceButton';
import VoiceInvoiceButton from '../admin/VoiceInvoiceButton'
import ProductLightbox from "../../components/pos/ProductLightbox";
import VariantUnitPickerModal from "../../components/pos/VariantUnitPickerModal";
import CreateMaintenanceTicketModal from "../../components/operations/CreateMaintenanceTicketModal";
import { findBaseUnit } from "../../utils/pos/unitPricing";
import { normalizePriceRows, resolveUnitPrice } from "../../utils/pos/tierPricing";
import { computeTotals, DEFAULT_VAT_RATE, VAT_OPTIONS } from "../../utils/pos/totals";
import {
  PAYMENT_METHOD,
  PAYMENT_BY_KEY,
  PAYMENT_LABEL_BY_METHOD,
} from "../../utils/pos/paymentOptions";
import { normalizeScanTerm } from "../../utils/pos/scanInput";
import usePosScannerFocus from "../../hooks/usePosScannerFocus";
import PosProductTable from "../../components/pos/PosProductTable";
import PosPaymentButtons from "../../components/pos/PosPaymentButtons";
import PosItemPanel from "../../components/pos/PosItemPanel";

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
  Wifi,
  WifiOff,
  ShoppingCart,
  Printer,
  Barcode,
  Layers,
  Wrench,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

// H-08: tax shown here is a CLIENT-SIDE ESTIMATE ONLY — the server computes the authoritative tax.
// The cashier can pick the VAT rate (14% / 15% / exempt); it is sent as `taxRatePercent` (see CHANGES.md).
const ORDER_SOURCE_IN_STORE = 2;
const POS_PAGE_SIZE = 20; // 20 one-line rows fit on screen without scrolling

// Roles that may see purchase price / margin in the item panel. NOTE: AuthContext.hasPermission()
// currently returns true for everyone, so the check is by role on purpose.
const COST_VISIBLE_ROLES = ["SUPER_ADMIN", "SUPERADMIN", "STORE_OWNER", "OWNER", "ADMIN"];

const PRINT_FORMAT_OPTIONS = [
  PRINT_FORMAT.THERMAL_80,
  PRINT_FORMAT.THERMAL_58,
  PRINT_FORMAT.A4,
  PRINT_FORMAT.A5,
];

const HELD_ORDERS_KEY = "pos:heldOrders";

// Dev hint (once per session): auto tier pricing needs the tier rows on the /Pos/products items.
let warnedNoTierRows = false;

function readHeldOrders() {
  try {
    const raw = localStorage.getItem(HELD_ORDERS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHeldOrders(list) {
  try {
    localStorage.setItem(HELD_ORDERS_KEY, JSON.stringify(list));
  } catch {
    /* ignore quota / privacy errors */
  }
}

export default function PosCheckoutPage() {
  const isOnline = useOnlineStatus();
  const { logout, hasRole } = useAuth();
  const canSeeCost = COST_VISIBLE_ROLES.some((r) => {
    try {
      return !!hasRole?.(r);
    } catch {
      return false;
    }
  });

  // ---- Refs للفوكس والاختصارات ----
  const searchInputRef = useRef(null);
  const customerSearchInputRef = useRef(null);
  const discountInputRef = useRef(null);
  const voiceInvoiceWrapRef = useRef(null);

  // ---- State ----
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [discountType, setDiscountType] = useState("Fixed");
  const [discountValue, setDiscountValue] = useState(0);

  const [pricingTier, setPricingTier] = useState(PRICING_TIER.RETAIL);
  // "تلقائي": each line moves Retail -> Half-wholesale -> Wholesale by its own quantity.
  // Picking a tier button switches to manual (that tier for every line).
  const [autoTier, setAutoTier] = useState(true);
  const [vatRate, setVatRate] = useState(DEFAULT_VAT_RATE);

  // Item action panel: { kind: "line" } follows the selected cart line, { kind: "product", productId } is a list item
  const [panel, setPanel] = useState(null);
  const productCacheRef = useRef(new Map()); // productId -> last product payload seen (for the panel + picker)
  const replaceLineRef = useRef(null); // cart line being replaced by the unit/variant picker
  const [printFormat, setPrintFormat] = useState(PRINT_FORMAT.THERMAL_80);

  const [lightboxProduct, setLightboxProduct] = useState(null);
  const [pickerProduct, setPickerProduct] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isAddingNewCustomer, setIsAddingNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ fullName: "", phoneNumber: "" });
  const [customerSearch, setCustomerSearch] = useState("");

  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseNotes, setExpenseNotes] = useState("");
  const [expenseSubmitting, setExpenseSubmitting] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [printMaintenanceLabel, setPrintMaintenanceLabel] = useState(false);

  const [showCashModal, setShowCashModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ---- جديد: تحديد سطر السلة بالكيبورد + فلاش السكانر + الطلبات المعلّقة ----
  const [selectedCartLineId, setSelectedCartLineId] = useState(null);
  const [scanFlash, setScanFlash] = useState(null); // 'ok' | 'error' | null
  const [heldOrders, setHeldOrders] = useState(readHeldOrders);
  const scanFlashTimerRef = useRef(null);
  const [toast, setToast] = useState(null); // { kind: "ok" | "warn" | "error", text }
  const toastTimerRef = useRef(null);
  const checkingOutRef = useRef(false); // sync guard: state updates are too late for key-repeat double Enter
  const scanQueueRef = useRef(Promise.resolve()); // scans are resolved strictly in order

  // ---- Auto-focus على البحث + رجوع الفوكس بعد كل عملية ----
  const refocusSearch = useCallback(() => {
    // استنى دورة الرندر لحد ما المودال يقفل / السلة تتحدث
    requestAnimationFrame(() => {
      try {
        searchInputRef.current?.focus();
      } catch {
        /* noop */
      }
    });
  }, []);

  // ---- Flash قصير عند السكانر ----
  const flashScan = useCallback((kind) => {
    setScanFlash(kind);
    if (scanFlashTimerRef.current) clearTimeout(scanFlashTimerRef.current);
    scanFlashTimerRef.current = setTimeout(() => setScanFlash(null), 420);
  }, []);

  // Non-blocking message (replaces alert(): alert freezes the terminal and steals keyboard focus)
  const showToast = useCallback((kind, text, ms = 5000) => {
    setToast({ kind, text });
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), ms);
  }, []);

  useEffect(
    () => () => {
      if (scanFlashTimerRef.current) clearTimeout(scanFlashTimerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    []
  );

  // ---- Mount: focus + load data ----
  useEffect(() => {
    loadProducts(currentPage, search, pricingTier);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pricingTier]);

  useEffect(() => {
    loadPending();
    loadCustomersList();
    refocusSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadCustomersList() {
    try {
      const data = await getCustomers();
      const list = Array.isArray(data) ? data : data.items || data.data || [];
      setCustomers(list);
    } catch (err) {
      console.warn("تعذر جلب قائمة العملاء في الكاشير", err);
    }
  }

  async function loadPending() {
    const items = await getPendingTransactions();
    setPendingCount(items.length);
  }

  async function loadProducts(page = 1, query = "", tier = pricingTier) {
    setLoadingProducts(true);
    try {
      const data = await searchPosProducts({ query, tier, pageNumber: page, pageSize: POS_PAGE_SIZE });
      const items = data.items || [];
      items.forEach((p) => productCacheRef.current.set(p.id, p));
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

  // بحث السيرفر debounced — السكانر بيعتمد على Enter في handleSearchKeyDown
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

  function needsPicker(product) {
    const hasVariants = (product.variants || []).length > 0;
    const hasMultipleUnits = (product.units || []).length > 1;
    return hasVariants || hasMultipleUnits;
  }

  function addSimpleProductToCart(product, qty = 1) {
    const baseUnit = findBaseUnit(product.units);
    addResolvedLineToCart(product, {
      variant: null,
      unit: baseUnit || { fromUnit: "قطعة", toUnit: "قطعة", factor: 1, isBaseUnit: true },
      quantity: qty,
      quantityInBaseUnit: qty,
      unitPrice: product.sellingPrice,
      lineTotal: product.sellingPrice * qty,
    });
  }

  function handleTileClick(product) {
    if (needsPicker(product)) {
      setPickerProduct(product);
      return;
    }
    addSimpleProductToCart(product);
  }

  // يضيف سطر سلة محلول بالكامل — وبيشغّل feedback السكانر
  function addResolvedLineToCart(product, resolved) {
    productCacheRef.current.set(product.id, product);
    const priceRows = normalizePriceRows(product);
    if (!priceRows.length && !warnedNoTierRows) {
      warnedNoTierRows = true;
      console.warn(
        "[POS] لا توجد شرائح أسعار على منتج /Pos/products — التسعير التلقائي هيعتمد على السيرفر فقط. الحقول المتاحة:",
        Object.keys(product)
      );
    }
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
          priceRows, // ProductPrices rows for instant local tier pricing
          lineDiscountPct: 0, // per-item discount % (item panel) — folded into the order discount on submit
          priceTier: null, // tier the current unitPrice came from (shown as a badge)
          nextBreak: null,
          priceKey: null, // "qtyBase|mode" the price was last computed for
          serverKey: null, // "qtyBase|mode" the server last confirmed
        },
      ];
    });

    // تحديد السطر الجديد عشان +/- يشتغلوا عليه
    setSelectedCartLineId(cartLineId);

    // feedback
    playScanSuccess();
    flashScan("ok");
  }

  function handlePickerConfirm(resolved) {
    const replaceId = replaceLineRef.current;
    replaceLineRef.current = null;
    if (replaceId) setCart((prev) => prev.filter((x) => x.cartLineId !== replaceId));
    addResolvedLineToCart(pickerProduct, resolved);
    setPickerProduct(null);
    refocusSearch();
  }

  // ---- Dynamic pricing (quantity-based tier ladder) ----
  // Runs after EVERY cart change — scan increments, +/- keys, typed quantity, picker adds, tier change,
  // restored held orders — instead of only inside updateQty.
  //   1) instant local price from the product's own tier rows (auto ladder, or the selected tier)
  //   2) debounced server confirmation; the server stays authoritative, and answers for an
  //      outdated quantity are dropped.
  // Tier thresholds use quantityInBaseUnit (the same quantity the order sends to the server).
  const modeKey = autoTier ? "auto" : String(pricingTier);
  const priceKeyFor = (line) => `${line.quantityInBaseUnit}|${modeKey}`;

  useEffect(() => {
    if (cart.some((l) => l.priceKey !== priceKeyFor(l))) {
      setCart((prev) =>
        prev.map((l) => {
          const key = priceKeyFor(l);
          if (l.priceKey === key) return l;
          const rows = l.priceRows || [];
          if (!rows.length) return { ...l, priceKey: key, priceTier: null, nextBreak: null };
          const r = resolveUnitPrice({
            rows,
            baseQty: l.quantityInBaseUnit,
            tierMode: autoTier ? "auto" : pricingTier,
            variantId: l.variant?.id ?? null,
            fallback: l.unitPrice,
          });
          return { ...l, priceKey: key, unitPrice: r.price, priceTier: r.tier, nextBreak: r.nextBreak };
        })
      );
      return undefined; // re-runs with fresh keys, then schedules the server pass
    }

    if (!isOnline) return undefined;
    const pending = cart.filter((l) => l.serverKey !== l.priceKey);
    if (!pending.length) return undefined;

    const timer = setTimeout(() => {
      pending.forEach(async (l) => {
        let price = null;
        try {
          const res = await getResolvedUnitPrice({
            productId: l.productId,
            productVariantId: l.variant?.id || null,
            tier: l.priceTier ?? pricingTier,
            quantity: l.quantityInBaseUnit,
          });
          const p = res?.unitPrice ?? res?.UnitPrice;
          if (typeof p === "number" && p > 0) price = p;
        } catch {
          // keep the local price; the server re-resolves it authoritatively at order creation
        }
        setCart((prev) =>
          prev.map((x) =>
            x.cartLineId === l.cartLineId && x.priceKey === l.priceKey
              ? { ...x, serverKey: l.priceKey, unitPrice: price ?? x.unitPrice }
              : x
          )
        );
      });
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart, autoTier, pricingTier, isOnline]);

  const updateQty = (cartLineId, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((x) => x.cartLineId !== cartLineId));
      if (selectedCartLineId === cartLineId) setSelectedCartLineId(null);
      return;
    }

    setCart((prev) =>
      prev.map((x) =>
        x.cartLineId === cartLineId
          ? { ...x, quantity: qty, quantityInBaseUnit: qty * (x.unit?.factor || 1) }
          : x
      )
    );
    // re-pricing happens in the effect above
  };

  const removeFromCart = (cartLineId) => {
    setCart((prev) => prev.filter((x) => x.cartLineId !== cartLineId));
    if (selectedCartLineId === cartLineId) setSelectedCartLineId(null);
  };

  // بحث السكانر: Enter + تطابق SKU/Barcode/اسم = إضافة فورية
  const handleSearchKeyDown = (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    // strip scanner control chars; Arabic-Indic digits (Arabic keyboard layout) -> 0-9 for numeric codes
    const term = normalizeScanTerm(search).toLowerCase();
    if (!term) return;

    // Free the field right away: a scanner can fire the next code before this one's server round
    // trip finishes, and the two would otherwise be concatenated into one garbage code.
    setSearch("");

    const isExact = (p) =>
      String(p.sku ?? "").toLowerCase() === term ||
      String(p.barcode ?? "").toLowerCase() === term ||
      (p.nameAr || "").trim().toLowerCase() === term;

    const local = products.find(isExact);
    if (local) {
      handleTileClick(local);
      refocusSearch();
      return;
    }

    // No local match — ask the server. Queued so quick scans resolve in the order they were scanned.
    scanQueueRef.current = scanQueueRef.current.then(async () => {
      try {
        const data = await searchPosProducts({
          query: term,
          tier: pricingTier,
          pageNumber: 1,
          pageSize: 10,
        });
        const items = data.items || [];
        const exact = items.find(isExact);
        // A numeric code with no exact SKU/barcode hit is a bad scan, not a name search:
        // never ring up a fuzzy "first result" for it.
        const looksLikeBarcode = /^\d{6,}$/.test(term);
        const target = exact || (looksLikeBarcode ? null : items[0]);
        if (target) {
          handleTileClick(target);
          refocusSearch();
        } else {
          playScanError();
          flashScan("error");
          showToast("error", `لم يتم العثور على: ${term}`);
        }
      } catch {
        playScanError();
        flashScan("error");
        showToast("error", "تعذر البحث — تحقق من الاتصال");
      }
    });
  };

  // ---- Totals (line discounts + order discount + selectable VAT) ----
  const totals = useMemo(
    () => computeTotals({ cart, discountType, discountValue, vatRate }),
    [cart, discountType, discountValue, vatRate]
  );
  const normalizedDiscountValue = Math.max(Number(discountValue) || 0, 0);
  const subtotal = totals.gross;
  const safeDiscount = totals.discountTotal; // line discounts + order discount
  const discountPercentage = totals.orderDiscountPct;
  const tax = totals.tax;
  const total = totals.total;

  const cashReceivedNumber = Number(cashReceived) || 0;
  const changeDue = cashReceivedNumber - total;

  // ---- Quick add customer ----
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
      alert("حدث خطأ أثناء إضافة العميل الجديد.");
    }
  }

  // ---- Expense ----
  async function handleSubmitExpense(e) {
    e.preventDefault();
    const amount = Number(expenseAmount);
    if (!amount || amount <= 0) return;

    setExpenseSubmitting(true);
    try {
      await axiosInstance.post("/Expenses", { amount, notes: expenseNotes.trim() });
      setExpenseAmount("");
      setExpenseNotes("");
      setShowExpenseModal(false);
      alert("تم تسجيل المصروف بنجاح");
    } catch (err) {
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

  function handleLogout() {
    logout();
    window.location.assign(import.meta.env.BASE_URL + "login");
  }

  // ---- Submit order ----
  async function submitOrder(paymentMethod, uiKey) {
    if (!cart.length || checkingOutRef.current) return;
    checkingOutRef.current = true;

    const change = paymentMethod === PAYMENT_METHOD.CASH ? Math.max(0, cashReceivedNumber - total) : 0;

    const invoice = {
      customerName: selectedCustomer
        ? selectedCustomer.fullName || selectedCustomer.name || "عميل نقدي"
        : "عميل نقدي",
      customerPhone: selectedCustomer
        ? selectedCustomer.phoneNumber || selectedCustomer.phone || ""
        : "",
      customerId: selectedCustomer ? selectedCustomer.id || selectedCustomer.Id : null,
      paymentMethod,
      orderSource: ORDER_SOURCE_IN_STORE,
      pricingTier,
      // Per-item discounts can't be expressed in the order items, so when any exist they are merged with
      // the order discount into ONE fixed discount (the server then lands on the same total).
      discountType: totals.lineDiscountTotal > 0 ? "Fixed" : discountType,
      discountValue: totals.lineDiscountTotal > 0 ? safeDiscount : normalizedDiscountValue,
      discountAmount: safeDiscount,
      // VAT chosen by the cashier. Only sent when it differs from the default so the usual payload is unchanged.
      // Needs API support (CreateOrderDto.TaxRatePercent) — see CHANGES.md.
      ...(vatRate !== DEFAULT_VAT_RATE
        ? { taxRatePercent: Math.round(vatRate * 100), isTaxExempt: vatRate === 0 }
        : {}),
      items: cart.map((item) => ({
        productId: item.productId,
        productVariantId: item.variant?.id || null,
        quantity: item.quantityInBaseUnit,
        unitPrice: item.unitPrice,
        // Auto mode: the tier this line was priced at. Needs OrderItem support on the API
        // (extra property is ignored by the current DTO binding) — see CHANGES.md.
        ...(autoTier && item.priceTier && item.priceTier !== pricingTier ? { pricingTier: item.priceTier } : {}),
      })),
    };

    setIsCheckingOut(true);
    let serverOrder = null;
    try {
      if (isOnline) {
        const response = await axiosInstance.post("/Orders", invoice);
        serverOrder = response.data;
      } else {
        await addLocalTransaction(invoice);
        const pending = await getPendingTransactions();
        setPendingCount(pending.length);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "تعذر حفظ الفاتورة، يرجى المحاولة مرة أخرى.", 8000);
      checkingOutRef.current = false;
      setIsCheckingOut(false);
      refocusSearch();
      return;
    }

    // From here the order IS saved — nothing below may report it as failed (a retry would duplicate it).
    let printFailed = false;
    try {
      handlePrint(paymentMethod, serverOrder, uiKey);
    } catch (err) {
      console.error(err);
      printFailed = true;
    }

    // Screen vs server: if the server priced the lines differently, say so right on the receipt screen.
    // (compares the final TOTAL, so a VAT rate the server ignored is caught too)
    const serverTotal = Number(serverOrder?.totalAmount);
    const drift = Number.isFinite(serverTotal) ? Math.abs(serverTotal - total) : 0;

    // تفريغ الحالة
    setCart([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
    setDiscountType("Fixed");
    setShowCashModal(false);
    setCashReceived("");
    setSelectedCartLineId(null);
    setVatRate(DEFAULT_VAT_RATE); // exemption / custom VAT is per sale — never carried to the next customer
    setPanel(null);

    const parts = [isOnline ? "تم إنشاء الفاتورة" : "تم الحفظ أوفلاين وهتتزامن تلقائيًا"];
    if (change > 0) parts.push(`الباقي ${change.toFixed(2)} ج.م`);
    if (printFailed) parts.push("تعذرت الطباعة");
    if (drift > 0.5) parts.push(`⚠ إجمالي السيرفر ${serverTotal.toFixed(2)} يختلف عن الشاشة ${total.toFixed(2)}`);
    showToast(printFailed || drift > 0.5 ? "warn" : "ok", parts.join(" · "), change > 0 || drift > 0.5 ? 9000 : 4000);

    checkingOutRef.current = false;
    setIsCheckingOut(false);
    // ✅ رجّع الفوكس على السكانر بعد البيع
    refocusSearch();
  }

  function handlePaymentSelect(uiKey) {
    const option = PAYMENT_BY_KEY[uiKey];
    if (!cart.length || !option) return;
    if (option.key === "cash") {
      setCashReceived("");
      setShowCashModal(true);
      return;
    }
    submitOrder(option.serverMethod, option.key);
  }

  const handlePrint = (paymentMethod, serverOrder, uiKey) => {
    const printSubtotal = serverOrder?.subTotal ?? subtotal;
    const printDiscount = serverOrder?.discountAmount ?? safeDiscount;
    const printTax = serverOrder?.taxAmount ?? tax;
    const printTotal = serverOrder?.totalAmount ?? total;

    printInvoice(
      {
        orderNumber: serverOrder?.orderNumber || `POS-${Date.now()}`,
        createdAt: serverOrder?.createdAt || new Date().toISOString(),
        paymentMethod:
          PAYMENT_BY_KEY[uiKey]?.receiptLabel || PAYMENT_LABEL_BY_METHOD[paymentMethod] || "CASH",
        subtotal: printSubtotal,
        discount: printDiscount,
        tax: printTax,
        total: printTotal,
        shippingCost: 0,
        items: cart.map((item) => ({
          productId: item.productId,
          productName: item.nameAr || item.name,
          name: [
            item.nameAr || item.name,
            item.variant
              ? `(${[item.variant.color, item.variant.size].filter(Boolean).join(" / ")})`
              : null,
          ]
            .filter(Boolean)
            .join(" "),
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
      {
        fullName: selectedCustomer
          ? selectedCustomer.fullName || selectedCustomer.name
          : "عميل نقدي",
        phone: selectedCustomer
          ? selectedCustomer.phoneNumber || selectedCustomer.phone
          : "-",
        email: "",
      },
      { format: printFormat, silent: true }
    );
  };

  // ---- Hold / Restore (F8) ----
  const holdOrder = useCallback(() => {
    if (!cart.length) return;
    const snapshot = {
      id: `hold_${Date.now().toString(36)}`,
      createdAt: new Date().toISOString(),
      cart,
      selectedCustomer,
      discountType,
      discountValue,
      pricingTier,
      autoTier,
      vatRate,
    };
    const next = [...readHeldOrders(), snapshot];
    writeHeldOrders(next);
    setHeldOrders(next);

    setCart([]);
    setSelectedCustomer(null);
    setDiscountValue(0);
    setDiscountType("Fixed");
    setSelectedCartLineId(null);
    setVatRate(DEFAULT_VAT_RATE);
    setPanel(null);
    refocusSearch();
  }, [cart, selectedCustomer, discountType, discountValue, pricingTier, autoTier, vatRate, refocusSearch]);

  const restoreHeldOrder = useCallback(
    (id) => {
      const list = readHeldOrders();
      const found = list.find((h) => h.id === id);
      if (!found) return;
      let remaining = list.filter((h) => h.id !== id);
      // Don't overwrite a basket that's in progress — park it in the held list instead.
      if (cart.length) {
        remaining = [
          ...remaining,
          {
            id: `hold_${Date.now().toString(36)}`,
            createdAt: new Date().toISOString(),
            cart,
            selectedCustomer,
            discountType,
            discountValue,
            pricingTier,
            autoTier,
            vatRate,
          },
        ];
      }
      setCart(found.cart || []);
      setSelectedCustomer(found.selectedCustomer || found.customer || null);
      setDiscountType(found.discountType || "Fixed");
      setDiscountValue(found.discountValue || 0);
      setPricingTier(found.pricingTier || PRICING_TIER.RETAIL);
      setAutoTier(found.autoTier ?? false); // holds saved before auto mode existed keep their manual tier
      setVatRate(found.vatRate ?? DEFAULT_VAT_RATE);
      setPanel(null);
      writeHeldOrders(remaining);
      setHeldOrders(remaining);
      refocusSearch();
    },
    [cart, selectedCustomer, discountType, discountValue, pricingTier, autoTier, vatRate, refocusSearch]
  );

  // ---- F9: تشغيل زر الفاتورة الصوتية الموجود ----
  const triggerVoiceInvoice = useCallback(() => {
    const btn = voiceInvoiceWrapRef.current?.querySelector("button");
    if (btn) btn.click();
  }, []);

  // ---- Keyboard shortcut handlers ----
  const moveSelection = useCallback(
    (delta) => {
      if (cart.length === 0) return;
      const idx = cart.findIndex((x) => x.cartLineId === selectedCartLineId);
      const start = idx === -1 ? (delta > 0 ? -1 : 0) : idx;
      const next = Math.max(0, Math.min(cart.length - 1, start + delta));
      setSelectedCartLineId(cart[next].cartLineId);
    },
    [cart, selectedCartLineId]
  );

  const changeSelectedQty = useCallback(
    (delta) => {
      if (!selectedCartLineId) return;
      const line = cart.find((x) => x.cartLineId === selectedCartLineId);
      if (!line) return;
      updateQty(selectedCartLineId, line.quantity + delta);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, selectedCartLineId]
  );

  const removeSelected = useCallback(() => {
    if (selectedCartLineId) removeFromCart(selectedCartLineId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCartLineId]);

  const anyModalOpen =
    showCashModal ||
    showExpenseModal ||
    showModifyModal ||
    showMaintenanceModal ||
    !!pickerProduct ||
    !!lightboxProduct;

  // ---- Item action panel ----
  const selectedLine = cart.find((x) => x.cartLineId === selectedCartLineId) || null;
  const panelProduct =
    panel?.kind === "product"
      ? productCacheRef.current.get(panel.productId) || null
      : selectedLine
      ? productCacheRef.current.get(selectedLine.productId) || null
      : null;

  // The line panel follows the selection; it closes when its line disappears (deleted / sale finished).
  useEffect(() => {
    if (panel?.kind === "line" && !selectedLine) setPanel(null);
  }, [panel, selectedLine]);

  const openLinePanel = useCallback((lineId) => {
    setSelectedCartLineId(lineId);
    setPanel({ kind: "line" });
  }, []);

  const closePanel = useCallback(() => {
    setPanel(null);
    refocusSearch();
  }, [refocusSearch]);

  // F6 toggles the panel for the selected line; Esc closes it (only when the scan box is empty).
  useEffect(() => {
    const onKey = (e) => {
      if (showCashModal || showExpenseModal || showModifyModal || showMaintenanceModal || pickerProduct || lightboxProduct) return;
      if (e.key === "F6") {
        e.preventDefault();
        if (panel) closePanel();
        else if (selectedCartLineId) setPanel({ kind: "line" });
      } else if (e.key === "Escape" && panel) {
        const a = document.activeElement;
        if (a === searchInputRef.current && searchInputRef.current.value) return;
        e.preventDefault();
        closePanel();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panel, selectedCartLineId, closePanel, showCashModal, showExpenseModal, showModifyModal, showMaintenanceModal, pickerProduct, lightboxProduct]);

  // quick add from the panel: +N on a cart line, or add N of a list item
  function panelQuickAdd(n) {
    if (panel?.kind === "line" && selectedLine) {
      updateQty(selectedLine.cartLineId, selectedLine.quantity + n);
      return;
    }
    const product = panelProduct;
    if (!product) return;
    if (needsPicker(product)) {
      setPickerProduct(product);
      return;
    }
    addSimpleProductToCart(product, n);
  }

  function setLineDiscount(lineId, pct) {
    const v = Math.min(100, Math.max(0, Number(pct) || 0));
    setCart((prev) => prev.map((x) => (x.cartLineId === lineId ? { ...x, lineDiscountPct: v } : x)));
  }

  // change unit / colour / size of a cart line through the existing picker (replaces that line)
  async function panelPickOptions() {
    let product = panelProduct;
    if (!product && selectedLine) {
      try {
        const data = await searchPosProducts({ query: selectedLine.sku || selectedLine.name, tier: pricingTier, pageNumber: 1, pageSize: 10 });
        product = (data.items || []).find((p) => p.id === selectedLine.productId) || null;
        if (product) productCacheRef.current.set(product.id, product);
      } catch {
        /* offline: leave as is */
      }
    }
    if (!product) {
      showToast("warn", "تعذر تحميل خيارات الصنف الآن");
      return;
    }
    replaceLineRef.current = panel?.kind === "line" && selectedLine ? selectedLine.cartLineId : null;
    setPickerProduct(product);
  }

  // hands-free scanner focus trap (suspended while a modal is open)
  usePosScannerFocus(searchInputRef, { suspended: anyModalOpen });

  usePosKeyboardShortcuts({
    enabled: !anyModalOpen,
    onFocusSearch: refocusSearch,
    onCashCheckout: () => {
      if (cart.length) {
        setCashReceived("");
        setShowCashModal(true);
      }
    },
    onSelectCustomer: () => {
      requestAnimationFrame(() => customerSearchInputRef.current?.focus());
    },
    onFocusDiscount: () => {
      requestAnimationFrame(() => discountInputRef.current?.focus());
    },
    onHoldOrder: holdOrder,
    onVoiceOrder: triggerVoiceInvoice,
    onCartNavigate: moveSelection,
    onQuantityDelta: changeSelectedQty,
    onRemoveSelected: removeSelected,
  });

  return (
    <div className="min-h-screen bg-canvas pb-10" dir="rtl">
      {/* فلاش السكانر */}
      {scanFlash && (
        <div
          aria-hidden="true"
          className={`pointer-events-none fixed inset-0 z-[60] ${
            scanFlash === "ok" ? "bg-emerald-400/15" : "bg-rose-500/15"
          }`}
        />
      )}

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
                isOnline ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
              }`}
            >
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              {isOnline ? "متصل" : `أوفلاين • ${pendingCount} معلقة`}
            </span>

            {heldOrders.length > 0 && (
              <button
                type="button"
                onClick={() => restoreHeldOrder(heldOrders[heldOrders.length - 1].id)}
                className="ms-2 mt-1 inline-flex items-center gap-1 rounded-full bg-amber/15 px-2 py-0.5 text-[10px] font-bold text-amber-dark hover:bg-amber/25 cursor-pointer"
                title="استعادة آخر طلب معلّق (F8)"
              >
                <PlayCircle size={11} />
                معلقة ({heldOrders.length})
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span ref={voiceInvoiceWrapRef} className="contents">
            <VoiceInvoiceButton />
          </span>
          <VoiceAttendanceButton />

          <button
            type="button"
            onClick={holdOrder}
            disabled={!cart.length}
            className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-40 cursor-pointer"
            title="تعليق الطلب (F8)"
          >
            <PauseCircle size={14} />
            <span className="hidden sm:inline">تعليق</span>
          </button>

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
      <div className={`grid grid-cols-1 lg:grid-cols-10 gap-6 p-4 md:p-6 transition-[padding] ${panel ? "lg:ps-[372px]" : ""}`}>
        {/* Left: Products */}
        <div className="lg:col-span-7 space-y-4">
          <div className="sticky top-[68px] z-20 bg-canvas pb-1 space-y-2">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="امسح الباركود / QR أو ابحث بالاسم / SKU... (F1)"
                className="w-full border border-border rounded-2xl p-3.5 pr-11 text-sm bg-surface shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                autoComplete="off"
                spellCheck={false}
              />
              <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
            </div>

            <div className="flex items-center gap-2">
              <Layers size={13} className="text-ink-soft shrink-0" />
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setAutoTier(true)}
                  title="الشريحة تتغيّر تلقائيًا حسب كمية كل صنف"
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                    autoTier
                      ? "bg-emerald-600 border-emerald-600 text-white"
                      : "bg-surface border-border text-ink-soft hover:border-emerald-300"
                  }`}
                >
                  تلقائي
                </button>
                {[
                  PRICING_TIER.RETAIL,
                  PRICING_TIER.FIRST_WHOLESALE,
                  PRICING_TIER.WHOLESALE,
                  PRICING_TIER.DISTRIBUTOR,
                ].map((tierValue) => (
                  <button
                    key={tierValue}
                    type="button"
                    onClick={() => {
                      setPricingTier(tierValue);
                      setAutoTier(false);
                    }}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                      !autoTier && pricingTier === tierValue
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-surface border-border text-ink-soft hover:border-emerald-300"
                    }`}
                  >
                    {PRICING_TIER_LABELS[tierValue]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Receipt size={13} className="text-ink-soft shrink-0" />
              <span className="text-[11px] font-bold text-ink-soft">الضريبة:</span>
              <div className="flex flex-wrap gap-1.5">
                {VAT_OPTIONS.map((o) => (
                  <button
                    key={o.rate}
                    type="button"
                    data-vat={o.rate}
                    title={o.title}
                    aria-pressed={vatRate === o.rate}
                    onClick={() => setVatRate(o.rate)}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-bold border transition cursor-pointer ${
                      vatRate === o.rate
                        ? o.rate === 0
                          ? "bg-slate-800 border-slate-800 text-white"
                          : "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-surface border-border text-ink-soft hover:border-emerald-300"
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <PosProductTable
            products={products}
            loading={loadingProducts}
            activeId={panel?.kind === "product" ? panel.productId : null}
            onAdd={handleTileClick}
            onInfo={(p) => {
              productCacheRef.current.set(p.id, p);
              setPanel({ kind: "product", productId: p.id });
            }}
          />

          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-ink-soft disabled:opacity-40 hover:bg-canvas transition cursor-pointer"
            >
              السابق
            </button>
            <span className="text-xs font-bold text-ink-soft">
              صفحة {currentPage} من {totalPages}
            </span>
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

        {/* Right: Cart */}
        <div className="lg:col-span-3">
          <div className="lg:sticky lg:top-[68px] bg-surface border border-border rounded-2xl p-4 shadow-xs space-y-4">
            <h2 className="font-bold text-sm text-ink border-b border-border pb-2 flex items-center gap-1.5">
              <ShoppingCart size={15} className="text-emerald-600" />
              تفاصيل الطلب والعميل
            </h2>

            {/* Customer */}
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
                      ref={customerSearchInputRef}
                      type="text"
                      placeholder="ابحث عن عميل مسجل... (F3)"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="w-full border border-border rounded-lg p-1.5 pr-7 text-xs bg-surface outline-none"
                    />
                    <Search size={12} className="absolute right-2 top-2.5 text-ink-soft" />
                  </div>

                  {customerSearch && (
                    <div className="max-h-32 overflow-y-auto border border-border rounded-lg bg-surface divide-y divide-border">
                      {filteredCustomers.length === 0 ? (
                        <div className="p-2 text-[11px] text-ink-soft text-center">
                          لا يوجد عملاء مطابقين
                        </div>
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
                              <div className="text-[10px] text-ink-soft">
                                {c.phoneNumber || c.phone || "بدون رقم"}
                              </div>
                            </div>
                            {(selectedCustomer?.id === c.id ||
                              selectedCustomer?.Id === c.Id) && (
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
                        <span className="font-bold text-emerald-900">
                          {selectedCustomer.fullName || selectedCustomer.name}
                        </span>
                        <span className="block text-[10px] text-emerald-700">
                          {selectedCustomer.phoneNumber || selectedCustomer.phone}
                        </span>
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

            {/* Cart items */}
            <div className="max-h-72 overflow-y-auto space-y-1 divide-y divide-border pl-1">
              {cart.length === 0 ? (
                <div className="text-center py-6 text-xs text-ink-soft flex flex-col items-center gap-1.5">
                  <ShoppingCart size={22} className="text-border" />
                  السلة فارغة حالياً
                </div>
              ) : (
                cart.map((item) => {
                  const isSelected = item.cartLineId === selectedCartLineId;
                  return (
                    <div
                      key={item.cartLineId}
                      onClick={() => openLinePanel(item.cartLineId)}
                      className={`pt-2 pb-1 flex justify-between items-center text-xs gap-2 rounded-lg px-1.5 -mx-1 cursor-pointer transition ${
                        isSelected
                          ? "bg-emerald-50 ring-1 ring-emerald-300"
                          : "hover:bg-canvas"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-ink truncate">
                          {item.nameAr || item.name}
                        </div>
                        {item.variant && (
                          <div className="text-[10px] text-emerald-700 truncate">
                            {[item.variant.color, item.variant.size, item.variant.material]
                              .filter(Boolean)
                              .join(" / ")}
                          </div>
                        )}
                        <div className="text-ink-soft text-[10px] font-mono">
                          {item.unitPrice.toFixed(2)} ج.م / {item.unit?.fromUnit || "قطعة"}
                          {item.priceTier && item.priceTier !== PRICING_TIER.RETAIL && (
                            <span className="ms-1 rounded bg-emerald-100 px-1 font-sans font-bold text-emerald-700">
                              {PRICING_TIER_LABELS[item.priceTier]}
                            </span>
                          )}
                          {item.lineDiscountPct > 0 && (
                            <span className="ms-1 rounded bg-rose-100 px-1 font-sans font-bold text-rose-700">
                              −{item.lineDiscountPct}%
                            </span>
                          )}
                        </div>
                        {autoTier &&
                          item.nextBreak &&
                          item.nextBreak.minQuantity - item.quantityInBaseUnit <= 5 && (
                            <div className="text-[10px] text-sky-700 truncate">
                              +{Math.ceil(item.nextBreak.minQuantity - item.quantityInBaseUnit)} لسعر{" "}
                              {PRICING_TIER_LABELS[item.nextBreak.tier]} ({item.nextBreak.price.toFixed(2)})
                            </div>
                          )}
                      </div>

                      <div className="flex gap-1 items-center shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(item.cartLineId, item.quantity - 1);
                          }}
                          className="w-6 h-6 bg-canvas border border-border rounded-lg flex items-center justify-center hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="font-mono font-bold text-xs w-5 text-center">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQty(item.cartLineId, item.quantity + 1);
                          }}
                          className="w-6 h-6 bg-canvas border border-border rounded-lg flex items-center justify-center hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition cursor-pointer"
                        >
                          <Plus size={11} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFromCart(item.cartLineId);
                          }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-ink-soft hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Discount */}
            <div className="space-y-2 rounded-xl border border-border bg-canvas p-2.5">
              <p className="text-xs font-bold text-ink">الخصم</p>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-[11px] text-ink-soft">
                  المبلغ (ج.م)
                  <input
                    ref={discountInputRef}
                    type="number"
                    min="0"
                    step="0.01"
                    value={discountType === "Fixed" ? discountValue : totals.orderDiscount.toFixed(2)}
                    onChange={(e) => {
                      setDiscountType("Fixed");
                      setDiscountValue(e.target.value);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </label>
                <label className="text-[11px] text-ink-soft">
                  النسبة (%)
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={
                      discountType === "Percentage" ? discountValue : discountPercentage.toFixed(2)
                    }
                    onChange={(e) => {
                      setDiscountType("Percentage");
                      setDiscountValue(e.target.value);
                    }}
                    className="mt-1 w-full rounded-lg border border-border bg-surface p-1.5 text-xs font-mono outline-none focus:border-emerald-500"
                  />
                </label>
              </div>
              <p className="text-[10px] text-ink-soft">
                سيتم تطبيق خصم {safeDiscount.toFixed(2)} ج.م
                {totals.lineDiscountTotal > 0
                  ? ` (منها ${totals.lineDiscountTotal.toFixed(2)} خصم أصناف)`
                  : ` (${discountPercentage.toFixed(2)}%)`}
              </p>
            </div>

            {/* Print format */}
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

            {/* Totals */}
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
                <span>القيمة المضافة ({vatRate === 0 ? "معفى" : `${Math.round(vatRate * 100)}% تقديري`}):</span>
                <span className="font-mono">{tax.toFixed(2)} ج.م</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-ink pt-1 border-t border-border">
                <span>الإجمالي النهائي:</span>
                <span className="font-mono text-emerald-700">{total.toFixed(2)} ج.م</span>
              </div>
            </div>

            {/* Payment */}
            <PosPaymentButtons disabled={!cart.length || isCheckingOut} onSelect={handlePaymentSelect} />
          </div>
        </div>
      </div>

      {/* ===== Expense modal ===== */}
      {showExpenseModal && (
        <ModalShell
          onClose={() => setShowExpenseModal(false)}
          title="تسجيل مصروف"
          icon={<Receipt size={16} className="text-amber-dark" />}
        >
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

      {/* ===== Modify modal ===== */}
      {showModifyModal && (
        <ModalShell
          onClose={() => setShowModifyModal(false)}
          title="تعديل / إلغاء طلب"
          icon={<Ban size={16} className="text-ink-soft" />}
        >
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

      {/* ===== Cash modal ===== */}
      {showCashModal && (
        <ModalShell
          onClose={() => {
            setShowCashModal(false);
            refocusSearch();
          }}
          title="الدفع نقداً"
          icon={<Banknote size={16} className="text-emerald-600" />}
        >
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-ink-soft">
              <span>الإجمالي المطلوب:</span>
              <span className="font-mono font-bold text-ink">{total.toFixed(2)} ج.م</span>
            </div>

            <div>
              <label className="text-xs font-bold text-ink block mb-1">
                المبلغ المستلم من العميل
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                autoFocus
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cashReceivedNumber >= total && !isCheckingOut) {
                    e.preventDefault();
                    submitOrder(PAYMENT_METHOD.CASH, "cash");
                  }
                }}
                className="w-full border border-border rounded-xl p-3 text-lg font-mono font-bold bg-canvas outline-none focus:border-emerald-500 text-center"
                placeholder="0.00"
              />
            </div>

            {/* Quick cash suggestions */}
            <div className="grid grid-cols-5 gap-1.5">
              {[50, 100, 200, 500].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCashReceived(String(v))}
                  className="rounded-lg border border-border bg-canvas py-2 text-xs font-mono font-bold text-ink hover:bg-emerald-50 hover:border-emerald-300 transition cursor-pointer"
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCashReceived(total.toFixed(2))}
                className="rounded-lg border border-emerald-300 bg-emerald-50 py-2 text-[10px] font-bold text-emerald-700 hover:bg-emerald-100 transition cursor-pointer"
              >
                بالظبط
              </button>
            </div>

            <div
              className={`rounded-xl p-4 text-center ${
                changeDue >= 0
                  ? "bg-emerald-50 border border-emerald-200"
                  : "bg-rose-50 border border-rose-200"
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
              onClick={() => submitOrder(PAYMENT_METHOD.CASH, "cash")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 rounded-xl transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isCheckingOut ? "جاري التنفيذ..." : "تأكيد وطباعة الفاتورة (Enter)"}
            </button>
          </div>
        </ModalShell>
      )}

      {/* ===== Picker modal ===== */}
      {pickerProduct && (
        <VariantUnitPickerModal
          product={pickerProduct}
          tier={pricingTier}
          onConfirm={handlePickerConfirm}
          onClose={() => {
            replaceLineRef.current = null;
            setPickerProduct(null);
            refocusSearch();
          }}
        />
      )}

      {/* ===== Lightbox ===== */}
      {lightboxProduct && (
        <ProductLightbox
          imageUrl={lightboxProduct.imageUrl}
          title={lightboxProduct.nameAr || lightboxProduct.name}
          onClose={() => {
            setLightboxProduct(null);
            refocusSearch();
          }}
        />
      )}

      <CreateMaintenanceTicketModal
        isOpen={showMaintenanceModal}
        onClose={() => {
          setShowMaintenanceModal(false);
          setPrintMaintenanceLabel(false);
          refocusSearch();
        }}
        customers={customers}
        onCreated={() => {}}
        defaultPrintLabel={printMaintenanceLabel}
      />

      {/* ===== Item action panel (side drawer) ===== */}
      {panel && (panel.kind === "line" ? selectedLine : panelProduct) && (
        <PosItemPanel
          mode={panel.kind}
          line={panel.kind === "line" ? selectedLine : null}
          product={panelProduct}
          canSeeCost={canSeeCost}
          onClose={closePanel}
          onQuickAdd={panelQuickAdd}
          onSetQty={(q) => updateQty(selectedLine.cartLineId, q)}
          onSetDiscount={(p) => setLineDiscount(selectedLine.cartLineId, p)}
          onPickOptions={panelPickOptions}
          onRemove={() => {
            removeFromCart(selectedLine.cartLineId);
            closePanel();
          }}
          onOpenImage={() => setLightboxProduct(panelProduct || selectedLine)}
          onReturnFocus={refocusSearch}
        />
      )}

      {/* ===== Toast (non-blocking) ===== */}
      {toast && (
        <div className="pointer-events-none fixed inset-x-0 bottom-14 z-[70] flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            className={`rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg ${
              toast.kind === "error"
                ? "bg-rose-600 text-white"
                : toast.kind === "warn"
                ? "bg-amber-500 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* ===== Shortcut bar ===== */}
      <PosShortcutBar />
    </div>
  );
}

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
