import { Pill, Plus, ArrowDown, RefreshCcw, History, AlertTriangle, Users, LogOut, Edit, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "../../types";
import { PharmaLogo } from "../common/Icons";
import { getIdentityString } from "../../lib/formatters";

interface SidebarProps {
  user: any;
  userProfile: UserProfile | null;
  currentTab: string;
  isUserManagementOpen: boolean;
  lowStockCount: number;
  onTabChange: (val: string) => void;
  onDispense: () => void;
  onAdd: () => void;
  onAdjust: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
  masterAdminEmail: string;
  appVersion: string;
}

export function Sidebar({
  user,
  userProfile,
  currentTab,
  isUserManagementOpen,
  lowStockCount,
  onTabChange,
  onDispense,
  onAdd,
  onAdjust,
  onEditProfile,
  onLogout,
  masterAdminEmail,
  appVersion
}: SidebarProps) {
  const identity = getIdentityString(userProfile, user?.email);

  return (
    <aside className="w-full lg:w-[256px] lg:min-w-[256px] lg:max-w-[256px] flex flex-col gap-10 sticky top-24 shrink-0 overflow-visible">
      <div className="flex flex-col gap-3 w-full shrink-0">
        <div className="px-5 p-0 m-0 text-center flex flex-col items-center justify-center min-h-[40px]">
          <h3 className={`font-black text-blue-400/90 tracking-tight leading-tight transition-colors duration-300 no-interact ${
            (identity.length || 0) > 20 ? "text-lg" : 
            (identity.length || 0) > 15 ? "text-xl" : "text-2xl"
          }`}>
            {identity}
          </h3>
        </div>
        <Button 
          onClick={onDispense}
          className="bg-brand-blue hover:brightness-110 text-white gap-3 shadow-lg shadow-brand-blue/20 h-14 w-full justify-start px-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="h-7 w-7 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
            <ArrowDown className="h-4 w-4 text-brand-blue" strokeWidth={3} />
          </div>
          Dispense
        </Button>
        <Button 
          onClick={onAdd}
          className="bg-brand-blue hover:brightness-110 text-white gap-3 shadow-lg shadow-brand-blue/20 h-14 w-full justify-start px-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="h-7 w-7 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
            <Plus className="h-4 w-4 text-brand-blue" strokeWidth={3} />
          </div>
          Add
        </Button>
        <Button 
          onClick={onAdjust}
          className="bg-brand-blue hover:brightness-110 text-white gap-3 shadow-lg shadow-brand-blue/20 h-14 w-full justify-start px-6 text-lg font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="h-7 w-7 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
            <RefreshCcw className="h-4 w-4 text-brand-blue" strokeWidth={3} />
          </div>
          Adjust
        </Button>
      </div>
      
      <div className="flex flex-col w-full">
        <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 gap-2 w-full">
          <TabsTrigger 
            value="inventory" 
            className="w-full justify-start gap-4 h-14 px-5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-blue data-[state=active]:shadow-xl data-[state=active]:shadow-brand-blue/10 text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent data-[state=active]:border-brand-blue/10 text-base group"
          >
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
              <Pill className="h-4 w-4 text-brand-blue transition-all" strokeWidth={3} />
            </div>
            <span className={`whitespace-nowrap leading-none ${(currentTab === 'inventory' && !isUserManagementOpen) ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>Inventory View</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="w-full justify-start gap-4 h-14 px-5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-blue data-[state=active]:shadow-xl data-[state=active]:shadow-brand-blue/10 text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent data-[state=active]:border-brand-blue/10 text-base group"
          >
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
              <History className="h-4 w-4 text-brand-blue transition-all" strokeWidth={3} />
            </div>
            <span className={`whitespace-nowrap leading-none ${(currentTab === 'history' && !isUserManagementOpen) ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>Audit Log</span>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            className="w-full justify-start gap-4 h-14 px-5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-blue data-[state=active]:shadow-xl data-[state=active]:shadow-brand-blue/10 text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent data-[state=active]:border-brand-blue/10 text-base group"
          >
            <div className="relative">
              <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
                <AlertTriangle className="h-5 w-5 text-brand-blue transition-all" strokeWidth={3} />
              </div>
            </div>
            <span className={`whitespace-nowrap leading-none ${(currentTab === 'alerts' && !isUserManagementOpen) ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>Alerts</span>
            {lowStockCount > 0 && (
              <div className="ml-auto relative flex items-center justify-center h-5 w-5">
                <span className="absolute inset-0 rounded-full bg-brand-yellow opacity-75 animate-ping" />
                <Badge className="relative h-5 w-5 flex items-center justify-center text-[10px] bg-brand-yellow text-brand-blue border-none font-black rounded-full p-0 shadow-sm leading-none">
                  {lowStockCount}
                </Badge>
              </div>
            )}
          </TabsTrigger>
          <TabsTrigger 
            value="users" 
            className="w-full justify-start gap-4 h-14 px-5 rounded-xl data-[state=active]:bg-white data-[state=active]:text-brand-blue data-[state=active]:shadow-xl data-[state=active]:shadow-brand-blue/10 text-brand-blue/50 hover:bg-brand-blue/5 border border-transparent data-[state=active]:border-brand-blue/10 text-base group"
          >
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20 transition-all">
              <Users className="h-4 w-4 text-brand-blue" strokeWidth={3} />
            </div>
            <span className={`whitespace-nowrap leading-none ${isUserManagementOpen ? 'font-black text-brand-blue' : 'font-medium text-brand-blue/50'}`}>User Management</span>
          </TabsTrigger>
        </TabsList>
        
        {user && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-brand-blue/5 border border-brand-blue/10 group mt-8">
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
                onClick={onEditProfile}
                className="bg-brand-yellow text-brand-blue hover:brightness-110 h-8 w-8 shrink-0 rounded-full border border-brand-yellow/20 shadow-sm"
              >
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onLogout}
                className="bg-brand-yellow text-brand-blue hover:brightness-110 h-8 w-8 shrink-0 rounded-full border border-brand-yellow/20 shadow-sm"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
