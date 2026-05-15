import { Pill, Plus, ArrowDown, RefreshCcw, Check } from "lucide-react";
import { TransactionType } from "../../types";

export const PharmaLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    {/* The SVG structure provided by the user for the professional PharmaGuard brand */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
      <svg 
        viewBox="-3 -3 30 30" 
        className="h-[120%] w-[120%] overflow-visible"
      >
        <defs>
          <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e68cf" />
            <stop offset="100%" stopColor="#0f3d7a" />
          </linearGradient>
        </defs>
        <path 
          d="M12 2L4 5V11C4 16.1 7.4 20.8 12 22C16.6 20.8 20 16.1 20 11V5L12 2Z" 
          fill="url(#shieldGrad)"
          stroke="#ffd700"
          strokeWidth="0.5"
        />
        <path 
          d="M12 7V17" 
          stroke="#ffd700" 
          strokeWidth="2" 
          strokeLinecap="round"
          className="opacity-90"
        />
        <path 
          d="M8 12H16" 
          stroke="#ffd700" 
          strokeWidth="2" 
          strokeLinecap="round"
          className="opacity-90"
        />
      </svg>
    </div>
    {/* Inner symbol for brand recognition */}
    <div className="relative z-10 flex items-center justify-center h-full w-full">
      <Pill className="h-[55%] w-[55%] text-brand-yellow drop-shadow-sm" strokeWidth={3} />
    </div>
  </div>
);

export const TransactionBadge = ({ type, size = "md" }: { type: TransactionType, size?: "sm" | "md" }) => {
  const isSm = size === "sm";
  const iconSize = isSm ? "h-5 w-5" : "h-8 w-8";
  
  return (
    <div className="relative flex items-center justify-center px-3 py-1 group overflow-hidden rounded-lg min-w-[100px] h-9">
      <div className="absolute inset-0 flex items-center justify-center translate-y-1 opacity-100 transition-opacity pointer-events-none">
        {type === 'IN' && <Plus className={`${iconSize} text-brand-blue/30`} strokeWidth={2} />}
        {type === 'OUT' && <ArrowDown className={`${iconSize} text-brand-blue/30`} strokeWidth={2} />}
        {type === 'ADJUST' && <RefreshCcw className={`${iconSize} text-brand-blue/30`} strokeWidth={2} />}
        {type === 'VERIFY' && <Check className={`${iconSize} text-brand-blue/30`} strokeWidth={2} />}
      </div>
      
      <span className="relative z-10 text-[10px] font-bold text-brand-blue/50 uppercase tracking-widest whitespace-nowrap">
        {type === 'IN' ? 'ADDED' : 
         type === 'OUT' ? 'DISPENSED' : 
         type === 'ADJUST' ? 'ADJUSTED' : 
         'VERIFIED'}
      </span>
    </div>
  );
};
