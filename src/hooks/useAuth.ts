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
import { toast } from "sonner";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const emailId = currentUser.email?.toLowerCase() || currentUser.uid;
        const userDocRef = doc(db, "users", emailId);
        
        // Timeout for profile readiness - fallback if Firestore is slow
        const profileTimeout = setTimeout(() => {
          setIsAuthReady(true);
          setIsInitializing(false);
        }, 5000);

        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({ ...docSnap.data(), docId: docSnap.id } as UserProfile);
          } else {
            setUserProfile(null);
          }
          clearTimeout(profileTimeout);
          setIsAuthReady(true);
          setIsInitializing(false);
        }, (error) => {
          console.error("Auth profile listener error:", error);
          clearTimeout(profileTimeout);
          setIsAuthReady(true);
          setIsInitializing(false);
        });

        return () => {
          unsubProfile();
          clearTimeout(profileTimeout);
        };
      } else {
        setUserProfile(null);
        setIsAuthReady(true);
        setIsInitializing(false);
      }
    });

    return () => unsubscribe();
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
      toast.error(`Login Failed: ${error.message}`);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      return result.user;
    } catch (error: any) {
      toast.error(`Login Failed: ${error.message}`);
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
      toast.success("Verification email sent. Please check your inbox.");
      return user;
    } catch (error: any) {
      toast.error(`Registration Failed: ${error.message}`);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent.");
    } catch (error: any) {
      toast.error(`Reset Failed: ${error.message}`);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success("Signed out successfully");
    } catch (error: any) {
      toast.error(`Sign out error: ${error.message}`);
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
