/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { toast } from "sonner";
import { doc, updateDoc, deleteDoc, collection, getDocs, setDoc } from "firebase/firestore";
import { db } from "./lib/firebase";

// Components
import { AppHeader } from "./components/layout/AppHeader";
import { Sidebar } from "./components/layout/Sidebar";
import { AuthScreen } from "./components/auth/AuthScreen";
import { InitializationDelay, PendingApproval, SuspendedAccount } from "./components/auth/StatusScreens";
import { InventoryView } from "./components/inventory/InventoryView";
import { AuditLogView } from "./components/history/AuditLogView";
import { AlertsView } from "./components/alerts/AlertsView";
import { SuperAdminPortal } from "./components/admin/SuperAdminPortal";
import { UserManagementDialog } from "./components/users/UserManagementDialog";
import { LogTransactionDialog } from "./components/forms/LogTransactionDialog";
import { AddSubstanceDialog } from "./components/inventory/AddSubstanceDialog";
import { TransactionDetailDialog } from "./components/history/TransactionDetailDialog";
import { PharmaLogo } from "./components/common/Icons";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";
import { useAppInitialization } from "./hooks/useAppInitialization";

// Lib
import { MASTER_ADMIN_EMAIL, APP_VERSION } from "./lib/constants";
import { Schedule, Transaction, Substance, TransactionType, UserProfile } from "./types";
import { handleFirestoreError, OperationType } from "./lib/errorHandlers";

export default function App() {
  const { user, userProfile, isAuthReady, logout } = useAuth();
  const { inventory, transactions, staff, loading: inventoryLoading, addTransaction, addSubstance } = useInventory(user?.email || null);
  const { bootTimeout, isInitializing } = useAppInitialization();

  const [activeSchedule, setActiveSchedule] = useState<Schedule | "ALL">("ALL");
  const [currentTab, setCurrentTab] = useState("inventory");
  
  // Dialog States
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [logType, setLogType] = useState<TransactionType>("OUT");
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [viewingTransaction, setViewingTransaction] = useState<Transaction | null>(null);
  const [selectedSubstanceDetail, setSelectedSubstanceDetail] = useState<Substance | null>(null);
  
  // Super Admin Logic
  const [allUserProfiles, setAllUserProfiles] = useState<UserProfile[]>([]);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isActionPending, setIsActionPending] = useState(false);
  const isMasterAdmin = user?.email?.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase();

  const handleSyncRegistry = async () => {
    setIsActionPending(true);
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const items = snapshot.docs.map(doc => ({ ...doc.data(), docId: doc.id } as UserProfile));
      setAllUserProfiles(items.filter(p => p.email !== MASTER_ADMIN_EMAIL));
      toast.success(`Registry Sync Complete: ${items.length - 1} Authorized Nodes`);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleUpdateUserStatus = async (docId: string, currentStatus: any) => {
    try {
      const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
      await updateDoc(doc(db, "users", docId), { status: nextStatus });
      setAllUserProfiles(prev => prev.map(p => p.docId === docId ? { ...p, status: nextStatus } : p));
      toast.success(`Node ${docId} set to ${nextStatus}`);
    } catch (err) {
      toast.error("Status update failed");
    }
  };

  // UI calculations
  const lowStockItems = useMemo(() => {
    return inventory.filter(item => item.currentStock <= item.minThreshold);
  }, [inventory]);

  if (isInitializing && !bootTimeout) {
    return (
      <div className="min-h-screen bg-brand-light-grey flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <PharmaLogo className="h-16 w-16 animate-pulse" />
          <p className="text-brand-blue font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing Secure Registry...</p>
        </div>
      </div>
    );
  }

  if (bootTimeout && isInitializing) {
    return <InitializationDelay onRetry={() => window.location.reload()} />;
  }

  if (!isAuthReady) return null;

  if (!user) {
    return <AuthScreen />;
  }

  if (userProfile?.status === 'pending') {
    return <PendingApproval 
      email={user.email} 
      onRetry={() => window.location.reload()} 
      onLogout={logout} 
    />;
  }

  if (userProfile?.status === 'suspended') {
    return <SuspendedAccount onLogout={logout} />;
  }

  return (
    <div className="min-h-screen bg-brand-light-grey font-sans text-brand-grey">
      <AppHeader 
        activeSchedule={activeSchedule} 
        onScheduleChange={setActiveSchedule}
        onLogoClick={() => isMasterAdmin && setIsSuperAdminOpen(true)}
      />

      <main className="max-w-[1800px] mx-auto p-4 md:pt-2 md:pb-8 md:px-8 lg:px-12">
        <Tabs 
          value={isUserManagementOpen ? "users" : currentTab} 
          onValueChange={(val) => {
            if (val === "users") {
              setIsUserManagementOpen(true);
            } else {
              setCurrentTab(val);
              setIsUserManagementOpen(false);
            }
          }}
          className="flex flex-col lg:grid lg:grid-cols-[256px_minmax(0,1fr)] gap-10 items-start w-full relative"
        >
          {/* Background Watermark */}
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center opacity-[0.02] overflow-hidden z-0">
            <PharmaLogo className="h-[800px] w-[800px]" />
          </div>

          <Sidebar 
            user={user}
            userProfile={userProfile}
            currentTab={currentTab}
            isUserManagementOpen={isUserManagementOpen}
            lowStockCount={lowStockItems.length}
            onTabChange={setCurrentTab}
            onDispense={() => { setLogType("OUT"); setIsLogOpen(true); }}
            onAdd={() => { setLogType("IN"); setIsLogOpen(true); }}
            onAdjust={() => { setLogType("ADJUST"); setIsLogOpen(true); }}
            onEditProfile={() => setIsAddMedOpen(true)} // Or dedicated profile edit
            onLogout={logout}
            masterAdminEmail={MASTER_ADMIN_EMAIL}
            appVersion={APP_VERSION}
          />

          <div className="w-full relative min-w-0 flex-1 z-10">
            <TabsContent value="inventory" className="m-0">
              <InventoryView 
                inventory={inventory} 
                activeSchedule={activeSchedule} 
                isInitializing={inventoryLoading}
                onSubstanceClick={setSelectedSubstanceDetail}
                onNDCClick={(ndc) => window.open(`https://ndclist.com/?s=${ndc}`, '_blank')}
              />
            </TabsContent>

            <TabsContent value="history" className="m-0">
              <AuditLogView 
                transactions={transactions} 
                inventory={inventory}
                activeSchedule={activeSchedule}
                onViewTransaction={setViewingTransaction}
                onNDCClick={(ndc) => window.open(`https://ndclist.com/?s=${ndc}`, '_blank')}
              />
            </TabsContent>

            <TabsContent value="alerts" className="m-0">
              <AlertsView 
                lowStockItems={lowStockItems} 
                onNDCClick={(ndc) => window.open(`https://ndclist.com/?s=${ndc}`, '_blank')}
                onDismissAlert={(id) => toast.info("Alert dismissed for this session")}
              />
            </TabsContent>
          </div>
        </Tabs>
      </main>

      {/* Dialogs */}
      <LogTransactionDialog 
        isOpen={isLogOpen}
        onOpenChange={setIsLogOpen}
        type={logType}
        inventory={inventory}
        users={staff}
        onLog={addTransaction}
        isPhotoRequirementEnabled={userProfile?.isPhotoRequirementEnabled || false}
      />

      <AddSubstanceDialog 
        isOpen={isAddMedOpen}
        onOpenChange={setIsAddMedOpen}
        onAdd={addSubstance}
      />

      <TransactionDetailDialog 
        transaction={viewingTransaction}
        inventory={inventory}
        onOpenChange={(open) => !open && setViewingTransaction(null)}
      />

      <SuperAdminPortal 
        isOpen={isSuperAdminOpen}
        onOpenChange={setIsSuperAdminOpen}
        userProfiles={allUserProfiles.filter(p => !userSearchTerm || p.email?.includes(userSearchTerm))}
        userProfile={userProfile}
        currentUser={user}
        searchTerm={userSearchTerm}
        setSearchTerm={setUserSearchTerm}
        onSync={handleSyncRegistry}
        onUpdateStatus={handleUpdateUserStatus}
        onDeleteNode={async (id) => {
           if(confirm("Confirm IRREVERSIBLE terminal deletion?")) {
             await deleteDoc(doc(db, "users", id));
             setAllUserProfiles(prev => prev.filter(p => p.docId !== id));
             toast.success("Node Purged");
           }
        }}
        onResetNode={() => toast.info("Reset logic pending specialized auth")}
        isActionPending={isActionPending}
        appVersion={APP_VERSION}
      />

      <UserManagementDialog 
        isOpen={isUserManagementOpen}
        onOpenChange={setIsUserManagementOpen}
        userEmail={user.email!}
        users={staff}
        isSubmitting={isActionPending}
        setIsSubmitting={setIsActionPending}
      />

      <Toaster 
        position="bottom-right"
        theme="light"
        expand={true}
        richColors={true}
      />
    </div>
  );
}
