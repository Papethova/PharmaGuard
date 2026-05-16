import { useMemo } from "react";
import { Pill, ArrowDown, Plus, RefreshCcw, PlusCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Substance, Schedule } from "../../types";

interface InventoryViewProps {
  inventory: Substance[];
  activeSchedule: Schedule | "ALL";
  isInitializing: boolean;
  onSubstanceClick: (item: Substance) => void;
  onNDCClick: (ndc: string) => void;
  onDispense: () => void;
  onAddStock: () => void;
  onAdjustStock: () => void;
  onEnroll: () => void;
}

export function InventoryView({
  inventory,
  activeSchedule,
  isInitializing,
  onSubstanceClick,
  onNDCClick,
  onDispense,
  onAddStock,
  onAdjustStock,
  onEnroll
}: InventoryViewProps) {
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => activeSchedule === "ALL" || item.schedule === activeSchedule);
  }, [inventory, activeSchedule]);

  const tableHeadClass = "text-[10px] font-black text-brand-blue tracking-widest text-center h-10";

  return (
    <div className="space-y-6 relative z-10 m-0">
      <div className="flex flex-col gap-4">
        <Card className="border-brand-grey/10 shadow-sm overflow-hidden bg-brand-surface">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-brand-light-grey/50">
                <TableRow>
                  <TableHead className={tableHeadClass}>Medication & Strength</TableHead>
                  <TableHead className={tableHeadClass}>Schedule</TableHead>
                  <TableHead className={tableHeadClass}>NDC</TableHead>
                  <TableHead className={tableHeadClass}>Current Stock</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isInitializing ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-brand-dark-grey/50">Loading inventory...</TableCell>
                  </TableRow>
                ) : filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-brand-dark-grey/50">No entries found.</TableCell>
                  </TableRow>
                ) : filteredInventory.map((item) => (
                  <TableRow 
                    key={item.id} 
                    className="hover:bg-brand-blue/5 transition-colors cursor-pointer group h-14"
                    onClick={() => onSubstanceClick(item)}
                  >
                    <TableCell className="text-sm text-black text-center">
                      <div className="flex flex-col items-center">
                        <span className="font-bold">{item.name} {item.strength}</span>
                        <span className="text-[10px] text-black/50 uppercase tracking-tighter">{item.unit}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={`border-brand-blue/20 text-brand-blue bg-brand-blue/5 text-[10px] px-2 py-0.5 mx-auto`}>
                        {item.schedule}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onNDCClick(item.ndc); }}
                        className="text-brand-blue hover:underline font-bold transition-colors"
                      >
                        {item.ndc}
                      </button>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-sm font-bold ${item.currentStock <= item.minThreshold ? "text-yellow-600" : "text-black"}`}>
                          {item.currentStock}
                        </span>
                        {item.currentStock <= item.minThreshold && (
                          <div className="flex items-center gap-1 mt-1">
                            <div className="h-1.5 w-1.5 rounded-full bg-yellow-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                            <span className="text-[8px] font-bold text-yellow-600 tracking-tighter uppercase">Low Stock</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
