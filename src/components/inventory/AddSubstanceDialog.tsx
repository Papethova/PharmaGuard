import { useState } from "react";
import { PlusCircle } from "lucide-react";
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

interface AddSubstanceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (substance: any) => Promise<void>;
}

export function AddSubstanceDialog({ 
  isOpen, 
  onOpenChange,
  onAdd 
}: AddSubstanceDialogProps) {
  const [name, setName] = useState("");
  const [strength, setStrength] = useState("");
  const [schedule, setSchedule] = useState<string>("");
  const [ndc, setNdc] = useState("");
  const [unit, setUnit] = useState("");
  const [packageSize, setPackageSize] = useState("");
  const [minThreshold, setMinThreshold] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!name || !strength || !ndc || !schedule) return;
    setIsSubmitting(true);
    try {
      await onAdd({
        name,
        strength,
        schedule,
        ndc,
        unit,
        packageSize: Number(packageSize),
        minThreshold: Number(minThreshold)
      });
      onOpenChange(false);
      // Reset
      setName("");
      setStrength("");
      setNdc("");
      setUnit("");
      setPackageSize("");
      setMinThreshold("");
      setSchedule("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-brand-blue">Catalog New Substance</DialogTitle>
          <DialogDescription className="text-brand-dark-grey/60 text-[10px] uppercase tracking-widest font-bold">Registry Entry Creation</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-1.5">
            <Label className="text-xs font-bold text-brand-blue">Medication Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Oxycodone" className="h-10 border-brand-blue/10" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-brand-blue">Strength</Label>
              <Input value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="e.g. 10mg" className="h-10 border-brand-blue/10" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-brand-blue">Schedule</Label>
              <Select value={schedule === "" ? undefined : schedule} onValueChange={(v) => setSchedule(v)}>
                <SelectTrigger className="h-10 border-brand-blue/10">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent className="bg-brand-surface">
                  {SCHEDULES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-brand-blue">NDC</Label>
              <Input value={ndc} onChange={(e) => setNdc(e.target.value)} placeholder="00000-0000-00" className="h-10 border-brand-blue/10" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-brand-blue">Dosage Form</Label>
              <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="e.g. Tablets" className="h-10 border-brand-blue/10" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-brand-blue">Package Size</Label>
              <Input value={packageSize} onChange={(e) => setPackageSize(e.target.value)} placeholder="100" className="h-10 border-brand-blue/10" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-xs font-bold text-brand-blue">Low Stock Alert Level</Label>
              <Input value={minThreshold} onChange={(e) => setMinThreshold(e.target.value)} placeholder="50" className="h-10 border-brand-blue/10" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full h-12 bg-brand-blue text-brand-yellow font-black uppercase tracking-widest rounded-xl shadow-lg"
          >
            {isSubmitting ? "Provisioning..." : "Enroll Medication"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
