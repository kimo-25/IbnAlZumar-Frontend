import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import { useOnlineStatus } from "../../hooks/useOnlineStatus";

import {
  addLocalTransaction,
  getPendingTransactions,
  cacheProducts,
  getLocalProducts,
} from "../../db/db";

import { printInvoice } from "../../utils/printInvoice";

const TAX_RATE = 0.15;

export default function PosCheckoutPage() {
  const isOnline = useOnlineStatus();

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    loadProducts();
    loadPending();
  }, []);

  async function loadPending() {
    const items = await getPendingTransactions();
    setPendingCount(items.length);
  }

  async function loadProducts() {
    try {
      const { data } = await axios.get("/api/products");
      setProducts(data);
      await cacheProducts(data); // حفظ المنتجات محلياً وقت الاتصال الناجح
    } catch (err) {
      console.warn("تعذر الاتصال بالسيرفر، جاري جلب المنتجات المخزنة محلياً...", err);
      const localProducts = await getLocalProducts(); // جلب المنتجات أوفلاين
      setProducts(localProducts);
    }
  }

  const filteredProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    const exists = cart.find((x) => x.id === product.id);

    if (exists) {
      setCart(
        cart.map((x) =>
          x.id === product.id
            ? {
                ...x,
                quantity: x.quantity + 1,
              }
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
          ? {
              ...x,
              quantity: qty,
            }
          : x
      )
    );
  };

  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  async function checkout(paymentMethod) {
    if (!cart.length) return;

    const invoice = {
      paymentMethod,
      items: cart.map((item) => ({
        productId: item.id,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      total,
    };

    try {
      if (isOnline) {
        await axios.post("/api/orders", invoice);
      } else {
        await addLocalTransaction(invoice);

        const pending = await getPendingTransactions();
        setPendingCount(pending.length);
      }

      alert("تم إنشاء الفاتورة بنجاح");
      setCart([]);
    } catch (err) {
      console.error(err);
    }
  }

  const handlePrint = () => {
    printInvoice({
      items: cart,
      subtotal,
      tax,
      total,
    });
  };

  return (
    <div className="p-4 md:p-6">
      {/* Status Bar */}
      <div
        className={`mb-4 rounded-lg p-3 text-white flex justify-between ${
          isOnline ? "bg-green-600" : "bg-red-600"
        }`}
      >
        <span>{isOnline ? "🟢 Online" : "🔴 Offline"}</span>
        <span>Pending Sync: {pendingCount}</span>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Products */}
        <div className="md:col-span-2 bg-white rounded-xl shadow p-4">
          <input
            type="text"
            placeholder="بحث عن منتج..."
            className="w-full border rounded-lg p-2 mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProducts.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="border rounded-lg p-3 hover:bg-blue-50 text-right"
              >
                <h3 className="font-semibold">{product.name}</h3>
                <p>{product.price} ج.م</p>
              </button>
            ))}
          </div>
        </div>

        {/* Cart */}
        <div className="bg-white shadow rounded-xl p-4">
          <h2 className="font-bold mb-3">السلة</h2>

          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center mb-2"
            >
              <div>{item.name}</div>

              <div className="flex gap-2 items-center">
                <button
                  onClick={() => updateQty(item.id, item.quantity - 1)}
                  className="px-2 bg-gray-200 rounded"
                >
                  -
                </button>
                <span>{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.id, item.quantity + 1)}
                  className="px-2 bg-gray-200 rounded"
                >
                  +
                </button>
              </div>
            </div>
          ))}

          <hr className="my-3" />

          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{subtotal.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span>VAT:</span>
            <span>{tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between font-bold text-lg mt-1">
            <span>Total:</span>
            <span>{total.toFixed(2)}</span>
          </div>

          <div className="grid gap-2 mt-4">
            <button
              onClick={() => checkout("Cash")}
              className="bg-green-600 text-white p-2 rounded"
            >
              دفع نقدي
            </button>

            <button
              onClick={() => checkout("Card")}
              className="bg-blue-600 text-white p-2 rounded"
            >
              دفع بطاقة
            </button>

            <button
              onClick={handlePrint}
              className="bg-gray-700 text-white p-2 rounded"
            >
              طباعة الفاتورة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}