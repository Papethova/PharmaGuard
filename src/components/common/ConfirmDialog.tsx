import * as React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string | React.ReactNode;
  subtitle?: string;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  icon?: React.ReactNode;
}

export function ConfirmDialog({
  isOpen,
  onOpenChange,
  title,
  description,
  subtitle = "Action Required",
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  icon
}: ConfirmDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="sm:max-w-[400px] bg-brand-surface border-brand-blue/20 shadow-2xl p-0 gap-0 overflow-hidden rounded-2xl flex flex-col">
        <DialogHeader className="p-6 bg-brand-blue text-white overflow-hidden relative border-none shrink-0" id="dialog-header-confirm">
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-10 w-10 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20">
              {icon || <AlertTriangle className="h-5 w-5 text-brand-blue" strokeWidth={3} />}
            </div>
            <div>
              <DialogTitle className="text-lg font-black tracking-tight leading-none text-white">{title}</DialogTitle>
                <DialogDescription className="text-brand-yellow font-bold text-[10px] tracking-widest mt-1 uppercase">{subtitle}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 py-8">
          <div className="p-5 rounded-2xl bg-brand-blue/5 border border-brand-blue/10 text-brand-dark-grey text-sm font-medium leading-relaxed whitespace-pre-line">
            {description}
          </div>
        </div>

        <DialogFooter className="p-6 bg-brand-blue/5 border-t border-brand-blue/10 shrink-0 flex gap-4">
          <Button 
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-blue text-white hover:bg-brand-blue/90 rounded-xl shadow-lg transition-all border-none"
          >
            {cancelLabel}
          </Button>
          <Button 
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="flex-1 h-12 text-xs font-black uppercase tracking-widest bg-brand-yellow text-brand-blue hover:scale-[1.02] active:scale-[0.98] rounded-xl transition-all border-none shadow-xl shadow-brand-yellow/30"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
