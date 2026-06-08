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
const validConfig = firebaseConfig && firebaseConfig.apiKey ? firebaseConfig : {
  apiKey: "placeholder",
  authDomain: "placeholder",
  projectId: "placeholder",
  storageBucket: "placeholder",
  messagingSenderId: "placeholder",
  appId: "placeholder",
  firestoreDatabaseId: "(default)"
};

const app = initializeApp(validConfig);
export const auth = getAuth(app);

// Initialize Firestore with standard settings. 
// Using long polling and persistent local cache to stay resilient and save reads.
// Respect the custom workspace firestore Database ID defined in firebase-applet-config.json
const firestoreDatabaseId = validConfig.firestoreDatabaseId || "(default)";

// Option 3: Safe Initialization fallback that catches IndexedDB storage permission failures in sandboxed iframes
let dbInstance;
try {
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, firestoreDatabaseId);
  console.log("Firestore initialized successfully with persistent local cache.");
} catch (error) {
  console.warn("Firestore persistent cache block failed (likely sandbox or iframe storage restrictions). Falling back to memoryLocalCache:", error);
  dbInstance = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    localCache: memoryLocalCache()
  }, firestoreDatabaseId);
}

export const db = dbInstance;

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
