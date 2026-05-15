import { useState } from "react";
import { Plus, ArrowDown } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SCHEDULES } from "../../lib/constants";
import { Schedule } from "../../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CaptureSignature, CapturePhoto } from "../forms/CaptureIdentity";

interface AddSubstanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (substance: any) => Promise<string | void>;
  onLog: (transaction: any) => Promise<void>;
  users: any[];
  isPhotoRequirementEnabled: boolean;
}

export function AddSubstanceDialog({ 
  isOpen, 
  onOpenChange,
  onAdd,
  onLog,
  users,
  isPhotoRequirementEnabled
}: AddSubstanceDialogProps) {
  const [name, setName] = useState("");
  const [strength, setStrength] = useState("");
  const [schedule, setSchedule] = useState<Schedule>("C-II");
  const [ndc, setNdc] = useState("");
  const [dosageForm, setDosageForm] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [minThreshold, setMinThreshold] = useState("");
  
  // Initial Intake Fields
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [quantityReceived, setQuantityReceived] = useState("");
  const [performerId, setPerformerId] = useState("");
  const [signature, setSignature] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setStrength("");
    setNdc("");
    setDosageForm("");
    setPackageSize("");
    setMinThreshold("");
    setInvoiceNumber("");
    setQuantityReceived("");
    setPerformerId("");
    setSignature("");
    setPhoto(null);
  };

  const handleSubmit = async () => {
    if (!name || !strength || !ndc || !quantityReceived || !performerId || !signature) return;
    setIsSubmitting(true);
    try {
      const substanceId = await onAdd({
        name,
        strength,
        schedule,
        ndc,
        unit: dosageForm,
        packageSize: Number(packageSize),
        minThreshold: Number(minThreshold),
        currentStock: Number(quantityReceived)
      });

      if (substanceId) {
        await onLog({
          substanceId,
          type: "IN",
          quantity: Number(quantityReceived),
          referenceNumber: invoiceNumber || "INITIAL-STOCK",
          performedBy: performerId,
          performedByName: users.find(u => u.id === performerId)?.name || "",
          timestamp: new Date().toISOString(),
          signature,
          photo,
          notes: "Initial inventory setup"
        });
      }

      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => { onOpenChange(val); if (!val) resetForm(); }}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[90vh]">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0">
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <Plus className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Add To Inventory</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1 uppercase">AUDIT LOG ACTIVE</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>
        
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Substance Info */}
            <div className="space-y-4 p-4 rounded-xl bg-brand-blue/5 border border-brand-blue/10">
              <div className="grid gap-2">
                <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Medication</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oxycodone" className="h-10 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Strength</Label>
                  <Input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 10mg" className="h-10 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Dosage Form</Label>
                  <Input value={dosageForm} onChange={(e) => setDosageForm(e.target.value)} placeholder="e.g. Tablets" className="h-10 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">NDC</Label>
                  <Input value={ndc} onChange={(e) => setNdc(e.target.value)} placeholder="00000-0000-00" className="h-10 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Package Size</Label>
                  <Input type="number" value={packageSize} onChange={(e) => setPackageSize(e.target.value)} placeholder="e.g. 100" className="h-10 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Schedule</Label>
                  <Select value={schedule} onValueChange={(v: Schedule) => setSchedule(v)}>
                    <SelectTrigger className="h-10 border-brand-blue/20 bg-white text-black px-3 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SCHEDULES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Minimum Threshold</Label>
                  <Input type="number" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} placeholder="e.g. 50" className="h-10 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                </div>
              </div>
            </div>

            {/* Initial Intake Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Invoice Number</Label>
                  <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Enter Invoice #" className="h-10 border-brand-blue/10 bg-brand-surface text-black placeholder:text-brand-grey/50" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Quantity Received</Label>
                  <Input type="number" value={quantityReceived} onChange={(e) => setQuantityReceived(e.target.value)} placeholder="0" className="h-10 border-brand-blue/10 bg-brand-surface text-black placeholder:text-brand-grey/50" />
                </div>
              </div>

              <div className="grid gap-1">
                <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Performing User</Label>
                <Select value={performerId} onValueChange={setPerformerId}>
                  <SelectTrigger className="h-10 border-brand-blue/10 bg-brand-surface text-black px-3 font-bold focus:ring-brand-blue/20">
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
                    <Label className="text-black font-bold text-[10px] tracking-wider">Identity Photo</Label>
                    {photo && (
                      <button 
                        type="button"
                        onClick={() => setPhoto(null)}
                        className="text-[10px] text-brand-blue/50 hover:text-brand-blue uppercase tracking-widest transition-colors font-normal"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <CapturePhoto 
                    onCapture={setPhoto} 
                    capturedData={photo} 
                    onReset={() => setPhoto(null)} 
                  />
                </div>
              )}

              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-black font-bold text-[10px] tracking-wider">Identity Signature</Label>
                  {signature && (
                    <button 
                      type="button"
                      onClick={() => setSignature("")}
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
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl shadow-lg transition-all border-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !name || !strength || !ndc || !quantityReceived || !performerId || !signature}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-[#FFE600] text-brand-blue hover:brightness-110 active:scale-[0.98] rounded-xl transition-all border-none shadow-xl shadow-yellow-400/30"
          >
            {isSubmitting ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
