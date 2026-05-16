import { useState, useEffect } from "react";
import { doc, getDocFromServer } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useAppInitialization(timeoutMs = 10000) {
  const [bootTimeout, setBootTimeout] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setBootTimeout(true);
    }, timeoutMs);

    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        // If we reach here, we are "connected" enough
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
           console.error("Please check your Firebase configuration.");
        }
      } finally {
        setIsInitializing(false);
        clearTimeout(timer);
      }
    };

    testConnection();

    return () => clearTimeout(timer);
  }, [timeoutMs]);

  return { bootTimeout, isInitializing };
}
