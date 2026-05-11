import { useState, useEffect } from "react";
import { Settings, Shield, Camera, SwitchCamera } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { UserProfile } from "../../types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { toast } from "sonner";

interface EditProfileDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfile | null;
  userEmail: string | null;
}

export function EditProfileDialog({
  isOpen,
  onOpenChange,
  userProfile,
  userEmail
}: EditProfileDialogProps) {
  const [orgName, setOrgName] = useState("");
  const [isPhotoEnabled, setIsPhotoEnabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setOrgName(userProfile.organizationName || "");
      setIsPhotoEnabled(userProfile.isPhotoRequirementEnabled || false);
    }
  }, [userProfile, isOpen]);

  const handleSave = async () => {
    if (!userEmail) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "users", userEmail.toLowerCase()), {
        organizationName: orgName,
        isPhotoRequirementEnabled: isPhotoEnabled
      });
      toast.success("Terminal configuration updated");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-brand-surface border-brand-blue/20 rounded-2xl p-0 overflow-hidden shadow-2xl">
        <DialogHeader className="p-6 bg-brand-blue text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg">
              <Settings className="h-5 w-5 text-brand-blue" strokeWidth={3} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black tracking-tight">Terminal Settings</DialogTitle>
              <DialogDescription className="text-brand-yellow text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80">
                Authorized Node Configuration
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black text-brand-blue/60 tracking-widest">Organization / Pharmacy Name</Label>
            <Input 
              value={orgName} 
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="EX: Central Health Dispensary"
              className="bg-brand-light-grey/30 border-brand-blue/10 h-12 font-bold"
            />
          </div>

          <div className="p-4 rounded-xl border border-brand-blue/10 bg-brand-light-grey/20 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-brand-blue" />
                <Label className="text-sm font-bold text-brand-dark-grey">Photo Enforcement</Label>
              </div>
              <p className="text-[10px] text-brand-dark-grey/60 font-medium max-w-[200px]">
                Require live camera capture for every record entry.
              </p>
            </div>
            <Switch 
              checked={isPhotoEnabled}
              onCheckedChange={setIsPhotoEnabled}
              className="data-[state=checked]:bg-brand-blue"
            />
          </div>

          <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50 flex items-center gap-3">
            <Shield className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-[10px] font-bold text-emerald-800 leading-relaxed uppercase">
              Configuration changes are logged in the secure master registry audit trail.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-brand-light-grey/50 border-t border-brand-blue/5">
          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full h-12 bg-brand-blue text-white font-black uppercase tracking-widest rounded-xl hover:scale-[1.02] shadow-xl transition-all"
          >
            {isSubmitting ? "Sychronizing..." : "Apply Configuration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
