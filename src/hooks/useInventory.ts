import { useState, useEffect, useMemo } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  writeBatch,
  getDocs
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { Substance, Transaction, UserProfile } from "../types";
import { handleFirestoreError, OperationType } from "../lib/errorHandlers";
import { toast } from "sonner";

export function useInventory(userEmail: string | null) {
  const [inventory, setInventory] = useState<Substance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [staff, setStaff] = useState<{id: string, name: string, title?: string}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userEmail) {
      setInventory([]);
      setTransactions([]);
      setStaff([]);
      setLoading(false);
      return;
    }

    const emailId = userEmail.toLowerCase();
    setLoading(true);

    const unsubSubstances = onSnapshot(
      query(collection(db, "users", emailId, "substances"), orderBy("name")),
      (snap) => {
        setInventory(snap.docs.map(d => ({ ...d.data(), id: d.id } as Substance)));
        setLoading(false);
      },
      (err) => {
        console.error(`Inventory substances fetch error:`, err);
        setLoading(false);
      }
    );

    const unsubTransactions = onSnapshot(
      query(collection(db, "users", emailId, "transactions"), orderBy("timestamp", "desc")),
      (snap) => {
        setTransactions(snap.docs.map(d => ({ ...d.data(), id: d.id } as Transaction)));
      },
      (err) => console.error(`Inventory transactions fetch error:`, err)
    );

    const unsubStaff = onSnapshot(
      query(collection(db, "users", emailId, "staff"), orderBy("name")),
      (snap) => {
        setStaff(snap.docs.map(d => ({ ...d.data(), id: d.id } as any)));
      },
      (err) => console.error(`Inventory staff fetch error:`, err)
    );

    return () => {
      unsubSubstances();
      unsubTransactions();
      unsubStaff();
    };
  }, [userEmail]);

  const addTransaction = async (transaction: Omit<Transaction, "id" | "timestamp">) => {
    if (!userEmail) return;
    const emailId = userEmail.toLowerCase();
    
    try {
      const batch = writeBatch(db);
      
      // Add transaction doc
      const transRef = doc(collection(db, "users", emailId, "transactions"));
      batch.set(transRef, {
        ...transaction,
        timestamp: serverTimestamp()
      });

      // Update substance stock
      const substanceRef = doc(db, "users", emailId, "substances", transaction.substanceId);
      batch.update(substanceRef, {
        currentStock: transaction.newStock,
        lastUpdated: serverTimestamp()
      });

      await batch.commit();
      toast.success("Registry Record Secured");
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${emailId}/transactions`);
    }
  };

  const addSubstance = async (substance: Omit<Substance, "id" | "lastUpdated" | "currentStock">) => {
    if (!userEmail) return;
    const emailId = userEmail.toLowerCase();
    try {
      const docRef = await addDoc(collection(db, "users", emailId, "substances"), {
        ...substance,
        lastUpdated: serverTimestamp()
      });
      toast.success("New Catalog Entry Verified");
      return docRef.id;
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${emailId}/substances`);
    }
  };

  return {
    inventory,
    transactions,
    staff,
    loading,
    addTransaction,
    addSubstance
  };
}
