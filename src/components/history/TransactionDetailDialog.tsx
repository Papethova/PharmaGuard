import { Shield, Lock } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Transaction, Substance } from "../../types";
import { formatDateTime, escapeEmail } from "../../lib/formatters";
import { TransactionBadge } from "../common/Icons";

interface TransactionDetailDialogProps {
  transaction: Transaction | null;
  inventory: Substance[];
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({
  transaction,
  inventory,
  onOpenChange
}: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const inventoryItem = inventory?.find(i => i.id === transaction.substanceId);
  
  return (
    <Dialog open={!!transaction} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border-2 border-white">
              <Shield className="h-6 w-6 text-brand-blue" strokeWidth={3} />
            </div>
            <div className="flex flex-col">
              <DialogTitle className="text-xl font-black tracking-tight leading-none text-white whitespace-nowrap overflow-hidden">Registry Evidence File</DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[10px] uppercase tracking-[0.12em] mt-1">TRANSACTION IDENTITY BINDING</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-brand-blue/5 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest">Reference Node</p>
              <p className="text-sm font-black text-brand-blue no-interact">{transaction.referenceNumber || "AUTO-GEN-ID"}</p>
            </div>
            <TransactionBadge type={transaction.type} />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest leading-none">Security Timestamp</p>
              <p className="text-xs font-bold text-brand-dark-grey no-interact">{formatDateTime(transaction.timestamp)}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest leading-none">Authorization Identity</p>
              <p className="text-xs font-bold text-brand-blue truncate no-interact">{escapeEmail(transaction.performedByName)}</p>
            </div>
          </div>

          <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-brand-blue/60 uppercase tracking-widest">Substance Identity</span>
              <Badge className="bg-brand-blue text-white text-[9px] px-2 font-black">SCHED {inventoryItem?.schedule || '??'}</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-brand-blue tracking-tight leading-none">{transaction.substanceName}</h3>
              <p className="text-xs font-bold text-brand-dark-grey/60 uppercase">{transaction.strength} | NDC: {transaction.ndc}</p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-brand-blue/10">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-brand-blue/40 uppercase">Action Magnitude</span>
                <span className="text-lg font-black text-brand-blue">
                   {transaction.type === 'VERIFY' ? '=' : (transaction.type === 'IN' ? '+' : transaction.type === 'OUT' ? '-' : (transaction.type === 'ADJUST' && transaction.quantity > 0 ? '+' : ''))}{transaction.quantity}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-black text-brand-blue/40 uppercase">New Terminal Balance</span>
                <span className="text-lg font-black text-brand-blue">{transaction.newStock}</span>
              </div>
            </div>
          </div>

          {transaction.signature && (
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest">Registry Signature Binding</p>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-green-500" />
                    <span className="text-[8px] font-black uppercase text-green-600 tracking-widest font-mono">Immutable</span>
                  </div>
                </div>
                <div className="bg-white border border-brand-blue/10 rounded-xl p-2 h-24 flex items-center justify-center shadow-inner overflow-hidden">
                  <img src={transaction.signature} alt="Evidence signature" className="max-h-full max-w-full object-contain grayscale contrast-150" />
                </div>
             </div>
          )}

          {transaction.photo && (
             <div className="space-y-2">
                <p className="text-[10px] font-black text-brand-blue/40 uppercase tracking-widest">Identity Visual Verification</p>
                <div className="bg-white border border-brand-blue/10 rounded-xl overflow-hidden aspect-video relative group shadow-inner">
                  <img src={transaction.photo} alt="Identity evidence" className="w-full h-full object-cover grayscale contrast-125 brightness-90 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-brand-blue/40 gap-1 to-transparent flex items-end p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest drop-shadow-md">Active Secure Node Capture</span>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </div>

        <DialogFooter className="p-4 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full h-11 text-[10px] font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 shadow-lg shadow-brand-blue/10 rounded-xl transition-all border-none"
          >
            Acknowledge Evidence
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
