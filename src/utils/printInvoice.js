// File: src/utils/printInvoice.js

/**
 * دالة طباعة الفاتورة ديناميكياً بتصميم ابن الزمر الاحترافي
 * @param {Object} order - أوبجيكت الطلب المحتوي على البيانات والمنتجات
 */
export const printInvoice = (order) => {
  if (!order) return

  // إنشاء نافذة جديدة للطباعة
  const printWindow = window.open('', '_blank', 'width=900,height=950')
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للتمكن من طباعة الفاتورة.')
    return
  }

  // تجهيز البيانات بشكل آمن مع Fallbacks
  const customerName = order.customerName || order.fullName || order.customer?.fullName || 'العميل الكريم'
  const customerEmail = order.customerEmail || order.email || order.customer?.email || '-'
  const customerPhone = order.phone || order.customerPhone || order.customer?.phoneNumber || '-'
  const address = order.shippingAddress || order.address || 'العنوان المسجل بالحساب'
  const orderNum = order.orderNumber || `ORD-${order.id || 'NEW'}`
  
  // ضبط التاريخ
  const orderDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('ar-EG') 
    : new Date().toLocaleDateString('ar-EG')
    
  const paymentMethod = order.paymentMethod || 'الدفع عند الاستلام (COD)'

  // تجهيز مصفوفة المنتجات والحسابات المالية
  const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.orderItems) ? order.orderItems : [])
  const totalAmount = Number(order.totalAmount || order.total || 0)
  
  // حساب الإجمالي الفرعي وتكلفة الشحن إذا لم تكن موجودة صراحة
  const subtotal = items.length > 0 
    ? items.reduce((sum, item) => sum + (Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)), 0)
    : totalAmount
    
  const shippingCost = totalAmount > subtotal 
    ? totalAmount - subtotal 
    : Number(order.shippingCost || order.shippingFee || 0)

  // بناء صفوف جدول المنتجات
  const itemsTableRows = items.length > 0 
    ? items.map((item, index) => `
        <tr>
          <td style="text-align: center; font-weight: bold; color: #64748b;">${index + 1}</td>
          <td>
            <div class="item-title">${item.productName || item.name || 'منتج'}</div>
            <div class="item-id">ID: ${item.sku || item.productId || item.id || '-'}</div>
          </td>
          <td style="text-align: center; font-family: monospace;">EGP ${Number(item.unitPrice || item.price || 0).toLocaleString()}</td>
          <td style="text-align: center; font-weight: bold;">${item.quantity || 1}</td>
          <td class="font-bold" style="font-family: monospace;">EGP ${(Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</td>
        </tr>
      `).join('')
    : `
      <tr>
        <td style="text-align: center;">1</td>
        <td>
          <div class="item-title">مشتريات الطلب رقم #${orderNum}</div>
          <div class="item-id">حالة الطلب: ${order.statusText || order.status || 'مؤكد'}</div>
        </td>
        <td style="text-align: center; font-family: monospace;">EGP ${totalAmount.toLocaleString()}</td>
        <td style="text-align: center;">1</td>
        <td class="font-bold" style="font-family: monospace;">EGP ${totalAmount.toLocaleString()}</td>
      </tr>
    `

  // بناء هيكل الـ HTML وتنسيق الفاتورة
  const invoiceHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة مبيعات - ${orderNum}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: 'Cairo', sans-serif; 
          background-color: #f8fafc; 
          color: #0f172a; 
          padding: 20px;
          direction: rtl;
        }
        .invoice-card {
          max-width: 800px;
          margin: auto;
          background: #ffffff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          padding: 32px;
          box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding-bottom: 20px;
          border-bottom: 1px solid #e2e8f0;
        }
        .badge {
          background-color: #09090b;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 8px;
        }
        .meta-info { font-size: 12px; color: #64748b; font-weight: 600; }
        .meta-info span { color: #0f172a; font-weight: 700; font-family: monospace; }
        .company-title {
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          text-align: left;
        }
        .company-sub {
          font-size: 12px;
          color: #475569;
          text-align: left;
          margin-top: 2px;
          font-weight: 600;
        }
        .tax-id {
          font-size: 10px;
          color: #64748b;
          text-align: left;
          margin-top: 4px;
          font-weight: 700;
        }
        .info-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 16px;
          margin: 24px 0;
        }
        .info-box {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 16px;
          background-color: #f8fafc;
        }
        .box-title {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 8px;
        }
        .customer-name { font-size: 16px; font-weight: 800; color: #0f172a; }
        .customer-detail { font-size: 13px; color: #475569; margin-top: 4px; font-weight: 500; }
        .channel-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }
        .payment-tag {
          font-size: 13px;
          font-weight: 800;
          color: #059669;
        }
        .table-section-title {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 12px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
        }
        th {
          background-color: #09090b;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          padding: 12px 14px;
          text-align: right;
        }
        th:last-child, td:last-child { text-align: left; }
        td {
          padding: 14px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 13px;
          color: #1e293b;
        }
        .item-title { font-weight: 800; color: #0f172a; }
        .item-id { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 3px; font-family: monospace; }
        .totals-wrapper {
          display: flex;
          justify-content: flex-start;
          margin-top: 24px;
        }
        .totals-box {
          width: 340px;
          background-color: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          color: #475569;
          margin-bottom: 10px;
          font-weight: 700;
        }
        .total-row span:last-child { font-family: monospace; }
        .total-row.grand {
          border-top: 1px solid #cbd5e1;
          padding-top: 12px;
          margin-bottom: 0;
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
        }
        .grand-amount { color: #059669 !important; font-size: 18px; font-weight: 800; }
        .signatures-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-top: 40px;
          padding-top: 24px;
          border-top: 1px dashed #cbd5e1;
          align-items: center;
        }
        .signature-box { text-align: center; }
        .signature-title { font-size: 14px; font-weight: 800; color: #0f172a; margin-bottom: 30px; }
        .signature-line { border-bottom: 1px dotted #94a3b8; width: 70%; margin: 0 auto 8px auto; }
        .signature-hint { font-size: 10px; color: #94a3b8; font-weight: 600; }
        .stamp-container {
          position: relative;
          display: inline-block;
        }
        .stamp {
          width: 90px;
          height: 90px;
          border: 2px dashed #10b981;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: auto;
          transform: rotate(-15deg);
          color: #059669;
          font-size: 9px;
          font-weight: 800;
          text-align: center;
          padding: 4px;
          background: rgba(16, 185, 129, 0.04);
        }
        .stamp-title { font-size: 11px; font-weight: 900; }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #e2e8f0;
          padding-top: 16px;
          text-align: center;
        }
        .footer-main { font-size: 14px; font-weight: 800; color: #334155; }
        .footer-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; font-style: italic; font-weight: 500; }
        @media print {
          body { background: #fff; padding: 0; }
          .invoice-card { border: none; box-shadow: none; padding: 0; max-width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="invoice-card">
        <div class="header">
          <div>
            <span class="badge">فاتورة مبيعات معتمدة</span>
            <div class="meta-info">ID: <span>${orderNum}</span></div>
            <div class="meta-info" style="margin-top:4px;">التاريخ: <span>${orderDate}</span></div>
          </div>
          <div>
            <div class="company-title">ابن الزمر للعدد ومستلزمات الورش</div>
            <div class="company-sub">أصالة الجودة وكفاءة الأداء والمعدات الأصلية</div>
            <div class="tax-id">Tax ID: EGY-39481-22A • CR 843912</div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-box">
            <div class="box-title">المرسل إليه / العميل</div>
            <div class="customer-name">${customerName}</div>
            ${customerEmail && customerEmail !== '-' ? `<div class="customer-detail">${customerEmail}</div>` : ''}
            <div class="customer-detail" style="font-family: monospace;">${customerPhone}</div>
            <div class="customer-detail">${address}</div>
          </div>
          <div class="info-box">
            <div class="box-title">منفذ البيع وقناة التوزيع</div>
            <div class="channel-badge">🌐 طلبات المتجر الإلكتروني</div>
            <div class="box-title" style="margin-top:16px;">طريقة الدفع ومصادقتها</div>
            <div class="payment-tag">${paymentMethod}</div>
          </div>
        </div>

        <div class="table-section-title">المنتجات والعدد المباعة</div>
        <table>
          <thead>
            <tr>
              <th style="width: 5%; text-align: center;">#</th>
              <th style="width: 45%;">السلعة / البيان</th>
              <th style="width: 15%; text-align: center;">سعر الوحدة</th>
              <th style="width: 10%; text-align: center;">الكمية</th>
              <th style="width: 25%;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <div class="totals-wrapper">
          <div class="totals-box">
            <div class="total-row">
              <span>الإجمالي الفرعي:</span>
              <span>EGP ${subtotal.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>تكلفة الشحن:</span>
              <span>EGP ${shippingCost.toLocaleString()}</span>
            </div>
            <div class="total-row grand">
              <span>الإجمالي الكلي:</span>
              <span class="grand-amount">EGP ${totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="signatures-grid">
          <div class="signature-box">
            <div class="signature-title">توقيع المستلم / العميل</div>
            <div class="signature-line"></div>
            <div class="signature-hint">(أقر باستلام السلع بحالة سليمة ومطابقة للضمان)</div>
          </div>
          <div class="signature-box">
            <div class="signature-title">توقيع الصراف وختم المركز</div>
            <div class="stamp-container">
              <div class="stamp">
                <span class="stamp-title">ابن الزمر</span>
                <span>EBN ELZAMER</span>
                <span style="font-size:8px; color:#059669; margin-top:2px; font-weight: 900;">APPROVED</span>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">
          <div class="footer-main">شكراً لتعاملكم مع ابن الزمر لمستلزمات الورش!</div>
          <div class="footer-sub">.Please keep this VAT receipt copy as a reference for official device warranty claims</div>
        </div>
      </div>

      <script>
        // تشغيل أمر الطباعة فور تحميل النافذة والمحتوى
        window.onload = function() { 
          setTimeout(function() {
            window.print(); 
            // إغلاق النافذة التلقائي بعد الطباعة
            window.onafterprint = function() {
              window.close();
            };
          }, 400); // تأخير بسيط لضمان تحميل الخطوط (Cairo)
        };
      </script>
    </body>
    </html>
  `

  printWindow.document.write(invoiceHtml)
  printWindow.document.close()
}