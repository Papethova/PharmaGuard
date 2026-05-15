import { motion } from "motion/react";
import { Search, RefreshCcw, Settings, Trash2, Hammer, Database } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserProfile } from "../../types";
import { getIdentityString, escapeEmail } from "../../lib/formatters";

interface SuperAdminPortalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfiles: UserProfile[];
  userProfile: UserProfile | null;
  currentUser: any;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSync: () => Promise<void>;
  onUpdateStatus: (docId: string, currentStatus: any) => Promise<void>;
  onDeleteNode: (docId: string) => void;
  onResetNode: (docId: string) => void;
  isActionPending: boolean;
  appVersion: string;
}

export function SuperAdminPortal({
  isOpen,
  onOpenChange,
  userProfiles,
  userProfile,
  currentUser,
  searchTerm,
  setSearchTerm,
  onSync,
  onUpdateStatus,
  onDeleteNode,
  onResetNode,
  isActionPending,
  appVersion
}: SuperAdminPortalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-2xl bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0">
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <Settings className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Super Admin Command Center</DialogTitle>
                <DialogDescription className="text-brand-yellow/70 font-bold text-[9px] uppercase tracking-[0.12em] mt-1">Registry Management & Subscription Authority</DialogDescription>
              </div>
            </div>

            <div className="px-3 py-2 bg-brand-yellow rounded-lg border border-brand-yellow/20 flex items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-blue/60 leading-none mb-1">Authenticated Master Identity</span>
                  <span className="text-xs font-black text-brand-blue/80 tracking-tight flex items-center gap-2">
                    {getIdentityString(userProfile, currentUser?.email)} 
                  </span>
                  <div className="flex items-center gap-2 opacity-40 mt-0.5">
                    <div className="h-1 w-1 bg-brand-blue rounded-full" />
                    <span className="text-[8px] font-mono font-black tracking-widest uppercase text-brand-blue">Build {appVersion}</span>
                  </div>
                </div>
                <div className="h-6 w-px bg-brand-blue/10" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-brand-blue/60 leading-none mb-1">Registry Synchronization Status</span>
                  <span className="text-xs font-black text-brand-blue/80 tracking-tight">
                    {userProfiles.length} Managed Customer Nodes Registered
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
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onSync}
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
                  {userProfiles.length > 0 ? (
                    userProfiles.map((profile) => (
                      <tr key={profile.docId || profile.uid} className="hover:bg-brand-blue/5 transition-colors h-14">
                        <td className="py-2 px-4 w-[80%]">
                          <div className="flex flex-col gap-0 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-brand-dark-grey truncate">
                                {escapeEmail(profile.organizationName || profile.displayName || "Unregistered Node")}
                              </span>
                              <Badge 
                                className={`text-[7px] font-black px-1.5 h-3.5 rounded-sm inline-flex items-center uppercase tracking-tighter shrink-0 border ${
                                  profile.status === 'active' 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : profile.status === 'pending'
                                      ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30'
                                      : 'bg-red-50 text-red-700 border-red-200'
                                }`}
                              >
                                {profile.status || 'inactive'}
                              </Badge>
                            </div>
                            <span className="text-[9px] font-mono text-brand-grey/60 truncate mt-1">
                              {escapeEmail(profile.email)} | {profile.docId}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-4 w-[20%] text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => profile.docId && onResetNode(profile.docId)}
                              title="Reset Node Database"
                              className="h-7 w-7 text-brand-blue hover:bg-brand-yellow/20"
                            >
                              <Database className="h-3.5 w-3.5" />
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => profile.docId && onUpdateStatus(profile.docId, profile.status)}
                              className={`font-black uppercase tracking-tighter text-[9px] h-7 px-3 border transition-all shrink-0 ${
                                profile.status === 'active' 
                                ? 'border-red-200 text-red-600 hover:bg-red-50' 
                                : 'border-green-200 text-green-600 hover:bg-green-50'
                              }`}
                            >
                              {profile.status === 'active' ? 'Suspend' : 'Grant'}
                            </Button>
                            <Button 
                              size="icon"
                              variant="ghost" 
                              onClick={() => profile.docId && onDeleteNode(profile.docId)}
                              className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={2} className="py-20 text-center">
                        <div className="flex flex-col items-center gap-2 opacity-30">
                          <Hammer className="h-10 w-10 text-brand-blue" />
                          <p className="font-black uppercase text-[11px] tracking-widest text-brand-blue">No Registered Nodes Detected</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 rounded-xl transition-all"
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
