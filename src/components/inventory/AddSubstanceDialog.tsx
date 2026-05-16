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
import { Badge } from "@/components/ui/badge";
import { SCHEDULES } from "../../lib/constants";
import { Schedule } from "../../types";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CaptureSignature, CapturePhoto } from "../forms/CaptureIdentity";

interface AddSubstanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  inventory?: any[];
  onAdd: (substance: any) => Promise<string | void>;
  onLog: (transaction: any) => Promise<void>;
  users: any[];
  isPhotoRequirementEnabled: boolean;
}

export function AddSubstanceDialog({ 
  isOpen, 
  onOpenChange,
  inventory = [],
  onAdd,
  onLog,
  users,
  isPhotoRequirementEnabled
}: AddSubstanceDialogProps) {
  const [name, setName] = useState("");
  const [strength, setStrength] = useState("");
  const [schedule, setSchedule] = useState<Schedule | "">("");
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
  
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const resetForm = () => {
    setName("");
    setStrength("");
    setNdc("");
    setDosageForm("");
    setPackageSize("");
    setMinThreshold("");
    setSchedule("");
    setInvoiceNumber("");
    setQuantityReceived("");
    setPerformerId("");
    setSignature("");
    setPhoto(null);
    setShowConfirm(false);
  };

  const handleIntialSubmit = () => {
    if (!name || !strength || !ndc || !quantityReceived || !performerId || !schedule || (!signature && !isPhotoRequirementEnabled)) return;
    setShowConfirm(true);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const substanceId = await onAdd({
        name,
        strength,
        schedule: schedule as Schedule,
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
          {showConfirm ? (
            <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-300">
              <div className="h-20 w-20 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                <Plus className="h-10 w-10 text-brand-blue" strokeWidth={3} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-brand-blue uppercase tracking-tight">Confirm Enrollment</h3>
                <p className="text-sm text-brand-blue/60 font-medium max-w-[280px] mx-auto">
                  You are about to add <span className="font-bold text-brand-blue">{name} {strength}</span> to the registry with an initial stock of <span className="font-bold text-brand-blue">{quantityReceived}</span> units.
                </p>
              </div>
              <div className="bg-brand-blue/5 p-4 rounded-xl border border-brand-blue/10 w-full text-left space-y-2">
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-blue/40">
                   <span>NDC</span>
                   <span className="text-brand-blue">{ndc}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-brand-blue/40">
                   <span>Schedule</span>
                   <span className="text-brand-blue">{schedule}</span>
                 </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Substance Info */}
              <div className="space-y-4 p-4 rounded-xl bg-brand-blue/5 border border-brand-blue/10">
                <div className="grid gap-2">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Medication</Label>
                  <div className="relative">
                    <Input 
                      value={name} 
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      onChange={(e) => {
                        setName(e.target.value);
                        setIsSearching(true);
                      }} 
                      onFocus={() => setIsSearching(true)}
                      placeholder="e.g. Oxycodone" 
                      className="h-9 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" 
                    />
                    {name && isSearching && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-brand-grey/20 rounded-xl shadow-2xl max-h-64 overflow-y-auto overflow-x-hidden p-1">
                        {inventory.length > 0 && (
                          <div className="px-3 py-2 text-[10px] font-bold text-brand-blue/40 uppercase tracking-widest border-b border-brand-grey/5 mb-1">
                            Current Inventory
                          </div>
                        )}
                        {inventory
                          .filter(s => s.name.toLowerCase().includes(name.toLowerCase()))
                          .map(s => (
                            <div
                              key={s.id}
                              className="px-3 py-3 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group border-b border-brand-grey/5 last:border-0 rounded-lg"
                              onClick={() => {
                                setName(s.name);
                                setStrength(s.strength);
                                setNdc(s.ndc);
                                setDosageForm(s.unit);
                                setPackageSize(s.packageSize.toString());
                                setSchedule(s.schedule);
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
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Strength</Label>
                    <Input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 10mg" className="h-9 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Dosage Form</Label>
                    <Input value={dosageForm} onChange={(e) => setDosageForm(e.target.value)} placeholder="e.g. Tablets" className="h-9 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">NDC</Label>
                    <Input value={ndc} onChange={(e) => setNdc(e.target.value)} placeholder="00000-0000-00" className="h-9 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Package Size</Label>
                    <Input type="number" value={packageSize} onChange={(e) => setPackageSize(e.target.value)} placeholder="e.g. 100" className="h-9 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Schedule</Label>
                    <Select value={schedule} onValueChange={(v: Schedule) => setSchedule(v)}>
                      <SelectTrigger className="h-9 border-brand-blue/20 bg-white text-brand-blue px-3 font-bold">
                        <SelectValue placeholder="Select...." />
                      </SelectTrigger>
                      <SelectContent className="bg-brand-surface">
                        {SCHEDULES.map(s => <SelectItem key={s} value={s} className="text-black font-bold focus:bg-brand-blue/5">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                   <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Minimum Threshold</Label>
                    <Input type="number" value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} placeholder="e.g. 50" className="h-9 border-brand-blue/20 bg-white text-black placeholder:text-brand-grey/50" />
                  </div>
                </div>
              </div>
  
              {/* Initial Intake Info */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Invoice Number</Label>
                    <Input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="Enter Invoice #" className="h-9 border-brand-blue/10 bg-brand-surface text-black placeholder:text-brand-grey/50" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Quantity Received</Label>
                    <Input type="number" value={quantityReceived} autoComplete="off" onChange={(e) => setQuantityReceived(e.target.value)} placeholder="0" className="h-9 border-brand-blue/10 bg-brand-surface text-black placeholder:text-brand-grey/50" />
                  </div>
                </div>
  
                <div className="grid gap-1">
                  <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Performing User</Label>
                  <Select value={performerId} onValueChange={setPerformerId}>
                    <SelectTrigger className="h-9 border-brand-blue/10 bg-brand-surface text-brand-blue px-3 font-bold focus:ring-brand-blue/20">
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
                    <Label className="text-black font-bold text-[10px] tracking-wider uppercase">Identity Signature</Label>
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
            onClick={showConfirm ? handleSubmit : handleIntialSubmit} 
            disabled={isSubmitting || !name || !strength || !ndc || !quantityReceived || !performerId || !schedule || (!signature && !isPhotoRequirementEnabled)}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-[#FFE600] text-brand-blue hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all border-none shadow-xl shadow-[#FFE600]/30"
          >
            {isSubmitting ? (showConfirm ? "Finalizing..." : "Processing...") : (showConfirm ? "Confirm Add" : "Add")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
