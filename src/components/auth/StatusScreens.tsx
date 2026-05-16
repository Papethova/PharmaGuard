import { motion } from "motion/react";
import { Clock, X, AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PharmaLogo } from "../common/Icons";
import { escapeEmail } from "../../lib/formatters";
import { Card } from "@/components/ui/card";

export const InitializationDelay = ({ onRetry }: { onRetry: () => void }) => (
  <div className="min-h-screen bg-brand-light-grey flex items-center justify-center p-4">
    <Card className="max-w-md w-full border-brand-blue/10 bg-brand-surface p-8 text-center space-y-6">
      <div className="flex justify-center">
        <PharmaLogo className="h-16 w-16 opacity-50" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-brand-blue">Initialization Delay</h2>
        <p className="text-brand-grey text-sm">
          The registry is taking longer than expected to synchronize. 
          This may be due to high institutional traffic or secure node verification.
        </p>
      </div>
      <Button 
        onClick={onRetry}
        className="w-full bg-brand-blue text-brand-yellow font-black uppercase"
      >
        Retry Registry Sync
      </Button>
    </Card>
  </div>
);

export const PendingApproval = ({ email, onRetry, onLogout, isSubmitting }: any) => (
  <div className="min-h-screen bg-brand-light-grey flex flex-col items-center justify-center p-4 text-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full"
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-blue/20 flex flex-col items-center space-y-6">
        <div className="h-24 w-24 rounded-full bg-brand-yellow flex items-center justify-center shadow-lg border-4 border-brand-blue/10">
          <Clock className="w-12 h-12 text-brand-blue" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-brand-blue">Access Pending Approval</h2>
          <p className="text-brand-grey text-sm">
            Your PharmaGuard node has been registered successfully. 
            For security reasons, access must be manually granted by a Master Authority.
          </p>
          <div className="bg-brand-blue/5 p-4 rounded-lg border border-brand-blue/10 mt-4">
            <p className="text-[10px] text-brand-blue font-bold tracking-wider">Node Identification</p>
            <p className="text-xs font-mono mt-1 text-brand-grey no-interact">{escapeEmail(email)}</p>
          </div>
        </div>
        <div className="pt-4 w-full space-y-3">
          <Button 
            onClick={onRetry}
            disabled={isSubmitting}
            className="w-full bg-brand-yellow text-brand-blue font-black uppercase h-12 rounded-xl shadow-lg shadow-brand-yellow/20"
          >
            {isSubmitting ? "Syncing..." : "Retry Registry Sync"}
          </Button>
          <Button 
            onClick={onLogout}
            className="w-full bg-brand-blue text-white font-black uppercase h-12 rounded-xl shadow-lg shadow-brand-blue/10"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </motion.div>
  </div>
);

export const SuspendedAccount = ({ onLogout }: { onLogout: () => void }) => (
  <div className="min-h-screen bg-brand-light-grey flex flex-col items-center justify-center p-4 text-center">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-md w-full"
    >
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-brand-blue/10 flex flex-col items-center space-y-6">
        <div className="bg-brand-blue p-6 rounded-full shadow-lg shadow-brand-blue/20">
          <X className="w-16 h-16 text-brand-yellow" strokeWidth={3} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-brand-dark-grey">Subscription Suspended</h2>
          <p className="text-brand-grey">
            Your organization's access to PharmaGuard has been temporarily restricted. 
            Please contact our support team or your administrator to restore your services.
          </p>
        </div>
        <div className="pt-4 w-full">
          <Button 
            variant="outline" 
            onClick={onLogout}
            className="w-full border-brand-grey/20 text-brand-grey hover:bg-gray-50"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </motion.div>
  </div>
);
