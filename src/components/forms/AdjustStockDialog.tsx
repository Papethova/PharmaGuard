import { useState } from "react";
import { RefreshCcw, AlertOctagon, Info, FileText, User, Hash } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Substance } from "../../types";
import { CapturePhoto, CaptureSignature } from "./CaptureIdentity";

interface AdjustStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Substance[];
  users: {id: string, name: string, title?: string}[];
  onLog: (transaction: any) => Promise<void>;
  isPhotoRequirementEnabled: boolean;
}

const ADJUSTMENT_REASONS = [
  "Inventory Correction",
  "Product Damage / Loss",
  "Expired Stock Management",
  "Returned to Supplier",
  "Seizure / DEA Inspection",
  "Theft / Unexplained Loss",
  "Administrative Adjustment"
];

export function AdjustStockDialog({
  isOpen,
  onOpenChange,
  inventory,
  users,
  onLog,
  isPhotoRequirementEnabled
}: AdjustStockDialogProps) {
  const [substanceSearch, setSubstanceSearch] = useState("");
  const [selectedSubstance, setSelectedSubstance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reasonCategory, setReasonCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const resetForm = () => {
    setSubstanceSearch("");
    setSelectedSubstance("");
    setQuantity("");
    setReasonCategory("");
    setNotes("");
    setSelectedUser("");
    setCapturedPhoto(null);
    setSignature(null);
  };

  const handleSubmit = async () => {
    const item = inventory.find(i => i.id === selectedSubstance);
    if (!item || !selectedUser || !quantity || !reasonCategory) return;

    const qty = Number(quantity); // Can be negative for Adjustment
    const prevStock = item.currentStock;
    const newStock = prevStock + qty;

    await onLog({
      substanceId: item.id,
      substanceName: item.name,
      strength: item.strength,
      ndc: item.ndc,
      type: "ADJUST",
      quantity: qty,
      previousStock: prevStock,
      newStock,
      performedBy: selectedUser,
      performedByName: users.find(u => u.id === selectedUser)?.name || "Unknown",
      reason: `[${reasonCategory}] ${notes}`,
      referenceNumber: "ADJ-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      photo: capturedPhoto,
      signature
    });

    onOpenChange(false);
    resetForm();
  };

  const selectedItem = inventory.find(i => i.id === selectedSubstance);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[550px] bg-brand-surface border-amber-500/20 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[95vh]">
        <DialogHeader className="px-6 py-5 bg-amber-500 text-brand-blue relative shrink-0">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-14 w-14 rounded-full bg-brand-blue/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <RefreshCcw className="h-7 w-7 text-brand-blue" strokeWidth={3} />
            </div>
            
            <div className="flex flex-col gap-0 text-left">
              <DialogTitle className="text-2xl font-black tracking-tight text-brand-blue leading-none">
                Inventory Reconciliation
              </DialogTitle>
              <DialogDescription className="text-brand-blue font-black text-[12px] uppercase tracking-[0.2em] mt-1 opacity-70">
                Corrective Audit Entry
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-4 text-amber-800">
              <AlertOctagon className="h-6 w-6 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-black uppercase tracking-wider leading-none">Security Warning</p>
                <p className="text-[10px] font-bold leading-relaxed opacity-80 uppercase">
                  Adjustments create a permanent, non-expungable record. Discrepancy reporting is mandatory for DEA compliance.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-amber-600/40" />
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Substance for Adjustment</Label>
              </div>
              <div className="relative">
                <Input
                  placeholder="Identify Registry Entry..."
                  value={substanceSearch}
                  onChange={(e) => {
                    setSubstanceSearch(e.target.value);
                    setSelectedSubstance("");
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="bg-brand-light-grey/30 border-amber-500/10 h-12 text-lg font-bold"
                />
                {substanceSearch && !selectedSubstance && isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-brand-grey/20 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden">
                    {inventory
                      .filter(s => 
                        s.name.toLowerCase().includes(substanceSearch.toLowerCase()) || 
                        s.ndc.includes(substanceSearch)
                      )
                      .map(s => (
                        <div
                          key={s.id}
                          className="px-4 py-3 hover:bg-amber-50 cursor-pointer text-sm flex justify-between items-center group border-b border-brand-grey/5 last:border-0"
                          onClick={() => {
                            setSelectedSubstance(s.id);
                            setSubstanceSearch(s.name);
                            setIsSearching(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold group-hover:text-amber-700 text-brand-dark-grey">{s.name} {s.strength}</span>
                            <span className="text-[10px] text-amber-600/70 font-mono tracking-tighter uppercase">REGISTRY ID: {s.ndc}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black border-amber-300 text-amber-600 px-2">{s.schedule}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {selectedItem && (
              <div className="grid grid-cols-2 gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-inner">
                <div className="space-y-1">
                  <Label className="text-[10px] uppercase font-black text-amber-600/40 tracking-[0.1em]">Reported Balance</Label>
                  <p className="text-2xl font-black text-amber-700 leading-tight">
                    {selectedItem.currentStock} <span className="text-xs font-bold opacity-60 uppercase">{selectedItem.unit}</span>
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <Label className="text-[10px] uppercase font-black text-amber-600/40 tracking-[0.1em]">Verification Type</Label>
                  <p className="text-sm font-bold text-amber-700 mt-2 uppercase">
                    INTERNAL AUDIT
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-amber-600/40" />
                  <Label className="text-brand-dark-grey text-[10px] font-black uppercase tracking-wider">Adjustment Reason</Label>
                </div>
                <Select value={reasonCategory} onValueChange={setReasonCategory}>
                  <SelectTrigger className="bg-brand-light-grey/30 border-amber-500/10 h-11">
                    <SelectValue placeholder="Reason..." />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface">
                    {ADJUSTMENT_REASONS.map(r => (
                      <SelectItem key={r} value={r} className="font-bold text-xs">{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Hash className="h-3 w-3 text-amber-600/40" />
                  <Label className="text-brand-dark-grey text-[10px] font-black uppercase tracking-wider">Variance (+/-)</Label>
                </div>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="EX: -5" 
                  className="bg-brand-light-grey/30 border-amber-500/10 h-11 font-mono font-bold text-lg text-amber-700"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3 text-amber-600/40" />
                <Label className="text-brand-dark-grey text-[10px] font-black uppercase tracking-wider">Detailed Documentation</Label>
              </div>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Required explanation for discrepancies..." 
                className="bg-brand-light-grey/30 border-amber-500/10 min-h-[80px] resize-none text-xs"
              />
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-amber-600/40" />
                <Label className="text-brand-dark-grey text-[10px] font-black uppercase tracking-wider">Authorizing Supervisor</Label>
              </div>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-brand-light-grey/30 border-amber-500/10 h-11">
                  <SelectValue placeholder="Identify Staff Member" />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id} className="font-bold">{u.name} {u.title && <span className="opacity-50 text-[10px]">({u.title})</span>}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-6 pt-4 border-t border-amber-100">
              <CapturePhoto 
                onCapture={setCapturedPhoto}
                capturedData={capturedPhoto}
                onReset={() => setCapturedPhoto(null)}
              />
              <CaptureSignature 
                onCapture={setSignature}
                capturedData={signature}
                onReset={() => setSignature(null)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-amber-50 border-t border-amber-100">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedSubstance || !quantity || !selectedUser || !reasonCategory || !capturedPhoto || !signature}
            className="w-full h-14 bg-amber-500 text-brand-blue font-black uppercase tracking-widest rounded-xl shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50"
          >
            Confirm Audit Correction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
