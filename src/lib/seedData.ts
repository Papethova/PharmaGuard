
import { db } from "./firebase";
import { collection, doc, writeBatch, serverTimestamp, getDoc } from "firebase/firestore";

export const seedChandlerData = async (userEmail: string) => {
  const emailId = userEmail.toLowerCase();
  const userRef = doc(db, "users", emailId);
  const substancesRef = collection(db, "users", emailId, "substances");
  const staffRef = collection(db, "users", emailId, "staff");

  const batch = writeBatch(db);

  // 1. Update Profile
  batch.set(userRef, {
    organizationName: "Chandler Rx",
    displayName: "Chandler Rx Admin",
    status: "active",
    role: "pharmacist",
    updatedAt: serverTimestamp()
  }, { merge: true });

  // 2. Add Staff
  const staff = [
    { id: "staff-1", name: "Dr. Robert Chandler" },
    { id: "staff-2", name: "Sarah Miller, CPhT" }
  ];
  staff.forEach(s => {
    batch.set(doc(staffRef, s.id), { name: s.name });
  });

  // 3. Add Medications with different NDCs
  const medications = [
    {
      id: "oxy-30-1",
      name: "Oxycodone 30mg",
      schedule: "C-II",
      ndc: "00406-0552-01",
      currentStock: 100,
      unit: "tablets",
      minThreshold: 50,
      packageSize: "100",
      strength: "30mg"
    },
    {
      id: "oxy-30-2",
      name: "Oxycodone 30mg",
      schedule: "C-II",
      ndc: "68308-0145-01",
      currentStock: 45,
      unit: "tablets",
      minThreshold: 20,
      packageSize: "100",
      strength: "30mg"
    },
    {
      id: "hydro-10-1",
      name: "Hydrocodone/APAP 10/325",
      schedule: "C-II",
      ndc: "00603-3888-21",
      currentStock: 250,
      unit: "tablets",
      minThreshold: 100,
      packageSize: "500",
      strength: "10/325mg"
    },
    {
      id: "hydro-10-2",
      name: "Hydrocodone/APAP 10/325",
      schedule: "C-II",
      ndc: "65162-0527-11",
      currentStock: 80,
      unit: "tablets",
      minThreshold: 50,
      packageSize: "100",
      strength: "10/325mg"
    },
    {
      id: "alpraz-2",
      name: "Alprazolam 2mg",
      schedule: "C-IV",
      ndc: "00093-3113-05",
      currentStock: 120,
      unit: "tablets",
      minThreshold: 30,
      packageSize: "100",
      strength: "2mg"
    }
  ];

  medications.forEach(m => {
    batch.set(doc(substancesRef, m.id), {
      ...m,
      lastUpdated: serverTimestamp()
    });
  });

  await batch.commit();
  return true;
};
