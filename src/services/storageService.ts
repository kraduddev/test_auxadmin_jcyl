const STORAGE_KEY_PREFIX = 'webapp_';

export const storageService = {
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(`${STORAGE_KEY_PREFIX}${key}`);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error reading from localStorage (key: ${key}):`, error);
      return null;
    }
  },

  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${key}`, JSON.stringify(value));
    } catch (error) {
      console.error(`Error writing to localStorage (key: ${key}):`, error);
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${key}`);
    } catch (error) {
      console.error(`Error removing from localStorage (key: ${key}):`, error);
    }
  },

  clear(): void {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith(STORAGE_KEY_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
};
