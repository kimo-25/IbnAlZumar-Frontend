// src/services/syncService.js
import axiosInstance from '../api/axiosInstance';
import {
  db,
  getPendingTransactions,
  markAsSyncing,
  markAsSynced,
  markAsFailed,
} from '../db/db';

let isSyncing = false; // simple lock to avoid overlapping sync runs

/**
 * Pushes pending offline orders to the .NET API in a single batch (/orders/sync).
 * Processes responses and updates Dexie DB status accordingly.
 */
export async function syncPendingTransactions() {
  if (isSyncing) return;
  isSyncing = true;

  try {
    // C-10: includes both 'pending' and stale 'syncing' rows — see db.js.
    const pending = await getPendingTransactions();
    if (!pending || pending.length === 0) return;

    // 1. تحديث حالة الفواتير في Dexie إلى 'syncing'
    for (const tx of pending) {
      await markAsSyncing(tx.id);
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
    // C-09: uses the shared axiosInstance — JWT Authorization header is
    // attached automatically, and the baseURL comes from the same
    // apiConfig.js every other api/* module uses (no more hardcoded '/api',
    // which only ever worked behind the local Vite dev proxy).
    const response = await axiosInstance.post('/orders/sync', batchPayload);

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

    // C-10: on a network/server-level failure (not a per-order rejection),
    // revert EVERYTHING currently marked 'syncing' back to 'pending' with a
    // bumped retryCount, instead of stranding it in 'syncing' forever.
    const stuck = await db.transactions.where('syncStatus').equals('syncing').toArray();
    for (const tx of stuck) {
      await markAsFailed(tx.id);
    }
  } finally {
    isSyncing = false;
  }
}