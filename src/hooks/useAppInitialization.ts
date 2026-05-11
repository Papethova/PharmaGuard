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
        // safety race to prevent hang
        const connectionTest = getDocFromServer(doc(db, 'test', 'connection'));
        await Promise.race([
          connectionTest,
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
      } catch (error) {
        console.warn("Connection test non-critical failure:", error);
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
