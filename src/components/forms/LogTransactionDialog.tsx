import { useState } from "react";
import { ArrowDown, Plus, RefreshCcw, Check } from "lucide-react";
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
import { Substance, Transaction, TransactionType } from "../../types";
import { SCHEDULES } from "../../lib/constants";
import { CaptureIdentity } from "./CaptureIdentity";

interface LogTransactionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  type: TransactionType;
  inventory: Substance[];
  users: {id: string, name: string, title?: string}[];
  onLog: (transaction: any) => Promise<void>;
  isPhotoRequirementEnabled: boolean;
}

export function LogTransactionDialog({
  isOpen,
  onOpenChange,
  type,
  inventory,
  users,
  onLog,
  isPhotoRequirementEnabled
}: LogTransactionDialogProps) {
  const [substanceSearch, setSubstanceSearch] = useState("");
  const [selectedSubstance, setSelectedSubstance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [reason, setReason] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const resetForm = () => {
    setSubstanceSearch("");
    setSelectedSubstance("");
    setQuantity("");
    setReferenceNumber("");
    setReason("");
    setSelectedUser("");
    setCapturedPhoto(null);
    setSignature(null);
  };

  const handleSubmit = async () => {
    const item = inventory.find(i => i.id === selectedSubstance);
    if (!item || !selectedUser) return;

    const qty = Number(quantity);
    const prevStock = item.currentStock;
    let newStock = prevStock;

    if (type === "IN") newStock += qty;
    else if (type === "OUT") newStock -= qty;
    else if (type === "ADJUST") newStock += qty;

    await onLog({
      substanceId: item.id,
      substanceName: item.name,
      strength: item.strength,
      ndc: item.ndc,
      type,
      quantity: qty,
      previousStock: prevStock,
      newStock,
      performedBy: selectedUser,
      performedByName: users.find(u => u.id === selectedUser)?.name || "Unknown",
      reason,
      referenceNumber,
      photo: capturedPhoto,
      signature
    });

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-3 bg-brand-blue text-white relative shrink-0">
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg relative overflow-hidden">
              {type === "OUT" && <ArrowDown className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
              {type === "IN" && <Plus className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
              {type === "ADJUST" && <RefreshCcw className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
              {type === "VERIFY" && <Check className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
            </div>
            
            <div className="flex flex-col gap-0 text-left">
              <DialogTitle className="text-sm font-black tracking-tight text-white leading-none">
                {type === "OUT" ? "Dispense Medication" : 
                 type === "IN" ? "Add to Inventory" : 
                 type === "ADJUST" ? "Adjust Inventory" : 
                 "Verify Inventory Count"}
              </DialogTitle>
              <DialogDescription className="text-brand-yellow/70 font-bold text-[8px] uppercase tracking-widest mt-0.5">
                Audit Log Active
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-5 pt-3 space-y-4">
            <div className="grid gap-1.5">
              <Label className="text-brand-dark-grey text-xs font-normal">Medication Search</Label>
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
                  onBlur={() => setTimeout(() => setIsSearching(false), 200)}
                  className="bg-brand-surface border-brand-blue/10 h-10 text-sm font-normal text-brand-dark-grey placeholder:text-brand-grey/50 placeholder:font-normal"
                />
                {substanceSearch && !selectedSubstance && isSearching && (
                  <div className="absolute z-50 w-full mt-1 bg-brand-surface border border-brand-grey/20 rounded-md shadow-xl max-h-60 overflow-y-auto">
                    {inventory
                      .filter(s => 
                        s.name.toLowerCase().includes(substanceSearch.toLowerCase()) || 
                        s.ndc.includes(substanceSearch)
                      )
                      .map(s => (
                        <div
                          key={s.id}
                          className="px-3 py-2 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group"
                          onClick={() => {
                            setSelectedSubstance(s.id);
                            setSubstanceSearch(s.name);
                            setIsSearching(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-medium group-hover:text-brand-blue text-brand-dark-grey">{s.name} {s.strength}</span>
                            <span className="text-[10px] text-brand-blue/70">NDC: {s.ndc}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px]">{s.schedule}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {selectedSubstance && (
              <div className="grid grid-cols-2 gap-4 bg-brand-blue/5 p-3 rounded-lg border border-brand-blue/10">
                <div>
                  <Label className="text-[9px] uppercase font-black text-brand-blue/40">Current Stock</Label>
                  <p className="text-sm font-black text-brand-blue">
                    {inventory.find(i => i.id === selectedSubstance)?.currentStock} {inventory.find(i => i.id === selectedSubstance)?.unit}
                  </p>
                </div>
                <div className="text-right">
                  <Label className="text-[9px] uppercase font-black text-brand-blue/40">Schedule</Label>
                  <p className="text-sm font-black text-brand-blue">
                    {inventory.find(i => i.id === selectedSubstance)?.schedule}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-brand-dark-grey text-xs font-normal">Reference #</Label>
                <Input 
                  value={referenceNumber} 
                  onChange={(e) => setReferenceNumber(e.target.value)} 
                  placeholder="RX / Invoice #" 
                  className="bg-brand-surface border-brand-blue/10 h-10 text-sm font-normal text-brand-dark-grey placeholder:text-brand-grey/50 placeholder:font-normal"
                />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-brand-dark-grey text-xs font-normal">Quantity</Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="0" 
                  className="bg-brand-surface border-brand-blue/10 h-10 text-sm font-normal text-brand-dark-grey placeholder:text-brand-grey/50 placeholder:font-normal"
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-brand-dark-grey text-xs font-normal">Performing User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className={`border-brand-grey/20 focus:ring-brand-blue bg-brand-surface h-10 text-sm font-normal data-placeholder:text-muted-foreground/50 data-placeholder:font-normal ${!selectedUser ? 'text-muted-foreground/50' : 'text-brand-dark-grey'}`}>
                  <SelectValue placeholder="Select User" />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name} {u.title && `(${u.title})`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-1.5">
              <Label className="text-brand-dark-grey text-xs font-normal">Notes</Label>
              <Input 
                value={reason} 
                onChange={(e) => setReason(e.target.value)} 
                placeholder="Required for adjustments" 
                className="bg-brand-surface border-brand-blue/10 h-10 text-sm font-normal text-brand-dark-grey placeholder:text-brand-grey/50 placeholder:font-normal"
              />
            </div>

            <CaptureIdentity 
              mode={isPhotoRequirementEnabled ? "photo" : "signature"}
              onCapture={(data) => isPhotoRequirementEnabled ? setCapturedPhoto(data) : setSignature(data)}
              capturedData={isPhotoRequirementEnabled ? capturedPhoto : signature}
              onReset={() => isPhotoRequirementEnabled ? setCapturedPhoto(null) : setSignature(null)}
            />
          </div>
        </ScrollArea>

        <DialogFooter className="p-4 bg-brand-blue/5 border-t border-brand-blue/10">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedSubstance || !quantity || !selectedUser}
            className="w-full h-12 bg-brand-blue text-brand-yellow font-black uppercase tracking-widest rounded-xl shadow-lg"
          >
            Commit to Registry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
