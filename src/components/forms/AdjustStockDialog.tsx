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
import { CaptureSignature, CapturePhoto } from "./CaptureIdentity";

interface AdjustStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Substance[];
  users: {id: string, name: string, title?: string}[];
  onLog: (transaction: any) => Promise<void>;
  isPhotoRequirementEnabled: boolean;
  nextAdjustCount: number;
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
  isPhotoRequirementEnabled,
  nextAdjustCount
}: AdjustStockDialogProps) {
  const [substanceSearch, setSubstanceSearch] = useState("");
  const [selectedSubstance, setSelectedSubstance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [reasonCategory, setReasonCategory] = useState("Administrative Adjustment");
  const [notes, setNotes] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const referenceNumber = `ADJ-${nextAdjustCount.toString().padStart(3, "0")}`;

  const resetForm = () => {
    setSubstanceSearch("");
    setSelectedSubstance("");
    setQuantity("");
    setReasonCategory("Administrative Adjustment");
    setNotes("");
    setSelectedUser("");
    setCapturedPhoto(null);
    setSignature(null);
    setShowConfirm(false);
  };

  const handleInitialSubmit = () => {
    const item = inventory.find(i => i.id === selectedSubstance);
    if (!item || !selectedUser || !quantity || (!signature && !isPhotoRequirementEnabled)) return;
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    const item = inventory.find(i => i.id === selectedSubstance);
    if (!item || !selectedUser || !quantity || (!signature && !isPhotoRequirementEnabled)) return;

    setIsSubmitting(true);
    try {
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
        witnessId: null,
        reason: notes || reasonCategory,
        referenceNumber: referenceNumber,
        photo: capturedPhoto,
        signature
      });

      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedItem = inventory.find(i => i.id === selectedSubstance);

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0">
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <RefreshCcw className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Adjust Inventory</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1 uppercase">MANUAL BALANCE CORRECTION</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          {showConfirm ? (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="h-20 w-20 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                <RefreshCcw className="h-10 w-10 text-brand-blue" strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-brand-blue uppercase tracking-tight">Confirm Adjustment</h3>
                <p className="text-sm text-brand-blue/60 font-medium max-w-[280px] mx-auto">
                  You are about to adjust <span className="font-bold text-brand-blue">{quantity} units</span> for <span className="font-bold text-brand-blue">{selectedItem?.name} {selectedItem?.strength}</span>.
                </p>
              </div>
              <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 w-full text-left space-y-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-blue/40">
                   <span>Reference #</span>
                   <span className="text-brand-blue">{referenceNumber}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-blue/40">
                   <span>New Total</span>
                   <span className="text-brand-blue">{(selectedItem?.currentStock || 0) + Number(quantity)}</span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Selection Section */}
              <div className="space-y-4 pb-2">
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Medication</Label>
                  <div className="relative">
                    <Input
                      placeholder="Type to search medication..."
                      value={substanceSearch}
                      onChange={(e) => {
                        setSubstanceSearch(e.target.value);
                        setSelectedSubstance("");
                        setIsSearching(true);
                      }}
                      onFocus={() => setIsSearching(true)}
                      className="h-9 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50"
                    />
                    {substanceSearch && !selectedSubstance && isSearching && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-brand-grey/20 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden p-1">
                        {inventory
                          .filter(s => 
                            s.name.toLowerCase().includes(substanceSearch.toLowerCase()) || 
                            s.ndc.includes(substanceSearch)
                          )
                          .map(s => (
                            <div
                              key={s.id}
                              className="px-3 py-3 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group border-b border-brand-grey/5 last:border-0 rounded-lg"
                              onClick={() => {
                                setSelectedSubstance(s.id);
                                setSubstanceSearch(s.name);
                                setIsSearching(false);
                              }}
                            >
                              <div className="flex flex-col text-left">
                                <span className="group-hover:text-brand-blue text-brand-blue font-bold">{s.name} {s.strength}</span>
                                <span className="text-[10px] text-brand-blue/70 font-mono uppercase tracking-tighter">NDC: {s.ndc}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] font-medium border-brand-blue/30 text-brand-blue px-2">{s.schedule}</Badge>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
  
                {selectedItem && (
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="space-y-1">
                      <Label className="text-black font-bold text-[10px] tracking-wider uppercase leading-none">Current Balance</Label>
                      <p className="text-2xl font-bold text-brand-blue leading-tight flex items-baseline gap-2">
                        {selectedItem.currentStock}
                      </p>
                    </div>
                    <div className="text-right space-y-1">
                      <Label className="text-black font-bold text-[10px] tracking-wider uppercase leading-none">NDC</Label>
                      <p className="text-sm font-mono font-bold text-brand-blue leading-none mt-2">
                        {selectedItem.ndc}
                      </p>
                    </div>
                  </div>
                )}
              </div>
  
              {/* Transaction Details */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Reference #</Label>
                    <Input 
                      value={referenceNumber} 
                      readOnly
                      className="h-9 border-brand-blue/10 bg-brand-surface text-black font-bold"
                    />
                  </div>
                  <div className="grid gap-1">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Adjustment Amount (-/+)</Label>
                    <Input 
                      type="number" 
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                      placeholder="e.g. -10 or 10" 
                      className="h-9 border-brand-blue/10 bg-brand-surface text-black placeholder:text-brand-grey/50 text-sm"
                    />
                  </div>
                </div>
  
                <div className="grid gap-1">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Notes/Reason</Label>
                  <Textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Enter reason for adjustment" 
                    className="bg-brand-surface border-brand-blue/10 min-h-[80px] resize-none text-sm text-black placeholder:text-brand-grey/50"
                  />
                </div>
  
                <div className="grid gap-1">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Performing User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-9 border-brand-blue/10 bg-brand-surface text-brand-blue px-3 font-bold">
                      <SelectValue placeholder="Select user..." />
                    </SelectTrigger>
                    <SelectContent className="bg-brand-surface" align="start">
                      {users.map(u => (
                        <SelectItem key={u.id} value={u.id} className="text-black font-bold focus:bg-brand-blue/5 focus:text-black">
                          {u.name} {u.title ? `(${u.title})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
  
                {isPhotoRequirementEnabled && (
                  <div className="grid gap-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Identity Photo</Label>
                      {capturedPhoto && (
                        <button 
                          type="button"
                          onClick={() => setCapturedPhoto(null)}
                          className="text-[10px] text-brand-blue/50 hover:text-brand-blue uppercase tracking-widest transition-colors font-normal"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <CapturePhoto 
                      onCapture={setCapturedPhoto} 
                      capturedData={capturedPhoto} 
                      onReset={() => setCapturedPhoto(null)} 
                    />
                  </div>
                )}
  
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Identity Signature</Label>
                    {signature && (
                      <button 
                        type="button"
                        onClick={() => setSignature(null)}
                        className="text-[10px] text-brand-blue/50 hover:text-brand-blue uppercase tracking-widest transition-colors font-normal"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <CaptureSignature 
                    onCapture={setSignature} 
                    capturedData={signature} 
                    onReset={() => setSignature(null)}
                  />
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
  
        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 flex gap-4">
          <Button 
            onClick={() => {
              if (showConfirm) setShowConfirm(false);
              else { onOpenChange(false); resetForm(); }
            }}
            disabled={isSubmitting}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl shadow-lg transition-all border-none"
          >
            {showConfirm ? "Back" : "Cancel"}
          </Button>
          <Button 
            onClick={showConfirm ? handleSubmit : handleInitialSubmit}
            disabled={isSubmitting || !selectedSubstance || !quantity || !selectedUser || (!signature && !isPhotoRequirementEnabled)}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-[#FFE600] text-brand-blue hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all disabled:opacity-50 border-none shadow-xl shadow-[#FFE600]/30"
          >
            {isSubmitting ? (showConfirm ? "Finalizing..." : "Processing...") : (showConfirm ? "Confirm Adjust" : "Adjust")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
