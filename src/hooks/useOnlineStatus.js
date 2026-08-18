// src/hooks/useOnlineStatus.js
import { useState, useEffect } from 'react';

/**
 * Tracks browser connectivity. navigator.onLine alone is unreliable
 * (it only reflects network adapter state, not real internet access),
 * so we pair it with 'online'/'offline' events and re-check on focus.
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    // Extra safety net: re-verify when the tab regains focus,
    // since 'online' events can be missed on some mobile browsers.
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        setIsOnline(navigator.onLine);
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  return isOnline;
}