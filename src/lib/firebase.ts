import { initializeApp } from 'firebase/app';
import {
	initializeFirestore,
	persistentLocalCache,
	persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Offline persistence: caches reads in IndexedDB and queues writes made
// while offline, syncing automatically once the connection comes back.
// persistentMultipleTabManager lets it work across more than one open tab
// instead of only the first one that grabbed the cache.
export const db = initializeFirestore(app, {
	localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
