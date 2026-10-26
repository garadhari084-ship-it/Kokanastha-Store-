// Safe localStorage wrapper to prevent crashes in private browsing or restricted environments

class SafeStorage {
  private memoryFallback: Map<string, string> = new Map();

  private isLocalStorageAvailable(): boolean {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch (_) {
      return false;
    }
  }

  public getItem(key: string): string | null {
    if (this.isLocalStorageAvailable()) {
      try {
        return window.localStorage.getItem(key);
      } catch (_) {}
    }
    return this.memoryFallback.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch (_) {}
    }
    this.memoryFallback.set(key, value);
  }

  public removeItem(key: string): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.removeItem(key);
        return;
      } catch (_) {}
    }
    this.memoryFallback.delete(key);
  }

  public clear(): void {
    if (this.isLocalStorageAvailable()) {
      try {
        window.localStorage.clear();
      } catch (_) {}
    }
    this.memoryFallback.clear();
  }
}

export const safeStorage = new SafeStorage();
