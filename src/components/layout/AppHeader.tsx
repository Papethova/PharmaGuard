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

          <div className="hidden lg:flex flex-1 items-center justify-between gap-2">
            {["ALL", ...SCHEDULES].map((sched) => (
              <button
                key={sched}
                onClick={() => onScheduleChange(sched as any)}
                className={`flex-1 py-2 px-4 text-[10px] font-black tracking-widest transition-all rounded-full border ${
                  activeSchedule === sched
                    ? "bg-brand-blue text-white shadow-xl shadow-brand-blue/30 border-brand-blue"
                    : "text-black/50 hover:bg-brand-blue/5 hover:text-black border-brand-blue/10 bg-brand-blue/5"
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
