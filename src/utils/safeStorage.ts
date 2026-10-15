/**
 * safeStorage.ts
 * Bulletproof Storage wrapper with automatic QuotaExceededError recovery,
 * cache pruning of non-essential logs/tables, and fallback to sessionStorage & in-memory store.
 */

const memoryStore: Record<string, string> = {};

// Non-essential cache keys that can be safely evicted first when storage quota is exceeded
const PURGE_PRIORITY_KEYS = [
  'omnipack_erp_auditLogs',
  'omnipack_erp_stockLogs',
  'omnipack_erp_messages',
  'omnipack_erp_comboLogs',
  'omnipack_erp_packingSessions',
  'omnipack_erp_loyaltyLogs',
  'omnipack_read_notifications',
  'omnipack_erp_purchases'
];

export const safeStorage = {
  /**
   * Set item in localStorage with auto-pruning if quota is exceeded
   */
  setItem(key: string, value: string): boolean {
    memoryStore[key] = value;

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return true;
      }
    } catch (err: any) {
      console.warn(`[safeStorage] localStorage quota error on key "${key}":`, err?.message || err);

      // 1. Attempt to purge non-essential keys
      try {
        let freed = false;
        for (const purgeKey of PURGE_PRIORITY_KEYS) {
          if (purgeKey !== key && window.localStorage.getItem(purgeKey) !== null) {
            window.localStorage.removeItem(purgeKey);
            freed = true;
          }
        }

        // Also clean up any hidden communication caches or temp caches
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && (k.startsWith('omnipack_erp_hidden_comms_') || k.startsWith('temp_'))) {
            window.localStorage.removeItem(k);
            freed = true;
          }
        }

        if (freed) {
          try {
            window.localStorage.setItem(key, value);
            console.log(`[safeStorage] Successfully saved "${key}" after pruning non-essential storage.`);
            return true;
          } catch (_) {
            // Still full, proceed to step 2
          }
        }

        // 2. If still full and this is a critical key (session, credentials, device id), purge ONLY non-essential transient log keys
        if (key.includes('session') || key.includes('device_id') || key.includes('passwords')) {
          for (const purgeKey of PURGE_PRIORITY_KEYS) {
            window.localStorage.removeItem(purgeKey);
          }
          try {
            window.localStorage.setItem(key, value);
            console.log(`[safeStorage] Successfully saved critical key "${key}" after pruning non-essential storage.`);
            return true;
          } catch (_) {}
        }
      } catch (purgeErr) {
        console.warn('[safeStorage] Error during storage purge:', purgeErr);
      }

      // 3. Fallback to sessionStorage for session/auth items
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          window.sessionStorage.setItem(key, value);
          return true;
        }
      } catch (sessionErr) {
        console.warn('[safeStorage] sessionStorage fallback also failed:', sessionErr);
      }
    }

    return false;
  },

  /**
   * Get item from localStorage with fallback to sessionStorage & in-memory
   */
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch (_) {}

    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const sessionVal = window.sessionStorage.getItem(key);
        if (sessionVal !== null) return sessionVal;
      }
    } catch (_) {}

    return memoryStore[key] ?? null;
  },

  /**
   * Remove item from localStorage, sessionStorage, and memory
   */
  removeItem(key: string): void {
    delete memoryStore[key];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch (_) {}
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch (_) {}
  },

  /**
   * Preemptively trim / clean non-essential storage entries
   */
  pruneNonEssential(): void {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      for (const purgeKey of PURGE_PRIORITY_KEYS) {
        window.localStorage.removeItem(purgeKey);
      }
    } catch (_) {}
  }
};
