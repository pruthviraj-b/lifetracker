// IndexedDB - Persistent storage for notifications

class IndexedDBManager {
    private dbName = 'HabitTrackerDB';
    private version = 1;
    private db: IDBDatabase | null = null;

    // Initialize database
    async init(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => {
                console.error('Database failed to open');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('Database opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create object stores
                if (!db.objectStoreNames.contains('notifications')) {
                    db.createObjectStore('notifications', { keyPath: 'id' });
                }

                if (!db.objectStoreNames.contains('habits')) {
                    const habitStore = db.createObjectStore('habits', { keyPath: 'id' });
                    habitStore.createIndex('name', 'name', { unique: false });
                }

                if (!db.objectStoreNames.contains('completions')) {
                    db.createObjectStore('completions', { keyPath: 'id' });
                }
            };
        });
    }

    // Add notification
    async addNotification(notification: any) {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction('notifications', 'readwrite');
        const store = transaction.objectStore('notifications');

        return new Promise((resolve, reject) => {
            const request = store.put({
                ...notification,
                createdAt: new Date().toISOString()
            });

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get all notifications
    async getAllNotifications(): Promise<any[]> {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction('notifications', 'readonly');
        const store = transaction.objectStore('notifications');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete notification
    async deleteNotification(id: string) {
        if (!this.db) await this.init();
        const transaction = this.db!.transaction('notifications', 'readwrite');
        const store = transaction.objectStore('notifications');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
}

export const IndexedDBManagerInstance = new IndexedDBManager();

