import Dexie from 'dexie';

export const db = new Dexie('IbnAlZumarDB');

// v3: bumped for the C-10 fix. On upgrade, any transaction left stuck in
// 'syncing' from a previous (crashed/closed) session is recovered back to
// 'pending' so it isn't stranded forever.
db.version(3).stores({
  transactions: '++id, syncStatus, createdAt, clientUuid, syncedAt',
  products: 'id, name',
}).upgrade(async (tx) => {
  await tx.table('transactions')
    .where('syncStatus')
    .equals('syncing')
    .modify({ syncStatus: 'pending' });
});

db.version(2).stores({
  transactions: '++id, syncStatus, createdAt, clientUuid',
  products: 'id, name',
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

// C-10: a sync attempt must pick up BOTH freshly queued orders ('pending')
// AND anything left mid-flight from a previous run that never got a
// success/failure response ('syncing') — otherwise those are stranded forever.
export async function getPendingTransactions() {
  return db.transactions
    .where('syncStatus')
    .anyOf(['pending', 'syncing'])
    .toArray();
}

export async function markAsSyncing(id) {
  return db.transactions.update(id, { syncStatus: 'syncing' });
}

// C-10: never hard-delete a synced order — keep it for audit history and
// just flag it so it naturally drops out of getPendingTransactions().
export async function markAsSynced(id) {
  return db.transactions.update(id, {
    syncStatus: 'synced',
    syncedAt: new Date().toISOString(),
  });
}

const MAX_RETRIES = 5;

// C-10: on any sync failure (server rejected it, or the batch request itself
// failed) revert to 'pending' with retryCount bumped, so the next sync run
// retries it automatically. Only after MAX_RETRIES does it become terminally
// 'failed' (surfaced to the cashier instead of retried silently forever).
export async function markAsFailed(id) {
  const item = await db.transactions.get(id);
  if (!item) return;

  const nextRetryCount = (item.retryCount ?? 0) + 1;
  return db.transactions.update(id, {
    syncStatus: nextRetryCount >= MAX_RETRIES ? 'failed' : 'pending',
    retryCount: nextRetryCount,
    lastSyncErrorAt: new Date().toISOString(),
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