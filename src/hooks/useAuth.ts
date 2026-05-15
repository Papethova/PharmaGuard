import { useState, useEffect } from "react";
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "../lib/firebase";
import { UserProfile } from "../types";
import { handleFirestoreError, OperationType } from "../lib/errorHandlers";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let unsubProfile: (() => void) | undefined;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      try {
        if (currentUser) {
          const emailId = currentUser.email?.toLowerCase() || currentUser.uid;
          const userDocRef = doc(db, "users", emailId);
          
          let userDoc = await getDoc(userDocRef).catch(() => {
             return null;
          });

          // Identity Recovery: Handle UID-based legacy records migrating to Email identifier
          if (currentUser.uid !== emailId) {
            try {
              const { collection, getDocs, writeBatch } = await import("firebase/firestore");
              const legacyDoc = await getDoc(doc(db, "users", currentUser.uid));
              if (legacyDoc.exists()) {
                const legacySubstances = await getDocs(collection(db, "users", currentUser.uid, "substances"));
                const currentSubstances = await getDocs(collection(db, "users", emailId, "substances"));
                
                if (legacySubstances.size > 0 && currentSubstances.size === 0) {
                  const batch = writeBatch(db);
                  if (!userDoc?.exists()) {
                    batch.set(userDocRef, { ...legacyDoc.data(), migratedFromUid: currentUser.uid, updatedAt: serverTimestamp() });
                  }
                  for (const s of legacySubstances.docs) batch.set(doc(db, "users", emailId, "substances", s.id), s.data());
                  const legacyTx = await getDocs(collection(db, "users", currentUser.uid, "transactions"));
                  for (const t of legacyTx.docs) batch.set(doc(db, "users", emailId, "transactions", t.id), t.data());
                  const legacyStaff = await getDocs(collection(db, "users", currentUser.uid, "staff"));
                  for (const s of legacyStaff.docs) batch.set(doc(db, "users", emailId, "staff", s.id), s.data());
                  await batch.commit();
                  userDoc = await getDoc(userDocRef);
                } else if (!userDoc?.exists()) {
                  await setDoc(userDocRef, { ...legacyDoc.data(), migratedFromUid: currentUser.uid, updatedAt: serverTimestamp() });
                  userDoc = await getDoc(userDocRef);
                }
              }
            } catch (e) {
              console.error("Migration check failed:", e);
            }
          }

          // Profile Creation for New Users
          if (!userDoc || !userDoc.exists()) {
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || "",
              displayName: currentUser.displayName || "User",
              role: "pharmacist",
              status: "pending",
              organizationName: "",
              licenseNumber: "",
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            };
            await setDoc(userDocRef, newProfile);
          }

          // Real-time profile listener
          if (unsubProfile) unsubProfile();
          unsubProfile = onSnapshot(userDocRef, (docSnap) => {
            if (docSnap.exists()) {
              setUserProfile({ ...docSnap.data(), docId: docSnap.id } as UserProfile);
            } else {
              setUserProfile(null);
            }
            setIsAuthReady(true);
            setIsInitializing(false);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${emailId}`);
          });
        } else {
          setUserProfile(null);
          setIsAuthReady(true);
          setIsInitializing(false);
          if (unsubProfile) unsubProfile();
        }
      } catch (error) {
        console.error("Auth state processing error:", error);
        setIsAuthReady(true);
        setIsInitializing(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      const emailId = user.email?.toLowerCase() || user.uid;
      
      // Check if profile exists
      const userDocRef = doc(db, "users", emailId);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create initial profile
        await setDoc(userDocRef, {
          uid: user.uid,
          email: emailId,
          displayName: user.displayName || "Authorized User",
          role: "pharmacist", // default role
          status: "pending",   // needs approval
          createdAt: serverTimestamp()
        });
      }
      return user;
    } catch (error: any) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      return result.user;
    } catch (error: any) {
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, orgName: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, pass);
      const user = result.user;
      const emailId = email.toLowerCase();

      await updateProfile(user, { displayName: orgName });
      
      // Create profile
      await setDoc(doc(db, "users", emailId), {
        uid: user.uid,
        email: emailId,
        displayName: orgName,
        organizationName: orgName,
        role: "pharmacist",
        status: "pending",
        createdAt: serverTimestamp()
      });

      await sendEmailVerification(user);
      return user;
    } catch (error: any) {
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error: any) {
      console.error("Sign out error:", error);
    }
  };

  return {
    user,
    userProfile,
    isAuthReady,
    isInitializing,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    logout
  };
}
