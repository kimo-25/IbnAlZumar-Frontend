// src/hooks/useAutoSync.js
import { useEffect, useRef } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { syncPendingTransactions } from '../services/syncService';

/**
 * Drop this once near the root of your app (e.g. in App.jsx).
 * Triggers a sync:
 *  - immediately when the app regains connectivity
 *  - once on initial mount (covers app opened while already online with a stale queue)
 *  - on an interval as a safety net, in case a single 'online' event is missed
 */
export function useAutoSync({ intervalMs = 60_000 } = {}) {
  const isOnline = useOnlineStatus();
  const wasOnline = useRef(isOnline);

  useEffect(() => {
    // Transition from offline -> online: fire sync
    if (isOnline && !wasOnline.current) {
      syncPendingTransactions();
    }
    wasOnline.current = isOnline;
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) syncPendingTransactions(); // initial check on mount

    const interval = setInterval(() => {
      if (navigator.onLine) syncPendingTransactions();
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs, isOnline]);
}