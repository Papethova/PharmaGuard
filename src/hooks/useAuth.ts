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
        
        // Listen to user profile
        const userDocRef = doc(db, "users", emailId);
        
        const unsubProfile = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserProfile({ ...docSnap.data(), docId: docSnap.id } as UserProfile);
          } else {
            setUserProfile(null);
          }
          setIsAuthReady(true);
          setIsInitializing(false);
        }, (error) => {
          console.error("Auth profile listener error:", error);
          setIsAuthReady(true);
          setIsInitializing(false);
        });

        return () => unsubProfile();
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
    // 1. Email Compliance Checks
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Email address is required for registration.");
      throw new Error("Missing email");
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Invalid email format. Please specify a compliant standard email (e.g., user@domain.com).");
      throw new Error("Invalid email format");
    }
    const allowedIdRegex = /^[a-zA-Z0-9_\-.\@]+$/;
    if (!allowedIdRegex.test(trimmedEmail.toLowerCase())) {
      toast.error("Compliance restriction: Security rules do not permit emails containing special characters like '+' or brackets. Please use a standard email without special characters.");
      throw new Error("Special characters in email");
    }
    if (trimmedEmail.length > 128) {
      toast.error("Compliance restriction: The email address must be less than 128 characters.");
      throw new Error("Email too long");
    }

    // 2. Organization Name Compliance Checks
    const trimmedOrgName = orgName.trim();
    if (!trimmedOrgName) {
      toast.error("Organization Name is required to establish clinical node identity.");
      throw new Error("Missing organization name");
    }
    if (trimmedOrgName.length < 3) {
      toast.error("Compliance restriction: Organization Name must be at least 3 characters long.");
      throw new Error("Organization name too short");
    }
    if (trimmedOrgName.length > 120) {
      toast.error("Compliance restriction: Organization Name must be under 120 characters to comply with Firestore database limits.");
      throw new Error("Organization name too long");
    }

    // 3. Password Compliance Checks
    if (!pass) {
      toast.error("A secure terminal passkey is required.");
      throw new Error("Missing password");
    }
    if (pass.length < 6) {
      toast.error("Compliance restriction: A secure terminal passkey must be at least 6 characters in length.");
      throw new Error("Password too short");
    }
    const hasLetter = /[a-zA-Z]/.test(pass);
    const hasNumber = /[0-9]/.test(pass);
    if (!hasLetter || !hasNumber) {
      toast.error("Compliance rejection: For security registry compliance, your terminal passkey must contain both letters and numbers.");
      throw new Error("Password complexity not met");
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
      const user = result.user;
      const emailId = trimmedEmail.toLowerCase();

      await updateProfile(user, { displayName: trimmedOrgName });
      
      // Create profile
      await setDoc(doc(db, "users", emailId), {
        uid: user.uid,
        email: emailId,
        displayName: trimmedOrgName,
        organizationName: trimmedOrgName,
        role: "pharmacist",
        status: "pending",
        createdAt: serverTimestamp()
      });

      await sendEmailVerification(user);
      toast.success("Verification email sent. Please check your inbox.");
      return user;
    } catch (error: any) {
      console.error("Signup error in useAuth:", error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error("Compliance error: An active node is already registered with this email address.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Compliance rejection: Firebase authentication rejected this email format. Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        toast.error("Compliance rejection: Reconsider passkey complexity. Choose a stronger passkey (at least 6 characters with letters and numbers).");
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error("System configuration error: Safe signup is temporarily disabled by network or administrator policies.");
      } else if (error.message && error.message.includes("permission-denied")) {
        toast.error("Security rule compliance violation: Permission Denied. Please ensure your Organization Name matches character/length requirements.");
      } else {
        toast.error(`Registration Failed: ${error.message || "Unknown validation error"}`);
      }
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
