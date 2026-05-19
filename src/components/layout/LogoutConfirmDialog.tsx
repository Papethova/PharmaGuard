import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function LogoutConfirmDialog({ isOpen, onOpenChange, onConfirm }: LogoutConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-md bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col touch-none">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0 touch-auto">
          <div className="flex flex-col gap-1 relative z-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
                <LogOut className="h-5 w-5 text-brand-blue" strokeWidth={3} />
              </div>
              <div>
                <DialogTitle className="text-xl font-black tracking-tight leading-none text-white">Sign out confirmation</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1 uppercase">TERMINATE SECURE SESSION</DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 touch-auto">
          <div className="p-5 rounded-2xl bg-brand-blue/5 border border-brand-blue/10">
            <p className="text-brand-grey text-sm font-medium leading-relaxed max-w-[320px] mx-auto whitespace-pre-line text-center">
              Are you sure you want to sign out of the <span className="text-brand-grey font-bold">PharmaGuard</span> registry?
              {"\n\n"}
              All active database sync connections will be safely terminated.
            </p>
          </div>
        </div>

        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 flex gap-3 touch-auto">
          <Button 
            onClick={() => onOpenChange(false)} 
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:brightness-110 rounded-xl transition-all shadow-lg shadow-brand-blue/20"
          >
            Stay signed in
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:brightness-110 shadow-lg shadow-brand-yellow/20 rounded-xl transition-all"
          >
            Sign out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
