import { AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Substance } from "../../types";

interface AlertsViewProps {
  lowStockItems: Substance[];
  onNDCClick: (ndc: string) => void;
  onDismissAlert: (id: string) => void;
}

export function AlertsView({
  lowStockItems,
  onNDCClick,
  onDismissAlert
}: AlertsViewProps) {
  return (
    <div className="space-y-4 relative z-10 m-0">
      <div className="grid gap-4">
        {lowStockItems.length === 0 ? (
          <Card className="border-brand-grey/10 shadow-sm p-12 text-center text-brand-dark-grey/50 bg-brand-surface">
            <p>All stock levels are currently above minimum thresholds.</p>
          </Card>
        ) : lowStockItems.map(item => (
          <Card key={item.id} className="border-brand-grey/20 bg-brand-surface shadow-sm">
            <CardContent className="flex items-center justify-between p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-full bg-brand-yellow flex items-center justify-center shrink-0 shadow-lg border border-brand-yellow/20 relative">
                  <span className="absolute inset-0 rounded-full bg-brand-yellow opacity-40 animate-ping" />
                  <AlertTriangle className="h-6 w-6 text-brand-blue relative z-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-blue tracking-tight">{item.name}{" "}{item.strength}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-lg text-brand-dark-grey">
                      Current Stock: <span className="font-black text-brand-yellow text-xl">{item.currentStock}</span> / Min Threshold: <span className="font-bold text-xl">{item.minThreshold}</span>
                    </p>
                    <div className="h-4 w-[1px] bg-brand-grey/30" />
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-brand-dark-grey/60">NDC:</span>
                      <button 
                        onClick={() => onNDCClick(item.ndc)}
                        className="text-brand-blue hover:underline font-bold transition-colors"
                      >
                        {item.ndc}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <Button 
                className="bg-brand-yellow text-brand-blue hover:brightness-100 shadow-lg shadow-brand-yellow/20 h-12 px-6 font-extrabold rounded-xl transition-all border-none"
                onClick={() => onDismissAlert(item.id)}
              >
                Dismiss Alert
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
