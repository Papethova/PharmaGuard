import { 
  ShieldCheck, 
  Trash2, 
  Search, 
  Lock, 
  Unlock, 
  Zap, 
  Settings,
  MoreHorizontal
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserProfile } from "../../types";
import { escapeEmail } from "../../lib/formatters";

interface SuperAdminPortalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfiles: UserProfile[];
  userProfile: UserProfile | null;
  currentUser: any;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  onSync: () => void;
  onUpdateStatus: (docId: string, currentStatus: any) => void;
  onDeleteNode: (docId: string) => void;
  onResetNode: (docId: string) => void;
  isActionPending: boolean;
}

export function SuperAdminPortal({
  isOpen,
  onOpenChange,
  userProfiles,
  searchTerm,
  setSearchTerm,
  onSync,
  onUpdateStatus,
  onDeleteNode,
  onResetNode,
  isActionPending
}: SuperAdminPortalProps) {
  const tableHeadClass = "text-[10px] uppercase font-black text-brand-blue/60 tracking-widest text-center h-12";

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-5xl bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col h-[85vh] touch-none">
        <DialogHeader className="p-8 bg-brand-blue text-white overflow-hidden relative border-none shrink-0 touch-auto">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center pointer-events-none">
            <ShieldCheck className="h-[400px] w-[400px]" strokeWidth={0.5} />
          </div>
          
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-5">
              <div className="h-16 w-16 rounded-2xl bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg rotate-3">
                <ShieldCheck className="h-9 w-9 text-brand-blue" strokeWidth={3} />
              </div>
              <div className="flex flex-col gap-1">
                <DialogTitle className="text-3xl font-black tracking-tight leading-none text-white">Institutional HQ</DialogTitle>
                <DialogDescription className="text-brand-yellow/70 font-bold text-[11px] uppercase tracking-[0.2em] mt-1 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-brand-yellow animate-pulse" />
                  Terminal Authority Matrix 
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 group-focus-within:text-white transition-colors" />
                <Input 
                  placeholder="Inquire User Terminal..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/30 h-11 w-64 pl-10 rounded-xl focus-visible:ring-brand-yellow focus-visible:bg-white/20"
                />
              </div>
              <Button 
                onClick={onSync} 
                className="bg-brand-yellow text-brand-blue hover:brightness-110 h-11 px-6 font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg shadow-brand-yellow/10"
                disabled={isActionPending}
              >
                Sync Nodes
              </Button>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 shrink-0 overflow-y-auto touch-auto">
          <div className="p-8">
            <Card className="border-brand-blue/10 bg-white shadow-xl rounded-2xl overflow-hidden">
              <Table>
                <TableHeader className="bg-brand-blue/[0.03]">
                  <TableRow className="hover:bg-transparent border-brand-blue/10">
                    <TableHead className={tableHeadClass}>Authority Status</TableHead>
                    <TableHead className={tableHeadClass}>Registered Identify</TableHead>
                    <TableHead className={tableHeadClass}>Credential Email</TableHead>
                    <TableHead className={tableHeadClass}>System Role</TableHead>
                    <TableHead className={tableHeadClass}>Command Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userProfiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-brand-dark-grey/30 uppercase font-black tracking-widest text-xs">
                        <Zap className="h-12 w-12 mx-auto mb-4 opacity-10" />
                        No authorization nodes detected
                      </TableCell>
                    </TableRow>
                  ) : userProfiles.map((p) => (
                    <TableRow key={p.docId || p.uid} className="hover:bg-brand-blue/[0.02] border-brand-blue/5 transition-colors h-16">
                      <TableCell className="text-center">
                        <button 
                          onClick={() => onUpdateStatus(p.docId!, p.status)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                            p.status === 'active' 
                            ? "bg-green-100 text-green-700 border border-green-200" 
                            : p.status === 'suspended'
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-brand-yellow/20 text-brand-blue/60 border border-brand-yellow/30"
                          }`}
                        >
                          {p.status}
                        </button>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-brand-blue">{p.organizationName || 'Individual node'}</span>
                          <span className="text-[9px] font-bold text-brand-dark-grey/40 uppercase tracking-tight">{p.displayName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-mono text-brand-blue/60 text-center no-interact">
                        {escapeEmail(p.email)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-brand-blue/10 text-brand-blue font-black tracking-widest text-[9px] px-2 h-5 uppercase">
                          {p.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onUpdateStatus(p.docId!, p.status)}
                            className="bg-brand-blue/[0.03] hover:bg-brand-blue/10 h-9 w-9 p-0 rounded-lg group"
                          >
                            {p.status === 'active' ? (
                              <Lock className="h-4 w-4 text-red-400 group-hover:scale-110 transition-transform" />
                            ) : (
                              <Unlock className="h-4 w-4 text-green-500 group-hover:scale-110 transition-transform" />
                            )}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onResetNode(p.docId!)}
                            className="bg-brand-blue/[0.03] hover:bg-brand-blue/10 h-9 w-9 p-0 rounded-lg"
                          >
                            <Settings className="h-4 w-4 text-brand-blue/60" />
                          </Button>
                           <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDeleteNode(p.docId!)}
                            className="bg-red-50 hover:bg-red-100 h-9 w-9 p-0 rounded-lg group"
                          >
                            <Trash2 className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-brand-blue/[0.03] border-t border-brand-blue/5 shrink-0 touch-auto">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full h-12 text-[11px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl"
          >
            Terminal Matrix Detach
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

