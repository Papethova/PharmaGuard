import { AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  const tableHeadClass = "text-[10px] uppercase font-black text-brand-blue/60 tracking-widest text-center h-10";

  return (
    <div className="space-y-4 relative z-10 m-0">
      <Card className="border-brand-yellow/20 shadow-sm overflow-hidden bg-brand-surface">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-brand-yellow/5">
              <TableRow>
                <TableHead className={tableHeadClass}>Alert Type</TableHead>
                <TableHead className={tableHeadClass}>Medication</TableHead>
                <TableHead className={tableHeadClass}>Current Level</TableHead>
                <TableHead className={tableHeadClass}>Action Required</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-brand-dark-grey/50">
                    <p>No active inventory alerts.</p>
                  </TableCell>
                </TableRow>
              ) : lowStockItems.map((item) => (
                <TableRow key={item.id} className="h-20 lg:h-14">
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2 text-brand-yellow font-black text-[10px] uppercase tracking-tighter">
                      <AlertTriangle className="h-4 w-4" />
                      Critical Stock
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm font-bold text-brand-dark-grey">{item.name}&nbsp;{item.strength}</div>
                    <button 
                      onClick={() => onNDCClick(item.ndc)}
                      className="text-xs font-bold text-brand-blue/60 hover:underline"
                    >
                      NDC: {item.ndc}
                    </button>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-brand-yellow">{item.currentStock}&nbsp;{item.unit}</span>
                      <span className="text-xs font-bold text-brand-dark-grey/40 uppercase">Threshold: {item.minThreshold}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => onDismissAlert(item.id)}
                      className="h-8 text-[10px] font-black uppercase tracking-widest border-brand-grey/20 hover:bg-brand-yellow/10 hover:text-brand-yellow hover:border-brand-yellow/20"
                    >
                      Acknowledge
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
