import { useState } from "react";
import { RefreshCcw, AlertOctagon } from "lucide-react";
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
import { CaptureIdentity } from "./CaptureIdentity";

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

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-amber-500/20 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-4 bg-amber-500 text-brand-blue relative shrink-0">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-brand-blue/10 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <RefreshCcw className="h-6 w-6 text-brand-blue" strokeWidth={3} />
            </div>
            
            <div className="flex flex-col gap-0 text-left">
              <DialogTitle className="text-xl font-black tracking-tight text-brand-blue leading-none">
                Inventory Adjustment
              </DialogTitle>
              <DialogDescription className="text-brand-blue font-bold text-[10px] uppercase tracking-widest mt-1 opacity-70">
                Corrective Audit Entry
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex gap-3 text-amber-800">
              <AlertOctagon className="h-5 w-5 shrink-0" />
              <p className="text-[10px] font-bold leading-relaxed uppercase">
                Adjustments create a permanent record in the secure registry. Please ensure all documentation is accurate before committing.
              </p>
            </div>

            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Select Medication</Label>
              <div className="relative">
                <Input
                  placeholder="Type to search..."
                  value={substanceSearch}
                  onChange={(e) => {
                    setSubstanceSearch(e.target.value);
                    setSelectedSubstance("");
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="bg-brand-light-grey/30 border-amber-500/10 h-11"
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
                            <span className="text-[10px] text-amber-600/70 font-mono">STOCK: {s.currentStock} {s.unit}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black border-amber-300 text-amber-600">{s.schedule}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Reason Category</Label>
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
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Net Change (+/-)</Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="EX: -5" 
                  className="bg-brand-light-grey/30 border-amber-500/10 h-11 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Detailed Explanation</Label>
              <Textarea 
                value={notes} 
                onChange={(e) => setNotes(e.target.value)} 
                placeholder="Required documentation for discrepancies..." 
                className="bg-brand-light-grey/30 border-amber-500/10 min-h-[80px] resize-none"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Authorized Supervisor</Label>
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

            <div className="border-t border-amber-100 pt-4">
              <CaptureIdentity 
                mode={isPhotoRequirementEnabled ? "photo" : "signature"}
                onCapture={(data) => isPhotoRequirementEnabled ? setCapturedPhoto(data) : setSignature(data)}
                capturedData={isPhotoRequirementEnabled ? capturedPhoto : signature}
                onReset={() => isPhotoRequirementEnabled ? setCapturedPhoto(null) : setSignature(null)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-amber-50 border-t border-amber-100">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedSubstance || !quantity || !selectedUser || !reasonCategory}
            className="w-full h-14 bg-amber-500 text-brand-blue font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-amber-600 transition-all border-none"
          >
            Confirm Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
