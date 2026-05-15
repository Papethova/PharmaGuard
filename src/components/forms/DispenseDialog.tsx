import { useState } from "react";
import { ArrowDown, Pill, User, Hash, FileText } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Substance } from "../../types";
import { CaptureSignature, CapturePhoto } from "./CaptureIdentity";

interface DispenseDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Substance[];
  users: {id: string, name: string, title?: string}[];
  onLog: (transaction: any) => Promise<void>;
  isPhotoRequirementEnabled: boolean;
}

export function DispenseDialog({
  isOpen,
  onOpenChange,
  inventory,
  users,
  onLog,
  isPhotoRequirementEnabled
}: DispenseDialogProps) {
  const [substanceSearch, setSubstanceSearch] = useState("");
  const [selectedSubstance, setSelectedSubstance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rxNumber, setRxNumber] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [witnessId, setWitnessId] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setSubstanceSearch("");
    setSelectedSubstance("");
    setQuantity("");
    setRxNumber("");
    setSelectedUser("");
    setWitnessId("");
    setCapturedPhoto(null);
    setSignature(null);
  };

  const handleSubmit = async () => {
    const item = inventory.find(i => i.id === selectedSubstance);
    if (!item || !selectedUser || !quantity || (!signature && !isPhotoRequirementEnabled)) return;

    setIsSubmitting(true);
    try {
      const qty = Number(quantity);
      const prevStock = item.currentStock;
      const newStock = prevStock - qty;

      await onLog({
        substanceId: item.id,
        substanceName: item.name,
        strength: item.strength,
        ndc: item.ndc,
        type: "OUT",
        quantity: qty,
        previousStock: prevStock,
        newStock,
        performedBy: selectedUser,
        performedByName: users.find(u => u.id === selectedUser)?.name || "Unknown",
        witnessId: witnessId || null,
        reason: `Authorized Dispensing`,
        referenceNumber: rxNumber,
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
                <ArrowDown className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Dispense Medication</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1 uppercase">AUTHORIZED RELEASE OF CONTROLLED SUBSTANCES</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
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
                    className="h-10 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50"
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
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Current Balance</Label>
                    <p className="text-2xl font-bold text-brand-blue leading-tight flex items-baseline gap-2">
                      {selectedItem.currentStock} <span className="text-xs font-bold opacity-60">{selectedItem.unit}</span>
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Target NDC</Label>
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
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">RX #</Label>
                  <Input 
                    value={rxNumber} 
                    onChange={(e) => setRxNumber(e.target.value)} 
                    placeholder="Enter RX #" 
                    className="h-10 border-brand-blue/10 bg-brand-surface text-black placeholder:text-brand-grey/50"
                  />
                </div>
                <div className="grid gap-1">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Quantity Dispensed</Label>
                  <Input 
                    type="number" 
                    value={quantity} 
                    onChange={(e) => setQuantity(e.target.value)} 
                    placeholder="0" 
                    className="h-10 border-brand-blue/10 bg-brand-surface text-black placeholder:text-brand-grey/50 text-sm"
                  />
                </div>
              </div>
              
              {selectedItem && (
                <div className="grid gap-1">
                   <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Remaining Balance (Calc)</Label>
                   <div className="h-10 bg-brand-blue/5 border border-brand-blue/10 rounded-md flex items-center px-3 font-bold text-brand-blue">
                     {(selectedItem.currentStock - (Number(quantity) || 0))} {selectedItem.unit}
                   </div>
                </div>
              )}

              <div className="grid gap-1">
                <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Performing User</Label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-10 border-brand-blue/10 bg-brand-surface text-black px-3 font-bold">
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent className="bg-brand-surface">
                    {users.map(u => (
                      <SelectItem key={u.id} value={u.id} className="text-black font-medium focus:bg-brand-blue/5 focus:text-black">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold">{u.name}</span>
                          {u.title && <span className="text-sm font-bold text-black/60 uppercase tracking-tighter">({u.title})</span>}
                        </div>
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
        </ScrollArea>

        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 flex gap-4">
          <Button 
            onClick={() => { onOpenChange(false); resetForm(); }}
            disabled={isSubmitting}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl shadow-lg transition-all border-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSubstance || !quantity || !selectedUser || !rxNumber || (isPhotoRequirementEnabled ? !capturedPhoto : !signature)}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-[#FFE600] text-brand-blue hover:brightness-110 active:scale-[0.98] rounded-xl transition-all disabled:opacity-50 border-none shadow-xl shadow-yellow-400/30"
          >
            {isSubmitting ? "Dispensing..." : "Dispense"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
