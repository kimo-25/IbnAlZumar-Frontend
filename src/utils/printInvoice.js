// File: src/utils/printInvoice.js

export const printInvoice = (order, customerUser = {}) => {
  if (!order) return

  const printWindow = window.open('', '_blank', 'width=900,height=950')
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للتمكن من استعراض الفاتورة.')
    return
  }

  // استخراج بيانات العميل بدقة من مختلف الأماكن المحتملة في الأوبجكت أو الحساب
  const customerName = 
    order.customerName || 
    order.fullName || 
    order.customer?.fullName || 
    order.user?.fullName || 
    order.user?.name || 
    customerUser.fullName || 
    customerUser.name || 
    'ابن الزمر' // الاسم الظاهر في البروفايل عندك كبديل افتراضي واقعي

  const customerEmail = 
    order.customerEmail || 
    order.email || 
    order.customer?.email || 
    order.user?.email || 
    customerUser.email || 
    'ebn-elzamer@store.com'

  const customerPhone = 
    order.phone || 
    order.customerPhone || 
    order.customer?.phoneNumber || 
    order.user?.phone || 
    order.user?.phoneNumber || 
    customerUser.phone || 
    customerUser.phoneNumber || 
    '01000000000' // رقم افتراضي مؤقت لو غير مسجل بالطلب

  // معالجة العنوان سواء كان نص أو أوبجكت تفصيلي مع إصلاح خطأ الدمج
  let address = 'العنوان المسجل بالحساب'
  const rawAddr = order.shippingAddress || order.address || order.customer?.address || order.user?.address || customerUser.address
  
  if (typeof rawAddr === 'string' && rawAddr.trim() !== '') {
    address = rawAddr
  } else if (rawAddr && typeof rawAddr === 'object') {
    const addrParts = [rawAddr.street, rawAddr.city, rawAddr.state].filter(Boolean)
    address = addrParts.length > 0 ? addrParts.join(', ') : 'القاهرة، مصر'
  }

  const orderNum = order.orderNumber || `ORD-${order.id || '2026-102'}`
  
  const orderDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : '١٤ أغسطس ٢٠٢٦'
    
  // ترجمة أو تنسيق طريقة الدفع
  const rawPayment = order.paymentMethod || 'CARD'
  const paymentMethod = rawPayment === 'CARD' ? 'بطاقة ائتمانية / دفع إلكتروني' : (rawPayment === 'CASH' ? 'الدفع عند الاستلام' : rawPayment)

  // المنتجات الحقيقية للطلب
  const items = Array.isArray(order.items) ? order.items : (Array.isArray(order.orderItems) ? order.orderItems : [])
  const totalAmount = Number(order.totalAmount || order.total || 0)
  
  // حساب المجموع الفرعي بدقة من المنتجات إن وجدت
  const subtotal = items.length > 0 
    ? items.reduce((sum, item) => sum + (Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)), 0)
    : totalAmount
    
  // حساب الشحنة بشكل منطقي
  const shippingCost = totalAmount > subtotal 
    ? totalAmount - subtotal 
    : Number(order.shippingCost || order.shippingFee || (totalAmount > 0 ? 55 : 0))

  const itemsTableRows = items.length > 0 
    ? items.map((item, index) => `
        <tr>
          <td style="text-align: right;">
            <div style="font-weight: 700; color: #0f172a;">${item.productName || item.name || `منتج رقم ${index + 1}`}</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;" dir="ltr">SKU/ID: ${item.sku || item.productId || item.id || 'prod-' + (index + 1)}</div>
          </td>
          <td style="text-align: center;"><span dir="ltr">EGP ${Number(item.unitPrice || item.price || 0).toLocaleString()}</span></td>
          <td style="text-align: center; font-weight: 700;"><span dir="ltr">${item.quantity || 1}</span></td>
          <td style="text-align: left; font-weight: 700;"><span dir="ltr">EGP ${(Number(item.unitPrice || item.price || 0) * Number(item.quantity || 1)).toLocaleString()}</span></td>
        </tr>
      `).join('')
    : `
        <tr>
          <td style="text-align: right;">
            <div style="font-weight: 700; color: #0f172a;">مشتريات عامة من المتجر</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 2px;" dir="ltr">ID: prod-general</div>
          </td>
          <td style="text-align: center;"><span dir="ltr">EGP ${subtotal.toLocaleString()}</span></td>
          <td style="text-align: center; font-weight: 700;"><span dir="ltr">1</span></td>
          <td style="text-align: left; font-weight: 700;"><span dir="ltr">EGP ${subtotal.toLocaleString()}</span></td>
        </tr>
      `

  const invoiceHtml = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة مبيعات - ${orderNum}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { 
          font-family: Arial, sans-serif; 
          background-color: #f8fafc; 
          color: #0f172a; 
          padding: 24px;
        }
        .modal-container {
          max-width: 750px;
          margin: auto;
          background: #ffffff;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.05);
        }
        .action-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #0f172a;
          color: #fff;
          padding: 12px 20px;
          border-radius: 10px;
          margin-bottom: 24px;
        }
        .action-bar span { font-size: 13px; font-weight: bold; }
        .print-btn {
          background: #10b981;
          color: #fff;
          border: none;
          padding: 8px 18px;
          font-size: 13px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          transition: background 0.2s;
        }
        .print-btn:hover { background: #059669; }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 1px solid #e2e8f0;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .badge-black {
          background-color: #09090b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 6px;
          display: inline-block;
          margin-bottom: 6px;
        }
        .meta-text {
          font-size: 12px;
          font-weight: 700;
          color: #09090b;
        }
        .company-name {
          font-size: 20px;
          font-weight: 900;
          color: #09090b;
          text-align: left;
        }
        .company-slogan {
          font-size: 11px;
          color: #475569;
          text-align: left;
          font-weight: 700;
          margin-top: 2px;
        }
        .tax-info {
          font-size: 10px;
          color: #475569;
          text-align: left;
          font-weight: 700;
          margin-top: 2px;
        }
        .grid-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }
        .box {
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 14px;
          background: #ffffff;
        }
        .box-title {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 8px;
        }
        .channel-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
          font-weight: 700;
          color: #09090b;
        }
        .payment-val {
          font-size: 13px;
          font-weight: 900;
          color: #059669;
          margin-top: 4px;
        }
        .client-name {
          font-size: 15px;
          font-weight: 900;
          color: #09090b;
        }
        .client-detail {
          font-size: 12px;
          color: #475569;
          margin-top: 2px;
          font-weight: 600;
        }
        .section-title {
          font-size: 13px;
          font-weight: 900;
          color: #09090b;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }
        th {
          background-color: #09090b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 700;
          padding: 10px 12px;
        }
        th:first-child { text-align: right; }
        th:nth-child(2), th:nth-child(3) { text-align: center; }
        th:last-child { text-align: left; }
        td {
          padding: 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
          color: #0f172a;
        }
        .totals-container {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 30px;
        }
        .totals-card {
          width: 320px;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
          padding: 14px 16px;
          background: #ffffff;
        }
        .total-line {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #475569;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .total-line.final {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-bottom: 0;
          font-size: 14px;
          font-weight: 900;
          color: #09090b;
        }
        .final-val { color: #059669; }
        .signatures-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding-top: 15px;
          border-top: 1px dashed #cbd5e1;
          margin-bottom: 20px;
          align-items: center;
        }
        .sig-box { text-align: center; }
        .sig-title { font-size: 13px; font-weight: 900; color: #09090b; margin-bottom: 20px; }
        .sig-line { border-bottom: 1px dotted #94a3b8; width: 65%; margin: 0 auto 6px auto; }
        .sig-hint { font-size: 10px; color: #64748b; font-weight: 600; }
        .stamp-circle {
          width: 75px;
          height: 75px;
          border: 2px dashed #10b981;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: auto;
          color: #059669;
          font-size: 8px;
          font-weight: 900;
          background: rgba(16, 185, 129, 0.03);
        }
        .footer-note {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
          text-align: center;
        }
        .footer-ar { font-size: 12px; font-weight: 900; color: #09090b; }
        .footer-en { font-size: 9px; color: #64748b; margin-top: 2px; font-style: italic; font-weight: 600; }
        
        @media print {
          body { background-color: #fff; padding: 0; }
          .action-bar { display: none; }
          .modal-container { border: none; padding: 0; max-width: 100%; box-shadow: none; }
        }
      </style>
    </head>
    <body>
      <div class="modal-container">
        <div class="action-bar">
          <span>📄 معاينة الفاتورة الرسمية - ابن الزمر</span>
          <button class="print-btn" onclick="window.print()">حفظ / طباعة الفاتورة</button>
        </div>

        <div class="header">
          <div>
            <div class="badge-black">فاتورة مبيعات معتمدة</div>
            <div class="meta-text" dir="ltr">ID: ${orderNum}</div>
            <div class="meta-text" style="margin-top:2px;" dir="ltr">Date: ${orderDate}</div>
          </div>
          <div>
            <div class="company-name">ابن الزمر للعدد ومستلزمات الورش</div>
            <div class="company-slogan">أصالة الجودة وكفاءة الأداء والمعدات الأصلية</div>
            <div class="tax-info" dir="ltr">Tax ID: EGY-39481-22A • CR 843912</div>
          </div>
        </div>

        <div class="grid-boxes">
          <div class="box">
            <div class="box-title">منفذ البيع وقناة التوزيع</div>
            <div class="channel-row">🌐 طلبات المتجر الإلكتروني</div>
            <div class="box-title" style="margin-top:10px;">طريقة الدفع ومصادقتها</div>
            <div class="payment-val">${paymentMethod}</div>
          </div>
          <div class="box">
            <div class="box-title">المرسل إليه / العميل</div>
            <div class="client-name">${customerName}</div>
            <div class="client-detail" dir="ltr">${customerEmail}</div>
            <div class="client-detail" dir="ltr">${customerPhone}</div>
            <div class="client-detail">${address}</div>
          </div>
        </div>

        <div class="section-title">المنتجات والعدد المباعة</div>
        <table>
          <thead>
            <tr>
              <th style="width: 50%;">السلعة / البيان</th>
              <th style="width: 15%; text-align: center;">سعر الوحدة</th>
              <th style="width: 15%; text-align: center;">الكمية</th>
              <th style="width: 20%; text-align: left;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <div class="totals-container">
          <div class="totals-card">
            <div class="total-line">
              <span>الإجمالي الفرعي:</span>
              <span dir="ltr">EGP ${subtotal.toLocaleString()}</span>
            </div>
            <div class="total-line">
              <span>تكلفة الشحن:</span>
              <span dir="ltr">EGP ${shippingCost.toLocaleString()}</span>
            </div>
            <div class="total-line final">
              <span>الإجمالي الكلي:</span>
              <span class="final-val" dir="ltr">EGP ${totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="signatures-section">
          <div class="sig-box">
            <div class="sig-title">توقيع المستلم / العميل</div>
            <div class="sig-line"></div>
            <div class="sig-hint">(أقر باستلام السلع بحالة سليمة ومطابقة للضمان)</div>
          </div>
          <div class="sig-box">
            <div class="sig-title">توقيع الصراف وختم المركز</div>
            <div class="stamp-circle">
              <span style="font-size:9px; font-weight:900;">ابن الزمر</span>
              <span style="font-size:7px;">EBN ELZAMER</span>
              <span style="font-size:6px; color:#059669; font-weight:900;">APPROVED</span>
            </div>
          </div>
        </div>

        <div class="footer-note">
          <div class="footer-ar">شكراً لتعاملكم مع ابن الزمر لمستلزمات الورش!</div>
          <div class="footer-en" dir="ltr">Please keep this VAT receipt copy as a reference for official device warranty claims.</div>
        </div>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(invoiceHtml)
  printWindow.document.close()
}