// src/services/syncService.js
import axios from 'axios';
import { db, getPendingTransactions, markAsSynced, markAsFailed } from '../db/db';

// Use the same '/api' base your vite.config.js proxies to backend
const api = axios.create({ baseURL: '/api' });

let isSyncing = false; // simple lock to avoid overlapping sync runs

/**
 * Pushes pending offline orders to the .NET API in a single batch (/api/orders/sync).
 * Processes responses and updates Dexie DB status accordingly.
 */
export async function syncPendingTransactions() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pending = await getPendingTransactions();
    if (!pending || pending.length === 0) return;

    // 1. تحديث حالة الفواتير في Dexie إلى 'syncing'
    for (const tx of pending) {
      await db.transactions.update(tx.id, { syncStatus: 'syncing' });
    }

    // 2. تجهيز البيانات بالشكل الصحيح الذي يتوقعه الـ Backend (SyncBatchRequestDto)
    const batchPayload = {
      orders: pending.map(tx => ({
        clientUuid: tx.clientUuid,
        customerId: tx.customerId || null,
        guestName: tx.guestName || null,
        guestPhone: tx.guestPhone || null,
        source: tx.source ?? 1,
        paymentMethod: tx.paymentMethod ?? 1,
        warehouseId: tx.warehouseId ?? 1,
        orderDate: tx.createdAt || new Date().toISOString(),
        shippingAddress: tx.shippingAddress || null,
        discountType: tx.discountType ?? 0,
        discountValue: tx.discountValue ?? 0,
        notes: tx.notes || null,
        items: (tx.items || []).map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountType: item.discountType ?? 0,
          discountValue: item.discountValue ?? 0,
        })),
      }))
    };

    // 3. إرسال الطلب دفعة واحدة للباك إند
    const response = await api.post('/orders/sync', batchPayload);

    // 4. معالجة النتيجة لكل فاتورة بشكل منفصل
    if (response.data && response.data.results) {
      for (const result of response.data.results) {
        const localRecord = pending.find(p => p.clientUuid === result.clientUuid);
        if (localRecord) {
          if (result.success) {
            await markAsSynced(localRecord.id);
          } else {
            console.error(`Sync failed for order ${result.clientUuid}:`, result.errorMessage);
            await markAsFailed(localRecord.id);
          }
        }
      }
    }
  } catch (err) {
    console.error('Batch sync request failed:', err);

    // في حالة انقطاع الاتصال أو خطأ بالشبكة، إرجاع الفواتير التي كانت قيد المزامنة لتتم إعادتها لاحقاً
    const pending = await getPendingTransactions();
    for (const tx of pending) {
      if (tx.syncStatus === 'syncing') {
        await markAsFailed(tx.id);
      }
    }
  } finally {
    isSyncing = false;
  }
}