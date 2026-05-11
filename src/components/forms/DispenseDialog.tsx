import { useState } from "react";
import { ArrowDown } from "lucide-react";
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
import { CaptureIdentity } from "./CaptureIdentity";

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
  const [patientName, setPatientName] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const resetForm = () => {
    setSubstanceSearch("");
    setSelectedSubstance("");
    setQuantity("");
    setRxNumber("");
    setPatientName("");
    setSelectedUser("");
    setCapturedPhoto(null);
    setSignature(null);
  };

  const handleSubmit = async () => {
    const item = inventory.find(i => i.id === selectedSubstance);
    if (!item || !selectedUser || !quantity) return;

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
      reason: `Patient: ${patientName}`,
      referenceNumber: rxNumber,
      photo: capturedPhoto,
      signature
    });

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-blue-500/20 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-4 bg-brand-blue text-white relative shrink-0">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <ArrowDown className="h-6 w-6 text-brand-yellow" strokeWidth={3} />
            </div>
            
            <div className="flex flex-col gap-0 text-left">
              <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                Dispense Medication
              </DialogTitle>
              <DialogDescription className="text-brand-yellow font-bold text-[10px] uppercase tracking-widest mt-1 opacity-80">
                Secure Outbound Transaction
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Search Inventory</Label>
              <div className="relative">
                <Input
                  placeholder="Type name, strength, or NDC..."
                  value={substanceSearch}
                  onChange={(e) => {
                    setSubstanceSearch(e.target.value);
                    setSelectedSubstance("");
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="bg-brand-light-grey/30 border-brand-blue/10 h-11"
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
                          className="px-4 py-3 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group border-b border-brand-grey/5 last:border-0"
                          onClick={() => {
                            setSelectedSubstance(s.id);
                            setSubstanceSearch(s.name);
                            setIsSearching(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold group-hover:text-brand-blue text-brand-dark-grey">{s.name} {s.strength}</span>
                            <span className="text-[10px] text-brand-blue/70 font-mono uppercase">NDC: {s.ndc}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black border-brand-blue/30 text-brand-blue">{s.schedule}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {selectedSubstance && (
              <div className="grid grid-cols-2 gap-4 bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10">
                <div>
                  <Label className="text-[10px] uppercase font-black text-brand-blue/40 tracking-widest">Current Inventory</Label>
                  <p className="text-lg font-black text-brand-blue leading-tight">
                    {inventory.find(i => i.id === selectedSubstance)?.currentStock} <span className="text-xs font-bold opacity-60 uppercase">{inventory.find(i => i.id === selectedSubstance)?.unit}</span>
                  </p>
                </div>
                <div className="text-right">
                  <Label className="text-[10px] uppercase font-black text-brand-blue/40 tracking-widest">FDA Schedule</Label>
                  <p className="text-lg font-black text-brand-blue leading-tight">
                    {inventory.find(i => i.id === selectedSubstance)?.schedule}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">RX / Prescription #</Label>
                <Input 
                  value={rxNumber} 
                  onChange={(e) => setRxNumber(e.target.value)} 
                  placeholder="EX: 8823901" 
                  className="bg-brand-light-grey/30 border-brand-blue/10 h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Quantity to Pull</Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="0.00" 
                  className="bg-brand-light-grey/30 border-brand-blue/10 h-11 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Patient Information</Label>
              <Input 
                value={patientName} 
                onChange={(e) => setPatientName(e.target.value)} 
                placeholder="Full Legal Name" 
                className="bg-brand-light-grey/30 border-brand-blue/10 h-11"
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Dispensing Pharmacist</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-brand-light-grey/30 border-brand-blue/10 h-11">
                  <SelectValue placeholder="Identify Staff Member" />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id} className="font-bold">{u.name} {u.title && <span className="opacity-50 text-[10px]">({u.title})</span>}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-brand-grey/10 pt-4">
              <CaptureIdentity 
                mode={isPhotoRequirementEnabled ? "photo" : "signature"}
                onCapture={(data) => isPhotoRequirementEnabled ? setCapturedPhoto(data) : setSignature(data)}
                capturedData={isPhotoRequirementEnabled ? capturedPhoto : signature}
                onReset={() => isPhotoRequirementEnabled ? setCapturedPhoto(null) : setSignature(null)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-brand-light-grey/50 border-t border-brand-blue/10">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedSubstance || !quantity || !selectedUser || !patientName}
            className="w-full h-14 bg-brand-blue text-brand-yellow font-black uppercase tracking-widest rounded-xl shadow-xl hover:scale-[1.01] transition-all"
          >
            Authorize Dispensation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
