import { useState, useEffect } from "react";
import { Settings, Shield, Camera, SwitchCamera, AlertCircle, Edit } from "lucide-react";
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
      toast.success("Settings updated");
      onOpenChange(false);
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0">
            <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <Edit className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Profile Identity</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1">ESTABLISH ORGANIZATION IDENTITY</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-8">
          <div className="space-y-2">
            <Label className="text-brand-blue font-black text-xs tracking-wider uppercase">Organization Name</Label>
            <Input 
              value={orgName} 
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Ex: Central Health Dispensary"
              className="bg-brand-light-grey/30 border-brand-blue/10 h-12 text-black placeholder:text-brand-grey/50 font-bold"
            />
          </div>

          <div className="p-4 rounded-xl border border-brand-blue/5 bg-brand-blue/5 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-brand-yellow flex items-center justify-center shrink-0">
              <AlertCircle className="h-4 w-4 text-brand-blue" strokeWidth={3} />
            </div>
            <p className="text-[10px] text-brand-blue/70 font-bold leading-relaxed transition-colors">
              Updating your organization name will immediately synchronize your identity across all regional database nodes.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 flex gap-4">
          <Button 
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl shadow-lg transition-all border-none"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSave}
            disabled={isSubmitting}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all border-none shadow-xl shadow-brand-yellow/30"
          >
            {isSubmitting ? "Updating..." : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
