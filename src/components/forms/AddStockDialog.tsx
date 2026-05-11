import { useState } from "react";
import { Plus, Calendar } from "lucide-react";
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

interface AddStockDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inventory: Substance[];
  users: {id: string, name: string, title?: string}[];
  onLog: (transaction: any) => Promise<void>;
  isPhotoRequirementEnabled: boolean;
}

export function AddStockDialog({
  isOpen,
  onOpenChange,
  inventory,
  users,
  onLog,
  isPhotoRequirementEnabled
}: AddStockDialogProps) {
  const [substanceSearch, setSubstanceSearch] = useState("");
  const [selectedSubstance, setSelectedSubstance] = useState("");
  const [quantity, setQuantity] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const resetForm = () => {
    setSubstanceSearch("");
    setSelectedSubstance("");
    setQuantity("");
    setInvoiceNumber("");
    setLotNumber("");
    setExpiryDate("");
    setSelectedUser("");
    setCapturedPhoto(null);
    setSignature(null);
  };

  const handleSubmit = async () => {
    const item = inventory.find(i => i.id === selectedSubstance);
    if (!item || !selectedUser || !quantity) return;

    const qty = Number(quantity);
    const prevStock = item.currentStock;
    const newStock = prevStock + qty;

    await onLog({
      substanceId: item.id,
      substanceName: item.name,
      strength: item.strength,
      ndc: item.ndc,
      type: "IN",
      quantity: qty,
      previousStock: prevStock,
      newStock,
      performedBy: selectedUser,
      performedByName: users.find(u => u.id === selectedUser)?.name || "Unknown",
      reason: `Lot: ${lotNumber} | Exp: ${expiryDate}`,
      referenceNumber: invoiceNumber,
      photo: capturedPhoto,
      signature
    });

    onOpenChange(false);
    resetForm();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-[500px] bg-brand-surface border-emerald-500/20 shadow-2xl p-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="px-6 py-4 bg-emerald-600 text-white relative shrink-0">
          <div className="flex items-center gap-4 relative z-10">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
              <Plus className="h-6 w-6 text-brand-yellow" strokeWidth={3} />
            </div>
            
            <div className="flex flex-col gap-0 text-left">
              <DialogTitle className="text-xl font-black tracking-tight text-white leading-none">
                Receive Inventory
              </DialogTitle>
              <DialogDescription className="text-brand-yellow font-bold text-[10px] uppercase tracking-widest mt-1 opacity-80">
                Inbound Stock Addition
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5">
            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Target Medication</Label>
              <div className="relative">
                <Input
                  placeholder="Scan or Search..."
                  value={substanceSearch}
                  onChange={(e) => {
                    setSubstanceSearch(e.target.value);
                    setSelectedSubstance("");
                    setIsSearching(true);
                  }}
                  onFocus={() => setIsSearching(true)}
                  className="bg-brand-light-grey/30 border-emerald-500/10 h-11"
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
                          className="px-4 py-3 hover:bg-emerald-50 cursor-pointer text-sm flex justify-between items-center group border-b border-brand-grey/5 last:border-0"
                          onClick={() => {
                            setSelectedSubstance(s.id);
                            setSubstanceSearch(s.name);
                            setIsSearching(false);
                          }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold group-hover:text-emerald-700 text-brand-dark-grey">{s.name} {s.strength}</span>
                            <span className="text-[10px] text-emerald-600/70 font-mono">NDC: {s.ndc}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] font-black border-emerald-300 text-emerald-600">{s.schedule}</Badge>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Invoice / PO #</Label>
                <Input 
                  value={invoiceNumber} 
                  onChange={(e) => setInvoiceNumber(e.target.value)} 
                  placeholder="EX: INV-9921" 
                  className="bg-brand-light-grey/30 border-emerald-500/10 h-11 transition-all focus:border-emerald-500"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Quantity Added</Label>
                <Input 
                  type="number" 
                  value={quantity} 
                  onChange={(e) => setQuantity(e.target.value)} 
                  placeholder="0" 
                  className="bg-brand-light-grey/30 border-emerald-500/10 h-11 font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Lot Number</Label>
                <Input 
                  value={lotNumber} 
                  onChange={(e) => setLotNumber(e.target.value)} 
                  placeholder="EX: LX-123" 
                  className="bg-brand-light-grey/30 border-emerald-500/10 h-11"
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Exp Date</Label>
                <div className="relative">
                  <Input 
                    type="text"
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)} 
                    placeholder="MM/YYYY" 
                    className="bg-brand-light-grey/30 border-emerald-500/10 h-11 pl-10"
                  />
                  <Calendar className="absolute left-3 top-3 h-5 w-5 text-emerald-500/40" />
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-brand-dark-grey text-xs font-black uppercase tracking-wider">Authorized Receiving Agent</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="bg-brand-light-grey/30 border-emerald-500/10 h-11">
                  <SelectValue placeholder="Identify Staff Member" />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface">
                  {users.map(u => (
                    <SelectItem key={u.id} value={u.id} className="font-bold">{u.name} {u.title && <span className="opacity-50 text-[10px]">({u.title})</span>}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="border-t border-emerald-100 pt-4">
              <CaptureIdentity 
                mode={isPhotoRequirementEnabled ? "photo" : "signature"}
                onCapture={(data) => isPhotoRequirementEnabled ? setCapturedPhoto(data) : setSignature(data)}
                capturedData={isPhotoRequirementEnabled ? capturedPhoto : signature}
                onReset={() => isPhotoRequirementEnabled ? setCapturedPhoto(null) : setSignature(null)}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-emerald-50 border-t border-emerald-100">
          <Button 
            onClick={handleSubmit}
            disabled={!selectedSubstance || !quantity || !selectedUser || !invoiceNumber || !lotNumber}
            className="w-full h-14 bg-emerald-600 text-white font-black uppercase tracking-widest rounded-xl shadow-xl hover:bg-emerald-700 transition-all"
          >
            Log Multi-Step Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
