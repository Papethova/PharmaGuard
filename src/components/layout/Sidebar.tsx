import { Pill, Plus, ArrowDown, RefreshCcw, History, AlertTriangle, Users, LogOut, Edit } from "lucide-react";
import { 
  TabsList, TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "../../types";
import { PharmaLogo } from "../common/Icons";
import { getIdentityString } from "../../lib/formatters";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
    <aside className="w-full lg:w-[256px] lg:min-w-[256px] lg:max-w-[256px] flex flex-col gap-12 sticky top-24 shrink-0 overflow-visible">
      <div className="flex flex-col w-full shrink-0">
        <div className="px-5 p-0 m-0 text-center flex flex-col items-center justify-center min-h-[40px] mb-4">
          <h3 className={`font-bold text-brand-blue/60 tracking-tight leading-tight transition-colors duration-300 no-interact ${
            (identity.length || 0) > 20 ? "text-lg" : 
            (identity.length || 0) > 15 ? "text-xl" : "text-2xl"
          }`}>
            {identity}
          </h3>
        </div>

        <div className="space-y-3 mb-10 px-1">
          <Button 
            onClick={onDispense}
            className="w-full h-12 gap-3 justify-start px-4 text-xs font-black tracking-widest bg-brand-blue text-white hover:brightness-110 active:scale-[0.98] rounded-xl shadow-lg shadow-brand-blue/20 transition-all border-none"
          >
            <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0">
              <ArrowDown className="h-3.5 w-3.5 text-brand-blue" strokeWidth={4} />
            </div>
            Dispense
          </Button>
          <Button 
            onClick={onAdd}
            className="w-full h-12 gap-3 justify-start px-4 text-xs font-black tracking-widest bg-brand-blue text-white hover:brightness-110 active:scale-[0.98] rounded-xl shadow-lg shadow-brand-blue/20 transition-all border-none"
          >
            <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0">
              <Plus className="h-3.5 w-3.5 text-brand-blue" strokeWidth={4} />
            </div>
            Add
          </Button>
          <Button 
            onClick={onAdjust}
            className="w-full h-12 gap-3 justify-start px-4 text-xs font-black tracking-widest bg-brand-blue text-white hover:brightness-110 active:scale-[0.98] rounded-xl shadow-lg shadow-brand-blue/20 transition-all border-none"
          >
            <div className="h-6 w-6 rounded-full bg-brand-yellow flex items-center justify-center shrink-0">
              <RefreshCcw className="h-3.5 w-3.5 text-brand-blue" strokeWidth={4} />
            </div>
            Adjust
          </Button>
        </div>
        
        <TabsList className="flex flex-col h-auto bg-transparent border-none p-0 gap-3 w-full">
          <TabsTrigger 
            value="inventory" 
            className="w-full justify-start gap-4 h-12 px-3 rounded-lg data-[state=active]:bg-brand-blue/10 data-[state=active]:text-brand-blue text-brand-blue hover:bg-brand-blue/5 border border-transparent text-sm font-bold group transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
              <Pill className="h-4 w-4 text-brand-blue" strokeWidth={3} />
            </div>
            <span className="whitespace-nowrap">Inventory View</span>
          </TabsTrigger>
          <TabsTrigger 
            value="history" 
            className="w-full justify-start gap-4 h-12 px-3 rounded-lg data-[state=active]:bg-brand-blue/10 data-[state=active]:text-brand-blue text-brand-blue hover:bg-brand-blue/5 border border-transparent text-sm font-bold group transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
              <History className="h-4 w-4 text-brand-blue" strokeWidth={3} />
            </div>
            <span className="whitespace-nowrap">Audit Log</span>
          </TabsTrigger>
          <TabsTrigger 
            value="alerts" 
            className="w-full justify-start gap-4 h-12 px-3 rounded-lg data-[state=active]:bg-brand-blue/10 data-[state=active]:text-brand-blue text-brand-blue hover:bg-brand-blue/5 border border-transparent text-sm font-bold group transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
              <AlertTriangle className="h-4 w-4 text-brand-blue" strokeWidth={3} />
            </div>
            <span className="whitespace-nowrap">Alerts</span>
            {lowStockCount > 0 && (
              <Badge className="ml-auto h-5 w-5 flex items-center justify-center text-[10px] bg-brand-blue text-white border-none font-bold rounded-full p-0">
                {lowStockCount}
              </Badge>
            )}
          </TabsTrigger>
          <div className="h-px bg-brand-blue/10 my-1" />
          <TabsTrigger 
            value="users" 
            className="w-full justify-start gap-4 h-12 px-3 rounded-lg data-[state=active]:bg-brand-blue/10 data-[state=active]:text-brand-blue text-brand-blue hover:bg-brand-blue/5 border border-transparent text-sm font-bold group transition-colors"
          >
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-sm border border-brand-yellow/20">
              <Users className="h-4 w-4 text-brand-blue" strokeWidth={3} />
            </div>
            <span className="whitespace-nowrap">User Management</span>
          </TabsTrigger>
        </TabsList>

        {user && (
          <div className="flex items-center justify-between p-3 rounded-lg bg-brand-blue/5 border border-brand-blue/10 group mt-10">
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-black/60 truncate tracking-tight">
                {userProfile?.organizationName || userProfile?.displayName || user.displayName}
              </span>
              {!userProfile?.organizationName && (
                <span className="text-[7px] font-bold bg-brand-blue/5 text-brand-blue px-1 rounded-sm w-fit uppercase tracking-tighter mt-0.5">Setup required</span>
              )}
              <span className="text-[10px] text-black font-medium truncate no-interact">{user.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onEditProfile}
                className="hover:brightness-100 h-8 w-8 shrink-0 rounded-full p-0 overflow-hidden"
              >
                <div className="h-full w-full bg-brand-yellow flex items-center justify-center shadow-sm">
                  <Edit className="h-3.5 w-3.5 text-brand-blue" strokeWidth={3} />
                </div>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onLogout}
                className="hover:brightness-100 h-8 w-8 shrink-0 rounded-full p-0 overflow-hidden"
              >
                <div className="h-full w-full bg-brand-yellow flex items-center justify-center shadow-sm">
                  <LogOut className="h-3.5 w-3.5 text-brand-blue" strokeWidth={3} />
                </div>
              </Button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
