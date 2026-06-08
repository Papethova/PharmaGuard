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

// Option 3: Robust Fallback Offline Caching
// IFrame Compatibility & Graceful Recovery: Initializing specific Firestore persistence 
// try-catch routines to automatically transition to client-side in-memory management 
// when third-party sandboxed iframes block IndexedDB operations.
let initializedDb;
try {
  initializedDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  }, validConfig.firestoreDatabaseId);
  console.log("Option 3 Active: Firestore initialized successfully with robust multi-tab offline local cache persistence.");
} catch (error) {
  console.warn(
    "Option 3 Fallback: Sandbox iframe or browser blocked IndexedDB/storage. " +
    "Transitioning gracefully to client-side in-memory management.", 
    error
  );
  initializedDb = getFirestore(app, validConfig.firestoreDatabaseId);
}

export const db = initializedDb;

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
