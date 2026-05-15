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
import { DispenseDialog } from "./components/forms/DispenseDialog";
import { AddStockDialog } from "./components/forms/AddStockDialog";
import { AdjustStockDialog } from "./components/forms/AdjustStockDialog";
import { EditProfileDialog } from "./components/layout/EditProfileDialog";
import { LogoutConfirmDialog } from "./components/layout/LogoutConfirmDialog";
import { AddSubstanceDialog } from "./components/inventory/AddSubstanceDialog";
import { TransactionDetailDialog } from "./components/history/TransactionDetailDialog";
import { PharmaLogo } from "./components/common/Icons";

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useInventory } from "./hooks/useInventory";
import { useAppInitialization } from "./hooks/useAppInitialization";

// Lib
import { MASTER_ADMIN_EMAIL, APP_VERSION, SCHEDULES } from "./lib/constants";
import { Schedule, Transaction, Substance, TransactionType, UserProfile } from "./types";
import { handleFirestoreError, OperationType } from "./lib/errorHandlers";

export default function App() {
  const { user, userProfile, isAuthReady, logout } = useAuth();
  const { inventory, transactions, staff, loading: inventoryLoading, addTransaction, addSubstance } = useInventory(user?.email || null);
  const { bootTimeout, isInitializing } = useAppInitialization();

  const [activeSchedule, setActiveSchedule] = useState<Schedule | "ALL">("ALL");
  const [currentTab, setCurrentTab] = useState("inventory");
  
  // Dialog States
  const [isDispenseOpen, setIsDispenseOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isAdjustStockOpen, setIsAdjustStockOpen] = useState(false);
  const [isAddMedOpen, setIsAddMedOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isSuperAdminOpen, setIsSuperAdminOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
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

  // If loading, show professional loading state
  if (isInitializing || !isAuthReady) {
    return (
      <div className="min-h-screen bg-brand-light-grey flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <PharmaLogo className="h-20 w-20 animate-pulse" />
          <div className="flex flex-col items-center gap-2">
            <p className="text-black font-bold tracking-widest text-[10px] animate-pulse font-mono">Loading data...</p>
            <div className="h-[1px] w-24 bg-brand-blue/20 overflow-hidden rounded-full">
              <div className="h-full bg-brand-blue w-full -translate-x-full animate-[progress_1.5s_infinite_linear]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If connected but profile is taking too long to load (and we have a user)
  if (bootTimeout && userProfile === null && user !== null) {
    return <InitializationDelay onRetry={() => window.location.reload()} />;
  }

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
        onLogoClick={() => isMasterAdmin && setIsSuperAdminOpen(true)}
        activeSchedule={activeSchedule}
        onScheduleChange={setActiveSchedule}
      />

      <main className="max-w-[1800px] mx-auto p-4 md:pt-2 md:pb-8 md:px-8 lg:px-12">
        <Tabs 
          value={isUserManagementOpen ? "users" : currentTab} 
          orientation="vertical"
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
            onDispense={() => setIsDispenseOpen(true)}
            onAdd={() => setIsAddMedOpen(true)}
            onAdjust={() => setIsAdjustStockOpen(true)}
            onEditProfile={() => setIsEditProfileOpen(true)}
            onLogout={() => setIsLogoutConfirmOpen(true)}
            masterAdminEmail={MASTER_ADMIN_EMAIL}
            appVersion={APP_VERSION}
          />

          <div className="w-full relative min-w-0 flex-1 z-10 space-y-6">
            <TabsContent value="inventory" className="m-0">
              <InventoryView 
                inventory={inventory} 
                activeSchedule={activeSchedule} 
                isInitializing={inventoryLoading}
                onSubstanceClick={setSelectedSubstanceDetail}
                onNDCClick={(ndc) => window.open(`https://ndclist.com/?s=${ndc}`, '_blank')}
                onDispense={() => setIsDispenseOpen(true)}
                onAddStock={() => setIsAddStockOpen(true)}
                onAdjustStock={() => setIsAdjustStockOpen(true)}
                onEnroll={() => setIsAddMedOpen(true)}
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
      <DispenseDialog 
        isOpen={isDispenseOpen}
        onOpenChange={setIsDispenseOpen}
        inventory={inventory}
        users={staff}
        onLog={addTransaction}
        isPhotoRequirementEnabled={userProfile?.isPhotoRequirementEnabled || false}
      />

      <AddStockDialog 
        isOpen={isAddStockOpen}
        onOpenChange={setIsAddStockOpen}
        inventory={inventory}
        users={staff}
        onLog={addTransaction}
        isPhotoRequirementEnabled={userProfile?.isPhotoRequirementEnabled || false}
      />

      <AdjustStockDialog 
        isOpen={isAdjustStockOpen}
        onOpenChange={setIsAdjustStockOpen}
        inventory={inventory}
        users={staff}
        onLog={addTransaction}
        isPhotoRequirementEnabled={userProfile?.isPhotoRequirementEnabled || false}
        nextAdjustCount={transactions.filter(t => t.type === "ADJUST").length + 1}
      />

      <AddSubstanceDialog 
        isOpen={isAddMedOpen}
        onOpenChange={setIsAddMedOpen}
        onAdd={addSubstance}
        onLog={addTransaction}
        users={staff}
        isPhotoRequirementEnabled={userProfile?.isPhotoRequirementEnabled || false}
      />

      <EditProfileDialog 
        isOpen={isEditProfileOpen}
        onOpenChange={setIsEditProfileOpen}
        userProfile={userProfile}
        userEmail={user.email || ""}
      />

      <TransactionDetailDialog 
        transaction={viewingTransaction}
        inventory={inventory}
        staff={staff}
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
        onOpenChange={(open) => {
          setIsUserManagementOpen(open);
          if (!open) setCurrentTab("inventory");
        }}
        userEmail={user.email || ""}
        userProfile={userProfile}
        users={staff}
        isSubmitting={isActionPending}
        setIsSubmitting={setIsActionPending}
      />

      <LogoutConfirmDialog 
        isOpen={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
        onConfirm={logout}
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
