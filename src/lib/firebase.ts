import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore, 
  memoryLocalCache, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Handle cases where firebase-applet-config.json might be empty or invalid
const validConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfig?.apiKey || "placeholder",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfig?.authDomain || "placeholder",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfig?.projectId || "placeholder",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfig?.storageBucket || "placeholder",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfig?.messagingSenderId || "placeholder",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfig?.appId || "placeholder",
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_DATABASE_ID || firebaseConfig?.firestoreDatabaseId || "(default)"
};

const app = initializeApp(validConfig);
export const auth = getAuth(app);

// Initialize Firestore with standard settings. 
// Using long polling and in-memory cache to stay resilient in restricted Chrome/Safari iframe environments.
const firestoreDatabaseId = validConfig.firestoreDatabaseId || "(default)";
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache()
}, firestoreDatabaseId);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification,
  updateProfile
};
