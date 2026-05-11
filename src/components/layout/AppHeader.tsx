import { PharmaLogo } from "../common/Icons";
import { Button } from "@/components/ui/button";
import { SCHEDULES } from "../../lib/constants";
import { Schedule } from "../../types";

interface AppHeaderProps {
  activeSchedule: Schedule | "ALL";
  onScheduleChange: (schedule: Schedule | "ALL") => void;
  onLogoClick: () => void;
}

export function AppHeader({
  activeSchedule,
  onScheduleChange,
  onLogoClick
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-blue/10 bg-brand-surface/90 backdrop-blur-md">
      <div className="max-w-[1800px] mx-auto px-4 md:px-8 lg:px-12">
        <div className="flex h-14 items-center gap-8">
          <div className="w-full lg:w-64 flex items-center lg:justify-start justify-center lg:-ml-4">
            <div 
              className="flex items-center gap-3 cursor-pointer group" 
              onClick={onLogoClick}
            >
              <PharmaLogo className="h-10 w-10 group-hover:scale-110 transition-transform" />
              <h1 className="text-4xl font-black tracking-tighter text-brand-blue">PharmaGuard</h1>
            </div>
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center">
            <div className="flex items-center gap-12">
              {["ALL", ...SCHEDULES].map((sched) => (
                <Button
                  key={sched}
                  variant={activeSchedule === sched ? "default" : "outline"}
                  size="sm"
                  onClick={() => onScheduleChange(sched as any)}
                  className={`rounded-full px-8 h-10 text-xs font-extrabold tracking-wider transition-all min-w-[120px] ${
                    activeSchedule === sched 
                      ? "bg-brand-blue text-white border-brand-blue shadow-md" 
                      : "bg-brand-surface text-brand-blue border-brand-blue/20 hover:bg-brand-blue/5"
                  }`}
                >
                  {sched === "ALL" ? "ALL SCHEDULES" : sched}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
