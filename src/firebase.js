import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.FIRE_API_KEY,
  authDomain: process.env.FIRE_AUTH_DOMAIN,
  projectId: process.env.FIRE_PROJECT_ID,
  storageBucket: process.env.FIRE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIRE_MESSAGING_SENDER_ID,
  appId: process.env.FIRE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore();
export const storage = getStorage();

export default app;
