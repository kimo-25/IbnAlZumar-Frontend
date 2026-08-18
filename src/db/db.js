import Dexie from 'dexie';

export const db = new Dexie('IbnAlZumarDB');

db.version(2).stores({
  transactions: '++id, syncStatus, createdAt, clientUuid',
  products: 'id, name', // إضافة جدول المنتجات
});

export async function addLocalTransaction(payload) {
  const record = {
    ...payload,
    clientUuid: crypto.randomUUID(),
    syncStatus: 'pending',
    createdAt: new Date().toISOString(),
    retryCount: 0,
  };
  const id = await db.transactions.add(record);
  return { id, ...record };
}

export async function getPendingTransactions() {
  return db.transactions.where('syncStatus').equals('pending').toArray();
}

export async function markAsSynced(id) {
  return db.transactions.delete(id);
}

export async function markAsFailed(id) {
  const item = await db.transactions.get(id);
  return db.transactions.update(id, {
    syncStatus: item.retryCount >= 5 ? 'failed' : 'pending',
    retryCount: (item.retryCount ?? 0) + 1,
  });
}

// --- دوال المنتجات للمزامنة الأوفلاين ---

export async function cacheProducts(products) {
  await db.products.clear();
  return db.products.bulkPut(products);
}

export async function getLocalProducts() {
  return db.products.toArray();
}