// File: src/utils/printInvoice.js

/**
 * دالة طباعة الفاتورة ديناميكياً
 * @param {Object} order - أوبجيكت الطلب المحتوي على البيانات والمنتجات
 */
export const printInvoice = (order) => {
  if (!order) return

  const items = order.items || order.orderItems || []
  
  // إنشاء نافذة جديدة للطباعة
  const printWindow = window.open('', '_blank')

  // بناء هيكل الـ HTML وتنسيق الفاتورة
  const invoiceHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة رقم ${order.orderNumber || order.id}</title>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
          padding: 20px;
          color: #333;
          direction: rtl;
        }
        .invoice-header {
          text-align: center;
          border-bottom: 2px solid #eee;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .info-grid {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
        }
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .invoice-table th, .invoice-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: right;
          font-size: 13px;
        }
        .invoice-table th {
          background-color: #f8f9fa;
        }
        .total-section {
          text-align: left;
          font-size: 16px;
          font-weight: bold;
          margin-top: 15px;
        }
        .footer-note {
          margin-top: 40px;
          text-align: center;
          font-size: 12px;
          color: #777;
        }
        @media print {
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-header">
        <h1 class="invoice-title">فاتورة شراء</h1>
        <p>شكراً لتسوقكم معنا!</p>
      </div>

      <div class="info-grid">
        <div>
          <p><strong>رقم الطلب:</strong> ${order.orderNumber || `ORD-${order.id}`}</p>
          <p><strong>تاريخ الطلب:</strong> ${
            order.createdAt 
              ? new Date(order.createdAt).toLocaleDateString('ar-EG') 
              : new Date().toLocaleDateString('ar-EG')
          }</p>
        </div>
        <div>
          <p><strong>عنوان التوصيل:</strong> ${order.shippingAddress || 'العنوان المسجل بالحساب'}</p>
        </div>
      </div>

      <table class="invoice-table">
        <thead>
          <tr>
            <th>#</th>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item, index) => `
            <tr>
              <td>${index + 1}</td>
              <td>${item.productName || item.name || 'منتج'}</td>
              <td>${item.quantity}</td>
              <td>${item.unitPrice || item.price || 0} ج.م</td>
              <td>${(item.quantity * (item.unitPrice || item.price || 0)).toFixed(2)} ج.م</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="total-section">
        <span>الإجمالي الكلي: </span>
        <span>${order.totalAmount || order.total || 0} ج.م</span>
      </div>

      <div class="footer-note">
        <p>تم استخراج هذه الفاتورة إلكترونياً ولا تحتاج إلى توقيع.</p>
      </div>

      <script>
        // تشغيل أمر الطباعة فور تحميل النافذة ثم إغلاقها
        window.onload = function() {
          window.print();
          window.onafterprint = function() {
            window.close();
          };
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.write(invoiceHtml)
  printWindow.document.close()
}