export type Schedule = 'C-II' | 'C-III' | 'C-IV' | 'C-V';

export interface Substance {
  id: string;
  name: string;
  strength: string;
  schedule: Schedule;
  ndc: string;
  currentStock: number;
  unit: string;
  packageSize: number;
  minThreshold: number;
  lastUpdated: any; // Firestore Timestamp
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUST' | 'VERIFY';

export interface Transaction {
  id: string;
  substanceId: string;
  substanceName: string;
  strength: string;
  ndc: string;
  type: TransactionType;
  quantity: number;
  previousStock: number;
  newStock: number;
  performedBy: string;
  performedByName: string;
  performedByTitle?: string;
  timestamp: any; // Firestore Timestamp
  reason: string;
  referenceNumber?: string;
  signature?: string;
  photo?: string;
  witnessId?: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'pharmacist' | 'technician' | 'admin';
  licenseNumber?: string;
  organizationName?: string;
  status: 'active' | 'suspended' | 'pending';
  isPhotoRequirementEnabled?: boolean;
  isSignatureRequirementEnabled?: boolean;
  isAlertsEnabled?: boolean;
  reconFilters?: string[];
  docId?: string; // Track exact document key in Firestore
  createdAt?: any;
  updatedAt?: any;
}
