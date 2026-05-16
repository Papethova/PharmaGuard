import { PharmaLogo } from "../common/Icons";
import { Plus, ArrowDown, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SCHEDULES } from "../../lib/constants";
import { Schedule } from "../../types";

interface AppHeaderProps {
  onLogoClick: () => void;
  activeSchedule: Schedule | "ALL";
  onScheduleChange: (schedule: Schedule | "ALL") => void;
}

export function AppHeader({
  onLogoClick,
  activeSchedule,
  onScheduleChange
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-blue/10 bg-brand-surface/90 backdrop-blur-md">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex h-14 items-center gap-10">
          <div className="w-full lg:w-64 flex items-center lg:justify-start justify-center lg:-ml-4">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={onLogoClick}
            >
              <PharmaLogo className="h-8 w-8 text-brand-blue" />
              <div className="flex flex-col">
                <h1 className="text-xl font-black text-brand-blue leading-none tracking-tight">Pharma</h1>
                <p className="text-[9px] font-black text-brand-blue/40 tracking-[0.2em] -mt-0.5">Guard Registry</p>
              </div>
            </div>
          </div>

          <div className="hidden lg:flex items-center justify-between gap-2 flex-1 overflow-visible">
            {["ALL", ...SCHEDULES].map((sched) => (
              <button
                key={sched}
                onClick={() => onScheduleChange(sched as any)}
                className={`h-9 px-0 flex-1 text-xs font-black tracking-tighter transition-all rounded-xl border-2 shrink-0 ${
                  activeSchedule === sched
                    ? "bg-brand-blue text-white shadow-lg shadow-brand-blue/30 border-brand-blue scale-105"
                    : "text-brand-blue/60 hover:text-brand-blue hover:bg-brand-blue/15 border-brand-blue/10 bg-brand-blue/5"
                }`}
              >
                {sched}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
