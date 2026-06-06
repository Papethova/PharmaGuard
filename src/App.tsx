/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useMemo, useCallback, FormEvent, Fragment } from "react";
import { 
  History,
  Clock,
  Plus,
  PlusCircle,
  AlertTriangle, 
  X,
  Pill,
  ArrowDown,
  ArrowRight,
  RefreshCcw,
  Users,
  UserPlus,
  Edit,
  Trash2,
  LogOut,
  Folder,
  Check,
  Settings,
  Shield,
  Search,
  AlertCircle,
  Camera,
  PenTool,
  Lock,
  Ghost,
  Database,
  Eye,
  EyeOff,
  Mail,
  Clipboard,
  ClipboardCheck,
  Printer,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { createPortal } from "react-dom";
import firebaseConfig from "../firebase-applet-config.json";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Substance, Transaction, Schedule, UserProfile, TransactionType } from "./types";
import { MASTER_ADMIN_EMAIL, SCHEDULES, APP_VERSION } from "./lib/constants";
import SignatureCanvas from "react-signature-canvas";
import { trimSignatureCanvas } from "./lib/signatureUtils";
import { ChunkedBatch } from "./lib/chunkedBatch";
import { 
  auth, 
  db, 
  googleProvider, 
  signInWithPopup, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile
} from "./lib/firebase";
import { 
  onAuthStateChanged, 
  User,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  serverTimestamp, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  writeBatch, 
  doc, 
  setDoc, 
  addDoc,
  getDocFromServer,
  updateDoc,
  deleteDoc,
  limit,
  where,
  initializeFirestore,
  memoryLocalCache
} from "firebase/firestore";


const PharmaLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
      <svg 
        viewBox="-3 -3 30 30" 
        className="h-[120%] w-[120%] overflow-visible"
      >
        {/* 1. Outermost white outline for the blue border */}
        <path 
          d="M12 24C12 24 23 19.5 23 12V5.5C23 5.5 19.5 3 12 1C4.5 3 1 5.5 1 5.5V12C1 19.5 12 24 12 24Z" 
          fill="none"
          stroke="white"
          strokeWidth="5.5"
          strokeLinejoin="round"
        />
        {/* 2. Thicker blue border around the shield */}
        <path 
          d="M12 24C12 24 23 19.5 23 12V5.5C23 5.5 19.5 3 12 1C4.5 3 1 5.5 1 5.5V12C1 19.5 12 24 12 24Z" 
          fill="none"
          stroke="var(--color-brand-blue, #1e68cf)"
          strokeWidth="4.5"
          strokeLinejoin="round"
        />
        {/* 3. Yellow shield fill with its own white outline */}
        <path 
          d="M12 24C12 24 23 19.5 23 12V5.5C23 5.5 19.5 3 12 1C4.5 3 1 5.5 1 5.5V12C1 19.5 12 24 12 24Z" 
          fill="var(--color-brand-yellow, #ffd700)"
          stroke="white"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="relative z-10 flex items-center justify-center h-full w-full">
      <Pill 
        className="h-[55%] w-[55%] drop-shadow-sm" 
        fill="var(--color-brand-blue, #1e68cf)" 
        color="white" 
        strokeWidth={1.2} 
      />
    </div>
  </div>
);

const OneSidedArrowLeftRight = ({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    {/* Top left-pointing arrow: shaft and top-half of the arrowhead */}
    <path d="M21 10H3" />
    <path d="M8 5L3 10" />

    {/* Bottom right-pointing arrow: shaft and bottom-half of the arrowhead */}
    <path d="M3 14h18" />
    <path d="M21 14L16 19" />
  </svg>
);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

const escapeEmail = (text: string | null | undefined) => {
  if (!text) return "";
  return typeof text === 'string' ? text.replace("@", "\u200B@\u200B") : text;
};

const getIdentityString = (profile: UserProfile | null, userEmail?: string | null) => {
  const identity = profile?.organizationName || profile?.displayName || userEmail || "Identity Unverified";
  return escapeEmail(identity);
};

const tableHeadClass = "font-semibold text-sm tracking-wider text-brand-blue text-center";

const TransactionBadge = ({ type, size = "md" }: { type: TransactionType, size?: "sm" | "md" }) => {
  const isSm = size === "sm";
  const iconSize = isSm ? "h-5 w-5" : "h-8 w-8";
  
  return (
    <div className="relative flex items-center justify-center px-3 py-1 group overflow-hidden rounded-lg min-w-[100px] h-9">
      {/* Watermark Icon */}
      <div className="absolute inset-0 flex items-center justify-center translate-y-1 opacity-100 transition-opacity pointer-events-none">
        {type === 'IN' && <Plus className={`${iconSize} text-brand-yellow`} strokeWidth={2} />}
        {type === 'OUT' && <ArrowDown className={`${iconSize} text-brand-yellow`} strokeWidth={2} />}
        {type === 'ADJUST' && <RefreshCcw className={`${iconSize} text-brand-yellow`} strokeWidth={2} />}
        {type === 'VERIFY' && <Check className={`${iconSize} text-brand-yellow`} strokeWidth={2} />}
      </div>
      
      {/* Label Text */}
      <span className="relative z-10 text-[10px] font-black text-brand-blue/50 uppercase tracking-widest whitespace-nowrap">
        {type === 'IN' ? 'ADDED' : 
         type === 'OUT' ? 'DISPENSED' : 
         type === 'ADJUST' ? 'ADJUSTED' : 
         'VERIFIED'}
      </span>
    </div>
  );
};

const formatDateTime = (timestamp: any) => {
  if (!timestamp) return "-";
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const dateStr = date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: '2-digit' });
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).replace(/\s/g, '');
  return `${dateStr} ${timeStr}`;
};

const formatRefForDisplay = (ref: string | undefined) => {
  if (!ref || !ref.startsWith("VER-")) return ref;
  
  // Check if it's in the old format: VER-YYYYMMDD-HHMM
  const oldFormatMatch = ref.match(/^VER-(\d{4})(\d{2})(\d{2})-(.*)$/);
  if (oldFormatMatch) {
    const [_, year, month, day, suffix] = oldFormatMatch;
    const shortYear = year.slice(-2);
    return `VER-${month}${day}${shortYear}-${suffix}`;
  }
  return ref;
};

const getTimestampMs = (ts: any): number => {
  if (!ts) return Date.now();
  if (typeof ts.toDate === "function") {
    return ts.toDate().getTime();
  }
  if (ts.seconds !== undefined) {
    return ts.seconds * 1000 + (ts.nanoseconds || 0) / 1000000;
  }
  if (ts instanceof Date) {
    return ts.getTime();
  }
  return new Date(ts).getTime();
};

const parseCompoundStrength = (str: string): { first: number; second: number } => {
  if (!str) return { first: 0, second: 0 };
  const compoundMatch = str.match(/(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)/);
  if (compoundMatch) {
    return {
      first: parseFloat(compoundMatch[1]),
      second: parseFloat(compoundMatch[2])
    };
  }
  const singleMatch = str.match(/(\d+(?:\.\d+)?)/);
  return {
    first: singleMatch ? parseFloat(singleMatch[1]) : 0,
    second: 0
  };
};

const compareSubstances = (a: any, b: any): number => {
  const aName = a.name || a.substanceName || "";
  const bName = b.name || b.substanceName || "";
  const nameCompare = aName.localeCompare(bName, undefined, { sensitivity: "base", numeric: true });
  if (nameCompare !== 0) return nameCompare;

  const aStrength = parseCompoundStrength(a.strength || "");
  const bStrength = parseCompoundStrength(b.strength || "");

  if (aStrength.second !== bStrength.second) {
    return aStrength.second - bStrength.second;
  }
  if (aStrength.first !== bStrength.first) {
    return aStrength.first - bStrength.first;
  }

  const aPkg = a.packageSize || 0;
  const bPkg = b.packageSize || 0;
  if (aPkg !== bPkg) return aPkg - bPkg;

  const aStock = a.currentStock || 0;
  const bStock = b.currentStock || 0;
  return aStock - bStock;
};

// Sync Heartbeat: 2026-05-18T16:45:00
export default function App() {
  // Emergency catch-all to prevent white screens
  const [renderError, setRenderError] = useState<string | null>(null);

  if (renderError) {
    return (
      <div className="min-h-screen bg-brand-light-grey flex items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-destructive/20 max-w-md space-y-4">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-black text-brand-dark-grey uppercase">Component Level Fault</h2>
          <p className="text-brand-grey text-sm font-medium">{renderError}</p>
          <Button onClick={() => window.location.reload()} className="w-full bg-brand-blue text-brand-yellow font-bold py-4 rounded-xl">Force System Reset</Button>
        </div>
      </div>
    );
  }


  // Rendered natively via React Portal on document.body to stay above overlays

    const sigPad = useRef<SignatureCanvas>(null);
    const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isVerificationBypassed, setIsVerificationBypassed] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setIsVerificationBypassed(localStorage.getItem(`bypass_verification_${user.uid}`) === "true");
    } else {
      setIsVerificationBypassed(false);
    }
  }, [user]);

  const [isAuthReady, setIsAuthReady] = useState(false);
  const [inventory, setInventory] = useState<Substance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLogOpen, setIsLogOpen] = useState(false);
  
  // Reset form when dialog closes or on initialization
  useEffect(() => {
    if (!isLogOpen) {
      resetForm();
    }
  }, [isLogOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isActionPending, setIsActionPending] = useState(false);
  const [activeSchedule, setActiveSchedule] = useState("ALL");
  const [selectedSubstanceDetail, setSelectedSubstanceDetail] = useState<Substance | null>(null);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [historyMedicationFilter, setHistoryMedicationFilter] = useState("");
  const [historyMedicationSearch, setHistoryMedicationSearch] = useState("");
  const [isHistorySearchFocused, setIsHistorySearchFocused] = useState(false);
  const [historyTypeFilter, setHistoryTypeFilter] = useState<string>("All");

  // Database Sync limits for speed and low-reads
  const [syncLimit, setSyncLimit] = useState<number>(30);
  const isIncrementingSyncLimitRef = useRef(false);

  // Medication-specific transactions listener state for high-performance and deep history
  const [substanceTransactions, setSubstanceTransactions] = useState<Transaction[]>([]);
  const [substanceHistoryLimit, setSubstanceHistoryLimit] = useState<number>(30);
  const isIncrementingSubstanceLimitRef = useRef(false);
  const [isUsingFallback, setIsUsingFallback] = useState<boolean>(false);

  // Stub variables for hidden pagination compatibility
  const pageSize = 15;
  const currentPage = 1;
  const setCurrentPage = (_p: any) => {};
  const setPageSize = (_s: any) => {};

  // Form state
  const [isNewMedSearchFocused, setIsNewMedSearchFocused] = useState(false);
  const [isSubstanceSearchFocused, setIsSubstanceSearchFocused] = useState(false);
  const [selectedSubstance, setSelectedSubstance] = useState("");
  const [substanceSearch, setSubstanceSearch] = useState("");
  const [transactionType, setTransactionType] = useState<"IN" | "OUT" | "ADJUST" | "VERIFY">("OUT");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [useSignatureFallback, setUseSignatureFallback] = useState(false);
  const [cameraPermissionError, setCameraPermissionError] = useState(false);
  const [users, setUsers] = useState<{id: string, name: string, title?: string}[]>([]);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);

  // Lock background scroll when user management is open
  useEffect(() => {
    if (isUserManagementOpen) {
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      document.documentElement.style.position = "fixed";
      document.documentElement.style.width = "100%";
      document.documentElement.style.height = "100%";
      document.documentElement.style.overflow = "hidden";
      document.documentElement.style.touchAction = "none";
    } else {
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width = "";
      document.documentElement.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.touchAction = "";
    }
    return () => {
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      document.body.style.overflow = "";
      document.body.style.touchAction = "";
      document.documentElement.style.position = "";
      document.documentElement.style.width = "";
      document.documentElement.style.height = "";
      document.documentElement.style.overflow = "";
      document.documentElement.style.touchAction = "";
    };
  }, [isUserManagementOpen]);

  // Prefill verify count with current inventory count
  useEffect(() => {
    if (isLogOpen && transactionType === "VERIFY" && !quantity) {
      const activeSub = selectedSubstanceDetail || inventory.find(s => s.id === selectedSubstance);
      if (activeSub) {
        setQuantity(activeSub.currentStock.toString());
      }
    }
  }, [transactionType, selectedSubstance, selectedSubstanceDetail, isLogOpen, inventory, quantity]);
  const [isEditMinThresholdOpen, setIsEditMinThresholdOpen] = useState(false);
  const [isEditMedDetailsOpen, setIsEditMedDetailsOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Substance | null>(null);
  const [newUserName, setNewUserName] = useState("");
  const [newUserTitle, setNewUserTitle] = useState("");
  const [editingUser, setEditingUser] = useState<{id: string, name: string, title?: string} | null>(null);
  const [userToDeleteConfirm, setUserToDeleteConfirm] = useState<{id: string, name: string} | null>(null);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  const [isNodeMigrationOpen, setIsNodeMigrationOpen] = useState(false);
  const [migrationSourceNode, setMigrationSourceNode] = useState("");
  const [migrationDestNode, setMigrationDestNode] = useState("");
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationSourceSearch, setMigrationSourceSearch] = useState("");
  const [isSourceSearchFocused, setIsSourceSearchFocused] = useState(false);
  const [migrationDestSearch, setMigrationDestSearch] = useState("");
  const [isDestSearchFocused, setIsDestSearchFocused] = useState(false);

  useEffect(() => {
    if (!isNodeMigrationOpen) {
      setMigrationSourceNode("");
      setMigrationDestNode("");
      setMigrationSourceSearch("");
      setMigrationDestSearch("");
    }
  }, [isNodeMigrationOpen]);

  // Reconciliation states with local caching
  const [isReconOpen, setIsReconOpen] = useState(() => {
    return localStorage.getItem("recon_isReconOpen") === "true";
  });
  const [reconScheduleFilter, setReconScheduleFilter] = useState<"ALL" | "C-II" | "C-III/C-IV/C-V">(() => {
    return (localStorage.getItem("recon_reconScheduleFilter") as "ALL" | "C-II" | "C-III/C-IV/C-V") || "C-II";
  });

  const [reconCounts, setReconCounts] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("recon_reconCounts");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [reconTimestamps, setReconTimestamps] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("recon_reconTimestamps");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [reconReasons, setReconReasons] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem("recon_reconReasons");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [reconUser, setReconUser] = useState(() => {
    return localStorage.getItem("recon_reconUser") || "";
  });
  const [reconWitness, setReconWitness] = useState(() => {
    return localStorage.getItem("recon_reconWitness") || "";
  });
  const [isReconSubmitting, setIsReconSubmitting] = useState(false);
  const [reconShowPreview, setReconShowPreview] = useState(false);
  const reconCanvasRef = useRef<any>(null);
  const [reconSigData, setReconSigData] = useState<string | null>(() => {
    return localStorage.getItem("recon_reconSigData") || null;
  });
  const picCanvasRef = useRef<any>(null);
  const [picSigData, setPicSigData] = useState<string | null>(() => {
    return localStorage.getItem("recon_picSigData") || null;
  });

  // Added history/selection states
  const [reconViewMode, setReconViewMode] = useState<"form" | "history">("form");
  const [selectedHistoricalReport, setSelectedHistoricalReport] = useState<any>(null);
  const [historicalReports, setHistoricalReports] = useState<any[]>([]);

  // Synchronize reconciliation states to local storage
  useEffect(() => {
    localStorage.setItem("recon_isReconOpen", String(isReconOpen));
  }, [isReconOpen]);

  useEffect(() => {
    localStorage.setItem("recon_reconScheduleFilter", reconScheduleFilter);
  }, [reconScheduleFilter]);

  useEffect(() => {
    localStorage.setItem("recon_reconCounts", JSON.stringify(reconCounts));
  }, [reconCounts]);

  useEffect(() => {
    localStorage.setItem("recon_reconTimestamps", JSON.stringify(reconTimestamps));
  }, [reconTimestamps]);

  useEffect(() => {
    localStorage.setItem("recon_reconReasons", JSON.stringify(reconReasons));
  }, [reconReasons]);

  useEffect(() => {
    localStorage.setItem("recon_reconUser", reconUser);
  }, [reconUser]);

  useEffect(() => {
    localStorage.setItem("recon_reconWitness", reconWitness);
  }, [reconWitness]);

  useEffect(() => {
    if (reconSigData) {
      localStorage.setItem("recon_reconSigData", reconSigData);
    } else {
      localStorage.removeItem("recon_reconSigData");
    }
  }, [reconSigData]);

  useEffect(() => {
    if (picSigData) {
      localStorage.setItem("recon_picSigData", picSigData);
    } else {
      localStorage.removeItem("recon_picSigData");
    }
  }, [picSigData]);

  // Listen to browser storage events to synchronize reconciliation states in real-time across open tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith("recon_")) {
        const val = e.newValue;
        switch (e.key) {
          case "recon_isReconOpen":
            setIsReconOpen(val === "true");
            break;
          case "recon_reconScheduleFilter":
            setReconScheduleFilter((val as any) || "C-II");
            break;
          case "recon_reconCounts":
            try { setReconCounts(val ? JSON.parse(val) : {}); } catch {}
            break;
          case "recon_reconTimestamps":
            try { setReconTimestamps(val ? JSON.parse(val) : {}); } catch {}
            break;
          case "recon_reconReasons":
            try { setReconReasons(val ? JSON.parse(val) : {}); } catch {}
            break;
          case "recon_reconUser":
            setReconUser(val || "");
            break;
          case "recon_reconWitness":
            setReconWitness(val || "");
            break;
          case "recon_reconSigData":
            setReconSigData(val || null);
            break;
          case "recon_picSigData":
            setPicSigData(val || null);
            break;
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const reconRef = useMemo(() => {
    const today = new Date();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const yy = String(today.getFullYear()).slice(-2);
    let suffix = "2345";
    if (reconScheduleFilter === "C-II") {
      suffix = "2";
    } else if (reconScheduleFilter === "C-III/C-IV/C-V") {
      suffix = "345";
    }
    const baseRef = `REC-${mm}${dd}${yy}C${suffix}`;

    const existingNums = new Set<string>();
    historicalReports.forEach(r => {
      if (r.reportNumber) existingNums.add(r.reportNumber);
    });
    transactions.forEach(t => {
      if (t.referenceNumber && (t.referenceNumber.startsWith("REC-") || t.referenceNumber.startsWith("RECON-"))) {
        existingNums.add(t.referenceNumber);
      }
    });

    let maxIndex = 0;
    existingNums.forEach(num => {
      const sNum = num.trim();
      if (sNum === baseRef) {
        if (maxIndex < 1) maxIndex = 1;
      } else if (sNum.startsWith(baseRef + "-")) {
        const parts = sNum.split("-");
        const lastPart = parts[parts.length - 1];
        const idx = parseInt(lastPart, 10);
        if (!isNaN(idx) && idx > maxIndex) {
          maxIndex = idx;
        }
      }
    });

    const nextIndex = maxIndex + 1;
    return `${baseRef}-${nextIndex}`;
  }, [reconScheduleFilter, historicalReports, transactions]);

  const getReportTitle = () => {
    const filter = selectedHistoricalReport ? selectedHistoricalReport.scheduleFilter : reconScheduleFilter;
    if (filter === "C-II") {
      return "Controlled Substance Reconciliation Report For Schedule C-II";
    } else if (filter === "C-III/C-IV/C-V") {
      return "Controlled Substance Reconciliation Report For Schedules C-III/C-IV/C-V";
    } else {
      return "Controlled Substance Reconciliation Report For Schedules C-II/C-III/C-IV/C-V";
    }
  };

  useEffect(() => {
    if (isReconOpen) {
      setTimeout(() => {
        if (reconSigData && reconCanvasRef.current) {
          try {
            reconCanvasRef.current.fromDataURL(reconSigData);
          } catch (e) {
            console.warn("Failed to load recon signature:", e);
          }
        } else {
          reconCanvasRef.current?.clear();
        }

        if (picSigData && picCanvasRef.current) {
          try {
            picCanvasRef.current.fromDataURL(picSigData);
          } catch (e) {
            console.warn("Failed to load PIC signature:", e);
          }
        } else {
          picCanvasRef.current?.clear();
        }
      }, 150);
    }
  }, [isReconOpen, reconSigData, picSigData]);

  const lastReport = useMemo(() => {
    const reconTxs = transactions.filter(t => {
      if (!t.referenceNumber) return false;
      if (!(t.referenceNumber.startsWith("REC-") || t.referenceNumber.startsWith("RECON-"))) return false;
      if (t.referenceNumber === reconRef) return false;

      // Filter based on reconScheduleFilter if not ALL
      if (reconScheduleFilter !== "ALL") {
        const sub = inventory.find(s => s.id === t.substanceId);
        if (!sub) return false;
        if (reconScheduleFilter === "C-II") {
          return sub.schedule === "C-II";
        }
        if (reconScheduleFilter === "C-III/C-IV/C-V") {
          return sub.schedule === "C-III" || sub.schedule === "C-IV" || sub.schedule === "C-V";
        }
      }
      return true;
    });

    if (reconTxs.length === 0) {
      return { date: "N/A", counts: {} as Record<string, number>, ref: "N/A", timestampMs: 0 };
    }

    const sortedReconTxs = [...reconTxs].sort((a, b) => {
      const aTime = getTimestampMs(a.timestamp);
      const bTime = getTimestampMs(b.timestamp);
      return bTime - aTime;
    });

    const latestRef = sortedReconTxs[0].referenceNumber || "";

    let lastDate = "N/A";
    let lastReportTimestampMs = 0;

    const latestRefTxs = reconTxs.filter(t => t.referenceNumber === latestRef);
    latestRefTxs.forEach(t => {
      const ms = getTimestampMs(t.timestamp);
      if (ms > lastReportTimestampMs) {
        lastReportTimestampMs = ms;
      }
    });

    const firstTxWithLatestRef = sortedReconTxs.find(t => t.referenceNumber === latestRef);
    if (firstTxWithLatestRef?.timestamp) {
      const ts = firstTxWithLatestRef.timestamp;
      let d: Date;
      if (typeof ts.toDate === "function") {
        d = ts.toDate();
      } else if (ts instanceof Date) {
        d = ts;
      } else {
        d = new Date(ts);
      }
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const yy = String(d.getFullYear()).slice(-2);
      lastDate = `${mm}/${dd}/${yy}`;
    }

    const counts: Record<string, number> = {};
    sortedReconTxs.filter(t => t.referenceNumber === latestRef).forEach(t => {
      counts[t.substanceId] = t.newStock;
    });

    return { date: lastDate, counts, ref: latestRef, timestampMs: lastReportTimestampMs };
  }, [transactions, reconRef, inventory, reconScheduleFilter]);

  const getSubstanceHistoryMetrics = useCallback((subId: string) => {
    const subTxs = transactions.filter(t => t.substanceId === subId);
    
    let lastClosingCount = 0;
    let prevReportDate = "N/A";
    let lastReportTxTime = 0;
    
    if (lastReport.ref !== "N/A") {
      const prevReconTx = subTxs.find(t => t.referenceNumber === lastReport.ref);
      if (prevReconTx) {
        lastClosingCount = prevReconTx.newStock;
        lastReportTxTime = getTimestampMs(prevReconTx.timestamp);
        prevReportDate = lastReport.date;
      } else {
        lastClosingCount = 0;
        lastReportTxTime = 0;
        prevReportDate = lastReport.date;
      }
    } else {
      if (subTxs.length > 0) {
        const sortedSubTxs = [...subTxs].sort((a, b) => {
          return getTimestampMs(a.timestamp) - getTimestampMs(b.timestamp);
        });
        lastClosingCount = sortedSubTxs[0].previousStock;
        const oldestTs = sortedSubTxs[0].timestamp;
        if (oldestTs) {
          if (typeof oldestTs.toDate === "function") {
            const d = oldestTs.toDate();
            prevReportDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
          } else if (oldestTs instanceof Date) {
            prevReportDate = `${String(oldestTs.getMonth() + 1).padStart(2, '0')}/${String(oldestTs.getDate()).padStart(2, '0')}/${String(oldestTs.getFullYear()).slice(-2)}`;
          } else {
            const d = new Date(oldestTs);
            prevReportDate = `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
          }
        }
      } else {
        const currentSub = inventory.find(s => s.id === subId);
        lastClosingCount = currentSub ? currentSub.currentStock : 0;
      }
    }
    
    const periodTxs = subTxs.filter(t => {
      if (t.referenceNumber === reconRef) return false;
      if (lastReport.ref !== "N/A" && t.referenceNumber === lastReport.ref) return false;
      
      const txTime = getTimestampMs(t.timestamp);
      return txTime > lastReportTxTime;
    });
    
    let purchases = 0;
    let dispensed = 0;
    let adjustments = 0;
    
    periodTxs.forEach(t => {
      if (t.type === "IN") {
        purchases += t.quantity;
      } else if (t.type === "OUT") {
        dispensed += t.quantity;
      } else if (t.type === "ADJUST") {
        adjustments += t.quantity;
      }
    });
    
    const expected = lastClosingCount + purchases - dispensed + adjustments;
    
    return {
      lastClosingCount,
      prevReportDate,
      purchases,
      dispensed,
      adjustments,
      expected
    };
  }, [transactions, lastReport, reconRef, inventory]);

  const getLatestVerifiedCount = useCallback((subId: string) => {
    const subTxs = transactions.filter(t => 
      t.substanceId === subId && 
      t.type === "VERIFY" &&
      (!t.referenceNumber || (!t.referenceNumber.startsWith("REC-") && !t.referenceNumber.startsWith("RECON-")))
    );
    if (subTxs.length === 0) return null;
    
    const sorted = [...subTxs].sort((a, b) => {
      const aTime = getTimestampMs(a.timestamp);
      const bTime = getTimestampMs(b.timestamp);
      return bTime - aTime;
    });
    
    const latestTx = sorted[0];
    
    // Find the timestamp of the last report
    let lastReportTxTime = 0;
    if (lastReport.ref !== "N/A") {
      const prevReconTx = transactions.find(t => t.referenceNumber === lastReport.ref);
      if (prevReconTx) {
        lastReportTxTime = getTimestampMs(prevReconTx.timestamp);
      }
    }
    
    if (getTimestampMs(latestTx.timestamp) > lastReportTxTime) {
      return latestTx.quantity;
    }
    return null;
  }, [transactions, lastReport]);

  const getReconPhysicalCount = useCallback((subId: string) => {
    if (reconCounts[subId] !== undefined && reconCounts[subId] !== "") {
      return Number(reconCounts[subId]);
    }
    const verifiedNum = getLatestVerifiedCount(subId);
    if (verifiedNum !== null) {
      return verifiedNum;
    }
    return undefined;
  }, [reconCounts, getLatestVerifiedCount]);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const activeStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    // Keep video stream attached during re-renders
    if (isCameraActive && videoRef.current && activeStreamRef.current) {
      if (videoRef.current.srcObject !== activeStreamRef.current) {
        videoRef.current.srcObject = activeStreamRef.current;
        videoRef.current.play().catch(e => console.error("Video play error during sync:", e));
      }
    }
  }, [isCameraActive, isLogOpen, inventory, transactionType, selectedSubstance, quantity, selectedUser]); // Sync on any form change

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("Camera access not supported by your browser");
      return;
    }

    try {
      setIsCameraActive(true);
      setUseSignatureFallback(false);
      setCameraPermissionError(false);
      
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          } 
        });
      } catch (err) {
        console.warn("Retrying camera with basic constraints...", err);
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      activeStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Error playing video:", e));
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      let errorMsg = "Could not access camera";
      let isPermissionError = false;
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          errorMsg = "Camera permission denied. Please enable camera access in your browser settings.";
          isPermissionError = true;
          setCameraPermissionError(true);
        } else if (err.name === 'NotFoundError') {
          errorMsg = "No camera found on this device.";
        } else {
          errorMsg = `Camera error: ${err.message}`;
        }
      }

      toast.error(errorMsg, {
        description: isPermissionError ? "Click the Lock 🔒 icon in your browser address bar to allow camera access." : "Falling back to signature verification.",
        duration: 8000
      });
      
      setIsCameraActive(false);
      setUseSignatureFallback(true);
    }
  };

  const stopCamera = () => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(dataUrl);
        stopCamera();
      }
    }
  };

  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [bootTimeout, setBootTimeout] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const [editingOrgName, setEditingOrgName] = useState("");
  const [currentTab, setCurrentTab] = useState<string>("inventory");

  const isMasterAdmin = useMemo(() => {
    const email = user?.email?.toLowerCase();
    const isMaster = email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();
    if (user) {
      console.log(`Identity Check: ${email} | Master: ${isMaster}`);
    }
    return isMaster;
  }, [user]);

  // Email Auth State
  const [authMode, setAuthMode] = useState<"google" | "login" | "signup" | "forgot">("google");
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const authModeRef = useRef("google");
  useEffect(() => {
    authModeRef.current = authMode;
  }, [authMode]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordRef = useRef("");
  useEffect(() => {
    passwordRef.current = password;
  }, [password]);
  const [showPassword, setShowPassword] = useState(false);
  const [orgName, setOrgName] = useState("");
  const orgNameRef = useRef("");
  useEffect(() => {
    orgNameRef.current = orgName;
  }, [orgName]);

  // Reset fields when transitioning between authentications screens (login, signup, forgot)
  useEffect(() => {
    setEmail("");
    setPassword("");
    setOrgName("");
    setShowPassword(false);
    setResetEmailSent(false);
  }, [authMode]);

  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<UserProfile | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [nodeToReset, setNodeToReset] = useState<UserProfile | null>(null);
  const [isAlreadyRegisteredOpen, setIsAlreadyRegisteredOpen] = useState(false);
  const [isUserDoesNotExistOpen, setIsUserDoesNotExistOpen] = useState(false);

  useEffect(() => {
    setIsAlreadyRegisteredOpen(false);
    setIsUserDoesNotExistOpen(false);
  }, [authMode, email, password]);

  const checkAccountStatus = () => {
    if (userProfile?.status === 'suspended' || userProfile?.status === 'pending') {
      const isPending = userProfile.status === 'pending';
      toast.error(
        isPending 
          ? "Authority Notice: Access to this node is still pending approval. Please contact the Master Authority for terminal clearance."
          : "Administrative Notice: Your account is currently suspended. Transaction privileges have been revoked. Please contact your system administrator for assistance.",
        { duration: 6000 }
      );
      return false;
    }
    return true;
  };

  // Auto-populate reference number for adjustments
  useEffect(() => {
    if (isLogOpen && transactionType === "ADJUST" && !referenceNumber) {
      const adjTransactions = transactions.filter(t => 
        t.type === "ADJUST" && 
        t.referenceNumber && 
        t.referenceNumber.startsWith("ADJ-")
      );
      
      let nextNum = 1;
      if (adjTransactions.length > 0) {
        const numbers = adjTransactions.map(t => {
          const match = t.referenceNumber?.match(/ADJ-(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        }).filter(n => !isNaN(n));
        
        if (numbers.length > 0) {
          nextNum = Math.max(...numbers) + 1;
        }
      }
      
      setReferenceNumber(`ADJ-${nextNum.toString().padStart(3, '0')}`);
    }
  }, [isLogOpen, transactionType, transactions, referenceNumber]);

  // Sync newMed with selectedSubstance for "Add" window
  useEffect(() => {
    if (selectedSubstance) {
      const s = inventory.find(i => i.id === selectedSubstance);
      if (s) {
        setNewMed({
          name: s.name,
          strength: s.strength,
          schedule: s.schedule,
          ndc: s.ndc,
          unit: s.unit,
          packageSize: s.packageSize.toString(),
          minThreshold: s.minThreshold.toString()
        });
      }
    }
  }, [selectedSubstance, inventory]);

  // New Medication Form state
  const [newMed, setNewMed] = useState<{
    name: string;
    strength: string;
    schedule: Schedule | "";
    ndc: string;
    unit: string;
    packageSize: string;
    minThreshold: string;
  }>({
    name: "",
    strength: "",
    schedule: "",
    ndc: "",
    unit: "",
    packageSize: "",
    minThreshold: ""
  });

  // =========================================================================
  // DB WRITE OPTIMIZATION STRATEGIES (Options A, B, and C)
  // =========================================================================

  // Ref to hold the timeout id for debouncing profile writes
  const profileDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Ref to collect pending profile updates to be saved in a single batch
  const pendingProfileUpdatesRef = useRef<Partial<UserProfile>>({});

  const debouncedUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
    if (!user || !user.email) return;
    const userEmail = user.email.toLowerCase();

    // Option A: Skip redundant writes check
    const currentProfileData = userProfile || {};
    const filteredUpdates: Partial<UserProfile> = {};
    let hasActualChanges = false;

    Object.keys(updates).forEach((key) => {
      const k = key as keyof UserProfile;
      if (Array.isArray(updates[k]) && Array.isArray(currentProfileData[k])) {
        const arr1 = updates[k] as any[];
        const arr2 = currentProfileData[k] as any[];
        if (arr1.length !== arr2.length || arr1.some((v, i) => v !== arr2[i])) {
          (filteredUpdates as any)[k] = updates[k];
          hasActualChanges = true;
        }
      } else if (updates[k] !== currentProfileData[k]) {
        (filteredUpdates as any)[k] = updates[k];
        hasActualChanges = true;
      }
    });

    if (!hasActualChanges && Object.keys(pendingProfileUpdatesRef.current).length === 0) {
      console.log("Option A: Bypassed redundant profile update write.");
      return;
    }

    // Merge the actual changes into our pending updates ref
    pendingProfileUpdatesRef.current = {
      ...pendingProfileUpdatesRef.current,
      ...filteredUpdates,
    };

    // Option B: Reset the 2.5s idle timer if user continues typing or interacting
    if (profileDebounceTimeoutRef.current) {
      clearTimeout(profileDebounceTimeoutRef.current);
    }

    profileDebounceTimeoutRef.current = setTimeout(async () => {
      const finalUpdates = { ...pendingProfileUpdatesRef.current };
      if (Object.keys(finalUpdates).length === 0) return;

      console.log("Option B - Saving debounced profile updates to Firestore (2.5s Idle):", finalUpdates);
      try {
        const userDocRef = doc(db, "users", userEmail);
        await updateDoc(userDocRef, {
          ...finalUpdates,
          updatedAt: serverTimestamp()
        });
        pendingProfileUpdatesRef.current = {};
        console.log("Firestore state successfully synchronized.");
      } catch (error) {
        console.error("Debounced Firestore sync failed:", error);
        handleFirestoreError(error, OperationType.UPDATE, `users/${userEmail}`);
      }
    }, 2500); // 2.5 seconds idle time for Option B
  }, [user, userProfile]);

  useEffect(() => {
    return () => {
      if (profileDebounceTimeoutRef.current) {
        clearTimeout(profileDebounceTimeoutRef.current);
      }
    };
  }, []);

  // Auth Listener
  useEffect(() => {
    // Advanced Safety Heartbeat: Ensure we never stay on a white screen
    // If auth hasn't responded in 3 seconds, show the delay box
    const delayTimer = setTimeout(() => {
      setIsAuthReady(ready => {
        if (!ready) setBootTimeout(true);
        return ready;
      });
    }, 3000);

    // Hard Bypass: If auth hasn't responded in 6 seconds, force show the login screen
    const bypassTimer = setTimeout(() => {
      setIsAuthReady(ready => {
        if (!ready) {
          console.warn("Auth Heartbeat: Forcing auth ready state due to timeout");
          setIsInitializing(false);
          return true;
        }
        return ready;
      });
    }, 6000);

    // Connection Test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        console.error("Database connection check failed - might be in offline mode:", error);
      }
    };
    testConnection();

    let unsubProfile: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setUserProfile(null);
        if (unsubProfile) unsubProfile();
        setIsAuthReady(true);
        setIsInitializing(false);
        setEmail("");
        setPassword("");
        setOrgName("");
        return;
      }
      
      setIsInitializing(true);
      
      try {
        if (currentUser) {
          // Identity Recovery & Profile Synchronization
          const emailId = currentUser.email?.toLowerCase() || currentUser.uid;
          const userDocRef = doc(db, "users", emailId);
          
          let userDoc = null;
          let fetchFailed = false;
          try {
            userDoc = await getDoc(userDocRef);
          } catch (e: any) {
            console.warn("Initial user doc fetch failed:", e);
            fetchFailed = true;
            toast.error("Database connection issue. Retrying secure loading in the background...", {
              description: "Please check your network. Transactions will load when the connection is restored."
            });
          }

          // 1. Identity Recovery: Handle UID-based legacy records migrating to Email identifier
          if (!fetchFailed && currentUser.uid !== emailId) {
            try {
              const legacyDoc = await getDoc(doc(db, "users", currentUser.uid));
              if (legacyDoc.exists()) {
                const legacyData = legacyDoc.data() || {};
                const batch = writeBatch(db);
                
                // Write the parent profile document first
                const existingOrgName = userDoc?.exists() ? (userDoc.data()?.organizationName || "") : "";
                if (!userDoc?.exists() || !existingOrgName) {
                  batch.set(userDocRef, { 
                    ...legacyData, 
                    email: emailId,
                    migratedFromUid: currentUser.uid, 
                    updatedAt: serverTimestamp() 
                  }, { merge: true });
                }

                // Retrieve and migrate sub-collections individually with safe try-catches
                try {
                  const legacySubstances = await getDocs(collection(db, "users", currentUser.uid, "substances"));
                  legacySubstances.docs.forEach(s => {
                    batch.set(doc(db, "users", emailId, "substances", s.id), s.data(), { merge: true });
                  });
                } catch (subErr) {
                  console.warn("Could not copy legacy substances during identity unification:", subErr);
                }

                try {
                  const legacyTx = await getDocs(collection(db, "users", currentUser.uid, "transactions"));
                  legacyTx.docs.forEach(t => {
                    batch.set(doc(db, "users", emailId, "transactions", t.id), t.data(), { merge: true });
                  });
                } catch (txErr) {
                  console.warn("Could not copy legacy transactions during identity unification:", txErr);
                }

                try {
                  const legacyStaff = await getDocs(collection(db, "users", currentUser.uid, "staff"));
                  legacyStaff.docs.forEach(s => {
                    batch.set(doc(db, "users", emailId, "staff", s.id), s.data(), { merge: true });
                  });
                } catch (staffErr) {
                  console.warn("Could not copy legacy staff list during identity unification:", staffErr);
                }

                try {
                  const legacyReports = await getDocs(collection(db, "users", currentUser.uid, "reconciliation_reports"));
                  legacyReports.docs.forEach(r => {
                    batch.set(doc(db, "users", emailId, "reconciliation_reports", r.id), r.data(), { merge: true });
                  });
                } catch (repErr) {
                  console.warn("Could not copy legacy reconciliation reports during identity unification:", repErr);
                }

                await batch.commit();
                toast.success("Identity Unification Successful");
                userDoc = await getDoc(userDocRef);
              }
            } catch (e) {
              console.warn("Migration Assistant deferred:", e);
            }
          }

          // 2. Profile Creation for New Users (Skip this if we had a fetch failure to avoid overwriting or creating blank nodes)
          if (!fetchFailed) {
            if (!userDoc || !userDoc.exists()) {
              if (authModeRef.current === "signup") {
                console.log("onAuthStateChanged: Skipping auto-profile creation during signup to let handleEmailSignUp handle it definitively.");
              } else if (currentUser.providerData && currentUser.providerData.some((p: any) => p.providerId === "google.com")) {
                console.log("onAuthStateChanged: Automatically provisioning profile for new Google SSO user:", emailId);
                const isMaster = emailId === MASTER_ADMIN_EMAIL.toLowerCase();
                const defaultOrgName = currentUser.displayName || `Clinical Node (${emailId.split('@')[0]})`;
                const newProfile = {
                  uid: currentUser.uid,
                  email: emailId,
                  displayName: currentUser.displayName || emailId,
                  organizationName: defaultOrgName,
                  password: "Google SSO Identity Token",
                  role: isMaster ? "admin" : "pharmacist",
                  status: isMaster ? "active" : "pending"
                };
                await setDoc(userDocRef, newProfile, { merge: true });
                userDoc = await getDoc(userDocRef);
              } else {
                // Not in signup mode and the Firestore document is missing. Log out immediately and show unregistered message.
                console.log("No registered profile found in Firestore. Disallowing login.");
                await signOut(auth);
                setUserProfile(null);
                setUser(null);
                toast.error("Either the email or password you entered is incorrect, or an account does not exist for this email address");
                setIsUserDoesNotExistOpen(true);
                setIsInitializing(false);
                setIsAuthReady(true);
                return;
              }
            } else {
              // Self-healing database correction: if persistent record in Firestore has "Master Authority", automatically clear it
              const currentData = userDoc.data();
              if (currentData && currentData.organizationName === "Master Authority") {
                console.log(`Self-healing database correction: clearing "Master Authority" for ${emailId}`);
                await updateDoc(userDocRef, { organizationName: "" });
              }
              if (currentUser.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() && currentData?.status !== 'active') {
                // Master Admin Authority Verification
                await updateDoc(userDocRef, { status: 'active', role: 'admin' });
              }
            }
          }

          // 3. Real-time profile listener on the stable primary identifier
          let hasHadProfile = !!(userDoc && userDoc.exists());
          if (unsubProfile) unsubProfile();
          unsubProfile = onSnapshot(userDocRef, async (doc) => {
            if (doc.exists()) {
              hasHadProfile = true;
              const data = doc.data() as UserProfile;
              setUserProfile(data);
            } else {
              // Node was deleted/purged in real-time! Force log out.
              // ONLY sign out if not in the signup or initial registration phase
              if (authModeRef.current === "signup") {
                console.log("onSnapshot: Skipping auto-logout during signup mode.");
              } else if (hasHadProfile) {
                console.log(`Real-time: User profile ${emailId} no longer exists. Signing out.`);
                await signOut(auth);
                setUserProfile(null);
                setUser(null);
                toast.error("Your organizational node has been revoked or purged. Access terminated.");
              }
            }
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, `users/${emailId}`);
          });

          // Authenticated successfully and verified. Set the user state now to transition to the app view.
          setUser(currentUser);
        } else {
          setUserProfile(null);
          if (unsubProfile) unsubProfile();
          setUser(null);
        }
      } catch (error) {
        console.error("Auth state processing error:", error);
      } finally {
        // ALWAYS mark as ready even if profile loading failed
        setIsAuthReady(true);
        setIsInitializing(false);
      }
    });

    return () => {
      clearTimeout(delayTimer);
      clearTimeout(bypassTimer);
      unsubAuth();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  // Active state cleaning hook when user logging status changes
  useEffect(() => {
    if (!user) {
      setInventory([]);
      setTransactions([]);
      setUsers([]);
      setHistoricalReports([]);
      setReconCounts({});
      setReconTimestamps({});
      setReconReasons({});
    }
  }, [user]);

  // Real-time Data Listeners split to prevent redundant re-subscription reads of all collections
  // whenever any sub-limit or single sync property updates in real-time.
  useEffect(() => {
    if (!user) return;

    const emailId = user.email?.toLowerCase() || user.uid;
    const uid = user.uid;
    const substancesRef = collection(db, "users", emailId, "substances");

    const unsubSubstances = onSnapshot(substancesRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Substance));
      setInventory(items);
    }, (error) => {
      if (userProfile?.status === 'active') {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/substances`);
      } else {
        console.warn("Substances listener failed - likely pending approval:", error);
      }
    });

    return () => unsubSubstances();
  }, [user, userProfile?.status]);

  useEffect(() => {
    if (!user) return;

    const emailId = user.email?.toLowerCase() || user.uid;
    const uid = user.uid;
    const staffRef = collection(db, "users", emailId, "staff");

    const unsubStaff = onSnapshot(staffRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().name as string,
        title: doc.data().title as string
      }));
      
      items.sort((a, b) => {
        const getPriority = (title: string = "") => {
          const t = title.toUpperCase();
          if (t === "PIC") return 1;
          if (t === "RPH") return 2;
          if (t === "TECH") return 4;
          return 3; 
        };
        
        const pA = getPriority(a.title);
        const pB = getPriority(b.title);
        
        if (pA !== pB) return pA - pB;
        return a.name.localeCompare(b.name);
      });

      setUsers(items);
    }, (error) => {
      if (userProfile?.status === 'active') {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/staff`);
      } else {
        console.warn("Staff listener failed - likely pending approval:", error);
      }
    });

    return () => unsubStaff();
  }, [user, userProfile?.status]);

  useEffect(() => {
    if (!user) return;

    const emailId = user.email?.toLowerCase() || user.uid;
    const reportsRef = collection(db, "users", emailId, "reconciliation_reports");

    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setHistoricalReports(items);
    }, (error) => {
      console.warn("Reports listener failed:", error);
    });

    return () => unsubReports();
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const emailId = user.email?.toLowerCase() || user.uid;
    const uid = user.uid;
    const transactionsRef = collection(db, "users", emailId, "transactions");

    const unsubTransactions = onSnapshot(query(transactionsRef, orderBy("timestamp", "desc"), limit(syncLimit)), (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setTransactions(items);
    }, (error) => {
      if (userProfile?.status === 'active') {
        handleFirestoreError(error, OperationType.LIST, `users/${uid}/transactions`);
      } else {
        console.warn("Transactions listener failed - likely pending approval:", error);
      }
    });

    return () => unsubTransactions();
  }, [user, userProfile?.status, syncLimit]);

  // Medication-specific transactions listener for high-performance and deep historical records
  useEffect(() => {
    if (!user || !selectedSubstanceDetail) {
      setSubstanceTransactions([]);
      setSubstanceHistoryLimit(30);
      setIsUsingFallback(false);
      return;
    }

    const emailId = user.email || "";
    if (!emailId) return;

    const txRef = collection(db, "users", emailId, "transactions");
    const q = query(
      txRef,
      where("substanceId", "==", selectedSubstanceDetail.id),
      orderBy("timestamp", "desc"),
      limit(substanceHistoryLimit)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
      setSubstanceTransactions(items);
      setIsUsingFallback(false);
    }, (error) => {
      // If composite index is missing, gracefully auto-fallback to client-filtered global transactions list
      if (error.code === 'failed-precondition' || error.message?.includes('index')) {
        console.warn("Firestore index needed for Medication History. Gracefully falling back to client-filtered global transactions list:", error);
        setIsUsingFallback(true);
      } else {
        console.error("Substance transactions listener failed:", error);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [user, selectedSubstanceDetail, substanceHistoryLimit]);

  // Super Admin Listener
  useEffect(() => {
    if (!user || !isMasterAdmin) {
      setAllUserProfiles([]);
      return;
    }

    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const items = snapshot.docs.map(doc => {
        const data = doc.data();
        return { 
          ...data, 
          docId: doc.id,
          uid: data.uid || doc.id
        } as UserProfile;
      });
      setAllUserProfiles(items);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });

    return () => unsubscribe();
  }, [user]);

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    
    // Check if the application is running inside an iframe
    const isIframe = window.self !== window.top;
    if (isIframe) {
      toast.warning("Google Login Popup: If the login window hangs or fails, please open the app in a new tab using the 'Open in new tab' button at the top-right of the preview.", { duration: 8000 });
    }

    try {
      await signInWithPopup(auth, googleProvider);
      toast.success("Signed in successfully");
    } catch (error: any) {
      console.error("Google login error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        const hostname = window.location.hostname;
        toast.error(`Auth Error: Domain "${hostname}" is not authorized. Please add "${hostname}" to your Firebase project Authorized Domains list under Authentication > Settings > Authorized domains in the Firebase Console.`, { duration: 15000 });
      } else if (error.code === 'auth/popup-blocked') {
        toast.error("Login popup blocked. Please enable popups or open the app in a new tab.");
      } else {
        toast.error("Login Failed: " + error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailSignUp = async (e: FormEvent) => {
    e.preventDefault();

    // 1. Email Compliance Checks
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      toast.error("Email address is required for registration.");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error("Invalid email format. Please specify a compliant standard email (e.g., user@domain.com).");
      return;
    }
    // Firestore rules restrict characters in the User Document ID to: ^[a-zA-Z0-9_\-\.\@]+$
    const allowedIdRegex = /^[a-zA-Z0-9_\-.\@]+$/;
    if (!allowedIdRegex.test(trimmedEmail.toLowerCase())) {
      toast.error("Compliance restriction: Security rules do not permit emails containing special characters like '+' or brackets. Please use a standard email without special characters.");
      return;
    }
    if (trimmedEmail.length > 128) {
      toast.error("Compliance restriction: The email address must be less than 128 characters.");
      return;
    }

    // 2. Organization Name Compliance Checks
    const trimmedOrgName = orgName.trim();
    if (!trimmedOrgName) {
      toast.error("Organization Name is required to establish clinical node identity.");
      return;
    }
    if (trimmedOrgName.length < 3) {
      toast.error("Compliance restriction: Organization Name must be at least 3 characters long.");
      return;
    }
    if (trimmedOrgName.length > 120) {
      toast.error("Compliance restriction: Organization Name must be under 120 characters to comply with Firestore database limits.");
      return;
    }

    // 3. Password Compliance Checks
    if (!password) {
      toast.error("Compliance restriction: A secure terminal passkey is required.");
      return;
    }
    
    const passwordDeficiencies: string[] = [];
    if (password.length < 6) {
      passwordDeficiencies.push(`• Must be at least 6 characters (currently ${password.length})`);
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter) {
      passwordDeficiencies.push("• Must contain at least one letter (a-z, A-Z)");
    }
    if (!hasNumber) {
      passwordDeficiencies.push("• Must contain at least one number (0-9)");
    }

    if (passwordDeficiencies.length > 0) {
      toast.error(`Compliance Deficiencies Detected:\n${passwordDeficiencies.join("\n")}`, {
        duration: 8000
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
      const newUser = userCredential.user;
      
      const emailId = trimmedEmail.toLowerCase();
      
      // Update profile with organization name as the display name
      await updateProfile(newUser, { displayName: trimmedOrgName });
      
      // The auth listener will pick this up and create the Firestore document
      // but we force the metadata here too if needed - ALWAYS use emailId for unification
      const isMaster = emailId === MASTER_ADMIN_EMAIL.toLowerCase();
      const userDocRef = doc(db, "users", emailId);
      await setDoc(userDocRef, {
        uid: newUser.uid,
        email: emailId,
        displayName: trimmedOrgName,
        organizationName: trimmedOrgName,
        password: password,
        role: isMaster ? "admin" : "pharmacist",
        status: isMaster ? "active" : "pending"
      }, { merge: true });



      if (isMaster) {
        toast.success("Registration successful! Your terminal credentials are now live.");
      } else {
        toast.success("Registration successful! Access is pending administrative approval.");
      }
      setEmail("");
      setPassword("");
      setOrgName("");
    } catch (error: any) {
      console.error("Signup error:", error);
      if (error.code === 'auth/email-already-in-use' || error.message?.toLowerCase().includes("already") || error.message?.toLowerCase().includes("in use")) {
        const emailId = trimmedEmail.toLowerCase();
        try {
          const userDocRef = doc(db, "users", emailId);
          const userDoc = await getDocFromServer(userDocRef);
          if (!userDoc.exists()) {
            // Node was purged/deleted from Firestore, but Auth account still exists.
            // Attempt to restore/recreate it by logging in with the credentials they just submitted.
            try {
              const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, password);
              const loggedInUser = userCredential.user;
              await updateProfile(loggedInUser, { displayName: trimmedOrgName });
              
              const isMaster = emailId === MASTER_ADMIN_EMAIL.toLowerCase();
              await setDoc(userDocRef, {
                uid: loggedInUser.uid,
                email: emailId,
                displayName: trimmedOrgName,
                organizationName: trimmedOrgName,
                password: password,
                role: isMaster ? "admin" : "pharmacist",
                status: isMaster ? "active" : "pending"
              }, { merge: true });

              if (isMaster) {
                toast.success("Registration successful! Your terminal credentials are now live.");
              } else {
                toast.success("Registration successful! Access is pending administrative approval.");
              }
              setEmail("");
              setPassword("");
              setOrgName("");
              return;
            } catch (loginErr: any) {
              console.error("Failed to restore purged node via login:", loginErr);
              toast.error("An account with this email exists in authentication but has no active registry profile. Please enter the original password for this email to register and restore this node.");
              return;
            }
          }
        } catch (fsErr) {
          console.error("Error checking Firestore for purged node:", fsErr);
        }

        setIsAlreadyRegisteredOpen(true);
        toast.error("Compliance error: An active node is already registered with this email address.");
      } else if (error.code === 'auth/invalid-email') {
        toast.error("Compliance rejection: Firebase authentication rejected this email format. Please enter a valid email address.");
      } else if (error.code === 'auth/weak-password') {
        toast.error("Compliance rejection: Reconsider passkey complexity. Choose a stronger passkey (at least 6 characters with letters and numbers).");
      } else if (error.code === 'auth/operation-not-allowed') {
        toast.error("System configuration error: Safe signup is temporarily disabled by network or administrator policies.");
      } else if (error.message && error.message.toLowerCase().includes("permission-denied")) {
        toast.error("Compliance error: Registry database permission was denied. Verify that your email has a valid format and is under 128 characters, and your Organization Name meets standard character lengths.", { duration: 10000 });
      } else {
        toast.error(`Registration failed: ${error.message || "Unknown validation error"}. Please review your inputs to correct any potential data deficiencies.`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter email and password");
      return;
    }

    try {
      setIsSubmitting(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      const emailId = loggedInUser.email?.toLowerCase() || loggedInUser.uid;

      toast.success("Log in successful");
      setEmail("");
      setPassword("");
    } catch (error: any) {
      console.error("Login error:", error);
      const errCode = error.code || "";
      const errMessage = error.message || "";
      
      // Check if user exists in the Firestore database to accurately identify unregistered accounts
      const emailId = email.trim().toLowerCase();
      let exists = true;
      try {
        const userDocRef = doc(db, "users", emailId);
        const userDoc = await getDoc(userDocRef);
        exists = userDoc.exists();
      } catch (dbErr) {
        console.warn("Could not verify user existence during catch block:", dbErr);
      }

      if (!exists || errCode === 'auth/user-not-found' || errMessage.includes('user-not-found')) {
        toast.error("Either the email or password you entered is incorrect, or an account does not exist for this email address");
        setIsUserDoesNotExistOpen(true);
      } else if (errCode === 'auth/wrong-password' || errMessage.includes('wrong-password')) {
        toast.error("Either the email or password you entered is incorrect, or an account does not exist for this email address");
        setIsUserDoesNotExistOpen(true);
      } else if (errCode === 'auth/invalid-credential' || errCode === 'auth/invalid-email' || errMessage.includes('invalid-credential')) {
        toast.error("Either the email or password you entered is incorrect, or an account does not exist for this email address");
        setIsUserDoesNotExistOpen(true);
      } else {
        toast.error("Either the email or password you entered is incorrect, or an account does not exist for this email address");
        setIsUserDoesNotExistOpen(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setIsSubmitting(true);
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset link sent to your email.");
      setResetEmailSent(true);
    } catch (error: any) {
      console.error("Reset error:", error);
      toast.error("Failed to send reset link. Please check the email address.");
    } finally {
      setIsSubmitting(false);
      setEmail("");
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleNDCClick = (ndc: string) => {
    const substance = inventory.find(s => s.ndc === ndc);
    if (substance) {
      setSelectedSubstanceDetail(substance);
      setViewingTransaction(null);
    } else {
      toast.error("Medication details not found for this NDC");
    }
  };

  const handleLogTransaction = async () => {
    if (!user) return;
    if (!checkAccountStatus()) return;
    
    let medId = selectedSubstance;

    try {
      if (!selectedUser) {
        toast.error("Please select a performing user from the dropdown");
        return;
      }

      if (transactionType === "IN" && !medId) {
        if (!newMed.name || !newMed.strength || !newMed.ndc || !newMed.unit || !newMed.packageSize || !newMed.minThreshold) {
          toast.error("Please fill in all medication fields");
          return;
        }
      } else if (!medId) {
        toast.error("Please select a medication");
        return;
      }

      if (transactionType !== "VERIFY" && (!quantity || (transactionType !== "ADJUST" && Number(quantity) <= 0) || (transactionType === "ADJUST" && Number(quantity) === 0))) {
        toast.error(transactionType === "ADJUST" ? "Please enter a non-zero adjustment amount" : "Please enter a valid quantity");
        return;
      }

      if (transactionType === "VERIFY" && (quantity === "" || isNaN(Number(quantity)) || Number(quantity) < 0)) {
        toast.error("Please enter a valid non-negative physical count");
        return;
      }

      let finalRef = referenceNumber.trim();
      
      if (transactionType === "OUT") {
        // Strip any existing prefix to avoid RX-RX-
        let baseNumeric = finalRef.replace(/^RX-/, "");
        // Also strip any pre-existing refill designator like R1, R2, etc. (suffix match matching R followed by digits)
        baseNumeric = baseNumeric.replace(/R\d+$/, "");
        
        // Count existing transactions that share this exact base RX number
        const normalizedBase = baseNumeric.toLowerCase();
        const rxMatches = transactions.filter(t => {
          if (t.type !== "OUT" || !t.referenceNumber) return false;
          let ref = t.referenceNumber.trim();
          let refNum = ref.replace(/^RX-/, "");
          refNum = refNum.replace(/R\d+$/, "");
          return refNum.toLowerCase() === normalizedBase;
        });

        const currentMed = inventory.find(s => s.id === medId);
        if (rxMatches.length > 0 && currentMed) {
          const mismatch = rxMatches.find(t => {
            const tName = (t.substanceName || "").trim().toLowerCase();
            const tStrength = (t.strength || "").trim().toLowerCase();
            const cName = (currentMed.name || "").trim().toLowerCase();
            const cStrength = (currentMed.strength || "").trim().toLowerCase();
            return tName !== cName || tStrength !== cStrength;
          });

          if (mismatch) {
            toast.error(`This RX number is already registered to a different medication (${mismatch.substanceName} ${mismatch.strength})`);
            return;
          }
        }

        const N = rxMatches.length;
        if (N > 0) {
          finalRef = `RX-${baseNumeric}R${N}`;
        } else {
          finalRef = `RX-${baseNumeric}`;
        }
      } else if (transactionType === "IN") {
        const numeric = finalRef.replace(/^INV-/, "");
        finalRef = `INV-${numeric}`;
      }

      if (transactionType === "VERIFY" && !finalRef) {
        const now = new Date();
        const mm = (now.getMonth() + 1).toString().padStart(2, '0');
        const dd = now.getDate().toString().padStart(2, '0');
        const yy = now.getFullYear().toString().slice(-2);
        // Include minutes/seconds as a suffix to maintain uniqueness while preserving the requested format
        const suffix = `${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}`;
        finalRef = `VER-${mm}${dd}${yy}-${suffix}`;
      }

      if (!finalRef || (transactionType === "OUT" && finalRef === "RX-") || (transactionType === "IN" && finalRef === "INV-")) {
        toast.error(transactionType === "OUT" ? "RX number is required" : (transactionType === "IN" ? "Invoice number is required" : "Reference number is required"));
        return;
      }

      if (transactionType === "ADJUST" && !reason) {
        toast.error("Reason for adjustment is required");
        return;
      }

      const isSigRequired = userProfile?.isSignatureRequirementEnabled !== false;

      if (isSigRequired && !(isReconOpen && transactionType === "VERIFY")) {
        const pad = sigPad.current;
        if (!pad || pad.isEmpty()) {
          toast.error(transactionType === "VERIFY" ? "Signature is required to verify the physical count" : "Signature is required for compliance");
          return;
        }
      }

      const emailId = user.email?.toLowerCase() || user.uid;
      setIsSubmitting(true);
      
      const batch = writeBatch(db);
      let signature = "";
      if (isSigRequired) {
        const canvas = sigPad.current?.getCanvas();
        const trimmedCanvas = canvas ? trimSignatureCanvas(canvas) : null;
        signature = trimmedCanvas ? trimmedCanvas.toDataURL("image/png") : (canvas ? canvas.toDataURL("image/png") : "");
      }
      
      let currentMed = inventory.find(s => s.id === medId);
      let targetMedId = medId;

      if (transactionType === "IN" && !targetMedId) {
        const substancesRef = collection(db, "users", emailId, "substances");
        const newMedDoc = doc(substancesRef);
        targetMedId = newMedDoc.id;
        currentMed = { 
          id: targetMedId, 
          ...newMed, 
          packageSize: Number(newMed.packageSize), 
          minThreshold: Number(newMed.minThreshold), 
          currentStock: 0, 
          lastUpdated: serverTimestamp() 
        };
        batch.set(newMedDoc, currentMed);
      }

      if (!currentMed) throw new Error("Medication not discovered in node");

      if (isReconOpen && transactionType === "VERIFY") {
        setReconCounts(prev => ({ ...prev, [targetMedId]: quantity }));
        setReconTimestamps(prev => ({ ...prev, [targetMedId]: new Date().toISOString() }));
        toast.success("Count cached in reconciliation form.");
        setIsLogOpen(false);
        resetForm();
        setIsSubmitting(false);
        return;
      }

      const previousStock = currentMed.currentStock;
      const amount = Number(quantity);
      let newStock = previousStock;

      if (transactionType === "IN") newStock += amount;
      else if (transactionType === "OUT") newStock -= amount;
      else if (transactionType === "ADJUST") newStock += amount;

      const transactionsRef = collection(db, "users", emailId, "transactions");
      const newTransactionDoc = doc(transactionsRef);
      
      batch.set(newTransactionDoc, {
        substanceId: targetMedId,
        substanceName: currentMed.name,
        strength: currentMed.strength,
        ndc: currentMed.ndc,
        type: transactionType,
        quantity: transactionType === "VERIFY" ? Number(quantity) : amount,
        previousStock,
        newStock,
        performedBy: user.uid,
        performedByName: users.find(u => u.id === selectedUser)?.name || user.displayName || user.email || "AUTHORIZED",
        performedByTitle: users.find(u => u.id === selectedUser)?.title || "",
        timestamp: serverTimestamp(),
        reason: transactionType === "ADJUST" ? reason : (transactionType === "IN" ? "Inventory Addition" : transactionType === "OUT" ? "Dispensed" : "Verified"),
        referenceNumber: finalRef,
        signature,
        photo: ""
      });
      
      batch.update(doc(db, "users", emailId, "substances", targetMedId), {
        currentStock: newStock,
        lastUpdated: serverTimestamp()
      });

      await batch.commit();

      if (transactionType === "VERIFY") {
        setReconCounts(prev => ({ ...prev, [targetMedId]: quantity }));
      }

      toast.success("Registry Record Secured");
      setIsLogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(`System Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReconciliationSubmit = async () => {
    if (!user) return;
    const emailId = user.email?.toLowerCase() || user.uid;
    
    if (!reconUser) {
      toast.error("Please identify the Performed By user");
      return;
    }

    if (substancesToReconcile.length === 0) {
      toast.error("No active substance list found to reconcile.");
      return;
    }

    const missingCounts = substancesToReconcile.filter(
      s => getReconPhysicalCount(s.id) === undefined
    );
    if (missingCounts.length > 0) {
      toast.error(`Please provide physical counts for: ${missingCounts.map(m => m.name).join(", ")}`);
      return;
    }

    const missingReasons: string[] = [];
    substancesToReconcile.forEach(s => {
      const counted = getReconPhysicalCount(s.id) ?? 0;
      const metrics = getSubstanceHistoryMetrics(s.id);
      const variance = counted - metrics.expected;
      if (variance !== 0) {
        const reasonStr = reconReasons[s.id];
        if (!reasonStr || reasonStr.trim() === "") {
          missingReasons.push(s.name);
        }
      }
    });

    if (missingReasons.length > 0) {
      toast.error(`Reason of variance required for: ${missingReasons.join(", ")}`);
      return;
    }

    const isSigRequired = userProfile?.isSignatureRequirementEnabled !== false;

    let signature = reconSigData || "";
    if (isSigRequired && reconCanvasRef.current) {
      const canvas = reconCanvasRef.current.getCanvas ? reconCanvasRef.current.getCanvas() : reconCanvasRef.current;
      if (canvas && !reconCanvasRef.current.isEmpty()) {
        const trimmedCanvas = trimSignatureCanvas(canvas);
        if (trimmedCanvas) {
          signature = trimmedCanvas.toDataURL("image/png");
        }
      }
    }

    if (isSigRequired && !signature) {
      toast.error("Performed By signature is required.");
      return;
    }

    let picSignature = picSigData || "";
    if (isSigRequired && picCanvasRef.current) {
      const canvas = picCanvasRef.current.getCanvas ? picCanvasRef.current.getCanvas() : picCanvasRef.current;
      if (canvas && !picCanvasRef.current.isEmpty()) {
        const trimmedCanvas = trimSignatureCanvas(canvas);
        if (trimmedCanvas) {
          picSignature = trimmedCanvas.toDataURL("image/png");
        }
      }
    }

    if (isSigRequired && !picSignature) {
      toast.error("PIC signature is required.");
      return;
    }

    try {
      setIsReconSubmitting(true);
      const batch = new ChunkedBatch(db);
      const transactionsRef = collection(db, "users", emailId, "transactions");
      
      const reconPerfBy = users.find(u => u.id === reconUser);
      const performedByName = reconPerfBy?.name || user.displayName || user.email || "AUTHORIZED PHARMACIST";
      const performedByTitle = reconPerfBy?.title || "Pharmacist";
      
      const witnessUser = users.find(u => u.id === reconWitness);
      const witnessName = witnessUser?.name || "";

      const picUserObj = users.find(u => u.title?.toUpperCase() === "PIC");

      // Build items array to freeze state for the historical report
      const reportedItems = [...substancesToReconcile].sort(compareSubstances).map(s => {
        const physical = getReconPhysicalCount(s.id) ?? 0;
        const metrics = getSubstanceHistoryMetrics(s.id);
        const variance = physical - metrics.expected;
        return {
          substanceId: s.id,
          substanceName: s.name,
          strength: s.strength,
          ndc: s.ndc,
          lastClosingCount: metrics.lastClosingCount,
          prevReportDate: metrics.prevReportDate,
          purchases: metrics.purchases,
          dispensed: metrics.dispensed,
          adjustments: metrics.adjustments,
          expected: metrics.expected,
          physical: physical,
          variance: variance,
          reason: reconReasons[s.id] || ""
        };
      });

      substancesToReconcile.forEach(s => {
        const physical = getReconPhysicalCount(s.id) ?? 0;
        const metrics = getSubstanceHistoryMetrics(s.id);
        const variance = physical - metrics.expected;
        const targetMedId = s.id;

        const newTxDoc = doc(transactionsRef);
        if (variance !== 0) {
          batch.set(newTxDoc, {
            substanceId: targetMedId,
            substanceName: s.name,
            strength: s.strength,
            ndc: s.ndc,
            type: "ADJUST",
            quantity: variance,
            previousStock: metrics.expected,
            newStock: physical,
            performedBy: user.uid,
            performedByName: performedByName,
            performedByTitle: performedByTitle,
            timestamp: reconTimestamps[targetMedId] ? new Date(reconTimestamps[targetMedId]) : serverTimestamp(),
            reason: `Reconciliation Discrepancy: ${reconReasons[s.id] || "Unexplained discrepancies"}`,
            referenceNumber: reconRef,
            signature,
            witnessId: reconWitness && reconWitness !== "none" ? reconWitness : ""
          });

          batch.update(doc(db, "users", emailId, "substances", targetMedId), {
            currentStock: physical,
            lastUpdated: serverTimestamp()
          });
        } else {
          batch.set(newTxDoc, {
            substanceId: targetMedId,
            substanceName: s.name,
            strength: s.strength,
            ndc: s.ndc,
            type: "VERIFY",
            quantity: metrics.expected,
            previousStock: metrics.expected,
            newStock: metrics.expected,
            performedBy: user.uid,
            performedByName: performedByName,
            performedByTitle: performedByTitle,
            timestamp: reconTimestamps[targetMedId] ? new Date(reconTimestamps[targetMedId]) : serverTimestamp(),
            reason: "Reconciliation Audit: perfect match verified",
            referenceNumber: reconRef,
            signature,
            witnessId: reconWitness && reconWitness !== "none" ? reconWitness : ""
          });

          batch.update(doc(db, "users", emailId, "substances", targetMedId), {
            currentStock: physical,
            lastUpdated: serverTimestamp()
          });
        }
      });

      // Assemble report details payload
      const reportsRef = collection(db, "users", emailId, "reconciliation_reports");
      const reportDocRef = doc(reportsRef);
      const reportPayload = {
        reportNumber: reconRef,
        timestamp: new Date().toISOString(),
        performedByUid: user.uid,
        performedByName: performedByName,
        performedByTitle: performedByTitle,
        witnessId: reconWitness && reconWitness !== "none" ? reconWitness : "",
        witnessName: witnessName,
        scheduleFilter: reconScheduleFilter,
        items: reportedItems,
        reconSigData: signature,
        picSigData: picSignature,
        picName: picUserObj?.name || "None"
      };

      batch.set(reportDocRef, reportPayload);

      await batch.commit();
      toast.success("Reconciliation Report finalized and saved to registry logs!");
      
      // Update local states to view newly created report
      setSelectedHistoricalReport({ id: reportDocRef.id, ...reportPayload });
      setReconShowPreview(true);

      // Reset the reconciliation window inputs
      setReconCounts({});
      setReconTimestamps({});
      setReconReasons({});
      setReconUser("");
      setReconWitness("");
      setReconSigData(null);
      setPicSigData(null);
      reconCanvasRef.current?.clear();
      picCanvasRef.current?.clear();

      localStorage.removeItem("recon_reconCounts");
      localStorage.removeItem("recon_reconTimestamps");
      localStorage.removeItem("recon_reconReasons");
      localStorage.removeItem("recon_reconUser");
      localStorage.removeItem("recon_reconWitness");
      localStorage.removeItem("recon_reconSigData");
      localStorage.removeItem("recon_picSigData");
    } catch (error: any) {
      toast.error(`System Error: ${error.message}`);
    } finally {
      setIsReconSubmitting(false);
    }
  };

  const handleUpdateMinThreshold = async () => {
    if (!user || !editingMed) return;
    const emailId = user.email?.toLowerCase() || user.uid;

    // Option A: Skip redundant writes check
    const originalSub = inventory.find(sub => sub.id === editingMed.id);
    if (originalSub && originalSub.minThreshold === Number(editingMed.minThreshold)) {
      console.log("Option A: Redundant write skipped for minThreshold");
      toast.success("Safeguard Threshold Adjusted");
      setIsEditMinThresholdOpen(false);
      setEditingMed(null);
      setSelectedSubstanceDetail(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDoc(doc(db, "users", emailId, "substances", editingMed.id), {
        minThreshold: Number(editingMed.minThreshold),
        lastUpdated: serverTimestamp()
      });
      toast.success("Safeguard Threshold Adjusted");
      setIsEditMinThresholdOpen(false);
      setEditingMed(null);
      setSelectedSubstanceDetail(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateMedDetails = async () => {
    if (!user || !editingMed) return;
    const emailId = user.email?.toLowerCase() || user.uid;

    // Option A: Skip redundant writes check
    const originalSub = inventory.find(sub => sub.id === editingMed.id);
    if (originalSub && 
        originalSub.name === editingMed.name &&
        originalSub.strength === editingMed.strength &&
        originalSub.schedule === editingMed.schedule &&
        originalSub.ndc === editingMed.ndc &&
        originalSub.unit === editingMed.unit &&
        originalSub.packageSize === Number(editingMed.packageSize) &&
        originalSub.minThreshold === Number(editingMed.minThreshold)) {
      console.log("Option A: Redundant write skipped for med details");
      toast.success("Catalog Registry Updated");
      setIsEditMedDetailsOpen(false);
      setEditingMed(null);
      setSelectedSubstanceDetail(null);
      return;
    }

    try {
      setIsSubmitting(true);
      await updateDoc(doc(db, "users", emailId, "substances", editingMed.id), {
        name: editingMed.name,
        strength: editingMed.strength,
        schedule: editingMed.schedule,
        ndc: editingMed.ndc,
        unit: editingMed.unit,
        packageSize: Number(editingMed.packageSize),
        minThreshold: Number(editingMed.minThreshold),
        lastUpdated: serverTimestamp()
      });
      toast.success("Catalog Registry Updated");
      setIsEditMedDetailsOpen(false);
      setEditingMed(null);
      setSelectedSubstanceDetail(null);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Super Admin Logic
  const handleUpdateSubscription = async (docIdToUpdate: string, currentStatus: 'active' | 'suspended' | 'pending') => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", docIdToUpdate), { status: newStatus });
      await batch.commit();
      toast.success(`Node Access: ${newStatus.toUpperCase()}`);
    } catch (error: any) {
      toast.error(`Authority Override Failure: ${error.message}`);
    }
  };

  const handleDeleteUserProfile = async (docIdToDelete: string) => {
    try {
      // Clean and purge all subcollection data for the node before deleting the profile itself
      const collectionsToClear = ["substances", "transactions", "staff", "reconciliation_reports"];
      for (const collName of collectionsToClear) {
        const collRef = collection(db, "users", docIdToDelete, collName);
        const snapshot = await getDocs(collRef);
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          chunk.forEach(d => {
            batch.delete(d.ref);
          });
          await batch.commit();
        }
      }

      await deleteDoc(doc(db, "users", docIdToDelete));
      toast.success("Organizational Node Revoked and Purged Successfully");
      setIsDeleteConfirmOpen(false);
      setNodeToDelete(null);
    } catch (error: any) {
      toast.error(`Purge Failure: ${error.message}`);
    }
  };

  const handleClearNodeData = async (docIdToClear: string) => {
    if (!isMasterAdmin) return;
    try {
      setIsActionPending(true);
      
      const collectionsToClear = ["substances", "transactions", "staff"];
      let totalDeleted = 0;

      for (const collName of collectionsToClear) {
        const collRef = collection(db, "users", docIdToClear, collName);
        const snapshot = await getDocs(collRef);
        
        // Firestore batch has 500 operation limit
        const docs = snapshot.docs;
        for (let i = 0; i < docs.length; i += 500) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + 500);
          chunk.forEach(d => {
            batch.delete(d.ref);
            totalDeleted++;
          });
          await batch.commit();
        }
      }
      
      toast.success(`Identity Refreshed: ${totalDeleted} records purged for node ${docIdToClear}`);
      setIsResetConfirmOpen(false);
      setNodeToReset(null);
    } catch (error: any) {
      toast.error(`Purge Failure: ${error.message}`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleGlobalRegistryMigration = async () => {
    if (!isMasterAdmin) {
      toast.error("Compliance Rejection: Master admin authority required for global registry migration.");
      return;
    }
    
    setIsActionPending(true);
    const toastId = toast.loading("Executing global registry data standardizations...");
    
    try {
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const batch = writeBatch(db);
      let migrationCount = 0;
      
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = docSnap.id;
        const updates: any = {};
        
        // Ensure default status is standard
        if (!data.status) {
          updates.status = "pending";
        }
        
        // Normalize role if missing
        if (!data.role) {
          updates.role = "pharmacist";
        }
        
        // Normalize display name or org name
        if (!data.displayName && docId.includes("@")) {
          updates.displayName = docId.split("@")[0];
        }

        // Set baseline timestamps for synchronization if missing
        if (!data.createdAt) {
          updates.createdAt = serverTimestamp();
        }
        if (!data.updatedAt) {
          updates.updatedAt = serverTimestamp();
        }

        if (Object.keys(updates).length > 0) {
          batch.update(docSnap.ref, updates);
          migrationCount++;
        }
      });
      
      if (migrationCount > 0) {
        await batch.commit();
        // Refresh local users list
        const refreshedSnapshot = await getDocs(usersRef);
        const refreshedItems = refreshedSnapshot.docs.map(doc => ({
          ...doc.data(),
          docId: doc.id,
          uid: doc.data().uid || doc.id
        } as UserProfile));
        setAllUserProfiles(refreshedItems);
        toast.success(`Global Migration Complete: Standardized metadata on ${migrationCount} nodes.`, { id: toastId });
      } else {
        toast.success("Global Migration Checked: All organizational registries are fully compliant & up-to-date.", { id: toastId });
      }
    } catch (err: any) {
      console.error("Migration task failure:", err);
      toast.error(`Migration Failed: ${err.message}`, { id: toastId });
    } finally {
      setIsActionPending(false);
    }
  };

  const handleNodeDataMigration = async () => {
    if (!isMasterAdmin) {
      toast.error("Compliance Rejection: Master admin authority required for data migration.");
      return;
    }
    if (!migrationSourceNode || !migrationDestNode) {
      toast.error("Compliance Error: Both source and destination nodes must be selected.");
      return;
    }
    if (migrationSourceNode === migrationDestNode) {
      toast.error("Compliance Error: Source and destination nodes cannot be identical.");
      return;
    }

    setIsMigrating(true);
    const toastId = toast.loading(`Copying all registry data from [${migrationSourceNode}] to [${migrationDestNode}]...`);

    try {
      const srcEmail = migrationSourceNode.toLowerCase().trim();
      const destEmail = migrationDestNode.toLowerCase().trim();

      const srcSubstancesRef = collection(db, "users", srcEmail, "substances");
      const srcSubstancesSnap = await getDocs(srcSubstancesRef);

      const srcTransactionsRef = collection(db, "users", srcEmail, "transactions");
      const srcTransactionsSnap = await getDocs(srcTransactionsRef);

      const srcStaffRef = collection(db, "users", srcEmail, "staff");
      const srcStaffSnap = await getDocs(srcStaffRef);

      const srcReportsRef = collection(db, "users", srcEmail, "reconciliation_reports");
      const srcReportsSnap = await getDocs(srcReportsRef);

      // Get parent node profile info to copy/merge
      let srcProfileData: any = null;
      try {
        const srcUserDoc = await getDoc(doc(db, "users", srcEmail));
        if (srcUserDoc.exists()) {
          srcProfileData = srcUserDoc.data();
        }
      } catch (profileErr) {
        console.warn("Could not copy source profile during node migration:", profileErr);
      }

      let batch = writeBatch(db);
      let count = 0;

      // Copy parent profile document metadata
      if (srcProfileData) {
        const destUserDocRef = doc(db, "users", destEmail);
        batch.set(destUserDocRef, {
          organizationName: srcProfileData.organizationName || "",
          displayName: srcProfileData.displayName || "",
          role: srcProfileData.role || "pharmacist",
          status: srcProfileData.status || "active",
          licenseNumber: srcProfileData.licenseNumber || "",
          updatedAt: serverTimestamp()
        }, { merge: true });
        count += 1;
      }

      for (const d of srcSubstancesSnap.docs) {
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
        const destDocRef = doc(db, "users", destEmail, "substances", d.id);
        batch.set(destDocRef, d.data());
        count += 1;
      }

      for (const d of srcTransactionsSnap.docs) {
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
        const destDocRef = doc(db, "users", destEmail, "transactions", d.id);
        batch.set(destDocRef, d.data());
        count += 1;
      }

      for (const d of srcStaffSnap.docs) {
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
        const destDocRef = doc(db, "users", destEmail, "staff", d.id);
        batch.set(destDocRef, d.data());
        count += 1;
      }

      for (const d of srcReportsSnap.docs) {
        if (count >= 400) {
          await batch.commit();
          batch = writeBatch(db);
          count = 0;
        }
        const destDocRef = doc(db, "users", destEmail, "reconciliation_reports", d.id);
        batch.set(destDocRef, d.data());
        count += 1;
      }

      if (count > 0) {
        await batch.commit();
      }

      toast.success(
        `Migration Successful: Copied profile metadata, ${srcSubstancesSnap.size} substances, ${srcTransactionsSnap.size} transactions, ${srcReportsSnap.size} reconciliation reports, and ${srcStaffSnap.size} staff records to ${destEmail} (source data protected & preserved).`,
        { id: toastId, duration: 8000 }
      );

      setMigrationSourceNode("");
      setMigrationDestNode("");
      setIsNodeMigrationOpen(false);
      setIsSuperAdminOpen(false);

      const activeUserEmail = (user?.email || "").toLowerCase().trim();
      if (activeUserEmail === srcEmail || activeUserEmail === destEmail) {
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }

    } catch (err: any) {
      console.error("Migration task failure:", err);
      toast.error(`Migration Failed: ${err.message}`, { id: toastId });
    } finally {
      setIsMigrating(false);
    }
  };

  const resetForm = () => {
    setSelectedSubstance("");
    setSubstanceSearch("");
    setQuantity("");
    setReason("");
    setReferenceNumber("");
    setCapturedPhoto(null);
    setIsCameraActive(false);
    setUseSignatureFallback(false);
    setCameraPermissionError(false);
    setSelectedUser("");
    setNewMed({
      name: "",
      strength: "",
      schedule: "",
      ndc: "",
      unit: "",
      packageSize: "",
      minThreshold: ""
    });
    setIsNewMedSearchFocused(false);
    sigPad.current?.clear();
  };

  const handleAddUser = async () => {
    if (!user || !newUserName.trim()) return;
    const emailId = user.email?.toLowerCase() || user.uid;
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "users", emailId, "staff"), { 
        name: newUserName.trim(),
        title: newUserTitle 
      });
      toast.success("User Record Secured");
      setNewUserName("");
      setNewUserTitle("");
    } catch (error: any) {
      console.error("Add User Error:", error);
      toast.error(`Process Failure: ${error.message || "Unknown Error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!user || !editingUser) return;
    const emailId = user.email?.toLowerCase() || user.uid;

    // Option A: Skip redundant writes check
    const originalStaff = users.find(u => u.id === editingUser.id);
    if (originalStaff && 
        originalStaff.name.trim() === editingUser.name.trim() && 
        originalStaff.title === editingUser.title) {
      console.log("Option A: Redundant write skipped for staff identity");
      toast.success("User Record Adjusted");
      setEditingUser(null);
      return;
    }

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", emailId, "staff", editingUser.id), { 
        name: editingUser.name.trim(),
        title: editingUser.title 
      });
      toast.success("User Record Modified");
      setEditingUser(null);
    } catch (error: any) {
      console.error("Update User Error:", error);
      toast.error(`Update Failure: ${error.message || "Unknown Error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!user) return;
    const emailId = user.email?.toLowerCase() || user.uid;
    try {
      await deleteDoc(doc(db, "users", emailId, "staff", id));
      toast.success("User Record Revoked");
      if (selectedUser === id) setSelectedUser("");
    } catch (error: any) {
      console.error("Delete User Error:", error);
      toast.error(`Delete Failure: ${error.message || "Unknown Error"}`);
    }
  };

  useEffect(() => {
    if (selectedSubstance) {
      const s = inventory.find(i => i.id === selectedSubstance);
      if (s) {
        setNewMed({
          name: s.name,
          strength: s.strength,
          schedule: s.schedule,
          ndc: s.ndc,
          unit: s.unit,
          packageSize: s.packageSize.toString(),
          minThreshold: s.minThreshold.toString()
        });
      }
    }
  }, [selectedSubstance, inventory]);

  // Derived Data
  const filteredUserProfiles = useMemo(() => {
    // Collect all raw records first for absolute transparency in debug
    const results: UserProfile[] = [];
    const seenEmails = new Set<string>();
    
    const activeDocId = (user?.email?.toLowerCase() || user?.uid || "").toLowerCase();

    allUserProfiles.forEach(p => {
      const emailLower = (p.email || "").toLowerCase().trim();
      
      // Deduplication: If we have multiple entries for the same customer email
      if (emailLower && seenEmails.has(emailLower)) {
        // Prefer the one with an organization name or more complete data
        const existingIdx = results.findIndex(r => (r.email || "").toLowerCase() === emailLower);
        if (existingIdx !== -1 && !results[existingIdx].organizationName && p.organizationName) {
          results[existingIdx] = p;
        }
        return;
      }
      
      if (emailLower) seenEmails.add(emailLower);
      results.push(p);
    });

    return results
      .filter((p: UserProfile) => {
        const term = userSearchTerm.toLowerCase();
        if (!term) return true;
        return (p.email?.toLowerCase() || "").includes(term) || 
               (p.displayName?.toLowerCase() || "").includes(term) ||
               (p.organizationName?.toLowerCase() || "").includes(term) ||
               (p.docId?.toLowerCase() || "").includes(term);
      })
      .sort((a: UserProfile, b: UserProfile) => {
        const isMasterA = (a.email || "").toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim();
        const isMasterB = (b.email || "").toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim();

        if (isMasterA && !isMasterB) return -1;
        if (!isMasterA && isMasterB) return 1;

        const nameA = (a.organizationName || a.displayName || "").toLowerCase();
        const nameB = (b.organizationName || b.displayName || "").toLowerCase();
        return nameA.localeCompare(nameB);
      });
  }, [allUserProfiles, userSearchTerm]);

  const masterAccountProfile = useMemo(() => 
    allUserProfiles.find((p: UserProfile) => p.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()),
  [allUserProfiles]);


  const filteredInventory = useMemo(() => 
    inventory
      .filter(s => activeSchedule === "ALL" || s.schedule === activeSchedule)
      .sort(compareSubstances),
  [inventory, activeSchedule]);

  const filteredTransactions = useMemo(() => 
    transactions
      .filter(t => {
        // Exclude all reconciliation report transactions (reference starting with REC- or RECON-)
        if (t.referenceNumber && (t.referenceNumber.startsWith("REC-") || t.referenceNumber.startsWith("RECON-"))) {
          return false;
        }

        const matchesSchedule = activeSchedule === "ALL" || 
          inventory.find(s => s.id === t.substanceId)?.schedule === activeSchedule;
        const transactionDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
        const matchesStartDate = !startDate || transactionDate >= new Date(startDate);
        const matchesEndDate = !endDate || transactionDate <= new Date(endDate + "T23:59:59");
        const cleanQuery = historyMedicationSearch
          ? historyMedicationSearch.split(" - ")[0].split(" (")[0].trim().toLowerCase()
          : "";
        const matchesSearch = historyMedicationFilter 
          ? t.substanceId === historyMedicationFilter 
          : (!cleanQuery || 
             t.substanceName.toLowerCase().startsWith(cleanQuery) || 
             t.ndc.toLowerCase().startsWith(cleanQuery) ||
             (t.strength && t.strength.toLowerCase().startsWith(cleanQuery)));
        const matchesType = historyTypeFilter === "All" || t.type === historyTypeFilter;

        return matchesSchedule && matchesStartDate && matchesEndDate && matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
        return dateB - dateA;
      }),
  [transactions, activeSchedule, inventory, startDate, endDate, historyMedicationFilter, historyMedicationSearch, historyTypeFilter]);

  const medicationHistoryTransactions = useMemo(() => {
    const rawTxs = isUsingFallback
      ? transactions.filter(t => t.substanceId === selectedSubstanceDetail?.id)
      : substanceTransactions;
    
    return rawTxs
      .filter(t => {
        if (!t.referenceNumber) return true;
        return !t.referenceNumber.startsWith("REC-") && !t.referenceNumber.startsWith("RECON-") && !t.referenceNumber.includes("REC");
      })
      .sort((a, b) => {
        const dateA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
        const dateB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
        return dateB - dateA;
      });
  }, [isUsingFallback, transactions, substanceTransactions, selectedSubstanceDetail?.id]);

  // Auto-fill logic for general Audit Log when filters exclude matches, debounced to prevent infinite loops and excess Firestore reads
  useEffect(() => {
    if (transactions.length > 0 && transactions.length >= syncLimit) {
      if (filteredTransactions.length < 30) {
        const timer = setTimeout(() => {
          setSyncLimit(prev => Math.min(prev + 30, 1000));
        }, 1500); // 1.5s debounce to stop hot loops & keep search highly cost-effective
        return () => clearTimeout(timer);
      }
    }
  }, [transactions.length, syncLimit, filteredTransactions.length]);

  // Auto-fill logic for Substance Detail History dialog, debounced to stop runaway queries costing unnecessary reads
  useEffect(() => {
    if (selectedSubstanceDetail) {
      const rawLimit = isUsingFallback ? syncLimit : substanceHistoryLimit;
      const rawLength = isUsingFallback ? transactions.length : substanceTransactions.length;
      if (rawLength > 0 && rawLength >= rawLimit) {
        if (medicationHistoryTransactions.length < 30) {
          const timer = setTimeout(() => {
            if (isUsingFallback) {
              setSyncLimit(prev => Math.min(prev + 30, 1000));
            } else {
              setSubstanceHistoryLimit(prev => Math.min(prev + 30, 1000));
            }
          }, 1500); // 1.5s rate-limit gate ensures data loads gracefully without draining GCP free tier read quota
          return () => clearTimeout(timer);
        }
      }
    }
  }, [
    selectedSubstanceDetail,
    isUsingFallback,
    transactions.length,
    syncLimit,
    substanceTransactions.length,
    substanceHistoryLimit,
    medicationHistoryTransactions.length
  ]);

  const lowStockItems = useMemo(() => {
    if (userProfile?.isAlertsEnabled === false) return [];
    return inventory.filter(s => 
      (activeSchedule === "ALL" || s.schedule === activeSchedule) && 
      s.currentStock <= s.minThreshold && 
      !dismissedAlerts.includes(s.id)
    );
  }, [inventory, dismissedAlerts, activeSchedule, userProfile?.isAlertsEnabled]);

  const substancesToReconcile = useMemo(() => {
    return inventory.filter(s => {
      if (reconScheduleFilter === "ALL") return true;
      if (reconScheduleFilter === "C-II") return s.schedule === "C-II";
      if (reconScheduleFilter === "C-III/C-IV/C-V") {
        return s.schedule === "C-III" || s.schedule === "C-IV" || s.schedule === "C-V";
      }
      return true;
    });
  }, [inventory, reconScheduleFilter]);

  const handleDismissAlert = (id: string) => {
    setDismissedAlerts(prev => [...prev, id]);
    toast.success("Alert dismissed");
  };

  // Auto-prompt organization setup if missing
  useEffect(() => {
    if (isAuthReady && userProfile && !userProfile.organizationName && !isProfileEditOpen && userProfile.status !== 'suspended') {
      const timer = setTimeout(() => {
        setIsProfileEditOpen(true);
        setEditingOrgName(userProfile.organizationName || "");
        toast.info("Welcome! Please establish your Clinical Organization Identity to continue.", {
          duration: 6000,
          icon: <Shield className="h-4 w-4 text-brand-blue" />
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthReady, userProfile, isProfileEditOpen]);

  const handleUpdateOrgProfile = async () => {
    if (!user || !userProfile) {
      toast.error("Auth Fail: Session or Profile missing");
      return;
    }
    if (!editingOrgName.trim()) {
      toast.error("Please enter an organizational name");
      return;
    }
    
    const emailId = user.email?.toLowerCase() || user.uid;

    // Option A: Skip redundant writes check
    if (userProfile.organizationName === editingOrgName.trim()) {
      console.log("Option A: Redundant write skipped for organizationName");
      toast.success("Organization Identity Updated Successfully");
      setIsProfileEditOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(`Updating Profile Identity for node: ${emailId}`);
      
      // Use setDoc with merge to be more robust
      await setDoc(doc(db, "users", emailId), { 
        organizationName: editingOrgName.trim(),
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast.success("Organization Identity Updated Successfully");
      setIsProfileEditOpen(false);
    } catch (error: any) {
      console.error("Profile Identity Sync Failed:", error);
      handleFirestoreError(error, OperationType.UPDATE, `users/${emailId}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthReady || isInitializing) {
    return (
      <div className="min-h-screen bg-brand-light-grey flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-6 max-w-sm">
            {!bootTimeout ? (
              <>
                <div className="h-16 w-16 border-4 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                <div className="flex flex-col gap-1">
                  <p className="text-brand-blue font-black uppercase tracking-widest text-[10px] animate-pulse">Initializing Terminal Node...</p>
                  <p className="text-[9px] text-brand-dark-grey/40 font-bold uppercase tracking-tighter italic">Restoring encrypted sessions</p>
                </div>
                <p className="text-[8px] text-brand-grey/30 font-mono mt-2">{APP_VERSION}</p>
              </>
            ) : (
            <div className="bg-white p-8 rounded-2xl shadow-xl border-2 border-brand-yellow space-y-4">
              <AlertTriangle className="h-12 w-12 text-brand-yellow mx-auto" />
              <h2 className="text-xl font-black text-brand-blue uppercase">Initialization Delay</h2>
              <p className="text-brand-grey text-sm font-medium leading-relaxed">
                The terminal is taking longer than usual to sync with the registry. This may be due to a restrictive network or browser session lock.
              </p>
              <div className="space-y-4">
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-brand-blue text-brand-yellow font-bold py-6 rounded-xl hover:scale-105 transition-transform"
                >
                  Force Restart Terminal
                </Button>
                <div className="flex items-center justify-center gap-2 opacity-40">
                  <div className="h-1 w-1 bg-brand-blue rounded-full animate-pulse" />
                  <span className="text-[9px] font-mono tracking-widest uppercase text-brand-blue">{APP_VERSION}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-brand-light-grey flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-sm w-full"
        >
          <div className="bg-brand-surface shadow-2xl overflow-hidden rounded-2xl border-none">
            <div className="bg-brand-blue px-6 py-6 text-center relative overflow-hidden rounded-t-2xl">
              <div className="flex justify-center mb-2">
                <PharmaLogo className="h-16 w-16" />
              </div>
              <h1 className="text-3xl font-black text-white tracking-tighter">PharmaGuard</h1>
              <p className="text-brand-yellow font-bold text-[8px] uppercase tracking-[0.15em] mt-1">
                SECURE CONTROLLED SUBSTANCE PERPETUAL INVENTORY SYSTEM
              </p>
            </div>

            <div className="p-5 pt-4">
              {authMode === "google" ? (
                <div className="space-y-4">
                  <div className="text-center space-y-1">
                    <h2 className="text-sm font-bold text-brand-blue uppercase tracking-tight">Identity Verification Required</h2>
                    <p className="text-brand-dark-grey/60 text-[10px]">
                      Access to the controlled substance registry is restricted to authorized personnel.
                    </p>
                  </div>
                  
                  <form onSubmit={handleEmailLogin} className="space-y-3">
                    <div className="space-y-2.5">
                      <div className="space-y-0.5 text-left">
                        <Label className="text-[9px] uppercase font-black text-brand-blue/80">Authorized Email</Label>
                        <Input 
                          type="email" 
                          placeholder=""
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className={`h-10 border-brand-blue/10 focus-visible:ring-brand-blue text-sm transition-colors duration-200 ${
                            isUserDoesNotExistOpen 
                              ? "bg-brand-yellow/30 border-brand-yellow/50" 
                              : "bg-brand-surface"
                          }`}
                          required
                        />
                      </div>
                      <div className="space-y-0.5 text-left">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] uppercase font-black text-brand-blue/80">Password</Label>
                          <button 
                            type="button"
                            onClick={() => {
                              setEmail("");
                              setAuthMode("forgot");
                            }}
                            className="text-[8px] font-bold text-brand-blue/40 uppercase hover:text-brand-blue"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder=""
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`h-10 pr-10 border-brand-blue/10 focus-visible:ring-brand-blue text-sm transition-colors duration-200 ${
                              isUserDoesNotExistOpen 
                                ? "bg-brand-yellow/30 border-brand-yellow/50" 
                                : "bg-brand-surface"
                            }`}
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-blue/40 hover:text-brand-blue focus:outline-none animate-fade-in"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {isUserDoesNotExistOpen && (
                      <div className="p-3 bg-brand-yellow border border-brand-yellow/30 rounded-xl text-center shadow-sm">
                        <p className="text-brand-blue text-[10px] leading-relaxed font-black text-center">
                          Either the email or password you entered is incorrect, or an account does not exist for this email address
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full h-11 bg-brand-blue text-brand-yellow font-black uppercase tracking-widest text-xs rounded-lg flex items-center justify-center hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans cursor-pointer"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Verifying..." : "Verify & Enter"}
                    </button>
                  </form>

                  <div className="relative my-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-brand-grey/10"></span></div>
                    <div className="relative flex justify-center text-[8px] uppercase font-bold px-2 bg-brand-surface text-brand-grey/40">or use google SSO</div>
                  </div>

                  <Button 
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full h-10 bg-white border border-brand-blue/10 hover:bg-gray-50 text-brand-dark-grey font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                    )}
                    {isSubmitting ? "Syncing..." : "Continue with Google"}
                  </Button>
                  
                  <div className="text-center pt-1">
                    <button 
                      onClick={() => setAuthMode("signup")}
                      className="text-[9px] uppercase font-black text-brand-blue/60 hover:text-brand-blue tracking-widest transition-colors"
                    >
                      Create New Organization Nodes
                    </button>
                  </div>
                </div>
              ) : authMode === "login" ? (
                <div className="flex flex-col gap-3">
                  <p className="text-center text-[11px] text-brand-dark-grey/60">Legacy login node redirecting...</p>
                  <Button onClick={() => setAuthMode("google")} className="h-11 text-xs">Click to Restore Session</Button>
                </div>
              ) : authMode === "signup" ? (
                <form onSubmit={handleEmailSignUp} className="space-y-3">
                  <div className="grid grid-cols-1 gap-2.5">
                  <div className="space-y-1 text-left">
                    <Label className="text-[9px] uppercase font-black text-brand-blue/80">Organization Name</Label>
                    <Input 
                      placeholder="e.g. UCLA Medical Center"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="h-10 border-brand-blue/10 placeholder:text-brand-dark-grey/30 text-sm bg-brand-surface"
                      required
                    />
                  </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-[9px] uppercase font-black text-brand-blue/80">Email</Label>
                      <Input 
                        type="email" 
                        placeholder="e.g. drsmith@ucla.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`h-10 border-brand-blue/10 placeholder:text-brand-dark-grey/30 text-sm transition-colors duration-200 ${
                          isAlreadyRegisteredOpen 
                            ? "bg-brand-yellow/30 border-brand-yellow/50" 
                            : "bg-brand-surface"
                        }`}
                        required
                      />
                    </div>
                    <div className="space-y-1 text-left">
                      <Label className="text-[9px] uppercase font-black text-brand-blue/80">Password</Label>
                      <div className="relative">
                        <Input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Choose a compliant password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className={`h-10 pr-10 border-brand-blue/10 placeholder:text-brand-dark-grey/30 text-sm transition-colors duration-200 ${
                            isAlreadyRegisteredOpen 
                              ? "bg-brand-yellow/30 border-brand-yellow/50" 
                              : "bg-brand-surface"
                          }`}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-blue/40 hover:text-brand-blue focus:outline-none animate-fade-in"
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <div className="mt-1.5 p-2 bg-brand-blue/5 border border-brand-blue/10 rounded-lg text-[10px] space-y-1">
                        <p className="font-bold text-brand-blue/80 uppercase tracking-widest text-[8px] mb-1">Passkey Compliance Requirements:</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${password.length >= 6 ? 'bg-emerald-500' : 'bg-brand-grey/40'}`} />
                          <span className={password.length >= 6 ? 'text-emerald-600 font-semibold text-[9px]' : 'text-brand-grey/70 text-[9px]'}>
                            At least 6 characters {password.length > 0 && password.length < 6 && <span className="text-rose-500 font-bold font-mono">({password.length}/6)</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block w-1.5 h-1.5 rounded-full transition-colors ${(/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) ? 'bg-emerald-500' : 'bg-brand-grey/40'}`} />
                          <span className={(/[a-zA-Z]/.test(password) && /[0-9]/.test(password)) ? 'text-emerald-600 font-semibold text-[9px]' : 'text-brand-grey/70 text-[9px]'}>
                            Must contain both letters and numbers
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                    {isAlreadyRegisteredOpen && (
                      <div className="p-3 bg-brand-yellow border border-brand-yellow/30 rounded-xl text-center shadow-sm">
                        <p className="text-brand-blue text-[10px] leading-relaxed font-black text-center">
                          This email address is already registered.
                        </p>
                      </div>
                    )}
                  
                  <button
                    type="submit"
                    className="w-full h-11 bg-brand-blue text-brand-yellow font-black uppercase tracking-widest text-xs mt-1 rounded-lg flex items-center justify-center hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans cursor-pointer"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Provisioning..." : "Register Organization"}
                  </button>

                  <button 
                    type="button" 
                    onClick={() => setAuthMode("google")}
                    className="w-full text-[9px] font-bold text-brand-grey/60 uppercase pt-1"
                  >
                    Already registered? Sign In
                  </button>
                </form>
              ) : (
                resetEmailSent ? (
                  <div className="space-y-4 text-center">
                    <div className="space-y-2">
                      <h2 className="text-lg font-bold text-brand-blue uppercase leading-tight">Reset Password</h2>
                      <p className="text-[11px] text-brand-grey leading-relaxed">
                        A link to reset your password has been sent to your email
                      </p>
                    </div>
                    <Button 
                      type="button" 
                      onClick={() => {
                        setResetEmailSent(false);
                        setAuthMode("google");
                      }} 
                      className="w-full h-11 bg-brand-blue text-brand-yellow font-black tracking-widest uppercase text-xs"
                    >
                      return to log in
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-3">
                    <div className="space-y-1 text-center">
                      <h2 className="text-lg font-bold text-brand-blue uppercase leading-tight">Reset Password</h2>
                      <p className="text-[11px] text-brand-grey">Enter your email for a recovery link.</p>
                    </div>
                    <Input 
                      type="email" 
                      placeholder=""
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-10 border-brand-blue/10 text-sm bg-brand-surface"
                      required
                    />
                    <button
                      type="submit"
                      className="w-full h-11 bg-brand-blue text-brand-yellow font-black tracking-widest uppercase text-xs rounded-lg flex items-center justify-center hover:bg-brand-blue/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans cursor-pointer"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Sending..." : "Send Recovery Link"}
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setAuthMode("google")}
                      className="w-full text-[9px] font-bold text-brand-grey/60 uppercase pt-1"
                    >
                      Back to Login Options
                    </button>
                  </form>
                )
              )}


            </div>
          </div>
        </motion.div>
      </div>
    );
  }



  if (userProfile?.status === 'pending') {
    return (
      <div className="min-h-screen bg-brand-light-grey flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-blue/20 flex flex-col items-center space-y-6">
            <div className="h-24 w-24 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg">
              <Clock className="w-12 h-12 text-brand-blue" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-brand-blue">Access Pending Approval</h2>
              <p className="text-brand-grey text-sm">
                Your PharmaGuard node has been registered successfully. 
                For security reasons, access must be manually granted by a Master Authority.
              </p>
              <div className="bg-brand-blue/5 p-4 rounded-lg border border-brand-blue/10 mt-4">
                <p className="text-[10px] text-brand-blue font-bold tracking-wider">Node Identification</p>
                <p className="text-sm font-bold text-brand-blue mt-1 no-interact">{escapeEmail(userProfile.email)}</p>
              </div>
              <p className="text-brand-dark-grey/60 text-xs mt-4">
                Please notify your system administrator if access is not granted within 24 hours.
              </p>
            </div>
            <div className="pt-4 w-full space-y-3">
              <Button 
                onClick={async () => {
                  if (user && user.email) {
                    setIsSubmitting(true);
                    const userEmail = user.email.toLowerCase();
                    const userDocRef = doc(db, "users", userEmail);
                    await setDoc(userDocRef, {
                      uid: user.uid,
                      email: userEmail,
                      displayName: user.displayName || "User",
                      role: "pharmacist",
                      status: "pending"
                    }, { merge: true });
                    toast.success("Registration heartbeat sent to Registry");
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="w-full bg-brand-yellow text-brand-blue hover:brightness-110 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-brand-yellow/20 disabled:opacity-100"
              >
                {isSubmitting ? "Syncing..." : "Retry Registry Sync"}
              </Button>
              <Button 
                onClick={handleLogout}
                className="w-full bg-brand-blue text-white hover:brightness-110 h-12 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-brand-blue/10"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (userProfile?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-brand-light-grey flex flex-col items-center justify-center p-4 text-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-blue/10 flex flex-col items-center space-y-6">
            <div className="bg-brand-yellow p-6 rounded-full shadow-lg shadow-brand-yellow/20">
              <X className="w-16 h-16 text-brand-blue" strokeWidth={3} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-brand-dark-grey">Subscription Suspended</h2>
              <p className="text-brand-grey">
                Your organization's access to PharmaGuard has been temporarily restricted. 
                Please contact our support team or your administrator to restore your inventory control services.
              </p>
            </div>
            <div className="pt-4 w-full">
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="w-full border-brand-grey/20 text-brand-grey hover:bg-gray-50"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  const togglePhotoRequirement = () => {
    if (!user || !userProfile) return;
    const newValue = !userProfile.isPhotoRequirementEnabled;
    
    // Update local React state instantly for responsive UI
    setUserProfile(prev => prev ? { ...prev, isPhotoRequirementEnabled: newValue } : null);
    toast.success(`Photo requirement ${newValue ? 'enabled' : 'disabled'}`);

    // Queue with Option A validation & Option B 2.5s debounce
    debouncedUpdateProfile({ isPhotoRequirementEnabled: newValue });
  };

  const toggleSignatureRequirement = () => {
    if (!user || !userProfile) return;
    const newValue = userProfile.isSignatureRequirementEnabled === false ? true : false;
    
    // Update local React state instantly for responsive UI
    setUserProfile(prev => prev ? { ...prev, isSignatureRequirementEnabled: newValue } : null);
    toast.success(`Signature requirement ${newValue ? 'enabled' : 'disabled'}`);

    // Queue with Option A validation & Option B 2.5s debounce
    debouncedUpdateProfile({ isSignatureRequirementEnabled: newValue });
  };

  const toggleAlertsRequirement = () => {
    if (!user || !userProfile) return;
    const newValue = userProfile.isAlertsEnabled === false ? true : false;
    
    // Update local React state instantly for responsive UI
    setUserProfile(prev => prev ? { ...prev, isAlertsEnabled: newValue } : null);
    toast.success(`System alerts ${newValue ? 'enabled' : 'disabled'}`);

    // Queue with Option A validation & Option B 2.5s debounce
    debouncedUpdateProfile({ isAlertsEnabled: newValue });
  };

  const toggleReconFilter = (filterVal: "ALL" | "C-II" | "C-III/C-IV/C-V") => {
    if (!user || !userProfile) return;
    const currentFilters = userProfile.reconFilters || ["ALL", "C-II", "C-III/C-IV/C-V"];
    let newFilters: string[];
    
    if (currentFilters.includes(filterVal)) {
      if (currentFilters.length <= 1) {
        toast.warning("At least one report option must remain selected.");
        return;
      }
      newFilters = currentFilters.filter(f => f !== filterVal);
    } else {
      newFilters = [...currentFilters, filterVal];
    }
    
    // Update local React state instantly for responsive UI
    setUserProfile(prev => prev ? { ...prev, reconFilters: newFilters } : null);
    toast.success("Reconciliation options matching profile updated.");

    // Queue with Option A validation & Option B 2.5s debounce
    debouncedUpdateProfile({ reconFilters: newFilters });
  };

  const renderReconciliationReportContent = (isForPrint: boolean) => {
    const formatToFourDigitYear = (dateStr: string) => {
      if (!dateStr || dateStr === "N/A") return "N/A";
      const parts = dateStr.split("/");
      if (parts.length === 3) {
        let year = parts[2];
        if (year.length === 2) {
          year = "20" + year;
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${year}`;
      }
      return dateStr;
    };

    const headerPrevReportDate = (() => {
      if (selectedHistoricalReport) {
        const firstItem = selectedHistoricalReport.items[0];
        return formatToFourDigitYear(firstItem?.prevReportDate || "N/A");
      } else {
        const firstSub = substancesToReconcile[0];
        if (firstSub) {
          const metrics = getSubstanceHistoryMetrics(firstSub.id);
          return formatToFourDigitYear(metrics.prevReportDate);
        }
        return formatToFourDigitYear(lastReport.date);
      }
    })();

    const reconUserObj = users.find(u => u.id === reconUser);
    const picUserObj = users.find(u => u.title?.toUpperCase() === "PIC");
    
    const perfName = selectedHistoricalReport
      ? `${selectedHistoricalReport.performedByName}${selectedHistoricalReport.performedByTitle ? ` (${selectedHistoricalReport.performedByTitle})` : ""}`
      : (reconUserObj ? `${reconUserObj.name}${reconUserObj.title ? ` (${reconUserObj.title})` : ""}` : "Unassigned");
    const picName = selectedHistoricalReport ? selectedHistoricalReport.picName : (picUserObj?.name || "PIC NOT ASSIGNED");
    const userSig = selectedHistoricalReport ? selectedHistoricalReport.reconSigData : reconSigData;
    const picSig = selectedHistoricalReport ? selectedHistoricalReport.picSigData : picSigData;
    const isSigRequired = userProfile?.isSignatureRequirementEnabled !== false;

    return (
      <div id={isForPrint ? "reconciliation-printable-root" : undefined} className={!isForPrint ? "max-w-[1000px] mx-auto p-4" : ""}>
        {isForPrint && (
          <style>{`
            @page {
              size: landscape;
              margin: 10mm 15mm 15mm 15mm;
              @bottom-right {
                content: "page " counter(page) " of " counter(pages);
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 8px;
                font-weight: bold;
                color: #111827;
                vertical-align: top;
                padding-top: 2mm;
              }
              @bottom-left {
                content: "Generated With PharmaGuard";
                font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                font-size: 8px;
                font-weight: bold;
                color: #111827;
                vertical-align: top;
                padding-top: 2mm;
              }
            }
            @media screen {
              #reconciliation-printable-root {
                display: none !important;
              }
            }
            @media print {
              html, body {
                position: static !important;
                overflow: visible !important;
                overflow-x: visible !important;
                overflow-y: visible !important;
                width: auto !important;
                height: auto !important;
                max-height: none !important;
                min-height: 0 !important;
                top: auto !important;
                left: auto !important;
                right: auto !important;
                bottom: auto !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body > *:not(#reconciliation-printable-root) {
                display: none !important;
              }
              #reconciliation-printable-root {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
              }
              #reconciliation-printable-invoice {
                display: block !important;
                position: static !important;
                width: 100% !important;
                height: auto !important;
                overflow: visible !important;
                max-height: none !important;
              }
              #reconciliation-printable-root * {
                visibility: visible !important;
              }
              table, tbody, thead, th, td {
                page-break-inside: auto !important;
                break-inside: auto !important;
                height: auto !important;
              }
              tr {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
              .break-inside-avoid {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
              }
            }
          `}</style>
        )}
        <div id={isForPrint ? "reconciliation-printable-invoice" : undefined} className={`${isForPrint ? "static pb-24 print:static print:pb-24" : "relative pb-4 overflow-hidden shadow-md border border-gray-200 rounded-xl"} px-8 pt-4 space-y-3 text-left selection:bg-brand-yellow/30 bg-white text-gray-900 font-sans`}>
          
          {/* Centered Watermark for Screen, and Centered fixed Watermark for Page Print */}
          <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center opacity-[0.035] print:opacity-[0.05] print:fixed print:inset-0 print:flex print:items-center print:justify-center">
            <PharmaLogo className="w-[380px] h-[380px]" />
          </div>
          
          {/* Visual Official Letterhead */}
          <div className="flex justify-between items-end pb-0">
            <div className="flex flex-col space-y-1 min-w-0 flex-1">
              <h1 className="text-xl font-extrabold tracking-tight uppercase leading-none whitespace-nowrap">{getReportTitle().toUpperCase()}</h1>
              <p className="text-xs text-gray-900 font-sans leading-none whitespace-nowrap">REPORT #: {(() => {
                const rNum = selectedHistoricalReport ? selectedHistoricalReport.reportNumber : reconRef;
                return rNum?.startsWith("REC-") ? rNum : `REC-${rNum}`;
              })()}</p>
              <p className="text-xs text-gray-900 font-sans leading-none whitespace-nowrap">REGISTRY ID: {userProfile?.organizationName?.toUpperCase() || "PHARMA GUARD ACTIVE NODE"}</p>
            </div>
            <div className="text-right flex flex-col items-end justify-end space-y-1 shrink-0 whitespace-nowrap ml-4">
              <p className="text-xs font-bold font-sans text-gray-900 leading-none whitespace-nowrap">
                COMPLETED BY: {
                  selectedHistoricalReport
                    ? `${selectedHistoricalReport.performedByName} ${selectedHistoricalReport.performedByTitle ? `(${selectedHistoricalReport.performedByTitle})` : ""}`
                    : (() => {
                        const selectedUserObj = users.find(u => u.id === reconUser);
                        return selectedUserObj ? `${selectedUserObj.name} ${selectedUserObj.title ? `(${selectedUserObj.title})` : ""}` : "AUTHORIZED STAFF";
                      })()
                }
              </p>
              <p className="text-xs font-normal font-sans text-gray-900 leading-none whitespace-nowrap">DATE EXECUTED: {
                selectedHistoricalReport 
                  ? new Date(selectedHistoricalReport.timestamp).toLocaleDateString()
                  : new Date().toLocaleDateString()
              }</p>
            </div>
          </div>

          {/* Audit Grid/Table */}
          <div className="!mt-1">
            <table className="w-full text-xs font-sans text-gray-900 table-fixed" style={{ height: 'auto' }}>
              <colgroup>
                <col className="w-[33%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[8%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
                <col className="w-[7%]" />
              </colgroup>
              <thead>
                <tr className="border-t-2 border-gray-900">
                  <th rowSpan={2} className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '1px', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>MEDICATION</span>
                    </div>
                  </th>
                  <th rowSpan={2} className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '1px', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>NDC</span>
                    </div>
                  </th>
                  <th rowSpan={2} className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '1px', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>LAST REPORT</span>
                      <span className="mt-0.5">COUNT</span>
                    </div>
                  </th>
                  <th className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '0px', verticalAlign: 'bottom' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>PURCHASED</span>
                    </div>
                  </th>
                  <th className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '0px', verticalAlign: 'bottom' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>DISPENSED</span>
                    </div>
                  </th>
                  <th className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '0px', verticalAlign: 'bottom' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>ADJUSTED</span>
                    </div>
                  </th>
                  <th rowSpan={2} className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '1px', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>EXPECTED</span>
                      <span className="mt-0.5">COUNT</span>
                    </div>
                  </th>
                  <th rowSpan={2} className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '1px', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>PHYSICAL</span>
                      <span className="mt-0.5">COUNT</span>
                    </div>
                  </th>
                  <th rowSpan={2} className="text-center font-bold text-[10px] font-sans" style={{ paddingTop: '1px', paddingBottom: '1px', verticalAlign: 'middle' }}>
                    <div className="flex flex-col items-center justify-center leading-none">
                      <span>VARIANCE</span>
                    </div>
                  </th>
                </tr>
                <tr className="border-b-2 border-gray-900">
                  <th colSpan={3} className="text-center font-bold text-[9px] text-gray-900 font-sans" style={{ paddingTop: '0px', paddingBottom: '1px', verticalAlign: 'top' }}>
                    SINCE LAST REPORT ON {headerPrevReportDate}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {selectedHistoricalReport ? (
                  [...selectedHistoricalReport.items].sort(compareSubstances).map(item => {
                    const variance = item.variance;
                    return (
                      <Fragment key={item.substanceId}>
                        <tr className="text-center text-gray-900 font-sans" style={{ height: '40px' }}>
                          <td className="py-1 px-1 text-center text-gray-900 font-sans align-middle">
                            <div 
                              onClick={() => {
                                if (!isForPrint) {
                                  const invItem = inventory.find(i => i.id === item.substanceId);
                                  if (invItem) setSelectedSubstanceDetail(invItem);
                                }
                              }}
                              className={`font-bold text-gray-900 text-[10px] leading-tight truncate max-w-[230px] mx-auto whitespace-nowrap ${!isForPrint ? 'cursor-pointer hover:text-brand-blue hover:underline' : ''}`} 
                              title={`${item.substanceName} ${item.strength} - Click to view transaction history`}
                            >
                              {item.substanceName} <span className="text-gray-900 font-normal ml-1">{item.strength}</span>
                            </div>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-sans align-middle">
                            <span className="font-bold text-[10px] text-gray-900 font-sans leading-none">{item.ndc}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-sans align-middle">
                            <div className="font-bold text-[10px] text-gray-900 leading-none">{item.lastClosingCount || 0}</div>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{(item.purchases || 0) === 0 ? "Ø" : `+${item.purchases}`}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{(item.dispensed || 0) === 0 ? "Ø" : `-${item.dispensed}`}</span>
                          </td>
                          <td className="py-1 px-1 text-center font-bold text-gray-900 font-sans align-middle">
                            <span className="text-[10px] leading-none">{item.adjustments === 0 ? "Ø" : (item.adjustments > 0 ? `+${item.adjustments}` : item.adjustments)}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{item.expected || 0}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{item.physical || 0}</span>
                          </td>
                          <td className="py-1 px-1 text-center font-bold text-gray-900 font-sans align-middle">
                            <span className="text-[10px] leading-none">{variance === 0 ? "0" : variance > 0 ? `+${variance}` : variance}</span>
                          </td>
                        </tr>
                        {variance !== 0 && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={9} className="py-2 pl-4 text-left border-l-2 border-gray-900 text-[10px] text-gray-900 italic font-sans">
                              Discrepancy Reason: {item.reason || "State reason omitted"}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                ) : (
                  [...substancesToReconcile].sort(compareSubstances).map(sub => {
                    const metrics = getSubstanceHistoryMetrics(sub.id);
                    const counted = getReconPhysicalCount(sub.id) ?? 0;
                    const variance = counted - metrics.expected;
                    const reason = reconReasons[sub.id] || "";
                    
                    return (
                      <Fragment key={sub.id}>
                        <tr className="text-center text-gray-900 font-sans" style={{ height: '40px' }}>
                          <td className="py-1 px-1 text-center text-gray-900 font-sans align-middle">
                            <div 
                              onClick={() => !isForPrint && setSelectedSubstanceDetail(sub)}
                              className={`font-bold text-gray-900 text-[10px] leading-tight truncate max-w-[230px] mx-auto whitespace-nowrap ${!isForPrint ? 'cursor-pointer hover:text-brand-blue hover:underline' : ''}`} 
                              title={`${sub.name} ${sub.strength} - Click to view transaction history`}
                            >
                              {sub.name} <span className="text-gray-900 font-normal ml-1">{sub.strength}</span>
                            </div>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-sans align-middle">
                            <span className="font-bold text-[10px] text-gray-900 font-sans leading-none">{sub.ndc}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-sans align-middle">
                            <div className="font-bold text-[10px] text-gray-900 leading-none">{metrics.lastClosingCount}</div>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{metrics.purchases === 0 ? "Ø" : `+${metrics.purchases}`}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{metrics.dispensed === 0 ? "Ø" : `-${metrics.dispensed}`}</span>
                          </td>
                          <td className="py-1 px-1 text-center font-bold text-gray-900 font-sans align-middle">
                            <span className="text-[10px] leading-none">{metrics.adjustments === 0 ? "Ø" : (metrics.adjustments > 0 ? `+${metrics.adjustments}` : metrics.adjustments)}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{metrics.expected}</span>
                          </td>
                          <td className="py-1 px-1 text-center text-gray-900 font-bold font-sans align-middle">
                            <span className="text-[10px] leading-none">{counted}</span>
                          </td>
                          <td className="py-1 px-1 text-center font-bold text-gray-900 font-sans align-middle">
                            <span className="text-[10px] leading-none">{variance === 0 ? "0" : variance > 0 ? `+${variance}` : variance}</span>
                          </td>
                        </tr>
                        {variance !== 0 && (
                          <tr className="bg-gray-50/50">
                            <td colSpan={9} className="py-2 pl-4 text-left border-l-2 border-gray-900 text-[10px] text-gray-900 italic font-sans">
                              Discrepancy Reason: {reason || "State reason omitted"}
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Signature box info */}
          <div className="space-y-1 pt-1.5 border-t border-gray-100 break-inside-avoid">
            {/* Moved disclaimer above signature fields in historical report block */}
            <p className="text-[10px] text-gray-900 font-medium leading-normal text-left">
              By executing this report, you certify that the physical count has been completed, any discrepancies are explained truthfully, and stock metrics are reconciled in good faith.
            </p>
            {isSigRequired ? (
              <div className="grid grid-cols-2 gap-4 pt-1">
                {/* Left signature field */}
                <div className="border border-black p-2.5 rounded-lg relative h-20 flex flex-col justify-between bg-gray-50/20">
                  <div className="flex items-center gap-1.5 pb-1">
                    <span className="text-[10px] text-gray-900 font-sans uppercase font-black tracking-wider">COMPLETED BY:</span>
                    <span className="text-[10px] text-gray-900 font-sans font-bold truncate">
                      {perfName}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {userSig ? (
                      <img src={userSig} className="max-h-12 object-contain" alt="Performed by signature" />
                    ) : (
                      <span className="text-gray-900 text-[9px] font-sans uppercase tracking-wider italic">
                        No signature captured
                      </span>
                    )}
                  </div>
                </div>

                {/* Right signature field */}
                <div className="border border-black p-2.5 rounded-lg relative h-20 flex flex-col justify-between bg-gray-50/20">
                  <div className="flex items-center gap-1.5 pb-1">
                    <span className="text-[10px] text-gray-900 font-sans uppercase font-black tracking-wider">PIC:</span>
                    <span className="text-[10px] text-gray-900 font-sans font-bold truncate">
                      {picName}
                    </span>
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    {picSig ? (
                      <img src={picSig} className="max-h-12 object-contain" alt="PIC signature" />
                    ) : (
                      <span className="text-gray-900 text-[9px] font-sans uppercase tracking-wider italic">
                        No signature captured
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="pt-1.5 flex flex-col sm:flex-row justify-between text-[10px] text-gray-900 font-sans font-bold uppercase gap-2">
                <div>COMPLETED BY: {perfName} (SYSTEM AUTHENTICATED)</div>
                <div>PIC: {picName} (AUTO-BYPASS ENFORCED)</div>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  return (
    <div className="h-[100dvh] overflow-hidden overscroll-none bg-brand-light-grey font-sans text-brand-grey flex flex-col touch-none">
      <header className={`shrink-0 sticky top-0 z-50 w-full border-b border-brand-blue/10 bg-brand-surface/90 backdrop-blur-md touch-auto ${isUserManagementOpen ? "pointer-events-none select-none overflow-hidden touch-none" : ""}`}>
        <div className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex h-14 items-center gap-8">
            <div className="w-full lg:w-64 flex items-center lg:justify-start justify-center lg:-ml-4">
                <div 
                  className="flex items-center gap-3 cursor-pointer group" 
                  onClick={() => {
                    if (user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
                      setIsSuperAdminOpen(true);
                      toast.success("Super Admin Portal Unlocked", { 
                        icon: (
                          <div className="h-6 w-6 rounded-full bg-brand-blue border-[1.5px] border-white flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                            <Settings className="h-4 w-4 text-white fill-brand-yellow" strokeWidth={2} />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="h-1.5 w-1.5 rounded-full bg-brand-blue border-[0.5px] border-white" />
                            </div>
                          </div>
                        )
                      });
                    }
                  }}
                >
                  <PharmaLogo className="h-10 w-10 group-hover:scale-110 transition-transform" />
                  <h1 className="text-4xl font-black tracking-tighter text-brand-blue">PharmaGuard</h1>
                </div>
            </div>

            <div className="hidden lg:flex flex-1 items-center justify-center">
              <div className="flex items-center gap-12">
                {["ALL", ...SCHEDULES].map((sched) => (
                  <Button
                    key={sched}
                    variant={activeSchedule === sched ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveSchedule(sched)}
                    className={`rounded-full px-8 h-10 text-xs font-extrabold tracking-wider transition-all min-w-[120px] ${
                      activeSchedule === sched 
                        ? "bg-brand-blue text-white border-brand-blue shadow-md" 
                        : "bg-brand-surface text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5"
                    }`}
                  >
                    {sched === "ALL" ? "ALL SCHEDULES" : sched}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className={`flex-1 h-[calc(100dvh-3.5rem)] min-h-0 max-w-[1800px] mx-auto px-4 pb-4 pt-1 md:pt-0.5 md:pb-8 md:px-8 lg:px-12 w-full flex flex-col touch-auto overflow-hidden ${isUserManagementOpen ? "pointer-events-none select-none overflow-hidden touch-none" : ""}`}>
        <Tabs 
          value={currentTab} 
          orientation="vertical"
          onValueChange={(val) => { 
            if (val === 'users') {
              setIsUserManagementOpen(true);
            } else {
              setCurrentTab(val); 
              setIsUserManagementOpen(false); 
            }
          }} 
          className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:grid-rows-1 gap-10 items-stretch w-full relative overflow-hidden"
        >
          {/* Background Watermark moved here for stability */}
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.03] overflow-hidden z-0">
            <PharmaLogo className="h-[800px] w-[800px]" />
          </div>
          <aside className="w-full lg:w-[256px] lg:min-w-[256px] lg:max-w-[256px] flex flex-col gap-9 shrink-0 overflow-visible self-start touch-none lg:pt-[10px]">
            <div className="flex flex-col gap-3 w-full shrink-0">
              <div className="px-5 p-0 m-0 text-center flex flex-col items-center justify-center min-h-[40px]">
                <h3 className={`font-black text-blue-400/90 tracking-tight leading-tight transition-colors duration-300 no-interact ${
                  (getIdentityString(userProfile, user?.email).length || 0) > 20 ? "text-lg" : 
                  (getIdentityString(userProfile, user?.email).length || 0) > 15 ? "text-xl" : "text-2xl"
                }`}>
                  {getIdentityString(userProfile, user?.email)}
                </h3>
              </div>
              <Button 
                onClick={() => { resetForm(); setTransactionType("OUT"); setIsLogOpen(true); }}
                className="bg-brand-blue hover:brightness-110 text-white gap-3 shadow-lg shadow-brand-blue/20 h-14 w-full justify-start px-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="h-7 w-7 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
                  <ArrowDown className="h-4 w-4 text-brand-blue" strokeWidth={3} />
                </div>
                Dispense
              </Button>
              <Button 
                onClick={() => { resetForm(); setTransactionType("IN"); setIsLogOpen(true); }}
                className="bg-brand-blue hover:brightness-110 text-white gap-3 shadow-lg shadow-brand-blue/20 h-14 w-full justify-start px-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="h-7 w-7 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
                  <Plus className="h-4 w-4 text-brand-blue" strokeWidth={3} />
                </div>
                Add
              </Button>
              <Button 
                onClick={() => { resetForm(); setTransactionType("ADJUST"); setIsLogOpen(true); }}
                className="bg-brand-blue hover:brightness-110 text-white gap-3 shadow-lg shadow-brand-blue/20 h-14 w-full justify-start px-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <div className="h-7 w-7 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
                  <RefreshCcw className="h-4 w-4 text-brand-blue" strokeWidth={3} />
                </div>
                Adjust
              </Button>
            </div>
            
            <div className="flex flex-col w-full">
              <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 gap-1 w-full">
                <TabsTrigger 
                  value="inventory" 
                  className="w-full justify-start gap-4 h-11 px-4 rounded-xl data-active:!bg-transparent data-active:!shadow-none data-active:after:!hidden text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent text-base group"
                >
                  <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
                    <Pill className="h-4 w-4 text-brand-blue transition-all" strokeWidth={3} />
                  </div>
                  <span className={`whitespace-nowrap leading-none ${(currentTab === 'inventory' && !isUserManagementOpen && !isReconOpen) ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>Inventory View</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="history" 
                  className="w-full justify-start gap-4 h-11 px-4 rounded-xl data-active:!bg-transparent data-active:!shadow-none data-active:after:!hidden text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent text-base group"
                >
                  <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
                    <Search className="h-4 w-4 text-brand-blue transition-all" strokeWidth={3} />
                  </div>
                  <span className={`whitespace-nowrap leading-none ${(currentTab === 'history' && !isUserManagementOpen && !isReconOpen) ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>Audit Log</span>
                </TabsTrigger>
 
                <Button
                  type="button"
                  onClick={() => {
                    setReconShowPreview(false);
                    setReconViewMode("form");
                    setSelectedHistoricalReport(null);
                    setIsReconOpen(true);
                  }}
                  className="w-full justify-start gap-4 h-11 px-4 rounded-xl bg-transparent hover:bg-brand-blue/5 border border-transparent shadow-none transition-all text-base text-brand-blue font-normal"
                >
                  <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
                    <Clipboard className="h-4 w-4 text-brand-blue transition-all" strokeWidth={3} />
                  </div>
                  <span className={`whitespace-nowrap leading-none ${isReconOpen ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>Reconciliations</span>
                </Button>
                <TabsTrigger 
                  value="alerts" 
                  className="w-full justify-start gap-4 h-11 px-4 rounded-xl data-active:!bg-transparent data-active:!shadow-none data-active:after:!hidden text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent text-base group"
                >
                  <div className="relative">
                    <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
                      <AlertTriangle className="h-5 w-5 text-brand-blue transition-all" strokeWidth={3} />
                    </div>
                  </div>
                  <span className={`whitespace-nowrap leading-none ${(currentTab === 'alerts' && !isUserManagementOpen && !isReconOpen) ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>Alerts</span>
                  {lowStockItems.length > 0 && (
                    <div className="ml-auto relative flex items-center justify-center h-5 w-5">
                      <span className="absolute inset-0 rounded-full bg-brand-yellow opacity-75 animate-ping" style={{ transform: 'translateZ(0)' }} />
                      <Badge className="relative h-5 w-5 flex items-center justify-center text-[10px] bg-brand-yellow text-brand-blue border-none font-black rounded-full p-0 shadow-sm leading-none">
                        {lowStockItems.length}
                      </Badge>
                    </div>
                  )}
                </TabsTrigger>
                <TabsTrigger 
                  value="users" 
                  onClick={(e) => {
                    e.preventDefault();
                    setIsUserManagementOpen(true);
                  }}
                  className="w-full justify-start gap-4 h-11 px-4 rounded-xl data-active:!bg-transparent data-active:!shadow-none data-active:after:!hidden text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent text-base group"
                >
                  <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
                    <Users className="h-4 w-4 text-brand-blue" strokeWidth={3} />
                  </div>
                  <span className={`whitespace-nowrap leading-none ${(isUserManagementOpen && !isReconOpen) ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>User Management</span>
                </TabsTrigger>
                <TabsContent value="users" className="hidden" />
              </TabsList>
              {user && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-brand-blue/5 border border-brand-blue/10 group mt-9">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-xs font-black text-brand-blue/60 truncate tracking-tight">
                      {userProfile?.organizationName || userProfile?.displayName || user.displayName}
                    </span>
                    {!userProfile?.organizationName && (
                      <span className="text-[7px] font-black bg-brand-yellow text-brand-blue px-1 rounded-sm w-fit uppercase tracking-tighter mt-0.5 animate-pulse">Setup Required</span>
                    )}
                    <span className="text-[10px] text-brand-grey font-medium truncate no-interact">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => {
                        setEditingOrgName(userProfile?.organizationName || "");
                        setIsProfileEditOpen(true);
                      }}
                      className="bg-brand-yellow text-brand-blue hover:brightness-110 h-8 w-8 shrink-0 rounded-full border border-brand-yellow/20 shadow-sm"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setIsLogoutConfirmOpen(true)}
                      className="bg-brand-yellow text-brand-blue hover:brightness-110 h-8 w-8 shrink-0 rounded-full border border-brand-yellow/20 shadow-sm"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              <div className="mt-6 flex flex-col items-center gap-1 opacity-20 hover:opacity-40 transition-opacity no-interact select-none pb-2">
                <span className="text-[9px] font-black font-mono text-brand-blue tracking-[0.2em] uppercase">
                  Registry Terminal
                </span>
                <span className="text-[8px] font-mono font-bold text-brand-blue/70">
                  {APP_VERSION}
                </span>
              </div>
            </div>
          </aside>

          <div className="w-full relative min-w-0 flex-1 z-10 flex flex-col min-h-0 overflow-hidden">

            <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
               <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="px-6 py-3 bg-brand-blue text-white relative shrink-0">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                      {transactionType === "OUT" && <ArrowDown className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
                      {transactionType === "IN" && <Plus className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
                      {transactionType === "ADJUST" && <RefreshCcw className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
                      {transactionType === "VERIFY" && <Check className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
                    </div>
                    
                    <div className="flex flex-col gap-0 text-left">
                      <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                        {transactionType === "OUT" ? "Dispense Medication" : 
                         transactionType === "IN" ? "Add to Inventory" : 
                         transactionType === "ADJUST" ? "Adjust Inventory" : 
                         "Verify Inventory Count"}
                      </DialogTitle>
                      <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                        AUDIT LOG ACTIVE
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-5 pt-3">
                    <div className="grid gap-4">
                    {transactionType === "IN" ? (
                      <div className="grid gap-3 p-3 border border-brand-blue/20 rounded-lg bg-brand-blue/5">
                        <div className="grid gap-1.5 relative">
                          <Label htmlFor="new-name" className="text-brand-dark-grey text-xs font-normal flex justify-between">
                            Medication
                            {selectedSubstance && (
                              <button 
                                onClick={(e) => {
                                  e.preventDefault();
                                  setSelectedSubstance("");
                                  setNewMed({
                                    name: "",
                                    strength: "",
                                    schedule: "",
                                    ndc: "",
                                    unit: "",
                                    packageSize: "",
                                    minThreshold: ""
                                  });
                                }}
                                className="text-[10px] text-brand-blue hover:underline font-normal"
                              >
                                Clear Selection
                              </button>
                            )}
                          </Label>
                          <div className="relative">
                            <Input 
                              id="new-name" 
                              value={newMed.name} 
                              onChange={e => {
                                const val = e.target.value;
                                setNewMed({...newMed, name: val});
                                // Clear selected substance if name doesn't match selected item's name perfectly
                                if (selectedSubstance) {
                                  const item = inventory.find(i => i.id === selectedSubstance);
                                  if (item && item.name !== val) {
                                    setSelectedSubstance("");
                                  }
                                }
                                setIsNewMedSearchFocused(true);
                              }} 
                              onFocus={() => setIsNewMedSearchFocused(true)}
                              onBlur={() => {
                                setTimeout(() => setIsNewMedSearchFocused(false), 200);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  setIsNewMedSearchFocused(false);
                                  document.getElementById('new-strength')?.focus();
                                }
                              }}
                              placeholder="e.g. Oxycodone" 
                              className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal" 
                              readOnly={!!selectedSubstance}
                            />
                            {newMed.name && !selectedSubstance && isNewMedSearchFocused && (
                              <div className="absolute z-[100] w-full mt-1 bg-brand-surface border border-brand-grey/20 rounded-md shadow-2xl max-h-60 overflow-y-auto left-0 top-full">
                                {inventory
                                  .filter(s => 
                                    s.name.toLowerCase().startsWith(newMed.name.toLowerCase()) || 
                                    s.ndc.startsWith(newMed.name)
                                  )
                                  .sort(compareSubstances)
                                  .map(s => (
                                    <div
                                      key={s.id}
                                      className="px-3 py-2 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group"
                                      onClick={() => {
                                        setSelectedSubstance(s.id);
                                        setNewMed({
                                          name: s.name,
                                          strength: s.strength,
                                          schedule: s.schedule,
                                          ndc: s.ndc,
                                          unit: s.unit,
                                          packageSize: s.packageSize.toString(),
                                          minThreshold: s.minThreshold.toString()
                                        });
                                        setIsNewMedSearchFocused(false);
                                      }}
                                    >
                                      <div className="flex flex-col min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className="font-normal text-sm group-hover:text-brand-blue text-brand-dark-grey">{s.name}</span>
                                          <span className="font-normal text-sm text-brand-dark-grey/80">{s.strength}</span>
                                        </div>
                                        <span className="text-xs text-brand-blue font-bold uppercase tracking-wider mt-0.5">{s.ndc}</span>
                                      </div>
                                      <div className="flex items-center shrink-0 justify-start w-36 pl-3 text-left">
                                        <span className="text-[10px] text-brand-blue font-extrabold">Stock: {s.currentStock} {s.unit || "Units"}</span>
                                      </div>
                                    </div>
                                  ))}
                                {inventory.filter(s => 
                                  s.name.toLowerCase().startsWith(newMed.name.toLowerCase()) || 
                                  s.ndc.startsWith(newMed.name)
                                ).length === 0 && (
                                  <div className="px-3 py-2 text-xs text-brand-dark-grey/50 italic">New medication entry...</div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor="new-strength" className="text-brand-dark-grey text-xs font-normal">Strength</Label>
                            <Input 
                              id="new-strength" 
                              value={newMed.strength} 
                              onChange={e => !selectedSubstance && setNewMed({...newMed, strength: e.target.value})} 
                              placeholder="e.g. 10mg" 
                              className={`border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal ${selectedSubstance ? 'opacity-70 cursor-not-allowed' : ''}`}
                              readOnly={!!selectedSubstance}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="new-unit" className="text-brand-dark-grey text-xs font-normal">Units</Label>
                            <Input 
                              id="new-unit" 
                              value={newMed.unit} 
                              onChange={e => !selectedSubstance && setNewMed({...newMed, unit: e.target.value})} 
                              placeholder="e.g. Tablets" 
                              className={`border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal ${selectedSubstance ? 'opacity-70 cursor-not-allowed' : ''}`}
                              readOnly={!!selectedSubstance}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor="new-ndc" className="text-brand-dark-grey text-xs font-normal">NDC</Label>
                            <Input 
                              id="new-ndc" 
                              value={newMed.ndc} 
                              onChange={e => !selectedSubstance && setNewMed({...newMed, ndc: e.target.value})} 
                              placeholder="00000-0000-00" 
                              className={`border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal ${selectedSubstance ? 'opacity-70 cursor-not-allowed' : ''}`}
                              readOnly={!!selectedSubstance}
                            />
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="new-package-size" className="text-brand-dark-grey text-xs font-normal">Package Size</Label>
                            <Input 
                              id="new-package-size" 
                              type="text"
                              inputMode="numeric"
                              value={newMed.packageSize} 
                              onChange={e => {
                                if (selectedSubstance) return;
                                const val = e.target.value;
                                if (val === "" || /^\d*$/.test(val)) {
                                  setNewMed({...newMed, packageSize: val});
                                }
                              }} 
                              placeholder="e.g. 100"
                              className={`border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal ${selectedSubstance ? 'opacity-70 cursor-not-allowed' : ''}`}
                              readOnly={!!selectedSubstance}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="grid gap-1.5">
                            <Label htmlFor="new-schedule" className="text-brand-dark-grey text-xs font-normal">Schedule</Label>
                            <Select 
                              value={newMed.schedule} 
                              onValueChange={(v: Schedule) => !selectedSubstance && setNewMed({...newMed, schedule: v})}
                              disabled={!!selectedSubstance}
                            >
                              <SelectTrigger className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-9 font-normal data-placeholder:text-brand-grey/50 data-placeholder:font-normal ${selectedSubstance ? 'opacity-70 cursor-not-allowed' : ''} ${!newMed.schedule ? 'text-brand-grey/50' : 'text-brand-dark-grey'}`}>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent className="bg-brand-surface" align="start">
                                {SCHEDULES.map(s => (
                                  <SelectItem key={s} value={s} className="pl-3 text-brand-dark-grey font-normal">{s}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid gap-1.5">
                            <Label htmlFor="new-min-threshold" className="text-brand-dark-grey text-xs font-normal">Min Threshold</Label>
                            <Input 
                              id="new-min-threshold" 
                              type="text"
                              inputMode="numeric"
                              value={newMed.minThreshold} 
                              onChange={e => {
                                if (selectedSubstance) return;
                                const val = e.target.value;
                                if (val === "" || /^\d*$/.test(val)) {
                                  setNewMed({...newMed, minThreshold: val});
                                }
                              }} 
                              placeholder="e.g. 50" 
                              className={`border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal ${selectedSubstance ? 'opacity-70 cursor-not-allowed' : ''}`}
                              readOnly={!!selectedSubstance}
                            />
                          </div>
                        </div>
                      </div>
                    ) : transactionType === "VERIFY" ? (() => {
                      const subObj = selectedSubstanceDetail || inventory.find(s => s.id === selectedSubstance);
                      return (
                        <div className="pt-4 px-4 pb-3 border-2 border-solid border-brand-blue/20 rounded-xl bg-brand-blue/5 text-center space-y-4">
                          <div className="flex justify-center">
                            <div className="h-14 w-14 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg border-4 border-brand-blue">
                              <Check className="h-7 w-7 text-brand-blue" strokeWidth={4} />
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <h3 className="text-base font-bold text-brand-blue">Confirm Inventory Count</h3>
                            <div className="flex flex-col items-center">
                              {/* Text line above the name */}
                              <span className="shrink-0 font-medium text-xs text-brand-dark-grey/70 leading-none">
                                I confirm that the physical count of:
                              </span>
                              
                              {/* Space above the medication name to the text line above it */}
                              <div className="h-3" />
                              
                              {/* Name and NDC in the center */}
                              <div className="flex flex-col items-center justify-center">
                                <span className="font-bold text-brand-blue block text-base leading-none text-center">
                                  {subObj?.name || ""}{" "}{subObj?.strength || ""}
                                </span>
                                <span className="text-xs text-brand-blue font-bold block mt-1 leading-none text-center">
                                  NDC: {subObj?.ndc || ""}
                                </span>
                              </div>
                              
                              {/* Space below the NDC to the top edge of the bubble below it (increased slightly to h-4 to align visually) */}
                              <div className="h-4" />
                              
                              {/* Quantity selection row/bubble */}
                              <div className="flex items-center justify-center gap-1.5 text-xs text-brand-dark-grey/70 leading-none">
                                <span>is currently</span>
                                <Input 
                                  id="quantity" 
                                  type="number" 
                                  placeholder="0"
                                  className="w-24 text-center border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-8 px-2 font-bold m-0 rounded-md shadow-inner"
                                  value={quantity}
                                  onChange={(e) => setQuantity(e.target.value)}
                                />{" "}
                                <span>{subObj?.unit || "Units"}.</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="pt-3 border-t-2 border-solid border-brand-blue/10 w-full flex flex-col items-center gap-1.5">
                            <div className="text-xs font-bold text-brand-blue flex items-center gap-1.5 px-3 py-1 bg-brand-yellow rounded-full border border-brand-yellow/55 shadow-sm">
                              <span>System Balance:</span>
                              <span className="text-brand-blue">{subObj?.currentStock ?? 0} {subObj?.unit || "Units"}</span>
                            </div>
                            <div className="text-[9px] text-brand-dark-grey/40 uppercase font-bold tracking-widest mt-1">
                              Timestamp: {new Date().toLocaleString()}
                            </div>
                          </div>
                        </div>
                      );
                    })() : (
                    <div className="grid gap-1.5">
                      <Label htmlFor="substance" className="text-brand-dark-grey text-xs">Medication</Label>
                      <div className="relative">
                        <Input
                          placeholder="Type to search medication..."
                          value={substanceSearch}
                          onChange={(e) => {
                            setSubstanceSearch(e.target.value);
                            setSelectedSubstance(""); // Clear selection when typing
                            setIsSubstanceSearchFocused(true);
                          }}
                          onFocus={() => setIsSubstanceSearchFocused(true)}
                          onBlur={() => {
                            setTimeout(() => setIsSubstanceSearchFocused(false), 200);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              setIsSubstanceSearchFocused(false);
                              document.getElementById('quantity')?.focus();
                            }
                          }}
                          className="border-brand-grey/20 focus-visible:ring-brand-blue pr-10 bg-brand-surface text-brand-dark-grey"
                        />
                        {substanceSearch && !selectedSubstance && isSubstanceSearchFocused && (
                          <div className="absolute z-50 w-full mt-1 bg-brand-surface border border-brand-grey/20 rounded-md shadow-xl max-h-60 overflow-y-auto">
                            {inventory
                              .filter(s => 
                                s.name.toLowerCase().startsWith(substanceSearch.toLowerCase()) || 
                                s.ndc.startsWith(substanceSearch)
                              )
                              .sort(compareSubstances)
                              .map(s => (
                                <div
                                  key={s.id}
                                  className="px-3 py-2 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group"
                                  onClick={() => {
                                    setSelectedSubstance(s.id);
                                    setSubstanceSearch(s.name);
                                  }}
                                >
                                  <div className="flex flex-col min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-normal text-sm group-hover:text-brand-blue text-brand-dark-grey">{s.name}</span>
                                      <span className="font-normal text-sm text-brand-dark-grey/80">{s.strength}</span>
                                    </div>
                                    <span className="text-xs text-brand-blue font-bold uppercase tracking-wider mt-0.5">{s.ndc}</span>
                                  </div>
                                  <div className="flex items-center shrink-0 justify-start w-36 pl-3 text-left">
                                    <span className="text-[10px] text-brand-blue font-extrabold">Stock: {s.currentStock} {s.unit || "Units"}</span>
                                  </div>
                                </div>
                              ))}
                            {inventory.filter(s => 
                              s.name.toLowerCase().startsWith(substanceSearch.toLowerCase()) || 
                              s.ndc.startsWith(substanceSearch)
                            ).length === 0 && (
                              <div className="px-3 py-2 text-xs text-brand-dark-grey/50 italic">No matches found</div>
                            )}
                          </div>
                        )}
                      </div>
                      {selectedSubstance && (
                        <div className="mt-1 grid grid-cols-2 gap-2">
                          <div className="p-2 bg-brand-blue/5 rounded border border-brand-blue/10">
                            <Label className="text-[10px] text-brand-blue uppercase font-normal">Strength</Label>
                            <div className="text-sm font-normal text-brand-dark-grey">
                              {inventory.find(i => i.id === selectedSubstance)?.strength}
                            </div>
                          </div>
                          <div className="p-2 bg-brand-blue/5 rounded border border-brand-blue/10">
                            <Label className="text-xs text-brand-blue uppercase font-normal">NDC</Label>
                            <div className="text-sm font-normal text-brand-dark-grey">
                              {inventory.find(i => i.id === selectedSubstance)?.ndc}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {transactionType !== "VERIFY" && (
                    <div className="grid gap-1.5">
                      <Label htmlFor="referenceNumber" className="text-brand-dark-grey text-xs">
                        {transactionType === "OUT" ? "RX #" : transactionType === "IN" ? "Invoice #" : "Reference #"}
                      </Label>
                      <Input 
                        id="referenceNumber" 
                        placeholder={transactionType === "OUT" ? "Enter RX #" : transactionType === "IN" ? "Enter invoice #" : "Auto-assigned"} 
                        className={`border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 ${transactionType === "ADJUST" ? "opacity-70 cursor-not-allowed bg-brand-blue/5" : ""}`}
                        value={referenceNumber}
                        onChange={(e) => {
                          if (transactionType === "ADJUST") return;
                          setReferenceNumber(e.target.value);
                        }}
                        readOnly={transactionType === "ADJUST"}
                      />
                    </div>
                  )}
                  {transactionType === "ADJUST" && (
                    <div className="grid gap-1.5">
                      <Label htmlFor="reason" className="text-brand-dark-grey text-xs">
                        Notes / Reason
                      </Label>
                      <Input 
                        id="reason" 
                        placeholder="Enter reason for adjustment" 
                        className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </div>
                  )}
                  
                  {transactionType !== "VERIFY" && (
                    <div className="grid gap-1.5">
                      <Label htmlFor="quantity" className="text-brand-dark-grey text-xs">
                        {transactionType === "IN" ? "Quantity Received" : transactionType === "OUT" ? "Quantity Dispensed" : "Adjustment Amount (+/-)"}
                      </Label>
                      <Input 
                        id="quantity" 
                        type="number" 
                        placeholder={transactionType === "ADJUST" ? "e.g. 10 or -10" : "0"} 
                        className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <div className="grid gap-1.5">
                      <Label htmlFor="user-select" className="text-brand-dark-grey text-xs">Performing User</Label>
                      <Select value={selectedUser || undefined} onValueChange={setSelectedUser}>
                        <SelectTrigger id="user-select" className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-9 font-normal data-placeholder:text-brand-grey/50 data-placeholder:font-normal ${!selectedUser ? 'text-brand-grey/50' : 'text-brand-dark-grey'}`}>
                          <SelectValue placeholder="Select...">
                            {(() => {
                              const u = users.find(u => u.id === selectedUser);
                              return u ? (
                                <span>{u.name} {u.title && <span className="text-brand-dark-grey">({u.title})</span>}</span>
                              ) : null;
                            })()}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent className="bg-brand-surface" align="start">
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id} className="text-brand-dark-grey pl-3">
                              {u.name} {u.title && <span className="text-brand-dark-grey">({u.title})</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedSubstance && quantity && transactionType !== "VERIFY" && (
                      <div className="p-2 bg-brand-blue/5 rounded-lg border border-brand-blue/10 flex justify-between items-center h-9 shadow-sm">
                        <span className="text-sm font-bold text-brand-blue uppercase">Projected</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-black font-bold flex items-center gap-2">
                            <span>{inventory.find(i => i.id === selectedSubstance)?.currentStock}</span>
                            <svg className="h-3.5 w-7 text-black shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </span>
                          <span className="text-sm font-bold text-brand-blue">
                            {(inventory.find(i => i.id === selectedSubstance)?.currentStock || 0) + 
                             (transactionType === "IN" ? Number(quantity) : 
                              transactionType === "OUT" ? -Number(quantity) : 
                              Number(quantity))}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                      <div className="grid gap-1.5">
                        {false ? (
                          <div className="space-y-2">
                             <Label className="flex justify-between items-center text-brand-dark-grey text-xs">
                              Identity Verification Capture
                              {capturedPhoto ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 text-[9px] text-brand-blue hover:text-brand-blue/80 px-1"
                                  onClick={() => {
                                    setCapturedPhoto(null);
                                    startCamera();
                                  }}
                                >
                                  Retake
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 text-[9px] text-brand-blue/60 hover:text-brand-blue px-1"
                                  onClick={() => setUseSignatureFallback(true)}
                                >
                                  Use Signature Instead
                                </Button>
                              )}
                            </Label>
                            <div className="border border-brand-grey/20 rounded-md bg-brand-light-grey/30 overflow-hidden relative min-h-[120px] flex items-center justify-center">
                              {capturedPhoto ? (
                                <img src={capturedPhoto} alt="Captured identity" className="w-full h-auto" />
                              ) : isCameraActive ? (
                                <div className="flex flex-col w-full gap-3 p-3 bg-brand-light-grey/20 items-center">
                                  <div className="flex justify-center pt-2">
                                    <Button 
                                      type="button"
                                      className="bg-brand-blue text-white rounded-full h-16 w-16 p-0 shadow-2xl border-4 border-white hover:bg-brand-blue/90 active:scale-95 transition-all z-30"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        capturePhoto();
                                      }}
                                    >
                                      <Camera className="h-8 w-8" />
                                    </Button>
                                  </div>
                                  <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-brand-blue/10 bg-black flex items-center justify-center">
                                    <video 
                                      ref={videoRef} 
                                      autoPlay 
                                      playsInline 
                                      muted
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col items-center gap-2 w-full p-4">
                                  <Button 
                                    variant="outline" 
                                    type="button"
                                    className="flex flex-col gap-2 h-24 w-full border-dashed border-2 bg-brand-surface group hover:border-brand-blue hover:bg-brand-blue/5 transition-all"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      startCamera();
                                    }}
                                  >
                                    <Camera className="h-6 w-6 text-brand-blue/40 group-hover:text-brand-blue transition-colors" />
                                    <span className="text-[10px] font-normal text-brand-grey uppercase">Activate Camera</span>
                                  </Button>
                                  {cameraPermissionError && (
                                    <motion.div 
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: 'auto' }}
                                      className="w-full mt-2 overflow-hidden"
                                    >
                                      <div className="bg-brand-blue border-2 border-brand-yellow shadow-2xl rounded-xl p-5 flex items-start gap-4 text-left transition-all ring-4 ring-brand-yellow/10">
                                        <div className="bg-brand-yellow rounded-full p-2.5 flex-shrink-0 mt-0.5 shadow-md">
                                          <Lock className="h-5 w-5 text-brand-blue" strokeWidth={3} />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-[11px] font-normal text-white uppercase tracking-[0.15em] leading-none mb-1">Access Locked</p>
                                          <p className="text-[10px] text-white/80 font-normal leading-tight">Please click the lock icon in your browser's address bar to allow camera permissions.</p>
                                          <button 
                                            type="button"
                                            className="text-[10px] text-brand-yellow hover:text-brand-yellow/80 font-normal uppercase tracking-widest underline mt-4 block transition-colors"
                                            onClick={() => window.open("https://support.google.com/chrome/answer/2693767", "_blank")}
                                          >
                                            View Permission Guide
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </div>
                              )}
                              <canvas ref={canvasRef} className="hidden" />
                            </div>
                          </div>
                        ) : null}
                        {userProfile?.isSignatureRequirementEnabled !== false ? (
                          <div className="space-y-2">
                            <Label className="flex justify-between items-center text-brand-dark-grey text-xs">
                              User Signature
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 text-[9px] text-brand-blue hover:text-brand-blue/80 px-1"
                                onClick={(e) => {
                                  e.preventDefault();
                                  sigPad.current?.clear();
                                }}
                              >
                                Clear
                              </Button>
                            </Label>
                            <div className="border border-brand-grey/20 rounded-md bg-brand-light-grey/30 overflow-hidden">
                              <SignatureCanvas 
                                ref={sigPad}
                                penColor="#1e68cf"
                                canvasProps={{
                                  id: "signature-canvas",
                                  className: "w-full h-24 cursor-crosshair"
                                }}
                              />
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              
                <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 flex flex-col sm:flex-row gap-3 shrink-0">
                  <Button 
                    onClick={() => {
                      setIsLogOpen(false);
                      stopCamera();
                      setCapturedPhoto(null);
                      setUseSignatureFallback(false);
                    }} 
                    className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl order-2 sm:order-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 transition-all active:scale-[0.98] rounded-xl order-1 sm:order-2 disabled:opacity-100"
                    onClick={handleLogTransaction}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Logging..." : 
                     transactionType === "OUT" ? "Dispense" : 
                     transactionType === "IN" ? "Add" : 
                     transactionType === "ADJUST" ? "Adjust" : 
                     transactionType === "VERIFY" ? "Confirm Verification" : 
                     "Execute"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Transaction Detail Modal */}
            <Dialog open={!!viewingTransaction} onOpenChange={(open) => !open && setViewingTransaction(null)}>
              <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-brand-blue/10 p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
                <DialogHeader className="p-6 bg-brand-blue text-white relative shrink-0">
                  <div className="flex items-center gap-4 relative z-10 text-left">
                    <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                      <History className="h-6 w-6 text-brand-blue" />
                    </div>
                    <div className="flex flex-col gap-0">
                      <DialogTitle className="text-xl font-black tracking-tight text-white uppercase leading-none">
                        Transaction Details
                      </DialogTitle>
                      <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                        FULL AUDIT RECORD FOR REFERENCE # {formatRefForDisplay(viewingTransaction?.referenceNumber)}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                  <div className="p-6 space-y-6">
                    {viewingTransaction && (
                      <>
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">Medication</Label>
                            <div className="text-sm font-bold text-brand-dark-grey">{viewingTransaction.substanceName}&nbsp;{viewingTransaction.strength}</div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">NDC</Label>
                            <div>
                              <button 
                                onClick={() => handleNDCClick(viewingTransaction.ndc)}
                                className="text-lg text-brand-blue hover:underline font-black transition-colors"
                              >
                                {viewingTransaction.ndc}
                              </button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">Action</Label>
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full flex items-center justify-center shrink-0 shadow-sm bg-brand-yellow text-brand-blue border border-brand-yellow/20">
                                {viewingTransaction.type === 'IN' && <Plus className="h-3 w-3" strokeWidth={3} />}
                                {viewingTransaction.type === 'OUT' && <ArrowDown className="h-3 w-3" strokeWidth={3} />}
                                {viewingTransaction.type === 'ADJUST' && <RefreshCcw className="h-3 w-3" strokeWidth={3} />}
                                {viewingTransaction.type === 'VERIFY' && <Check className="h-3 w-3" strokeWidth={3} />}
                              </div>
                              <span className="text-sm font-bold text-brand-dark-grey uppercase">
                                {viewingTransaction.type === 'IN' ? 'ADDED' : 
                                 viewingTransaction.type === 'OUT' ? 'DISPENSED' : 
                                 viewingTransaction.type === 'ADJUST' ? 'ADJUSTED' : 
                                 'VERIFIED'}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">
                              {viewingTransaction.type === 'VERIFY' ? 'Quantity Verified' : 'Quantity'}
                            </Label>
                            <div className="text-sm font-bold text-brand-dark-grey">
                              {viewingTransaction.type === 'VERIFY' 
                                ? viewingTransaction.newStock 
                                : (viewingTransaction.type === 'IN' ? '+' : viewingTransaction.type === 'OUT' ? '-' : (viewingTransaction.type === 'ADJUST' && viewingTransaction.quantity > 0 ? '+' : '')) + viewingTransaction.quantity}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">Reference #</Label>
                            <div className="text-sm text-brand-blue font-bold">{formatRefForDisplay(viewingTransaction.referenceNumber)}</div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">Performed By</Label>
                            <div className="text-sm text-brand-dark-grey no-interact">
                              {escapeEmail(viewingTransaction.performedByName)}
                              {viewingTransaction.performedByTitle ? (
                                <span className="ml-1 text-xs text-brand-dark-grey">({viewingTransaction.performedByTitle})</span>
                              ) : (
                                (() => {
                                  const u = users.find(usr => usr.name === viewingTransaction.performedByName);
                                  return u?.title ? <span className="ml-1 text-xs text-brand-dark-grey">({u.title})</span> : null;
                                })()
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">Timestamp</Label>
                            <div className="text-sm text-brand-dark-grey">{formatDateTime(viewingTransaction.timestamp)}</div>
                          </div>
                        </div>

                        {viewingTransaction.type === 'ADJUST' && (
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-brand-blue/60">Reason / Notes</Label>
                            <div className="text-sm p-3 bg-brand-light-grey/30 rounded-md border border-brand-grey/10 text-brand-dark-grey italic">
                              {viewingTransaction.reason}
                            </div>
                          </div>
                        )}

                        <div className="space-y-2 pb-4 pt-2 border-t border-brand-blue/5">
                          <Label className="text-[10px] uppercase font-bold text-brand-blue/60">
                            {viewingTransaction.photo ? 'Identity Capture' : 'Digital Signature'}
                          </Label>
                          <div className="border border-brand-grey/20 rounded-md bg-white overflow-hidden flex items-center justify-center p-2 min-h-[140px]">
                            {viewingTransaction.photo ? (
                              <img 
                                src={viewingTransaction.photo} 
                                alt="Identity Capture" 
                                className="max-w-full h-auto rounded shadow-sm"
                                referrerPolicy="no-referrer"
                              />
                            ) : viewingTransaction.signature ? (
                              <img 
                                src={viewingTransaction.signature} 
                                alt="User Signature" 
                                className="max-h-24 object-contain"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="text-xs text-brand-dark-grey/40 italic">No verification data recorded</div>
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </ScrollArea>

                <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0">
                  <Button 
                    className="w-full h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/20 rounded-xl"
                    onClick={() => setViewingTransaction(null)}
                  >
                    Close Record
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* User Management Modal */}
            <Dialog 
              open={isUserManagementOpen} 
              onOpenChange={(open) => {
                setIsUserManagementOpen(open);
                if (!open) setCurrentTab('inventory');
              }}
              modal="trap-focus"
            >
              <DialogContent 
                showCloseButton={false} 
                initialFocus={false}
                className="sm:max-w-[500px] bg-brand-surface border-brand-blue/10 p-0 overflow-hidden rounded-2xl flex flex-col h-[740px] max-h-[92vh]"
              >
                <DialogHeader className="p-6 pb-3 bg-brand-blue text-white relative shrink-0">
                  <div className="flex items-center gap-4 relative z-10 text-left">
                    <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden border border-brand-yellow/20">
                      <Users className="h-5 w-5 text-brand-blue" />
                    </div>
                    <div className="flex flex-col gap-0">
                      <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                        User Management
                      </DialogTitle>
                      <DialogDescription className="text-brand-yellow/70 font-bold text-[9px] tracking-widest mt-1 uppercase">
                        Terminal Access Control
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                <div className="px-6 pt-1 pb-0 space-y-3 shrink-0">
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-brand-dark-grey uppercase tracking-wider">System Configuration</Label>
                      <div 
                         className="hidden"
                        onClick={togglePhotoRequirement}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${userProfile?.isPhotoRequirementEnabled ? 'bg-brand-yellow text-brand-blue' : 'bg-brand-grey/20 text-brand-grey'}`}>
                            <Camera className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={`text-xs transition-colors ${userProfile?.isPhotoRequirementEnabled ? 'text-brand-blue font-black' : 'text-brand-blue/50 font-bold'}`}>Photo Verification</p>
                            <p className={`text-[8px] font-medium uppercase tracking-tight ${userProfile?.isPhotoRequirementEnabled ? 'text-brand-blue' : 'text-brand-blue/40'}`}>Capture photos for each transaction</p>
                          </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full p-1 transition-all ${userProfile?.isPhotoRequirementEnabled ? 'bg-brand-blue' : 'bg-brand-grey/30'}`}>
                          <div className={`h-3 w-3 bg-white rounded-full transition-all ${userProfile?.isPhotoRequirementEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>

                      <div 
                        className="flex items-center justify-between p-3 bg-brand-blue/5 rounded-xl border border-brand-blue/10 cursor-pointer hover:bg-brand-blue/10 transition-colors group mt-2"
                        onClick={toggleSignatureRequirement}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${userProfile?.isSignatureRequirementEnabled !== false ? 'bg-brand-yellow text-brand-blue' : 'bg-brand-grey/20 text-brand-grey'}`}>
                            <PenTool className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={`text-xs transition-colors ${userProfile?.isSignatureRequirementEnabled !== false ? 'text-brand-blue font-black' : 'text-brand-blue/50 font-bold'}`}>Signature Verification</p>
                            <p className={`text-[8px] font-medium uppercase tracking-tight ${userProfile?.isSignatureRequirementEnabled !== false ? 'text-brand-blue' : 'text-brand-blue/40'}`}>Enforce digital signatures on transactions & reports</p>
                          </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full p-1 transition-all ${userProfile?.isSignatureRequirementEnabled !== false ? 'bg-brand-blue' : 'bg-brand-grey/30'}`}>
                          <div className={`h-3 w-3 bg-white rounded-full transition-all ${userProfile?.isSignatureRequirementEnabled !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>

                      <div 
                        className="flex items-center justify-between p-3 bg-brand-blue/5 rounded-xl border border-brand-blue/10 cursor-pointer hover:bg-brand-blue/10 transition-colors group mt-2"
                        onClick={toggleAlertsRequirement}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${userProfile?.isAlertsEnabled !== false ? 'bg-brand-yellow text-brand-blue' : 'bg-brand-grey/20 text-brand-grey'}`}>
                            <AlertTriangle className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={`text-xs transition-colors ${userProfile?.isAlertsEnabled !== false ? 'text-brand-blue font-black' : 'text-brand-blue/50 font-bold'}`}>System Alerts</p>
                            <p className={`text-[8px] font-medium uppercase tracking-tight ${userProfile?.isAlertsEnabled !== false ? 'text-brand-blue' : 'text-brand-blue/40'}`}>Enable low-stock visual alerts and menu tracking</p>
                          </div>
                        </div>
                        <div className={`w-10 h-5 rounded-full p-1 transition-all ${userProfile?.isAlertsEnabled !== false ? 'bg-brand-blue' : 'bg-brand-grey/30'}`}>
                          <div className={`h-3 w-3 bg-white rounded-full transition-all ${userProfile?.isAlertsEnabled !== false ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      </div>
                    </div>

                    
                    {/* Removed Reconciliation Report Options Section */}
                  </div>

                  <div className="space-y-1.5 pt-1.5">
                    <Label className="text-xs font-semibold text-brand-dark-grey uppercase tracking-wider">Add Authorized User</Label>
                    <div className="flex gap-2 items-center">
                      <Input 
                        placeholder="Full Name..." 
                        value={newUserName}
                        onChange={(e) => setNewUserName(e.target.value)}
                        className="bg-brand-surface border-brand-grey/20 focus-visible:ring-brand-blue h-8 flex-1 text-sm"
                      />
                      <Select value={newUserTitle || undefined} onValueChange={setNewUserTitle}>
                        <SelectTrigger className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-8 flex items-center w-28 text-xs font-normal ${!newUserTitle ? 'text-brand-grey/50' : 'text-brand-dark-grey'}`}>
                          <SelectValue placeholder="Title...." />
                        </SelectTrigger>
                        <SelectContent className="bg-brand-surface border-brand-blue/10 min-w-0" align="start">
                          <SelectItem value="PIC">PIC</SelectItem>
                          <SelectItem value="RPh">RPh</SelectItem>
                          <SelectItem value="Tech">Tech</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        onClick={handleAddUser} 
                        className="bg-brand-yellow text-brand-blue hover:brightness-110 h-8 px-4 font-black shadow-sm"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-grow min-h-0 flex flex-col">
                  <div className="px-6 pt-1.5 pb-1 shrink-0">
                    <Label className="text-xs font-semibold text-brand-dark-grey uppercase tracking-wider">Authorized Registry Personnel</Label>
                  </div>
                  <div className="flex-1 min-h-0 px-6 pb-2 mt-1 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 border border-brand-grey/20 rounded-lg bg-brand-surface shadow-inner relative overflow-hidden flex flex-col">
                      <div className="flex-1 w-full overflow-y-auto scrollbar-thin scrollbar-thumb-brand-blue/20 touch-auto min-h-0">
                        <table className="w-full caption-bottom text-sm border-separate border-spacing-0 relative">
                          <TableHeader className="sticky top-0 z-40 bg-brand-light-grey">
                            <TableRow className="bg-brand-light-grey hover:bg-transparent">
                              <TableHead className={`${tableHeadClass} bg-brand-light-grey border-b border-brand-blue/10 sticky top-0 z-40 h-8 text-xs`}>Name & Title</TableHead>
                              <TableHead className={`${tableHeadClass} text-center bg-brand-light-grey border-b border-brand-blue/10 sticky top-0 z-40 h-8 text-xs`}>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {users.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={2} className="text-center py-6 text-[10px] text-brand-grey/40 uppercase font-bold">No registered users</TableCell>
                              </TableRow>
                            ) : users.map((u) => (
                              <TableRow key={u.id} className="hover:bg-brand-blue/5 h-8">
                                <TableCell className="font-medium text-brand-dark-grey py-1 text-center text-xs">
                                  {editingUser?.id === u.id ? (
                                    <div className="flex gap-1 items-center px-1">
                                      <Input 
                                        value={editingUser?.name || ""}
                                        onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)}
                                        className="h-6 text-xs bg-brand-surface border-brand-blue/30 flex-1"
                                        autoFocus
                                      />
                                      <Select 
                                        value={editingUser?.title || ""} 
                                        onValueChange={(v) => setEditingUser(prev => prev ? {...prev, title: v} : null)}
                                      >
                                        <SelectTrigger className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-6 flex items-center w-20 text-[10px] font-normal ${!editingUser?.title ? 'text-brand-grey/50' : 'text-brand-dark-grey'}`}>
                                          <SelectValue placeholder="Title" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-brand-surface border-brand-blue/10 min-w-0" align="start">
                                          <SelectItem value="PIC">PIC</SelectItem>
                                          <SelectItem value="RPh">RPh</SelectItem>
                                          <SelectItem value="Tech">Tech</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  ) : (
                                    <span>{u.name} {u.title && `(${u.title})`}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center py-1">
                                  <div className="flex justify-center gap-1">
                                    {editingUser?.id === u.id ? (
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-brand-blue"
                                        onClick={handleUpdateUser}
                                      >
                                        <PlusCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-6 w-6 p-0 text-brand-dark-grey hover:text-brand-blue"
                                        onClick={() => setEditingUser(u)}
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="h-6 w-6 p-0 text-brand-dark-grey hover:text-red-500"
                                      onClick={() => setUserToDeleteConfirm(u)}
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 touch-auto flex justify-end">
                  <Button 
                    onClick={() => {
                      setIsUserManagementOpen(false);
                      setCurrentTab('inventory');
                    }} 
                    className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-md shadow-brand-blue/10 rounded-lg transition-all"
                  >
                    Close User Management
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          <TabsContent value="inventory" className="flex-1 min-h-0 h-full mt-0 outline-none data-[state=inactive]:hidden flex flex-col relative z-20 m-0 overflow-hidden">
              <Card className="flex-1 min-h-0 border-brand-grey/10 shadow-sm bg-brand-surface/70 backdrop-blur-[2px] flex flex-col overflow-hidden py-0">
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-brand-blue/20 touch-auto">
                  <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
                    <TableHeader className="sticky top-0 z-40 bg-brand-blue">
                      <TableRow className="bg-brand-blue">
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Medication & Strength</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Schedule</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">NDC</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Current Stock</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isInitializing ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-brand-dark-grey/50">Loading inventory...</TableCell>
                        </TableRow>
                      ) : filteredInventory.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-brand-dark-grey/50">No entries found.</TableCell>
                        </TableRow>
                      ) : filteredInventory.map((item) => (
                    <TableRow 
                      key={item.id} 
                      className="hover:bg-brand-blue/5 transition-colors cursor-pointer group h-10"
                      onClick={() => setSelectedSubstanceDetail(item)}
                    >
                      <TableCell className="text-sm text-brand-dark-grey text-center py-1">
                        <span className="font-normal">{item.name}</span>{" "}
                        <span className="text-sm text-brand-dark-grey/80">{item.strength}</span>
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <Badge variant="outline" className={`border-brand-blue/20 text-brand-blue bg-brand-blue/5 text-[10px] px-2 py-0.5 mx-auto`}>
                          {item.schedule}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-normal text-sm text-center py-1">
                        <button 
                           onClick={(e) => { e.stopPropagation(); handleNDCClick(item.ndc); }}
                          className="text-brand-blue hover:underline font-normal transition-colors"
                        >
                          {item.ndc}
                        </button>
                      </TableCell>
                      <TableCell className={`text-center font-normal text-sm py-1 ${item.currentStock <= item.minThreshold ? 'text-brand-yellow' : 'text-brand-dark-grey'}`}>
                        {item.currentStock} {item.unit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
          </Card>
        </TabsContent>

          <TabsContent value="history" className="flex-1 min-h-0 h-full mt-0 outline-none data-[state=inactive]:hidden flex flex-col relative z-20 m-0 overflow-hidden">
            <div className="shrink-0 flex flex-col gap-3 bg-brand-surface p-4 rounded-lg border border-brand-grey/10 shadow-sm relative z-20">
              <div className="flex flex-row flex-wrap items-end gap-3.5 w-full">
                <div className="grid gap-1.5 w-[110px] shrink-0">
                  <Label htmlFor="start-date" className="text-xs font-bold text-brand-blue text-center">Start Date</Label>
                  <Input 
                    id="start-date"
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-[110px] !h-9 text-xs border-brand-grey/20 focus:border-brand-blue text-center px-1.5 py-0"
                  />
                </div>
                <div className="grid gap-1.5 w-[110px] shrink-0">
                  <Label htmlFor="end-date" className="text-xs font-bold text-brand-blue text-center">End Date</Label>
                  <Input 
                    id="end-date"
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-[110px] !h-9 text-xs border-brand-grey/20 focus:border-brand-blue text-center px-1.5 py-0"
                  />
                </div>

                <div className="grid gap-1.5 w-[240px] shrink-0 relative">
                  <Label htmlFor="history-med-search" className="text-xs font-bold text-brand-blue text-center">Medication Filter</Label>
                  <Input
                    id="history-med-search"
                    placeholder="Search medication..."
                    value={historyMedicationSearch}
                    onChange={(e) => {
                      setHistoryMedicationSearch(e.target.value);
                      setHistoryMedicationFilter(""); 
                      setIsHistorySearchFocused(true);
                    }}
                    onFocus={() => setIsHistorySearchFocused(true)}
                    onBlur={() => {
                      // Small delay to allow clicking on list items
                      setTimeout(() => setIsHistorySearchFocused(false), 200);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        setIsHistorySearchFocused(false);
                      }
                    }}
                    className="!h-9 text-sm border-brand-grey/20 focus:border-brand-blue bg-brand-surface text-left pl-4 w-full"
                  />
                  {historyMedicationSearch && !historyMedicationFilter && isHistorySearchFocused && (
                    <div className="absolute z-50 w-full min-w-[300px] top-full mt-1 bg-brand-surface border border-brand-grey/20 rounded-md shadow-2xl max-h-[400px] overflow-y-auto left-0">
                      {inventory
                        .filter(s => {
                          const query = historyMedicationSearch.split(" - ")[0].split(" (")[0].trim().toLowerCase();
                          return s.name.toLowerCase().startsWith(query) || 
                                 s.ndc.toLowerCase().startsWith(query) ||
                                 (s.strength && s.strength.toLowerCase().startsWith(query));
                        })
                        .map(s => (
                          <div
                            key={s.id}
                            className="px-3 py-2 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group"
                            onClick={() => {
                              setHistoryMedicationFilter(s.id);
                              setHistoryMedicationSearch(s.name);
                            }}
                          >
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-normal group-hover:text-brand-blue text-brand-dark-grey">{s.name}</span>
                                <span className="font-normal group-hover:text-brand-blue text-brand-dark-grey">{s.strength}</span>
                              </div>
                              <div className="flex items-center mt-0.5">
                                <span className="text-sm text-brand-blue/70 font-bold">{s.ndc}</span>
                              </div>
                            </div>
                            <Badge variant="outline" className="text-[10px] h-4 px-1">{s.schedule}</Badge>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-1.5 w-[125px] shrink-0">
                  <Label htmlFor="history-type-filter" className="text-xs font-bold text-brand-blue text-center whitespace-nowrap">Transaction Type</Label>
                  <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                    <SelectTrigger id="history-type-filter" className="w-full !h-9 text-sm border-brand-grey/20 focus:ring-brand-blue bg-brand-surface text-brand-dark-grey hover:bg-brand-blue/5 px-2">
                      <SelectValue placeholder="All">
                        {historyTypeFilter === "All" ? "All" :
                         historyTypeFilter === "OUT" ? "Dispensed" :
                         historyTypeFilter === "IN" ? "Added" :
                         historyTypeFilter === "ADJUST" ? "Adjusted" :
                         historyTypeFilter === "VERIFY" ? "Verified" : historyTypeFilter}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-brand-surface border-brand-blue/10" align="start">
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="OUT">Dispensed</SelectItem>
                      <SelectItem value="IN">Added</SelectItem>
                      <SelectItem value="ADJUST">Adjusted</SelectItem>
                      <SelectItem value="VERIFY">Verified</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="hidden">
                  <Select value={String(syncLimit)} onValueChange={(val) => {
                    const limitVal = parseInt(val, 10);
                    setSyncLimit(limitVal);
                    localStorage.setItem("inventory_sync_limit", val);
                  }}>
                    <SelectTrigger id="history-sync-limit" className="w-full !h-9 text-sm border-brand-grey/20 focus:ring-brand-blue bg-brand-surface text-brand-dark-grey hover:bg-brand-blue/5 px-2">
                      <SelectValue placeholder="50 Recs">
                        {`Last ${syncLimit}`}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-brand-surface border-brand-blue/10" align="start">
                      <SelectItem value="25">Last 25</SelectItem>
                      <SelectItem value="50">Last 50</SelectItem>
                      <SelectItem value="100">Last 100</SelectItem>
                      <SelectItem value="250">Last 250</SelectItem>
                      <SelectItem value="500">Last 500</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => { 
                    setStartDate(""); 
                    setEndDate(""); 
                    setHistoryMedicationFilter("");
                    setHistoryMedicationSearch("");
                    setHistoryTypeFilter("All");
                  }}
                  className="!h-9 text-xs border-brand-grey/20 hover:bg-brand-blue/5 w-[90px] shrink-0 flex items-center justify-center p-0"
                >
                  Clear Filter
                </Button>

                <div className="ml-auto shrink-0 h-9 flex items-center text-xs text-brand-dark-grey/60 font-medium whitespace-nowrap px-1">
                  Showing {filteredTransactions.length} transactions
                </div>
              </div>

              {historyMedicationFilter && (
                <div className="flex gap-4 mt-1 justify-start shrink-0 sm:ml-[248px]">
                  <div className="p-1.5 bg-brand-blue/5 rounded border border-brand-blue/10 min-w-[120px] flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-1">
                    <Label className="text-[9px] text-brand-blue uppercase font-bold leading-none mb-1">Strength</Label>
                    <div className="text-xs font-normal text-brand-dark-grey truncate">
                      {inventory.find(i => i.id === historyMedicationFilter)?.strength}
                    </div>
                  </div>
                  <div className="p-1.5 bg-brand-blue/5 rounded border border-brand-blue/10 min-w-[140px] flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-1">
                    <Label className="text-[9px] text-brand-blue uppercase font-bold leading-none mb-1">NDC</Label>
                    <div className="text-sm font-normal text-brand-dark-grey truncate">
                      {inventory.find(i => i.id === historyMedicationFilter)?.ndc}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Card className="flex-1 mt-4 min-h-0 border-brand-grey/10 shadow-sm bg-brand-surface/70 backdrop-blur-[2px] flex flex-col overflow-hidden py-0">
              <div 
                className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-brand-blue/20 touch-auto"
                onScroll={(e) => {
                  const target = e.currentTarget;
                  if (target.scrollHeight - target.scrollTop - target.clientHeight < 120) {
                    if (transactions.length >= syncLimit && !isIncrementingSyncLimitRef.current) {
                      isIncrementingSyncLimitRef.current = true;
                      setSyncLimit(prev => prev + 30);
                      setTimeout(() => {
                        isIncrementingSyncLimitRef.current = false;
                      }, 1000); // 1s lock allows data to load and render safely
                    }
                  }
                }}
              >
                <table className="w-full caption-bottom text-sm border-separate border-spacing-0">
                  <TableHeader className="sticky top-0 z-40 bg-brand-blue">
                    <TableRow className="bg-brand-blue">
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center w-[140px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Timestamp</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center w-[110px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Reference #</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Medication & Strength</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center w-[120px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">NDC</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center w-[90px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Type</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center w-[70px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">Qty</TableHead>
                        <TableHead className="font-semibold text-sm tracking-wider text-white text-center w-[130px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30">User</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTransactions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-brand-dark-grey/50">
                          <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                          <p>No transactions found for this schedule.</p>
                        </TableCell>
                      </TableRow>
                    ) : filteredTransactions.map((t) => (
                    <TableRow key={t.id} className="h-10 hover:bg-brand-blue/5 transition-colors">
                      <TableCell className="text-xs font-sans text-brand-dark-grey/70 whitespace-nowrap text-center py-1">
                        {formatDateTime(t.timestamp)}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        {t.referenceNumber ? (
                          <button 
                            onClick={() => setViewingTransaction(t)}
                            className="text-xs font-normal text-brand-blue hover:underline"
                          >
                            {t.referenceNumber}
                          </button>
                        ) : (
                          <span className="text-brand-dark-grey/40 italic">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center py-1">
                        <div className="text-sm font-normal text-brand-dark-grey">{t.substanceName}&nbsp;{t.strength}</div>
                      </TableCell>
                      <TableCell className="text-xs font-normal text-center py-1">
                        <button 
                          onClick={() => handleNDCClick(t.ndc)}
                          className="text-brand-blue hover:underline font-normal transition-colors"
                        >
                          {t.ndc}
                        </button>
                      </TableCell>
                      <TableCell className="py-1 text-center">
                        <TransactionBadge type={t.type} />
                      </TableCell>
                      <TableCell className="text-center font-normal text-sm text-brand-dark-grey py-1">
                        {t.type === 'VERIFY' ? `=${t.quantity}` : (t.type === 'IN' ? '+' : t.type === 'OUT' ? '-' : (t.type === 'ADJUST' && t.quantity > 0 ? '+' : '')) + t.quantity}
                      </TableCell>
                      <TableCell className="text-xs text-brand-dark-grey text-center no-interact py-1">
                        {escapeEmail(t.performedByName)}
                        {(t.performedByTitle || users.find(u => u.name === t.performedByName)?.title) && (
                          <span className="ml-1 text-brand-dark-grey">
                            ({t.performedByTitle || users.find(u => u.name === t.performedByName)?.title})
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </table>
            </div>
            {/* Pagination Footer */}
            {false && filteredTransactions.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 border-t border-brand-grey/10 bg-brand-surface/40 select-none shrink-0 gap-4">
                <div className="flex items-center gap-4 text-xs font-medium text-brand-dark-grey/70 font-sans">
                  <div className="flex items-center gap-1.5">
                    <span>Rows per page:</span>
                    <Select value={String(pageSize)} onValueChange={(val) => {
                      setPageSize(parseInt(val, 10));
                      setCurrentPage(1);
                    }}>
                      <SelectTrigger className="w-16 h-8 text-xs border-brand-grey/20 focus:ring-brand-blue bg-brand-surface py-0 px-2">
                        <SelectValue placeholder="15" />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-surface border-brand-blue/10 min-w-[70px]" align="start">
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="25">25</SelectItem>
                        <SelectItem value="50">50</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    {`Showing ${Math.min(filteredTransactions.length, (currentPage - 1) * pageSize + 1)}-${Math.min(filteredTransactions.length, currentPage * pageSize)} of ${filteredTransactions.length}`}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0 border-brand-grey/20 hover:bg-brand-blue/5 text-brand-blue disabled:opacity-40 flex items-center justify-center bg-brand-surface"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    title="First Page"
                  >
                    <ChevronsLeft className="h-4 w-4 text-brand-blue" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0 border-brand-grey/20 hover:bg-brand-blue/5 text-brand-blue disabled:opacity-40 flex items-center justify-center bg-brand-surface"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    title="Previous Page"
                  >
                    <ChevronLeft className="h-4 w-4 text-brand-blue" />
                  </Button>
                  
                  <span className="text-xs font-semibold text-brand-blue px-2 min-w-[80px] text-center font-sans">
                    Page {currentPage} of {Math.max(1, Math.ceil(filteredTransactions.length / pageSize))}
                  </span>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0 border-brand-grey/20 hover:bg-brand-blue/5 text-brand-blue disabled:opacity-40 flex items-center justify-center bg-brand-surface"
                    onClick={() => setCurrentPage(prev => Math.min(Math.max(1, Math.ceil(filteredTransactions.length / pageSize)), prev + 1))}
                    disabled={currentPage >= Math.ceil(filteredTransactions.length / pageSize)}
                    title="Next Page"
                  >
                    <ChevronRight className="h-4 w-4 text-brand-blue" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 p-0 border-brand-grey/20 hover:bg-brand-blue/5 text-brand-blue disabled:opacity-40 flex items-center justify-center bg-brand-surface"
                    onClick={() => setCurrentPage(Math.max(1, Math.ceil(filteredTransactions.length / pageSize)))}
                    disabled={currentPage >= Math.ceil(filteredTransactions.length / pageSize)}
                    title="Last Page"
                  >
                    <ChevronsRight className="h-4 w-4 text-brand-blue" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

          <TabsContent value="alerts" className="flex-1 min-h-0 h-full mt-0 outline-none data-[state=inactive]:hidden flex flex-col relative z-20 m-0 overflow-hidden">
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-6 scrollbar-thin scrollbar-thumb-brand-blue/20 touch-auto">
              <div className="grid gap-4">
                {lowStockItems.length === 0 ? (
                  <Card className="border-brand-grey/10 shadow-sm p-12 text-center text-brand-dark-grey/50 bg-brand-surface">
                    <p>
                      {userProfile?.isAlertsEnabled === false 
                        ? "Alerts are currently disabled. Enable them in settings to view notifications." 
                        : "All stock levels are currently above minimum thresholds."}
                    </p>
                  </Card>
                ) : lowStockItems.map(item => (
                  <Card key={item.id} className="border-brand-grey/20 bg-brand-surface shadow-sm">
                    <CardContent className="flex items-center justify-between p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20 relative">
                          <AlertTriangle className="h-6 w-6 text-brand-blue relative z-10" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-brand-blue tracking-tight">{item.name}{" "}{item.strength}</h3>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-lg text-brand-dark-grey">
                              Current Stock: <span className="font-black text-brand-yellow text-xl">{item.currentStock}</span> / Min Threshold: <span className="font-bold text-xl">{item.minThreshold}</span>
                            </p>
                            <div className="h-4 w-[1px] bg-brand-grey/30" />
                            <div className="flex items-center gap-1.5 text-sm">
                              <span className="text-brand-dark-grey/60">NDC:</span>
                              <button 
                                onClick={() => handleNDCClick(item.ndc)}
                                className="text-brand-blue hover:underline font-bold transition-colors"
                              >
                                {item.ndc}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 h-12 px-6 font-extrabold rounded-xl transition-all border-none"
                        onClick={() => handleDismissAlert(item.id)}
                      >
                        Dismiss Alert
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </main>
    {createPortal(
      <Toaster 
        position="bottom-right"
        theme="light"
        expand={true}
        richColors={true}
        toastOptions={{
          className: "sonner-industrial",
        }}
      />,
      document.body
    )}
    {reconShowPreview && createPortal(
      renderReconciliationReportContent(true),
      document.body
    )}

    {/* Transaction History Dialog (Globally available helper) */}
    <Dialog open={!!selectedSubstanceDetail} onOpenChange={(open) => !open && setSelectedSubstanceDetail(null)}>
      <DialogContent showCloseButton={false} className="sm:max-w-[1000px] bg-brand-surface border-brand-grey/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col h-[80vh] max-h-[80vh] touch-none">
        <DialogHeader className="px-6 py-4 bg-brand-blue text-white relative shrink-0 touch-auto">
          <div className="flex items-center gap-4 relative z-10 text-left">
            <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden border border-brand-yellow/20">
              <History className="h-5 w-5 text-brand-blue" />
            </div>
            <div className="flex flex-col gap-0">
              <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                Transaction History: {selectedSubstanceDetail?.name}&nbsp;{selectedSubstanceDetail?.strength}
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/80 font-bold text-[10px] tracking-widest mt-1">
                NDC: {selectedSubstanceDetail?.ndc}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-4 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <Button 
              size="sm"
              onClick={() => {
                if (selectedSubstanceDetail) {
                  resetForm();
                  setSelectedSubstance(selectedSubstanceDetail.id);
                  setSubstanceSearch(selectedSubstanceDetail.name);
                  setTransactionType("VERIFY");
                  setReferenceNumber("");
                  setReason("");
                  setIsLogOpen(true);
                }
              }}
              className="bg-brand-blue hover:brightness-110 text-white gap-2 shadow-lg shadow-brand-blue/20 h-10 px-4 font-extrabold rounded-xl transition-all flex items-center"
            >
              <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
                <Check className="h-3.5 w-3.5 text-brand-blue" strokeWidth={3} />
              </div>
              Confirm Count
            </Button>
            <Button 
              onClick={() => {
                if (selectedSubstanceDetail) {
                  setEditingMed({
                    ...selectedSubstanceDetail,
                    minThreshold: selectedSubstanceDetail.minThreshold.toString() as any,
                    packageSize: selectedSubstanceDetail.packageSize.toString() as any
                  });
                }
                setIsEditMinThresholdOpen(true);
              }}
              className="bg-brand-blue hover:brightness-110 text-white gap-2 shadow-lg shadow-brand-blue/20 h-10 px-4 font-extrabold rounded-xl transition-all flex items-center"
            >
              <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
                <div className="relative h-4 w-4 flex items-center justify-center">
                  <svg className="h-full w-full absolute text-brand-blue overflow-visible" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2 7 8.5 11.5 13.5 8.5 22 17" />
                    <line x1="0" y1="15.25" x2="24" y2="15.25" strokeWidth="2" />
                  </svg>
                </div>
              </div>
              Edit Threshold
            </Button>
            <Button 
              onClick={() => {
                if (selectedSubstanceDetail) {
                  setEditingMed({
                    ...selectedSubstanceDetail,
                    minThreshold: selectedSubstanceDetail.minThreshold.toString() as any,
                    packageSize: selectedSubstanceDetail.packageSize.toString() as any
                  });
                  setIsEditMedDetailsOpen(true);
                }
              }}
              className="bg-brand-blue hover:brightness-110 text-white gap-2 shadow-lg shadow-brand-blue/20 h-10 px-4 font-extrabold rounded-xl transition-all flex items-center"
            >
              <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
                <Edit className="h-3.5 w-3.5 text-brand-blue" strokeWidth={3} />
              </div>
              Edit Details
            </Button>
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 pb-4 flex flex-col overflow-hidden">
          <div 
            className="flex-1 overflow-x-auto overflow-y-auto rounded-md border border-brand-grey/10 scrollbar-thin scrollbar-thumb-brand-blue/20 touch-auto bg-brand-surface"
            onScroll={(e) => {
              const target = e.currentTarget;
              if (target.scrollHeight - target.scrollTop - target.clientHeight < 120) {
                if (isUsingFallback) {
                  if (transactions.length >= syncLimit && !isIncrementingSyncLimitRef.current) {
                    isIncrementingSyncLimitRef.current = true;
                    setSyncLimit(prev => prev + 30);
                    setTimeout(() => {
                      isIncrementingSyncLimitRef.current = false;
                    }, 1000);
                  }
                } else {
                  if (substanceTransactions.length >= substanceHistoryLimit && !isIncrementingSubstanceLimitRef.current) {
                    isIncrementingSubstanceLimitRef.current = true;
                    setSubstanceHistoryLimit(prev => prev + 30);
                    setTimeout(() => {
                      isIncrementingSubstanceLimitRef.current = false;
                    }, 1000);
                  }
                }
              }
            }}
          >
            <table className="relative border-separate border-spacing-0 w-full text-sm">
              <TableHeader className="sticky top-0 z-40 bg-brand-light-grey">
                <TableRow className="bg-brand-light-grey">
                  <TableHead className={`${tableHeadClass} sticky top-0 z-30 bg-brand-light-grey border-b border-brand-grey/10 h-11 text-xs`}>Date</TableHead>
                  <TableHead className={`${tableHeadClass} sticky top-0 z-30 bg-brand-light-grey border-b border-brand-grey/10 h-11 text-xs`}>NDC</TableHead>
                  <TableHead className={`${tableHeadClass} sticky top-0 z-30 bg-brand-light-grey border-b border-brand-grey/10 h-11 text-xs`}>Reference #</TableHead>
                  <TableHead className={`${tableHeadClass} sticky top-0 z-30 bg-brand-light-grey border-b border-brand-grey/10 h-11 text-xs`}>Action</TableHead>
                  <TableHead className={`${tableHeadClass} sticky top-0 z-30 bg-brand-light-grey border-b border-brand-grey/10 h-11 text-xs`}>Qty</TableHead>
                  <TableHead className={`${tableHeadClass} sticky top-0 z-30 bg-brand-light-grey border-b border-brand-grey/10 h-11 text-xs`}>Balance</TableHead>
                  <TableHead className={`${tableHeadClass} sticky top-0 z-30 bg-brand-light-grey border-b border-brand-grey/10 h-11 text-xs`}>User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="text-brand-dark-grey">
                {medicationHistoryTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-brand-dark-grey/50 italic">
                      No transaction history found for this item.
                    </TableCell>
                  </TableRow>
                ) : (
                  medicationHistoryTransactions.map((t) => {
                    const isNewSinceLastReport = (() => {
                      if (!isReconOpen) return false;
                      if (!selectedSubstanceDetail) return false;

                      let maxReportTime = 0;
                      
                      // 1. Check historical reports that contain this specific medication
                      if (historicalReports && historicalReports.length > 0) {
                        historicalReports.forEach(r => {
                          const hasMed = 
                            (r.items && r.items.some((item: any) => item.substanceId === selectedSubstanceDetail.id)) ||
                            (!r.items && (
                              r.scheduleFilter === "ALL" || 
                              r.scheduleFilter === selectedSubstanceDetail.schedule ||
                              (r.scheduleFilter === "C-III/C-IV/C-V" && (selectedSubstanceDetail.schedule === "C-III" || selectedSubstanceDetail.schedule === "C-IV" || selectedSubstanceDetail.schedule === "C-V"))
                            ));
                          
                          if (hasMed && r.timestamp) {
                            const ms = new Date(r.timestamp).getTime();
                            if (ms > maxReportTime) {
                              maxReportTime = ms;
                            }
                          }
                        });
                      }
                      
                      // 2. Check general transaction logs for any previous reconciliation transactions of this specific medication
                      const medReconTxs = transactions.filter(tx => 
                        tx.substanceId === selectedSubstanceDetail.id &&
                        tx.referenceNumber && 
                        (tx.referenceNumber.startsWith("REC-") || tx.referenceNumber.startsWith("RECON-") || tx.referenceNumber.includes("REC")) &&
                        tx.referenceNumber !== reconRef
                      );
                      
                      if (medReconTxs.length > 0) {
                        medReconTxs.forEach(tx => {
                          const ms = getTimestampMs(tx.timestamp);
                          if (ms > maxReportTime) {
                            maxReportTime = ms;
                          }
                        });
                      }

                      // 3. Check lastReport if it belongs to this medication's schedule filter
                      const isScheduleMatch = 
                        reconScheduleFilter === "ALL" ||
                        (reconScheduleFilter === "C-II" && selectedSubstanceDetail.schedule === "C-II") ||
                        (reconScheduleFilter === "C-III/C-IV/C-V" && (selectedSubstanceDetail.schedule === "C-III" || selectedSubstanceDetail.schedule === "C-IV" || selectedSubstanceDetail.schedule === "C-V"));
                        
                      if (isScheduleMatch && lastReport && lastReport.timestampMs && lastReport.timestampMs > maxReportTime) {
                        maxReportTime = lastReport.timestampMs;
                      }
                      
                      if (maxReportTime > 0) {
                        return getTimestampMs(t.timestamp) > maxReportTime;
                      }
                      
                      return true;
                    })();

                    return (
                      <TableRow 
                        key={t.id} 
                        className={`text-xs h-10 transition-colors ${
                          isNewSinceLastReport 
                            ? "bg-brand-yellow/10 hover:bg-brand-yellow/20 font-semibold" 
                            : "bg-white hover:bg-brand-blue/5"
                        }`}
                      >
                        <TableCell className="whitespace-nowrap text-brand-dark-grey/70 text-center py-1">
                          {formatDateTime(t.timestamp)}
                        </TableCell>
                        <TableCell className="text-[10px] text-center py-1">
                          <button 
                            onClick={() => handleNDCClick(t.ndc)}
                            className="text-brand-blue hover:underline font-normal transition-colors"
                          >
                            {t.ndc}
                          </button>
                        </TableCell>
                        <TableCell className="text-center py-1">
                          {t.referenceNumber ? (
                            <button 
                              onClick={() => setViewingTransaction(t)}
                              className="text-brand-blue hover:underline font-normal"
                            >
                              {formatRefForDisplay(t.referenceNumber)}
                            </button>
                          ) : (
                            <span className="text-brand-dark-grey/40 italic">-</span>
                          )}
                        </TableCell>
                        <TableCell className="py-1 text-center">
                          <TransactionBadge type={t.type} size="sm" />
                        </TableCell>
                        <TableCell className="text-center text-brand-dark-grey text-sm py-1">
                          {t.type === 'VERIFY' ? '=' : (t.type === 'IN' ? '+' : t.type === 'OUT' ? '-' : (t.type === 'ADJUST' && t.quantity > 0 ? '+' : ''))}{t.quantity}
                        </TableCell>
                        <TableCell className="text-center font-normal text-brand-dark-grey text-sm py-1">{t.newStock}</TableCell>
                        <TableCell className="text-brand-dark-grey text-[10px] text-center no-interact py-1">
                          {escapeEmail(t.performedByName)}
                          {(t.performedByTitle || users.find(u => u.name === t.performedByName)?.title) && (
                            <span className="ml-1 text-brand-dark-grey">
                              ({t.performedByTitle || users.find(u => u.name === t.performedByName)?.title})
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </table>
          </div>
        </div>
        
        <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 touch-auto flex justify-end">
          <Button 
            onClick={() => setSelectedSubstanceDetail(null)} 
            className="h-9 px-6 text-[10px] font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-md shadow-brand-yellow/10 rounded-lg transition-all"
          >
            Close History Log
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Reconciliation Report Dialog */}
    <Dialog open={isReconOpen} onOpenChange={(open) => { setIsReconOpen(open); if (!open) { setCurrentTab('inventory'); } }} modal="trap-focus">
      <DialogContent showCloseButton={false} className="sm:max-w-[1100px] w-[95vw] h-[90vh] max-h-[90vh] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col">
        <DialogHeader className="py-2.5 px-5 bg-brand-blue text-white relative shrink-0">
          <div className="flex items-center justify-between relative z-10 w-full">
            <div className="flex items-center gap-4 text-left">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                {reconViewMode === "history" ? (
                  <Folder className="h-5 w-5 text-brand-blue" strokeWidth={3} />
                ) : (
                  <Clipboard className="h-5 w-5 text-brand-blue" strokeWidth={3} />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                  {reconViewMode === "history" ? "Controlled Substance Reconciliation Report Registry" : "Controlled Substance Reconciliation"}
                </DialogTitle>
                <DialogDescription className="text-brand-yellow/70 font-bold text-[9px] tracking-widest mt-1 uppercase leading-tight">
                  VERIFY PHYSICAL HOLDINGS AGAINST DIGITAL LEDGER LOGS TO MAINTAIN ACTIVE COMPLIANCE
                </DialogDescription>
              </div>
            </div>

            {/* History button in the top header on the far right */}
            {reconViewMode !== "history" && (
              <div className="flex items-center gap-2">
                <Button
                  id="recon-history-button"
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setReconViewMode("history");
                    setSelectedHistoricalReport(null);
                    setReconShowPreview(false);
                  }}
                  className="h-10 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-brand-yellow border border-brand-yellow/30 hover:bg-white/10 flex items-center gap-2 transition-all"
                >
                  <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm text-brand-blue">
                    <Folder className="h-3.5 w-3.5 text-brand-blue" strokeWidth={3} />
                  </div>
                  Report Registry
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className={`flex flex-col flex-1 min-h-0 ${(reconShowPreview || reconViewMode !== "form") ? 'hidden' : ''}`}>
          {/* Form Editing View */}
          <div className="flex-1 min-h-0 p-6 pt-4 pb-1.5 flex flex-col gap-3 overflow-hidden">
                
                {/* Meta details */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-2 px-4 border border-brand-blue/10 rounded-xl bg-brand-blue/5 shrink-0">
                  <div className="flex items-center gap-2 text-left w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                      {(["C-II", "C-III/C-IV/C-V"] as const).map((filterVal) => (
                        <Button
                          key={filterVal}
                          type="button"
                          variant={reconScheduleFilter === filterVal ? "default" : "outline"}
                          size="sm"
                          onClick={() => setReconScheduleFilter(filterVal as any)}
                          className={`rounded-full px-6 h-10 text-xs font-extrabold tracking-wider transition-all ${
                            reconScheduleFilter === filterVal
                              ? "bg-brand-blue text-white border-brand-blue shadow-md"
                              : "bg-brand-surface text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5"
                          }`}
                        >
                          {filterVal}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-left w-full sm:w-auto sm:justify-end">
                    <Label className="text-[10px] uppercase font-black tracking-wider text-brand-blue/80 shrink-0">Report Reference #</Label>
                    <div className="h-8 px-3 border border-brand-blue/10 rounded-xl bg-brand-blue/5 flex items-center text-xs font-sans font-black text-brand-blue select-all shrink-0">
                      {reconRef}
                    </div>
                  </div>
                </div>

                {/* Substance Table List */}
                <div className="border border-brand-blue/10 rounded-xl overflow-hidden bg-brand-surface flex flex-col flex-1 min-h-0">
                  <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-brand-blue/20 touch-auto">
                    <table className="w-full border-separate border-spacing-0 text-xs text-left">
                      <thead className="sticky top-0 z-40">
                        <tr className="border-none" style={{ border: 'none' }}>
                          <th rowSpan={2} className="font-semibold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>Medication & Strength</th>
                          <th rowSpan={2} className="font-semibold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>NDC</th>
                          <th rowSpan={2} className="font-semibold text-xs tracking-wider text-brand-blue text-center bg-[#e9f0fa] sticky top-0 z-42 h-12 py-0" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal', border: 'none' }}>
                            <div className="flex flex-col items-center justify-center">
                              <span>Last Report</span>
                              <span>Count</span>
                            </div>
                          </th>
                          <th className="font-semibold text-xs tracking-wider text-brand-blue text-center bg-[#e9f0fa] sticky top-0 z-42 h-6 py-0" style={{ top: 0, verticalAlign: 'bottom', paddingBottom: '0px', lineHeight: 'normal', border: 'none' }}>Purchased</th>
                          <th className="font-semibold text-xs tracking-wider text-brand-blue text-center bg-[#e9f0fa] sticky top-0 z-42 h-6 py-0" style={{ top: 0, verticalAlign: 'bottom', paddingBottom: '0px', lineHeight: 'normal', border: 'none' }}>Dispensed</th>
                          <th className="font-semibold text-xs tracking-wider text-brand-blue text-center bg-[#e9f0fa] sticky top-0 z-42 h-6 py-0" style={{ top: 0, verticalAlign: 'bottom', paddingBottom: '0px', lineHeight: 'normal', border: 'none' }}>Adjusted</th>
                          <th rowSpan={2} className="font-semibold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>
                            <div className="flex flex-col items-center justify-center">
                              <span>Expected</span>
                              <span>Count</span>
                            </div>
                          </th>
                          <th rowSpan={2} className="font-semibold text-xs tracking-wider text-white text-center w-[110px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-1" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>
                            <div className="flex flex-col items-center justify-center">
                              <span>Physical</span>
                              <span>Count</span>
                            </div>
                          </th>
                          <th rowSpan={2} className="font-semibold text-xs tracking-wider text-white text-center w-[120px] bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>Variance</th>
                        </tr>
                        <tr className="border-none" style={{ border: 'none' }}>
                          <th colSpan={3} className="font-semibold text-xs tracking-wider text-brand-blue text-center bg-[#e9f0fa] sticky z-30 h-6 py-0" style={{ top: '24px', verticalAlign: 'top', paddingTop: '0px', lineHeight: 'normal', border: 'none' }}>
                            SINCE LAST REPORT ON {lastReport.date}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {substancesToReconcile.length === 0 ? (
                          <tr className="border-b border-brand-blue/10">
                            <td colSpan={9} className="text-center py-12 text-brand-dark-grey/50 align-middle">
                              No medications are matching the current node registry list.
                            </td>
                          </tr>
                        ) : (
                          [...substancesToReconcile].sort(compareSubstances).map((sub) => {
                            const metrics = getSubstanceHistoryMetrics(sub.id);
                            const counted = getReconPhysicalCount(sub.id);
                            const hasVariance = counted !== undefined && counted !== metrics.expected;
                            const varianceAmount = counted !== undefined ? counted - metrics.expected : 0;
                            
                            return (
                              <Fragment key={sub.id}>
                                <tr className="hover:bg-brand-blue/5 border-b border-brand-blue/10">
                                  <td 
                                    className="text-center font-semibold border-b border-brand-blue/10 py-1.5 cursor-pointer hover:bg-brand-blue/10 transition-colors group" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    <span className="font-bold text-black group-hover:text-brand-blue group-hover:underline text-xs">{sub.name} {sub.strength}</span>
                                  </td>
                                  <td 
                                    className="text-center border-b border-brand-blue/10 py-1.5 cursor-pointer hover:bg-brand-blue/10 transition-colors group" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    <span className="text-xs text-brand-blue font-sans font-bold px-1.5 py-0.5 bg-brand-blue/5 rounded border border-brand-blue/10 group-hover:underline leading-none shrink-0">{sub.ndc}</span>
                                  </td>
                                  <td 
                                    className="text-center border-b border-brand-blue/10 py-1.5 text-xs font-black text-brand-dark-grey/80 bg-brand-blue/5 cursor-pointer hover:bg-brand-blue/10 hover:text-brand-blue transition-all" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    {metrics.lastClosingCount}
                                  </td>
                                  <td 
                                    className="text-center border-b border-brand-blue/10 py-1.5 text-xs font-black text-brand-grey bg-brand-blue/5 cursor-pointer hover:bg-brand-blue/10 hover:text-brand-blue transition-all" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    +{metrics.purchases}
                                  </td>
                                  <td 
                                    className="text-center border-b border-brand-blue/10 py-1.5 text-xs font-black text-brand-grey bg-brand-blue/5 cursor-pointer hover:bg-brand-blue/10 hover:text-brand-blue transition-all" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    -{metrics.dispensed}
                                  </td>
                                  <td 
                                    className="text-center border-b border-brand-blue/10 py-1.5 text-xs font-black text-brand-grey bg-brand-blue/5 cursor-pointer hover:bg-brand-blue/10 hover:text-brand-blue transition-all" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    {metrics.adjustments >= 0 ? `+${metrics.adjustments}` : metrics.adjustments}
                                  </td>
                                  <td 
                                    className="text-center border-b border-brand-blue/10 py-1.5 text-xs font-black text-brand-blue cursor-pointer hover:bg-brand-blue/10 hover:underline transition-all" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    {metrics.expected}
                                  </td>
                                  <td className="text-center border-b border-brand-blue/10 py-1.5" style={{ verticalAlign: 'middle' }}>
                                    <div className="flex justify-center items-center">
                                      {counted !== undefined ? (
                                        <button
                                          type="button"
                                          className="flex items-center gap-1.5 px-3 py-1 bg-brand-blue/5 border border-brand-blue/10 rounded-lg text-brand-blue font-black text-xs h-8 hover:bg-brand-blue/10 hover:border-brand-blue/20 transition-all cursor-pointer shadow-sm select-none"
                                          onClick={() => {
                                            resetForm();
                                            setSelectedSubstance(sub.id);
                                            setSubstanceSearch(sub.name);
                                            setTransactionType("VERIFY");
                                            setReferenceNumber("");
                                            setReason("");
                                            setQuantity(counted.toString());
                                            setIsLogOpen(true);
                                          }}
                                        >
                                          <Check className="h-3.5 w-3.5 text-brand-blue shrink-0" strokeWidth={3} />
                                          {counted}
                                        </button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-8 text-[10px] font-black uppercase tracking-wider text-brand-blue border-brand-blue/15 hover:bg-brand-blue/5 rounded-xl shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1 bg-brand-surface font-sans px-2.5"
                                          onClick={() => {
                                            resetForm();
                                            setSelectedSubstance(sub.id);
                                            setSubstanceSearch(sub.name);
                                            setTransactionType("VERIFY");
                                            setReferenceNumber("");
                                            setReason("");
                                            setIsLogOpen(true);
                                          }}
                                        >
                                          <Check className="h-3 w-3 text-brand-blue shrink-0" strokeWidth={3} />
                                          Verify Count
                                        </Button>
                                      )}
                                    </div>
                                  </td>
                                  <td 
                                    className="text-center border-b border-brand-blue/10 py-1.5 cursor-pointer hover:bg-brand-blue/10 transition-colors" 
                                    style={{ verticalAlign: 'middle' }}
                                    onClick={() => setSelectedSubstanceDetail(sub)}
                                    title="Click to view transaction history"
                                  >
                                    <div className="flex justify-center items-center">
                                      {counted === undefined ? (
                                        <span className="text-[10px] text-brand-grey/50 font-medium whitespace-nowrap">Pending...</span>
                                      ) : varianceAmount === 0 ? (
                                        <Badge className="bg-brand-blue/10 hover:bg-brand-blue/15 text-brand-blue hover:text-brand-blue border border-brand-blue/20 font-bold text-[11px] h-7 px-3">
                                          <Check className="h-3.5 w-3.5 mr-1" strokeWidth={3} /> Match
                                        </Badge>
                                      ) : varianceAmount < 0 ? (
                                        <Badge className="bg-brand-yellow hover:bg-brand-yellow text-brand-blue hover:text-brand-blue border border-brand-yellow/40 font-black text-[11px] h-7 px-3 shadow-sm">
                                          Deficit: {varianceAmount}
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-brand-blue hover:bg-brand-blue/90 text-brand-yellow hover:text-brand-yellow border border-brand-blue/20 font-black text-[11px] h-7 px-3 shadow-sm">
                                          Surplus: +{varianceAmount}
                                        </Badge>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {hasVariance && (
                                  <tr className="bg-brand-blue/[0.02] hover:bg-brand-blue/[0.02]">
                                    <td colSpan={9} className="p-3 pl-4 pr-4 border-b border-brand-blue/10">
                                      <div className="w-full bg-brand-blue/5 border border-brand-blue/10 rounded-lg p-2.5">
                                        <Label className="text-[9px] font-black text-brand-blue block mb-1">Explanation For Discrepancy</Label>
                                        <Input
                                          placeholder="Reason For Variance..."
                                          value={reconReasons[sub.id] || ""}
                                          onChange={(e) => {
                                            const val = e.target.value;
                                            setReconReasons(prev => ({ ...prev, [sub.id]: val }));
                                          }}
                                          className="h-8 text-xs border-brand-blue/10 focus:border-brand-blue rounded-lg placeholder:text-brand-grey/50 bg-brand-surface"
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Two interactive signature fields and disclaimer grouped for perfect spacing balance */}
                <div className="space-y-1.5 shrink-0">
                  {(() => {
                    const reconUserObj = users.find(u => u.id === reconUser);
                    const picUserObj = users.find(u => u.title?.toUpperCase() === "PIC");
                    const isSigRequired = userProfile?.isSignatureRequirementEnabled !== false;
                    
                    return (
                      <div className="grid grid-cols-1 gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Left Sign-off: Completed By */}
                          <div className="flex flex-col gap-0.5 animate-fade-in">
                            {/* Inner row for label, select, and clear */}
                            <div className={`flex ${isSigRequired ? 'items-end' : 'items-center'} justify-between px-1 h-7`}>
                              <div className={`flex ${isSigRequired ? 'items-end' : 'items-center'} gap-1.5 min-w-0 flex-1`}>
                                <span className={`text-xs text-brand-blue font-black uppercase tracking-wider shrink-0 ${isSigRequired ? 'pb-0' : ''}`}>
                                  Completed By:
                                </span>
                                <Select value={reconUser || undefined} onValueChange={setReconUser}>
                                  <SelectTrigger id="recon-pharmacist" className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-7 font-normal data-placeholder:text-brand-grey/50 data-placeholder:font-normal w-[140px] shrink-0 ${!reconUser ? 'text-brand-grey/50' : 'text-brand-dark-grey'}`}>
                                    <SelectValue placeholder="Select...">
                                      {reconUserObj ? (
                                        <span>{reconUserObj.name} {reconUserObj.title && <span className="text-brand-dark-grey">({reconUserObj.title})</span>}</span>
                                      ) : null}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent className="bg-brand-surface" align="start">
                                    {users.map(u => (
                                      <SelectItem key={u.id} value={u.id} className="text-brand-dark-grey pl-3">
                                        {u.name} {u.title && <span className="text-brand-dark-grey">({u.title})</span>}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              {isSigRequired && (
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 text-[9px] text-brand-blue hover:text-brand-blue/80 px-1 font-bold shrink-0 hover:bg-transparent pb-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    reconCanvasRef.current?.clear();
                                    setReconSigData(null);
                                  }}
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            
                            {isSigRequired && (
                              <div className="h-[105px] relative border border-brand-blue/15 bg-brand-blue/[0.02] rounded-xl overflow-hidden mt-0.5">
                                <SignatureCanvas 
                                  ref={reconCanvasRef}
                                  penColor="#0d3151"
                                  canvasProps={{
                                    id: "reconciliation-signature-canvas",
                                    className: "w-full h-full cursor-crosshair bg-transparent"
                                  }}
                                />
                              </div>
                            )}
                          </div>

                          {/* Right Sign-off: PIC */}
                          <div className="flex flex-col gap-0.5 animate-fade-in">
                            {/* Inner row for PIC and clear */}
                            <div className="flex items-end justify-between px-1 h-7">
                              <span className="text-xs text-brand-blue font-black uppercase tracking-wider truncate mr-2 pb-0">
                                PIC: {picUserObj?.name || "PIC NOT ASSIGNED"}
                              </span>
                              {isSigRequired && (
                                <Button 
                                  type="button"
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-5 text-[9px] text-brand-blue hover:text-brand-blue/80 px-1 font-bold shrink-0 hover:bg-transparent pb-0"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    picCanvasRef.current?.clear();
                                    setPicSigData(null);
                                  }}
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            
                            {isSigRequired && (
                              <div className="h-[105px] relative border border-brand-blue/15 bg-brand-blue/[0.02] rounded-xl overflow-hidden mt-0.5">
                                <SignatureCanvas 
                                  ref={picCanvasRef}
                                  penColor="#0d3151"
                                  canvasProps={{
                                      id: "reconciliation-pic-signature-canvas",
                                      className: "w-full h-full cursor-crosshair bg-transparent"
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Reduced space disclaimer under signature fields */}
                  <p className="shrink-0 text-[9px] text-brand-grey font-medium leading-normal text-left pt-1 border-t border-brand-blue/5">
                    By executing this report, you certify that the physical count has been completed, any discrepancies are explained truthfully, and stock metrics are reconciled in good faith.
                  </p>
                </div>

          </div>

            <div className="py-3 px-6 bg-brand-blue/5 border-t border-brand-blue/10 flex justify-end items-center gap-3 shrink-0 rounded-b-2xl">
              <Button
                id="recon-cancel-button"
                type="button"
                onClick={() => {
                  setIsReconOpen(false);
                  setCurrentTab("inventory");
                }}
                className="text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl h-12 px-6 border-none transition-all flex items-center justify-center"
              >
                Cancel
              </Button>
              <Button
                id="recon-generate-report-button"
                type="button"
                onClick={handleReconciliationSubmit}
                disabled={isReconSubmitting}
                className="text-[10px] font-black uppercase tracking-widest bg-brand-yellow hover:brightness-110 text-brand-blue rounded-xl h-12 shadow-lg shadow-brand-yellow/20 px-6 border-none transition-all flex items-center justify-center"
              >
                {isReconSubmitting ? "Generating..." : "Generate Report"}
              </Button>
            </div>
        </div>

        <div className={`flex flex-col flex-1 min-h-0 ${!reconShowPreview ? 'hidden' : ''}`}>
          {/* Print Report Review Page (Gorgeously Styled) */}
          <ScrollArea className="flex-1 overflow-y-auto">
            {renderReconciliationReportContent(false)}
          </ScrollArea>

            <div className="py-3 px-6 bg-brand-blue/5 border-t border-brand-blue/10 flex justify-end items-center gap-3 shrink-0 rounded-b-2xl">
              <Button
                type="button"
                onClick={() => {
                  setReconShowPreview(false);
                  setSelectedHistoricalReport(null);
                }}
                className="text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl h-12 px-6 border-none transition-all flex items-center justify-center"
              >
                {selectedHistoricalReport ? "Return to Registry" : "Return to Editing"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  let printedViaPopup = false;
                  try {
                    const printContent = document.getElementById("reconciliation-printable-root")?.innerHTML;
                    if (printContent) {
                      // Grab all head style and link tags to compile styling accurately inside the popup
                      const styleTags = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
                        .map(tag => tag.outerHTML)
                        .join("\n");
                        
                      const printWindow = window.open("", "_blank");
                      if (printWindow) {
                        printWindow.document.write(`
                          <!DOCTYPE html>
                          <html>
                            <head>
                              <title>PharmaGuard Reconciliation Report</title>
                              ${styleTags}
                              <style>
                                @page {
                                  size: landscape;
                                  margin: 10mm 15mm 15mm 15mm;
                                  @bottom-right {
                                    content: "page " counter(page) " of " counter(pages);
                                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: #111827;
                                    vertical-align: top;
                                    padding-top: 2mm;
                                  }
                                  @bottom-left {
                                    content: "Generated With PharmaGuard";
                                    font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                    font-size: 8px;
                                    font-weight: bold;
                                    color: #111827;
                                    vertical-align: top;
                                    padding-top: 2mm;
                                  }
                                }
                                html, body, #reconciliation-printable-root, #reconciliation-printable-invoice {
                                  width: 100% !important;
                                  height: auto !important;
                                  min-height: 0 !important;
                                  max-height: none !important;
                                  overflow: visible !important;
                                  overflow-x: visible !important;
                                  overflow-y: visible !important;
                                  position: static !important;
                                  top: auto !important;
                                  left: auto !important;
                                  right: auto !important;
                                  bottom: auto !important;
                                  overscroll-behavior: auto !important;
                                  background: white !important;
                                  color: black !important;
                                }
                                body {
                                  margin: 0 !important;
                                  padding: 0 !important;
                                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                  -webkit-print-color-adjust: exact !important;
                                  print-color-adjust: exact !important;
                                  display: block !important;
                                }
                                #reconciliation-printable-root {
                                  display: block !important;
                                  position: static !important;
                                  width: 100% !important;
                                  height: auto !important;
                                  min-height: 0 !important;
                                  max-height: none !important;
                                  overflow: visible !important;
                                  padding: 0 !important;
                                  margin: 0 !important;
                                  background: white !important;
                                }
                                #reconciliation-printable-invoice {
                                  display: block !important;
                                  position: static !important;
                                  width: 100% !important;
                                  height: auto !important;
                                  min-height: 0 !important;
                                  max-height: none !important;
                                  overflow: visible !important;
                                  box-shadow: none !important;
                                  border: none !important;
                                }
                                table, tbody, thead, th, td {
                                  page-break-inside: auto !important;
                                  break-inside: auto !important;
                                  height: auto !important;
                                }
                                tr {
                                  page-break-inside: avoid !important;
                                  break-inside: avoid !important;
                                }
                                .break-inside-avoid {
                                  page-break-inside: avoid !important;
                                  break-inside: avoid !important;
                                }

                              </style>
                            </head>
                            <body class="bg-white">
                              <div id="reconciliation-printable-root">
                                ${printContent}
                              </div>
                              <script>
                                function triggerPrint() {
                                  setTimeout(() => {
                                    window.print();
                                    setTimeout(() => { window.close(); }, 1500);
                                  }, 800);
                                }
                                if (document.readyState === 'complete') {
                                  triggerPrint();
                                } else {
                                  window.addEventListener('load', triggerPrint);
                                }
                              </script>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printedViaPopup = true;
                      }
                    }
                  } catch (e) {
                    console.warn("Failed to print via popup tab, using standard fallback print:", e);
                  }

                  if (!printedViaPopup) {
                    window.print();
                  }
                }}
                className="text-[10px] font-black uppercase tracking-widest bg-brand-yellow hover:brightness-110 text-brand-blue rounded-xl h-12 shadow-lg shadow-brand-yellow/20 px-6 border-none transition-all flex gap-2 items-center justify-center"
              >
                <Printer className="h-4 w-4" />
                PRINT REPORT
              </Button>
            </div>

            {/* Print utilities to style print view on Ctrl+P or button click */}
            <style>{`
              @page {
                size: landscape;
                margin: 10mm 15mm 15mm 15mm;
                @bottom-right {
                  content: "page " counter(page) " of " counter(pages);
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  font-size: 8px;
                  font-weight: bold;
                  color: #111827;
                  vertical-align: top;
                  padding-top: 2mm;
                }
                @bottom-left {
                  content: "Generated With PharmaGuard";
                  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                  font-size: 8px;
                  font-weight: bold;
                  color: #111827;
                  vertical-align: top;
                  padding-top: 2mm;
                }
              }
              @media screen {
                #reconciliation-printable-root {
                  display: none !important;
                }
              }
              @media print {
                html, body {
                  position: static !important;
                  overflow: visible !important;
                  overflow-x: visible !important;
                  overflow-y: visible !important;
                  width: auto !important;
                  height: auto !important;
                  max-height: none !important;
                  min-height: 0 !important;
                  top: auto !important;
                  left: auto !important;
                  right: auto !important;
                  bottom: auto !important;
                  margin: 0 !important;
                  padding: 0 !important;
                  background: white !important;
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                }
                body > *:not(#reconciliation-printable-root) {
                  display: none !important;
                }
                #reconciliation-printable-root {
                  display: block !important;
                  position: static !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  padding: 0 !important;
                  margin: 0 !important;
                  background: white !important;
                }
                #reconciliation-printable-invoice {
                  display: block !important;
                  position: static !important;
                  width: 100% !important;
                  height: auto !important;
                  overflow: visible !important;
                  max-height: none !important;
                }
                #reconciliation-printable-root * {
                  visibility: visible !important;
                }
                table, tbody, thead, th, td {
                  page-break-inside: auto !important;
                  break-inside: auto !important;
                  height: auto !important;
                }
                tr {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .break-inside-avoid {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }

              }
            `}</style>
        </div>

        {/* Report History View */}
        <div className={`flex flex-col flex-1 min-h-0 ${(reconViewMode !== "history" || reconShowPreview) ? 'hidden' : ''}`}>
          <div className="p-6 pb-2 border-b border-brand-blue/10 bg-brand-blue/5">
            <h3 className="text-sm font-black uppercase tracking-wider text-brand-blue flex items-center gap-2 text-left">
              ARCHIVED RECONCILIATION REPORTS ({historicalReports.length})
            </h3>
            <p className="text-xs text-brand-dark-grey/60 mt-1 text-left">
              Select any report from the registry below to retrieve and print certified historical snapshots.
            </p>
          </div>

          <div className="flex-1 min-h-0 p-6 flex flex-col">
            <div className="border border-brand-blue/10 rounded-xl overflow-hidden bg-brand-surface flex flex-col flex-1 min-h-0 shadow-sm">
              <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto scrollbar-thin scrollbar-thumb-brand-blue/20 touch-auto">
                <table className="w-full border-separate border-spacing-0 text-xs text-left">
                  <thead className="sticky top-0 z-40 bg-brand-blue">
                    <tr className="bg-brand-blue hover:bg-brand-blue border-none">
                      <th className="font-extrabold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0 px-4" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>Report Date</th>
                      <th className="font-extrabold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0 px-4" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>Reference #</th>
                      <th className="font-extrabold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0 px-4" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>Schedules</th>
                      <th className="font-extrabold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0 px-4" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>Medications</th>
                      <th className="font-extrabold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0 px-4" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>Completed By</th>
                      <th className="font-extrabold text-xs tracking-wider text-white text-center bg-brand-blue border-b border-brand-blue/10 sticky top-0 z-30 h-12 py-0 px-4" style={{ top: 0, verticalAlign: 'middle', lineHeight: 'normal' }}>PIC</th>
                    </tr>
                  </thead>
                  <tbody className="bg-brand-surface text-brand-dark-grey divide-y divide-brand-blue/5">
                    {historicalReports.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-12 text-brand-dark-grey/50 italic font-medium">
                          No reports archived in the registry.
                        </td>
                      </tr>
                    ) : (
                      [...historicalReports]
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((report) => (
                          <tr 
                            key={report.id} 
                            onClick={() => {
                              setSelectedHistoricalReport(report);
                              setReconShowPreview(true);
                            }}
                            className="hover:bg-brand-blue/5 cursor-pointer transition-all duration-150 group animate-in fade-in slide-in-from-bottom-1 duration-150"
                          >
                            <td className="text-center border-b border-brand-blue/5 py-4 px-4 font-semibold font-sans text-brand-dark-grey" style={{ verticalAlign: 'middle' }}>
                              {new Date(report.timestamp).toLocaleDateString()} at {new Date(report.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="text-center border-b border-brand-blue/5 py-4 px-4 font-black font-sans text-brand-blue group-hover:text-brand-yellow transition-colors" style={{ verticalAlign: 'middle' }}>
                              {report.reportNumber?.startsWith("REC-") ? report.reportNumber : `REC-${report.reportNumber}`}
                            </td>
                            <td className="text-center border-b border-brand-blue/5 py-4 px-4" style={{ verticalAlign: 'middle' }}>
                              <span className="text-[10px] text-brand-blue font-black uppercase tracking-widest bg-brand-blue/5 px-2 py-0.5 rounded-lg border border-brand-blue/10">
                                {report.scheduleFilter || "ALL"}
                              </span>
                            </td>
                            <td className="text-center border-b border-brand-blue/5 py-4 px-4 font-semibold font-sans text-brand-dark-grey text-xs" style={{ verticalAlign: 'middle' }}>
                              {(() => {
                                const count = report.items?.length || 0;
                                return `${count} ${count === 1 ? "substance" : "substances"} reconciled`;
                              })()}
                            </td>
                            <td className="text-center border-b border-brand-blue/5 py-4 px-4 font-bold font-sans text-brand-dark-grey" style={{ verticalAlign: 'middle' }}>
                              <span className="font-bold text-brand-dark-grey">{report.performedByName}</span>
                              {report.performedByTitle && (
                                <span className="font-bold text-brand-dark-grey ml-1">({report.performedByTitle})</span>
                              )}
                            </td>
                            <td className="text-center border-b border-brand-blue/5 py-4 px-4 font-bold font-sans text-brand-dark-grey" style={{ verticalAlign: 'middle' }}>
                              {report.picName || "N/A"}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="py-3 px-6 bg-brand-blue/5 border-t border-brand-blue/10 flex justify-end items-center gap-3 shrink-0 rounded-b-2xl">
            <Button
              id="recon-history-close"
              type="button"
              onClick={() => {
                setReconViewMode("form");
              }}
              className="text-[10px] font-black uppercase tracking-widest bg-brand-blue hover:brightness-110 text-white rounded-xl h-12 shadow-lg shadow-brand-blue/20 px-6 border-none transition-all flex items-center justify-center"
            >
              Back to Form
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>

    {/* Node Migration Dialog */}
    <Dialog open={isNodeMigrationOpen} onOpenChange={setIsNodeMigrationOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-[480px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col">
        <DialogHeader className="p-5 bg-brand-blue text-white relative shrink-0">
          <div className="flex items-center gap-4 relative z-10 text-left">
            <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden border border-brand-yellow/20">
              <OneSidedArrowLeftRight className="h-5 w-5 text-brand-blue" strokeWidth={3} />
            </div>
            <div>
              <DialogTitle className="text-base font-black uppercase tracking-wider text-white">Node Registry Migration</DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[9px] tracking-widest mt-1 uppercase leading-tight">
                RELOCATE ALL SUBSTANCE INVENTORY AND AUDIT LEDGERS BETWEEN NODES.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-5 flex-1 overflow-visible">
          {/* Form */}
          <div className="flex flex-col gap-6 pt-5">
            <div className="relative text-left">
              <label className="absolute -top-5 left-1 text-[10px] uppercase font-black tracking-wider text-brand-blue/80">Source Node</label>
              <div className="relative">
                <Input
                  placeholder="Type to search source node..."
                  value={migrationSourceSearch}
                  onChange={(e) => {
                    setMigrationSourceSearch(e.target.value);
                    setMigrationSourceNode("");
                    setIsSourceSearchFocused(true);
                  }}
                  onFocus={() => setIsSourceSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsSourceSearchFocused(false), 200);
                  }}
                  className="w-full h-11 px-3 border border-brand-blue/10 rounded-xl bg-brand-surface text-brand-dark-grey text-sm font-semibold focus-visible:ring-brand-blue placeholder:text-brand-grey/50"
                />
                {isSourceSearchFocused && migrationSourceSearch.trim() !== "" && (
                  <div className="absolute z-50 w-full mt-1 bg-brand-surface border border-brand-blue/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto left-0 top-full">
                    {allUserProfiles
                      .filter((p) => {
                        const emailLower = (p.email || "").toLowerCase().trim();
                        // Allow MASTER_ADMIN_EMAIL (allen32) to be used as a source node so their legacy/test registry can be migrated or consolidated
                        const matchStr = migrationSourceSearch.toLowerCase().trim();
                        const orgName = (p.organizationName || "").toLowerCase();
                        const dispName = (p.displayName || "").toLowerCase();
                        return (
                          !matchStr ||
                          orgName.includes(matchStr) ||
                          dispName.includes(matchStr) ||
                          emailLower.includes(matchStr)
                        );
                      })
                      .map((p) => {
                        const nodeName = p.organizationName || p.displayName || p.email;
                        return (
                          <div
                            key={`src-opt-${p.uid}`}
                            onMouseDown={() => {
                              setMigrationSourceNode(p.email || p.uid);
                              setMigrationSourceSearch(`${nodeName} (${p.email})`);
                              setIsSourceSearchFocused(false);
                            }}
                            className="px-4 py-2 hover:bg-brand-blue/5 cursor-pointer text-xs flex flex-col border-b border-brand-blue/5 last:border-0"
                          >
                            <span className="font-bold text-brand-blue">{nodeName}</span>
                            <span className="text-[10px] text-brand-dark-grey/60 font-medium">{p.email}</span>
                          </div>
                        );
                      })}
                    {allUserProfiles.filter((p) => {
                      const emailLower = (p.email || "").toLowerCase().trim();
                      // Allow MASTER_ADMIN_EMAIL (allen32) as a source node in match checking
                      const matchStr = migrationSourceSearch.toLowerCase().trim();
                      const orgName = (p.organizationName || "").toLowerCase();
                      const dispName = (p.displayName || "").toLowerCase();
                      return (
                        !matchStr ||
                        orgName.includes(matchStr) ||
                        dispName.includes(matchStr) ||
                        emailLower.includes(matchStr)
                      );
                    }).length === 0 && (
                      <div className="px-4 py-3 text-xs text-brand-dark-grey/50 italic">No matches found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-center py-0">
              <svg className="h-16 w-16 text-brand-blue" viewBox="0 0 24 24" fill="currentColor">
                {/* Single downward bold/blocky arrow: wide square stem with large triangle head */}
                <path d="M8,3 H16 V11 H21 L12,21 L3,11 H8 Z" />
              </svg>
            </div>

            <div className="relative text-left">
              <label className="absolute -top-5 left-1 text-[10px] uppercase font-black tracking-wider text-brand-blue/80">Destination Node</label>
              <div className="relative">
                <Input
                  placeholder="Type to search destination node..."
                  value={migrationDestSearch}
                  onChange={(e) => {
                    setMigrationDestSearch(e.target.value);
                    setMigrationDestNode("");
                    setIsDestSearchFocused(true);
                  }}
                  onFocus={() => setIsDestSearchFocused(true)}
                  onBlur={() => {
                    setTimeout(() => setIsDestSearchFocused(false), 200);
                  }}
                  className="w-full h-11 px-3 border border-brand-blue/10 rounded-xl bg-brand-surface text-brand-dark-grey text-sm font-semibold focus-visible:ring-brand-blue placeholder:text-brand-grey/50"
                />
                {isDestSearchFocused && migrationDestSearch.trim() !== "" && (
                  <div className="absolute z-50 w-full mt-1 bg-brand-surface border border-brand-blue/10 rounded-xl shadow-2xl max-h-48 overflow-y-auto left-0 top-full">
                    {allUserProfiles
                      .filter((p) => {
                        const emailLower = (p.email || "").toLowerCase().trim();
                        if (emailLower === MASTER_ADMIN_EMAIL.toLowerCase().trim()) return false;
                        const matchStr = migrationDestSearch.toLowerCase().trim();
                        const orgName = (p.organizationName || "").toLowerCase();
                        const dispName = (p.displayName || "").toLowerCase();
                        return (
                          !matchStr ||
                          orgName.includes(matchStr) ||
                          dispName.includes(matchStr) ||
                          emailLower.includes(matchStr)
                        );
                      })
                      .map((p) => {
                        const nodeName = p.organizationName || p.displayName || p.email;
                        return (
                          <div
                            key={`dest-opt-${p.uid}`}
                            onMouseDown={() => {
                              setMigrationDestNode(p.email || p.uid);
                              setMigrationDestSearch(`${nodeName} (${p.email})`);
                              setIsDestSearchFocused(false);
                            }}
                            className="px-4 py-2 hover:bg-brand-blue/5 cursor-pointer text-xs flex flex-col border-b border-brand-blue/5 last:border-0"
                          >
                            <span className="font-bold text-brand-blue">{nodeName}</span>
                            <span className="text-[10px] text-brand-dark-grey/60 font-medium">{p.email}</span>
                          </div>
                        );
                      })}
                    {allUserProfiles.filter((p) => {
                      const emailLower = (p.email || "").toLowerCase().trim();
                      if (emailLower === MASTER_ADMIN_EMAIL.toLowerCase().trim()) return false;
                      const matchStr = migrationDestSearch.toLowerCase().trim();
                      const orgName = (p.organizationName || "").toLowerCase();
                      const dispName = (p.displayName || "").toLowerCase();
                      return (
                        !matchStr ||
                        orgName.includes(matchStr) ||
                        dispName.includes(matchStr) ||
                        emailLower.includes(matchStr)
                      );
                    }).length === 0 && (
                      <div className="px-4 py-3 text-xs text-brand-dark-grey/50 italic">No matches found</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 px-6 bg-brand-blue/5 flex gap-3 border-t border-brand-blue/10 rounded-b-2xl flex-col sm:flex-row">
          <Button
            onClick={() => {
              setIsNodeMigrationOpen(false);
            }}
            disabled={isMigrating}
            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleNodeDataMigration}
            disabled={isMigrating || !migrationSourceNode || !migrationDestNode}
            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 rounded-xl disabled:opacity-50 transition-all"
          >
            Execute Migration
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Super Admin Dialog */}
    <Dialog open={isSuperAdminOpen} onOpenChange={setIsSuperAdminOpen}>
      <DialogContent showCloseButton={false} className="max-w-[95vw] lg:max-w-xl w-full h-[85vh] overflow-hidden flex flex-col p-0 gap-0 border-brand-blue/20 bg-brand-surface rounded-xl shadow-2xl">
        <DialogHeader className="p-4 bg-brand-blue text-white overflow-hidden relative border-none rounded-t-lg">
          <div className="flex flex-col gap-4 relative z-10 w-full">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-brand-blue border-2 border-white flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
                <Settings className="h-6 w-6 text-white fill-brand-yellow" strokeWidth={2} />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-2 w-2 rounded-full bg-brand-blue border-[1px] border-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-black tracking-tight leading-none truncate text-white">Super Admin Command Center</DialogTitle>
                <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] tracking-widest mt-1 leading-tight truncate">
                  REAL-TIME REGISTRY MANAGEMENT AND GLOBAL SUBSCRIPTION AUTHORITY TERMINAL.
                </DialogDescription>
              </div>
            </div>

            <div className="px-3 py-2 bg-brand-yellow rounded-lg border border-brand-yellow/20 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-blue/60 leading-none mb-1">Authenticated Master Identity</span>
                  <span className="text-xs font-black text-brand-blue/80 tracking-tight flex items-center gap-2 no-interact">
                    {getIdentityString(userProfile, user?.email)} 
                    <span className={`h-1.5 w-1.5 rounded-full ${isMasterAdmin ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} title={isMasterAdmin ? 'Authority Verified' : 'Standard User Restricted'} />
                  </span>
                </div>
                <div className="h-6 w-px bg-brand-blue/10" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-blue/60 leading-none mb-1">Registry Synchronization Status</span>
                  <span className="text-xs font-black text-brand-blue/80 tracking-tight">
                    {filteredUserProfiles.filter(p => (p.email || "").toLowerCase().trim() !== MASTER_ADMIN_EMAIL.toLowerCase().trim()).length} Managed Customer Nodes Registered
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-3 bg-brand-blue/5 border-b border-brand-blue/10 flex flex-col gap-3 shrink-0">
          <div className="flex gap-2 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-grey/40" />
              <Input 
                placeholder="Search registry nodes..." 
                className="pl-9 h-9 border-brand-blue/20 bg-white focus-visible:ring-brand-blue text-xs shadow-sm w-full"
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                setIsActionPending(true);
                try {
                  const usersRef = collection(db, "users");
                  const snapshot = await getDocs(usersRef);
                  const items = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return { 
                      ...data, 
                      docId: doc.id,
                      uid: data.uid || doc.id // Ensure uid exists for older records
                    } as UserProfile;
                  });
                  setAllUserProfiles(items);
                  const filteredCount = Array.from(new Set(items.map(p => p.email?.toLowerCase() || p.uid?.toLowerCase() || p.docId?.toLowerCase())))
                    .filter(e => e?.toLowerCase() !== MASTER_ADMIN_EMAIL.toLowerCase()).length;
                  toast.success(`Registry Sync Complete: ${filteredCount} Registered Nodes Found`, {
                    description: `Total raw database entries: ${items.length}`
                  });
                } catch (err: any) {
                  toast.error(`Sync Failed: ${err.message}`);
                } finally {
                  setIsActionPending(false);
                }
              }}
              disabled={isActionPending}
              className="h-9 px-3 border-brand-blue/20 bg-white text-brand-blue hover:bg-brand-blue hover:text-white transition-all shadow-sm flex gap-2"
            >
              <RefreshCcw className={`h-3 w-3 ${isActionPending ? 'animate-spin' : ''}`} />
              <span className="text-[10px] uppercase font-black tracking-widest">{isActionPending ? 'Syncing...' : 'Sync'}</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-hidden p-2">
          <div className="h-full border border-brand-blue/10 rounded-md overflow-hidden bg-white shadow-sm flex flex-col">
            <div className="overflow-hidden bg-brand-blue/5 border-b border-brand-blue/10">
              <table className="w-full table-fixed">
                <thead>
                  <tr className="h-9">
                    <th className="py-2 px-4 font-black text-brand-blue uppercase tracking-widest text-[9px] text-left w-[80%]">Organization ID & Status</th>
                    <th className="py-2 px-4 font-black text-brand-blue uppercase tracking-widest text-[9px] text-right w-[20%]">Terminal Operations</th>
                  </tr>
                </thead>
              </table>
            </div>
            <div className="flex-1 overflow-y-auto">
              <table className="w-full table-fixed">
                <tbody className="divide-y divide-brand-blue/5">
                  {filteredUserProfiles.length > 0 ? (
                    filteredUserProfiles.map((profile) => {
                      const isAdminNode = (profile.email || "").toLowerCase().trim() === MASTER_ADMIN_EMAIL.toLowerCase().trim();
                      return (
                        <tr 
                          key={profile.docId || profile.uid} 
                          className={`transition-colors h-14 border-b border-brand-blue/5 ${
                            isAdminNode 
                              ? 'bg-brand-blue/10 hover:bg-brand-blue/15 border-l-4 border-brand-yellow' 
                              : 'hover:bg-brand-blue/5'
                          }`}
                        >
                          <td className="py-2 px-4 w-[80%]">
                            <div className="flex flex-col gap-0.5 min-w-0">
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                <span className="font-bold text-xs text-brand-dark-grey break-all no-interact">
                                  {escapeEmail(profile.organizationName || profile.displayName || "Unregistered Node")}
                                </span>
                                {profile.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase() && (
                                  <Badge className="bg-brand-blue text-white text-[7px] font-black px-1.5 h-3.5 rounded-sm uppercase tracking-tighter animate-pulse">
                                    MASTER AUTHORITY
                                  </Badge>
                                )}
                                <Badge 
                                  className={`text-[7px] font-black px-1.5 h-3.5 rounded-sm inline-flex items-center uppercase tracking-tighter shrink-0 border ${
                                    profile.status === 'active' 
                                      ? 'bg-green-50 text-green-700 border-green-200' 
                                      : profile.status === 'pending'
                                        ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30'
                                        : 'bg-red-50 text-red-700 border-red-200'
                                  }`}
                                >
                                  {profile.status === 'active' ? '● Active' : profile.status === 'pending' ? '● Pending' : '● Suspended'}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5 min-w-0">
                                 <span className="text-[10px] text-brand-grey font-medium break-all block no-interact">
                                   <span className="cursor-default select-none no-underline flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                                     <span>{profile.email ? escapeEmail(profile.email) : "No Email Bound"}</span>
                                     {profile.email && profile.password && profile.password.toLowerCase() !== "legacy account" && (
                                       <span className="text-brand-blue font-mono font-bold bg-brand-blue/5 border border-brand-blue/10 px-1.5 py-0.5 rounded select-all leading-none inline-flex items-center whitespace-nowrap">
                                          PW: {profile.password}
                                       </span>
                                     )}
                                   </span>
                                 </span>
                                 <Badge variant="outline" className="text-[8px] font-mono text-brand-grey/50 px-1 py-0 h-4 border-brand-grey/10 whitespace-nowrap">
                                   UID: {profile.docId}
                                 </Badge>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 px-4 w-[20%] text-right">
                            {isAdminNode ? (
                              <div className="flex justify-end items-center gap-2">
                                <span className="text-[9px] font-black text-brand-blue uppercase tracking-widest pointer-events-none select-none">
                                  ● SYSTEM ROOT
                                </span>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNodeToReset(profile);
                                    setIsResetConfirmOpen(true);
                                  }}
                                  className="h-7 w-7 p-0 text-brand-dark-grey/60 hover:text-brand-yellow"
                                  title="Clear User Data"
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end gap-1">
                                <Button 
                                  variant={profile.status === 'active' ? 'outline' : 'default'}
                                  size="sm"
                                  onClick={() => handleUpdateSubscription(profile.docId || profile.uid, profile.status)}
                                  className={`font-black uppercase tracking-tighter text-[9px] h-7 px-3 border transition-all shrink-0 ${
                                    profile.status === 'active' 
                                      ? 'border-red-100 text-red-600 hover:bg-red-600 hover:text-white' 
                                      : 'bg-brand-blue text-white hover:bg-brand-blue/90'
                                  }`}
                                >
                                  {profile.status === 'active' ? 'Suspend' : profile.status === 'pending' ? 'Grant Access' : 'Restore'}
                                </Button>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNodeToReset(profile);
                                    setIsResetConfirmOpen(true);
                                  }}
                                  className="h-7 w-7 p-0 text-brand-dark-grey/60 hover:text-brand-yellow"
                                  title="Clear User Data"
                                >
                                  <RefreshCcw className="h-3.5 w-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setNodeToDelete(profile);
                                    setIsDeleteConfirmOpen(true);
                                  }}
                                  className="h-7 w-7 p-0 text-brand-dark-grey/60 hover:text-red-500"
                                  title="Purge Node"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-12 border-none">
                        <div className="flex flex-col items-center justify-center gap-3 opacity-30 grayscale transition-all hover:grayscale-0 hover:opacity-100">
                          <div className="bg-brand-blue/10 p-4 rounded-full">
                            <Ghost className="h-10 w-10 text-brand-blue" />
                          </div>
                          <div className="text-center">
                            <p className="font-black uppercase text-[11px] tracking-widest text-brand-blue">No Registered Nodes Detected</p>
                            <p className="text-[9px] font-medium text-brand-blue/60 mt-1 max-w-[200px] leading-relaxed italic">
                              Check the Debug Panel below to see raw database records and why they are being filtered.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </div>
        
        <div className="p-3 px-4 bg-brand-blue/5 flex justify-between items-center border-t border-brand-blue/10">
          <div className="flex flex-col">
            <p className="text-[8px] text-brand-grey/40 uppercase tracking-widest font-black no-interact">
              Authority: <span className="cursor-default select-none no-underline">{getIdentityString(userProfile, user?.email)}</span>
            </p>
            <p className="text-[8px] text-brand-blue/40 uppercase tracking-widest font-black">
              PharmaGuard Inventory Registry Terminal
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="default" 
              title="migration"
              onClick={() => setIsNodeMigrationOpen(true)}
              className="text-[10px] font-black uppercase tracking-widest bg-brand-blue text-brand-yellow hover:brightness-115 px-4 h-9 rounded-lg transition-all flex gap-2 items-center shadow-md shadow-brand-blue/20"
            >
              <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 border border-brand-yellow/20 shadow-sm">
                <OneSidedArrowLeftRight className="h-3.5 w-3.5 text-brand-blue" strokeWidth={3} />
              </div>
              data migration
            </Button>
            <Button 
              variant="default" 
              onClick={() => setIsSuperAdminOpen(false)}
              className="text-[10px] font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 px-6 h-9 rounded-lg transition-all shadow-md shadow-brand-yellow/10"
            >
              Disconnect Terminal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-brand-blue text-white relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex h-12 w-12 items-center justify-center shrink-0">
              <div className="h-12 w-12 bg-brand-yellow rounded-full flex items-center justify-center relative shadow-lg border border-brand-yellow/20">
                <Trash2 className="h-6 w-6 text-brand-blue" />
              </div>
            </div>
            <div className="flex flex-col gap-0">
              <DialogTitle className="text-xl font-black tracking-tighter text-white leading-none">
                Confirm Purge
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] tracking-widest mt-1">
                AUTHORIZED NODE REVOCATION PROCESS
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-4">
          <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 text-center">
            <p className="text-xs text-brand-blue font-bold leading-relaxed">
              WARNING: You are about to permanently purge the organizational node <span className="underline decoration-brand-yellow decoration-2 underline-offset-2">"{nodeToDelete?.organizationName || nodeToDelete?.displayName}"</span>. This action is irreversible and will immediately revoke all access privileges for this entity.
            </p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-grey/40">
              <span>Organizational Node</span>
              <span className="text-brand-blue/80 font-bold">{nodeToDelete?.organizationName || nodeToDelete?.displayName}</span>
            </div>
            <div className="h-[1px] bg-brand-grey/5 w-full" />
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-grey/40 no-interact">
              <span>Node Identity</span>
              <span className="text-brand-grey font-medium cursor-default select-none no-underline">{nodeToDelete?.email ? nodeToDelete.email.replace("@", "\u200B@\u200B") : ""}</span>
            </div>
            <div className="h-[1px] bg-brand-grey/5 w-full" />
            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-brand-grey/40">
              <span>Primary ID</span>
              <span className="text-brand-blue/80 font-bold">{nodeToDelete?.docId || nodeToDelete?.uid}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10">
          <Button 
            onClick={() => setIsDeleteConfirmOpen(false)} 
            className="bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl flex-1 transition-all hover:brightness-110 shadow-lg shadow-brand-blue/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={() => nodeToDelete && handleDeleteUserProfile(nodeToDelete.docId || nodeToDelete.uid)} 
            className="bg-brand-yellow hover:brightness-110 text-brand-blue font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl shadow-lg shadow-brand-yellow/20 flex-1 border-none transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Purge Node
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>


    <Dialog open={!!userToDeleteConfirm} onOpenChange={(open) => !open && setUserToDeleteConfirm(null)}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-brand-blue text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
          <div className="flex items-center gap-4 relative z-10 text-left">
            <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg">
              <Trash2 className="h-6 w-6 text-brand-blue" />
            </div>
            <div className="flex flex-col gap-0 overflow-hidden">
              <DialogTitle className="text-xl font-black tracking-tighter text-white leading-none">
                Remove User
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] tracking-widest mt-1">
                CREDENTIAL REVOCATION
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl space-y-2 text-left">
            <p className="text-brand-grey text-xs font-medium leading-relaxed">
              Are you sure you want to remove <span className="font-bold text-brand-dark-grey">{userToDeleteConfirm?.name}</span>'s authorization? 
              They will no longer be able to sign transactions in this terminal.
            </p>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2 px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10">
          <Button variant="default" onClick={() => setUserToDeleteConfirm(null)} className="flex-1 bg-brand-blue text-white hover:bg-brand-blue/90 font-black uppercase tracking-widest text-[10px] h-11 border-none shadow-lg shadow-brand-blue/10">
            Keep User
          </Button>
          <Button 
            className="flex-1 bg-brand-yellow text-brand-blue hover:brightness-110 font-black uppercase tracking-widest text-[10px] h-11 shadow-lg shadow-brand-yellow/20 border-none"
            onClick={() => {
              if (userToDeleteConfirm) handleDeleteUser(userToDeleteConfirm.id);
              setUserToDeleteConfirm(null);
            }}
          >
            Confirm Removal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={isLogoutConfirmOpen} onOpenChange={setIsLogoutConfirmOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] bg-brand-surface border-brand-grey/20 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-brand-blue text-white relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
              <LogOut className="h-6 w-6 text-brand-blue" />
            </div>
            
            <div className="flex flex-col gap-0">
              <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                Sign Out Confirmation
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] tracking-widest mt-1">
                AUTHENTICATION SESSION END
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="p-4 bg-brand-blue/5 border border-brand-blue/10 rounded-xl space-y-3 text-left">
            <p className="text-brand-grey text-xs font-medium leading-relaxed">
              Are you sure you want to end your current session?
            </p>
            <p className="text-brand-grey text-xs font-medium leading-relaxed">
              You will need to sign in again to access the vault.
            </p>
          </div>
        </div>
        <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setIsLogoutConfirmOpen(false)} 
            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl"
          >
            Stay Signed In
          </Button>
          <Button 
            onClick={() => {
              setIsLogoutConfirmOpen(false);
              handleLogout();
            }}
            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 transition-all active:scale-[0.98] rounded-xl disabled:opacity-100"
          >
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={isEditMinThresholdOpen} onOpenChange={setIsEditMinThresholdOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] bg-brand-surface border-brand-grey/20 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-brand-blue text-white relative">
          <div className="flex items-center gap-4 relative z-10 text-left">
            <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative">
              <div className="relative h-8 w-8 flex items-center justify-center">
                <svg className="h-full w-full absolute text-brand-blue overflow-visible" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="2 7 8.5 11.5 13.5 8.5 22 17" />
                  <line x1="0" y1="15.25" x2="24" y2="15.25" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <div className="flex flex-col gap-0">
              <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                Edit Minimum Threshold
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] tracking-widest mt-1">
                UPDATE THE LOW-STOCK ALERT THRESHOLD FOR THIS MEDICATION.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6">
          {editingMed && (
            <>
              <div className="p-3 bg-brand-blue/5 rounded-md border border-brand-blue/10 mb-4 text-center">
                <div className="text-sm font-bold text-brand-blue">{editingMed.name}{" "}{editingMed.strength}</div>
                <div className="text-xs text-brand-blue font-bold mt-0.5">NDC: {editingMed.ndc}</div>
              </div>

                <div className="grid gap-1.5">
                  <Label className="text-brand-dark-grey text-xs font-normal">Minimum Threshold</Label>
                  <Input 
                    type="text"
                    inputMode="numeric"
                    value={editingMed.minThreshold} 
                    onChange={e => {
                      const val = e.target.value;
                      if (val === "" || /^\d*$/.test(val)) {
                        setEditingMed({...editingMed, minThreshold: val as any});
                      }
                    }}
                    className="bg-brand-surface border-brand-blue/10 h-10 text-sm font-normal text-brand-dark-grey placeholder:text-brand-grey/50 placeholder:font-normal"
                    placeholder="e.g. 50"
                  />
                <p className="text-[10px] text-brand-dark-grey/50 italic">
                  The inventory stock will turn yellow and trigger an alert when it reaches or falls below this number.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => setIsEditMinThresholdOpen(false)} 
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl"
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 transition-all active:scale-[0.98] rounded-xl disabled:opacity-100"
            onClick={handleUpdateMinThreshold}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Update Threshold"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <Dialog open={isEditMedDetailsOpen} onOpenChange={setIsEditMedDetailsOpen} modal="trap-focus">
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-brand-grey/20 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-brand-blue text-white relative shrink-0">
          <div className="flex items-center gap-4 relative z-10 text-left">
            <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
              <Edit className="h-6 w-6 text-brand-blue" />
            </div>
            <div className="flex flex-col gap-0">
              <DialogTitle className="text-xl font-black tracking-tight text-white uppercase leading-none">
                Edit Medication Details
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                UPDATE THE PERMANENT RECORDS FOR THIS MEDICATION.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6">
            {editingMed && (
              <div className="grid gap-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-name" className="text-brand-dark-grey text-xs font-normal">Medication Name</Label>
                  <Input 
                    id="edit-name" 
                    value={editingMed.name} 
                    onChange={e => setEditingMed({...editingMed, name: e.target.value})}
                    className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-strength" className="text-brand-dark-grey text-xs font-normal">Strength</Label>
                    <Input 
                      id="edit-strength" 
                      value={editingMed.strength} 
                      onChange={e => setEditingMed({...editingMed, strength: e.target.value})}
                      className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-unit" className="text-brand-dark-grey text-xs font-normal">Dosage Form</Label>
                    <Input 
                      id="edit-unit" 
                      value={editingMed.unit} 
                      onChange={e => setEditingMed({...editingMed, unit: e.target.value})}
                      placeholder="e.g. Tablets"
                      className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-ndc" className="text-brand-dark-grey text-xs font-normal">NDC</Label>
                    <Input 
                      id="edit-ndc" 
                      value={editingMed.ndc} 
                      onChange={e => setEditingMed({...editingMed, ndc: e.target.value})}
                      placeholder="00000-0000-00"
                      className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-package-size" className="text-brand-dark-grey text-xs font-normal">Package Size</Label>
                    <Input 
                      id="edit-package-size" 
                      type="text"
                      inputMode="numeric"
                      value={editingMed.packageSize} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "" || /^\d*$/.test(val)) {
                          setEditingMed({...editingMed, packageSize: val as any});
                        }
                      }}
                      placeholder="e.g. 100"
                      className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-schedule" className="text-brand-dark-grey text-xs font-normal">Schedule</Label>
                    <Select 
                      value={editingMed.schedule} 
                      onValueChange={(v: Schedule) => setEditingMed({...editingMed, schedule: v})}
                    >
                      <SelectTrigger className="border-brand-grey/20 focus:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-brand-surface">
                        {SCHEDULES.map(s => (
                          <SelectItem key={s} value={s} className="font-normal">{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-min-threshold" className="text-brand-dark-grey text-xs font-normal">Min Threshold</Label>
                    <Input 
                      id="edit-min-threshold" 
                      type="text"
                      inputMode="numeric"
                      value={editingMed.minThreshold} 
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "" || /^\d*$/.test(val)) {
                          setEditingMed({...editingMed, minThreshold: val as any});
                        }
                      }}
                      placeholder="e.g. 50"
                      className="border-brand-grey/20 focus-visible:ring-brand-blue bg-brand-surface text-brand-dark-grey h-9 font-normal placeholder:text-brand-grey/50 placeholder:font-normal"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 flex flex-col sm:flex-row gap-3 shrink-0">
          <Button 
            onClick={() => setIsEditMedDetailsOpen(false)} 
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl"
          >
            Cancel
          </Button>
          <Button 
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 transition-all active:scale-[0.98] rounded-xl disabled:opacity-100"
            onClick={handleUpdateMedDetails}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Update Details"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={isProfileEditOpen} onOpenChange={(open) => {
      if (!open && !userProfile?.organizationName) {
        toast.error("Compliance Enforced: You must establish your clinical organization identity to continue.");
        return;
      }
      setIsProfileEditOpen(open);
    }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-brand-blue text-white relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 border border-brand-yellow/20 shadow-md">
              <Edit className="h-6 w-6 text-brand-blue" />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Profile Identity</DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                ESTABLISH ORGANIZATIONAL AUTHORITY
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label htmlFor="orgName" className="text-[10px] font-black tracking-widest text-brand-blue">Organization Name</Label>
            <Input 
              id="orgName"
              placeholder="e.g. UCLA Medical Center"
              value={editingOrgName}
              onChange={(e) => setEditingOrgName(e.target.value)}
              className="h-12 border-brand-blue/20 bg-brand-light-grey/30 focus-visible:ring-brand-blue font-bold text-brand-dark-grey"
            />
            <p className="text-[9px] text-brand-grey/60 italic leading-tight">
              This name will be used as your unique identifier across the registry and on all transaction logs.
            </p>
          </div>

          <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 flex items-start gap-3">
             <div className="h-5 w-5 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 mt-0.5 border border-brand-yellow/20 shadow-sm">
               <AlertCircle className="h-3 w-3 text-brand-blue" />
             </div>
             <p className="text-[10px] text-brand-grey leading-relaxed">
               Updating your organization name will immediately synchronize your identity across all regional database nodes.
             </p>
          </div>
        </div>

        <DialogFooter className="px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10 flex flex-col sm:flex-row gap-3">
          {userProfile?.organizationName && (
            <Button 
              onClick={() => setIsProfileEditOpen(false)}
              className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl"
            >
              Cancel
            </Button>
          )}
          <Button 
            onClick={handleUpdateOrgProfile}
            disabled={isSubmitting}
            className="flex-1 h-12 text-[10px] font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 transition-all active:scale-[0.98] rounded-xl disabled:opacity-100"
          >
            {isSubmitting ? "Synchronizing..." : "Update Identity"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <Dialog open={isResetConfirmOpen} onOpenChange={setIsResetConfirmOpen}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-brand-blue text-white relative">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg">
              <RefreshCcw className="h-6 w-6 text-brand-blue" />
            </div>
            <div className="flex flex-col gap-0">
              <DialogTitle className="text-xl font-black tracking-tighter text-white leading-none">
                Reset Node Data
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                AUTHORIZED INDIVIDUAL DATA PURGE
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6 space-y-4">
          <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 text-center">
            <p className="text-xs text-brand-blue font-bold leading-relaxed">
              WARNING: You are about to clear all substance and transaction logs for <span className="underline decoration-brand-yellow decoration-2 underline-offset-2">"{nodeToReset?.organizationName || nodeToReset?.displayName}"</span>. The organization node itself will remain in the registry.
            </p>
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 px-6 pb-6 pt-2 bg-brand-blue/5 border-t border-brand-blue/10">
          <Button onClick={() => setIsResetConfirmOpen(false)} className="bg-brand-blue text-white font-black uppercase tracking-widest text-[10px] h-12 flex-1 rounded-xl">
            Cancel
          </Button>
          <Button 
            onClick={() => nodeToReset && handleClearNodeData(nodeToReset.docId || nodeToReset.uid)} 
            disabled={isActionPending}
            className="bg-brand-yellow text-brand-blue font-black uppercase tracking-widest text-[10px] h-12 flex-1 rounded-xl shadow-lg shadow-brand-yellow/20"
          >
            {isActionPending ? 'Purging...' : 'Confirm Reset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  </div>
  );
}


