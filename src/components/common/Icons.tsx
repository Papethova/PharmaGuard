import { Pill, Plus, ArrowDown, RefreshCcw, Check } from "lucide-react";
import { TransactionType } from "../../types";

export const PharmaLogo = ({ className = "h-8 w-8" }: { className?: string }) => (
  <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
      <svg 
        viewBox="-3 -3 30 30" 
        className="h-[120%] w-[120%] overflow-visible"
      >
        <path 
          d="M12 24C12 24 23 19.5 23 12V5.5C23 5.5 19.5 3 12 1C4.5 3 1 5.5 1 5.5V12C1 19.5 12 24 12 24Z" 
          fill="none"
          stroke="white"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path 
          d="M12 24C12 24 23 19.5 23 12V5.5C23 5.5 19.5 3 12 1C4.5 3 1 5.5 1 5.5V12C1 19.5 12 24 12 24Z" 
          fill="#ffd700"
          stroke="white"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
    <div className="relative z-10 flex items-center justify-center h-full w-full">
      <svg viewBox="0 0 24 24" className="h-[65%] w-[65%] overflow-visible">
        <g transform="translate(12, 12) rotate(-45)">
          <rect 
            x="-7" 
            y="-2.5" 
            width="14" 
            height="5" 
            rx="2.5" 
            fill="white"
            stroke="white"
            strokeWidth="1.5"
          />
          <rect 
            x="-6.5" 
            y="-2" 
            width="13" 
            height="4" 
            rx="2" 
            fill="#1e68cf"
          />
          <path d="M0 -2.5V2.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      </svg>
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
      
      <span className="relative z-10 text-[10px] font-black text-brand-blue/50 uppercase tracking-widest whitespace-nowrap">
        {type === 'IN' ? 'ADDED' : 
         type === 'OUT' ? 'DISPENSED' : 
         type === 'ADJUST' ? 'ADJUSTED' : 
         'VERIFIED'}
      </span>
    </div>
  );
};
