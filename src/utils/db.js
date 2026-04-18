// Utilitário simples para gerenciar IndexedDB para mídias pesadas
const DB_NAME = 'ReservaRioDB';
const STORE_NAME = 'gallery';

export const openDB = () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        };
        request.onsuccess = (e) => resolve(e.target.result);
        request.onerror = (e) => reject(e.target.error);
    });
};

export const saveGalleryDB = async (items) => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Limpamos e salvamos tudo (para manter a ordem do admin)
    // Nota: Em um sistema maior usaríamos add/put individual, 
    // mas para a vitrine simplificada, sobrescrevemos a coleção.
    await store.clear();
    for (const item of items) {
        await store.put(item);
    }
    return new Promise((resolve) => {
        tx.oncomplete = () => resolve();
    });
};

export const loadGalleryDB = async () => {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    return new Promise((resolve) => {
        request.onsuccess = () => resolve(request.result);
    });
};
