// File: src/utils/printInvoice.js

export const printInvoice = (order, customerUser = {}) => {
  if (!order) return

  const printWindow = window.open('', '_blank', 'width=900,height=950')
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للتمكن من استعراض الفاتورة.')
    return
  }

  // 1. استخراج بيانات العميل بدقة (التحقق من الكائن المدمج user أو customer أو الـ props المباشرة)
  const customerName =
    order.customerName ||
    order.fullName ||
    order.customer?.fullName ||
    order.customer?.name ||
    order.user?.fullName ||
    order.user?.name ||
    customerUser.fullName ||
    customerUser.name ||
    'عميل المتجر'

  // تم توسيع حقول البحث عن البريد الإلكتروني لتشمل كائن user المربوط بالطلب في قاعدة البيانات
  const customerEmail =
    order.customerEmail ||
    order.email ||
    order.customer?.email ||
    order.user?.email ||
    order.appUser?.email ||
    customerUser.email ||
    'غير مسجل'

  const customerPhone =
    order.phone ||
    order.customerPhone ||
    order.customer?.phoneNumber ||
    order.customer?.phone ||
    order.user?.phone ||
    order.user?.phoneNumber ||
    customerUser.phone ||
    customerUser.phoneNumber ||
    'غير مسجل'

  // 2. معالجة العنوان (سواء كان نص عادي أو Object أو حقل shippingAddress/address مباشرة من الطلب)
  let address = 'العنوان المسجل بالحساب'
  const rawAddr =
    order.shippingAddress ||
    order.address ||
    order.customer?.shippingAddress ||
    order.customer?.address ||
    order.user?.address ||
    customerUser.address

  if (typeof rawAddr === 'string' && rawAddr.trim() !== '') {
    address = rawAddr
  } else if (rawAddr && typeof rawAddr === 'object') {
    const addrParts = [rawAddr.street, rawAddr.city, rawAddr.state, rawAddr.governorate, rawAddr.details].filter(Boolean)
    address = addrParts.length > 0 ? addrParts.join(', ') : 'غير محدد'
  }

  // 3. البيانات الأساسية للطلب والتاريخ
  const orderNum = order.orderNumber || order.orderNo || `ORD-${order.id || '101'}`

  const now = new Date()
  const formattedToday = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()}`
  
  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : formattedToday

  // 4. طريقة الدفع
  const rawPayment = (order.paymentMethod || 'CARD').toString().toUpperCase()
  let paymentMethodDisplay = rawPayment
  if (rawPayment === 'CARD' || rawPayment === 'ONLINE') paymentMethodDisplay = 'CARD'
  else if (rawPayment === 'CASH' || rawPayment === 'COD') paymentMethodDisplay = 'الدفع عند الاستلام (CASH)'

  // 5. الحسابات والمنتجات (دعم جميع أسماء الـ Arrays والخصائص المحتملة للـ Items لضمان ظهور المنتجات وتفاصيلها بدقة)
  const items = Array.isArray(order.items)
    ? order.items
    : (Array.isArray(order.orderItems) 
        ? order.orderItems 
        : (Array.isArray(order.orderDetails) ? order.orderDetails : []))

  const totalAmount = Number(order.totalAmount || order.total || 0)

  // حساب المجموع الفرعي من المنتجات الفعلية إن وجدت
  const subtotal = items.length > 0
    ? items.reduce((sum, item) => sum + (Number(item.unitPrice || item.price || item.productPrice || 0) * Number(item.quantity || item.qty || 1)), 0)
    : (Number(order.subTotal || order.subtotal || totalAmount))

  // حساب الشحن
  const shippingCost = Number(
    order.shippingCost ??
    order.shippingFee ??
    (totalAmount > subtotal ? totalAmount - subtotal : 0)
  )

  // بناء أسطر الجدول بالتفاصيل الكاملة لكل منتج طلبه العميل (الاسم، السعر، الكمية، الإجمالي)
  const itemsTableRows = items.length > 0
    ? items.map((item, index) => {
        const uPrice = Number(item.unitPrice || item.price || item.productPrice || 0)
        const qty = Number(item.quantity || item.qty || 1)
        const itemTotal = uPrice * qty
        const pName = item.productName || item.name || item.title || item.product?.name || `منتج رقم ${index + 1}`
        const pSku = item.sku || item.productId || item.product?.sku || item.id || `prod-${index + 1}`

        return `
          <tr>
            <td style="text-align: right;">
              <div style="font-weight: 800; color: #09090b; font-size: 13px;">${pName}</div>
              <div style="font-size: 11px; color: #71717a; margin-top: 3px;" dir="ltr">ID: ${pSku}</div>
            </td>
            <td style="text-align: center; font-weight: 600; color: #27272a;"><span dir="ltr">EGP ${uPrice.toLocaleString()}</span></td>
            <td style="text-align: center; font-weight: 800; color: #09090b;"><span dir="ltr">${qty}</span></td>
            <td style="text-align: left; font-weight: 800; color: #09090b;"><span dir="ltr">EGP ${itemTotal.toLocaleString()}</span></td>
          </tr>
        `
      }).join('')
    : `
        <tr>
          <td style="text-align: right;">
            <div style="font-weight: 800; color: #09090b; font-size: 13px;">مشتريات عامة من المتجر</div>
            <div style="font-size: 11px; color: #71717a; margin-top: 3px;" dir="ltr">ID: prod-general</div>
          </td>
          <td style="text-align: center; font-weight: 600; color: #27272a;"><span dir="ltr">EGP ${subtotal.toLocaleString()}</span></td>
          <td style="text-align: center; font-weight: 800; color: #09090b;"><span dir="ltr">1</span></td>
          <td style="text-align: left; font-weight: 800; color: #09090b;"><span dir="ltr">EGP ${subtotal.toLocaleString()}</span></td>
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
          font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background-color: #0f172a; 
          color: #09090b; 
          padding: 30px 15px;
          display: flex;
          justify-content: center;
        }
        .invoice-card {
          width: 100%;
          max-width: 780px;
          background: #ffffff;
          border-radius: 20px;
          padding: 36px 40px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
          position: relative;
        }
        
        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .badge-black {
          background-color: #09090b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 6px 14px;
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 8px;
          letter-spacing: 0.3px;
        }
        .meta-info {
          font-size: 13px;
          font-weight: 800;
          color: #09090b;
          line-height: 1.4;
        }
        .company-title {
          font-size: 20px;
          font-weight: 900;
          color: #09090b;
          text-align: left;
        }
        .company-subtitle {
          font-size: 11px;
          color: #64748b;
          text-align: left;
          font-weight: 700;
          margin-top: 2px;
        }
        .tax-id {
          font-size: 11px;
          color: #09090b;
          text-align: left;
          font-weight: 800;
          margin-top: 4px;
        }

        .divider {
          height: 1px;
          background-color: #e2e8f0;
          margin-bottom: 24px;
        }

        /* Two Boxes Grid */
        .grid-boxes {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }
        .box {
          border: 1.5px solid #09090b;
          border-radius: 14px;
          padding: 16px 20px;
          background: #ffffff;
        }
        .box-label {
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          margin-bottom: 6px;
        }
        .box-val-header {
          font-size: 14px;
          font-weight: 900;
          color: #09090b;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .payment-status {
          font-size: 14px;
          font-weight: 900;
          color: #10b981;
          margin-top: 6px;
        }
        .client-name {
          font-size: 16px;
          font-weight: 900;
          color: #09090b;
        }
        .client-sub {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
          margin-top: 3px;
        }

        /* Table */
        .section-label {
          font-size: 12px;
          font-weight: 900;
          color: #09090b;
          margin-bottom: 10px;
          text-align: right;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          border-radius: 10px;
          overflow: hidden;
          border: 1px solid #e2e8f0;
          margin-bottom: 24px;
        }
        th {
          background-color: #09090b;
          color: #ffffff;
          font-size: 11px;
          font-weight: 800;
          padding: 12px 14px;
        }
        th:first-child { text-align: right; }
        th:nth-child(2), th:nth-child(3) { text-align: center; }
        th:last-child { text-align: left; }
        
        td {
          padding: 14px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
        }

        /* Totals Box */
        .totals-wrapper {
          display: flex;
          justify-content: flex-start;
          margin-bottom: 30px;
        }
        .totals-card {
          width: 310px;
          border: 1px solid #e2e8f0;
          background-color: #f8fafc;
          border-radius: 14px;
          padding: 16px 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          font-weight: 800;
          color: #475569;
          margin-bottom: 10px;
        }
        .total-row.final {
          margin-bottom: 0;
          padding-top: 10px;
          border-top: 1px solid #cbd5e1;
          color: #09090b;
          font-size: 15px;
          font-weight: 900;
        }
        .final-val {
          color: #10b981;
          font-weight: 900;
        }

        /* Signatures Section */
        .signatures-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          padding-top: 20px;
          border-top: 1px dashed #cbd5e1;
          margin-bottom: 24px;
        }
        .sig-box {
          text-align: center;
        }
        .sig-title {
          font-size: 13px;
          font-weight: 900;
          color: #09090b;
          margin-bottom: 24px;
        }
        .sig-dots {
          border-bottom: 1.5px dotted #94a3b8;
          width: 70%;
          margin: 0 auto 8px auto;
        }
        .sig-hint {
          font-size: 10px;
          color: #94a3b8;
          font-weight: 600;
        }
        
        .stamp-circle {
          width: 80px;
          height: 80px;
          border: 2px dashed #34d399;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          color: #059669;
          background: #ecfdf5;
          transform: rotate(-8deg);
        }

        /* Footer Notes */
        .footer-section {
          text-align: center;
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
          margin-bottom: 24px;
        }
        .footer-main {
          font-size: 13px;
          font-weight: 900;
          color: #09090b;
        }
        .footer-sub {
          font-size: 10px;
          color: #94a3b8;
          margin-top: 3px;
          font-style: italic;
          font-weight: 600;
        }

        /* Bottom Control Bar */
        .control-bar {
          display: flex;
          gap: 12px;
          margin-top: 10px;
        }
        .btn-print {
          flex: 2;
          background-color: #059669;
          color: #ffffff;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: background 0.2s;
        }
        .btn-print:hover { background-color: #047857; }
        .btn-close {
          flex: 1;
          background-color: #f1f5f9;
          color: #334155;
          border: none;
          border-radius: 12px;
          padding: 12px;
          font-size: 13px;
          font-weight: 800;
          cursor: pointer;
        }

        @media print {
          body { background-color: #ffffff; padding: 0; }
          .invoice-card { box-shadow: none; border-radius: 0; padding: 0; max-width: 100%; }
          .control-bar { display: none !important; }
        }
      </style>
    </head>
    <body>

      <div class="invoice-card">
        <!-- Header -->
        <div class="header">
          <div>
            <div class="badge-black">فاتورة مبيعات معتمدة</div>
            <div class="meta-info" dir="ltr">ID: ${orderNum}</div>
            <div class="meta-info" dir="ltr" style="margin-top:2px;">Date: ${orderDate}</div>
          </div>
          <div>
            <div class="company-title">ابن الزمر للعدد ومستلزمات الورش</div>
            <div class="company-subtitle">أصالة الجودة وكفاءة الأداء والمعدات الأصلية</div>
            <div class="tax-id" dir="ltr">Tax ID: EGY-39481-22A • CR 843912</div>
          </div>
        </div>

        <div class="divider"></div>

        <!-- 2 Grid Boxes -->
        <div class="grid-boxes">
          <div class="box">
            <div class="box-label">منفذ البيع وقناة التوزيع</div>
            <div class="box-val-header">🌐 طلبات المتجر الإلكتروني</div>
            
            <div class="box-label" style="margin-top: 14px;">طريقة الدفع ومصادقتها</div>
            <div class="payment-status" dir="ltr">${paymentMethodDisplay}</div>
          </div>

          <div class="box">
            <div class="box-label">المرسل إليه / العميل</div>
            <div class="client-name">${customerName}</div>
            <div class="client-sub" dir="ltr">${customerEmail}</div>
            <div class="client-sub" dir="ltr">${customerPhone}</div>
            <div class="client-sub">${address}</div>
          </div>
        </div>

        <!-- Items Table -->
        <div class="section-label">المنتجات والعدد المباعة</div>
        <table>
          <thead>
            <tr>
              <th style="width: 48%;">السلعة / البيان</th>
              <th style="width: 18%; text-align: center;">سعر الوحدة</th>
              <th style="width: 14%; text-align: center;">الكمية</th>
              <th style="width: 20%; text-align: left;">المجموع</th>
            </tr>
          </thead>
          <tbody>
            ${itemsTableRows}
          </tbody>
        </table>

        <!-- Totals Card -->
        <div class="totals-wrapper">
          <div class="totals-card">
            <div class="total-row">
              <span>الإجمالي الفرعي:</span>
              <span dir="ltr">EGP ${subtotal.toLocaleString()}</span>
            </div>
            <div class="total-row">
              <span>تكلفة الشحن:</span>
              <span dir="ltr">EGP ${shippingCost.toLocaleString()}</span>
            </div>
            <div class="total-row final">
              <span>الإجمالي الكلي:</span>
              <span class="final-val" dir="ltr">EGP ${totalAmount.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <!-- Signatures & Stamp -->
        <div class="signatures-section">
          <div class="sig-box">
            <div class="sig-title">توقيع المستلم / العميل</div>
            <div class="sig-dots"></div>
            <div class="sig-hint">(أقر باستلام السلع بحالة سليمة ومطابقة للضمان)</div>
          </div>

          <div class="sig-box">
            <div class="sig-title">توقيع الصراف وختم المركز</div>
            <div class="stamp-circle">
              <span style="font-size: 10px; font-weight: 900;">ابن الزمر</span>
              <span style="font-size: 7px; font-weight: 800;">EBN ELZAMER</span>
              <span style="font-size: 7px; font-weight: 900; color: #059669; margin-top:2px;">APPROVED</span>
            </div>
          </div>
        </div>

        <!-- Footer Note -->
        <div class="footer-section">
          <div class="footer-main">شكراً لتعاملكم مع ابن الزمر لمستلزمات الورش!</div>
          <div class="footer-sub" dir="ltr">.Please keep this VAT receipt copy as a reference for official device warranty claims</div>
        </div>

        <!-- Action Buttons -->
        <div class="control-bar">
          <button class="btn-print" onclick="window.print()">
            🖨️ طباعة الفاتورة الفورية
          </button>
          <button class="btn-close" onclick="window.close()">
            متابعة
          </button>
        </div>

      </div>

    </body>
    </html>
  `

  printWindow.document.write(invoiceHtml)
  printWindow.document.close()
}