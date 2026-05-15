import { Shield, Lock, History } from "lucide-react";
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
  staff: {id: string, name: string}[];
  onOpenChange: (open: boolean) => void;
}

export function TransactionDetailDialog({
  transaction,
  inventory,
  staff,
  onOpenChange
}: TransactionDetailDialogProps) {
  if (!transaction) return null;

  const inventoryItem = inventory?.find(i => i.id === transaction.substanceId);
  const performer = staff?.find(u => u.id === transaction.performedBy);
  const witness = staff?.find(u => u.id === transaction.witnessId);
  
  return (
    <Dialog open={!!transaction} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0">
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <History className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Event Log</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1">Detailed Movement Record</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="flex justify-between items-start border-b border-brand-blue/5 pb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-normal text-black tracking-widest">RX #</p>
              <p className="text-sm font-bold text-brand-blue no-interact">{transaction.referenceNumber || "AUTO-LOG"}</p>
            </div>
            <TransactionBadge type={transaction.type} />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-normal text-black tracking-widest leading-none">Timestamp</p>
              <p className="text-[10px] font-bold text-brand-dark-grey no-interact">{formatDateTime(transaction.timestamp)}</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-[10px] font-normal text-black tracking-widest leading-none">Authorized By</p>
              <p className="text-[10px] font-bold text-brand-blue truncate no-interact">{performer?.name || escapeEmail(transaction.performedByName)}</p>
            </div>
            <div className="space-y-1 text-right">
              <p className="text-[10px] font-normal text-black tracking-widest leading-none">Witness</p>
              <p className="text-[10px] font-bold text-brand-blue truncate no-interact">{witness?.name || transaction.witnessId || "-"}</p>
            </div>
          </div>

          <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-normal text-black tracking-widest">Substance</span>
              <Badge className="bg-brand-blue text-white text-[9px] px-2 font-black">Sched {inventoryItem?.schedule || '??'}</Badge>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-brand-blue tracking-tight leading-none">{transaction.substanceName}</h3>
              <p className="text-xs font-bold text-brand-dark-grey/60">{transaction.strength} | NDC: {transaction.ndc}</p>
            </div>
            <div className="pt-2 flex items-center justify-between border-t border-brand-blue/10">
              <div className="flex flex-col">
                <span className="text-[9px] font-normal text-black/50">Action Quantity</span>
                <span className="text-lg font-black text-brand-blue">
                   {transaction.type === 'VERIFY' ? '-' : (transaction.type === 'IN' ? '+' : transaction.type === 'OUT' ? '-' : (transaction.type === 'ADJUST' && transaction.quantity > 0 ? '+' : '')) + transaction.quantity}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-[9px] font-normal text-black/50">Closing Balance</span>
                <span className="text-lg font-black text-brand-blue">{transaction.newStock}</span>
              </div>
            </div>
          </div>

          {transaction.signature && (
             <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-[10px] font-normal text-black tracking-widest">Electronic Signature</p>
                  <div className="flex items-center gap-1">
                    <Lock className="h-3 w-3 text-green-500" />
                    <span className="text-[8px] font-black text-green-600 tracking-widest">Verified</span>
                  </div>
                </div>
                <div className="bg-white border border-brand-blue/10 rounded-xl p-2 h-24 flex items-center justify-center shadow-inner overflow-hidden">
                  <img src={transaction.signature} alt="Signature" className="max-h-full max-w-full object-contain" />
                </div>
             </div>
          )}

          {transaction.photo && (
             <div className="space-y-2">
                <p className="text-[10px] font-normal text-black tracking-widest">Captured Photo Identity</p>
                <div className="bg-white border border-brand-blue/10 rounded-xl overflow-hidden aspect-video relative shadow-inner">
                  <img src={transaction.photo} alt="Photo" className="w-full h-full object-cover" />
                </div>
             </div>
          )}
        </div>

        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="w-full h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all border-none shadow-xl shadow-brand-yellow/30"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
