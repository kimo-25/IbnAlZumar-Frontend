// src/db/db.js
import Dexie from 'dexie';

// Single Dexie database for the whole app.
// Add more tables here as your offline needs grow (e.g. drafts, attachments).
export const db = new Dexie('IbnAlZumarDB');

db.version(1).stores({
  // '++id' = auto-incrementing local primary key
  // 'syncStatus' and 'createdAt' are indexed for fast queries
  transactions: '++id, syncStatus, createdAt, clientUuid',
});

/**
 * Add a transaction locally. Always created with syncStatus = 'pending'.
 * clientUuid lets the backend de-duplicate if a sync is retried.
 */
export async function addLocalTransaction(payload) {
  const record = {
    ...payload,
    clientUuid: crypto.randomUUID(),
    syncStatus: 'pending', // 'pending' | 'syncing' | 'synced' | 'failed'
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
  return db.transactions.delete(id); // remove from queue once confirmed by server
}

export async function markAsFailed(id) {
  const item = await db.transactions.get(id);
  return db.transactions.update(id, {
    syncStatus: item.retryCount >= 5 ? 'failed' : 'pending',
    retryCount: (item.retryCount ?? 0) + 1,
  });
}