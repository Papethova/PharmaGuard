import { useState, useMemo } from "react";
import { History, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Transaction, Substance, Schedule } from "../../types";
import { formatDateTime, escapeEmail } from "../../lib/formatters";
import { TransactionBadge } from "../common/Icons";

interface AuditLogViewProps {
  transactions: Transaction[];
  inventory: Substance[];
  activeSchedule: Schedule | "ALL";
  onViewTransaction: (t: Transaction) => void;
  onNDCClick: (ndc: string) => void;
}

export function AuditLogView({
  transactions,
  inventory,
  activeSchedule,
  onViewTransaction,
  onNDCClick
}: AuditLogViewProps) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [historyMedicationSearch, setHistoryMedicationSearch] = useState("");
  const [historyMedicationFilter, setHistoryMedicationFilter] = useState("");
  const [isHistorySearchFocused, setIsHistorySearchFocused] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      // Schedule Filter
      if (activeSchedule !== "ALL") {
        const sub = inventory.find(i => i.id === t.substanceId);
        // If we found the substance and it's a different schedule, hide it.
        // If we didn't find the substance (deleted), we hide it if a specific schedule is selected 
        // because we can't verify it belongs to that schedule.
        if (sub) {
          if (sub.schedule !== activeSchedule) return false;
        } else {
          // If substance is missing, we don't know its schedule, so we exclude it from specific schedule views
          return false;
        }
      }
      
      // Date Range Filter
      if (startDate) {
        const tDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
        if (tDate < new Date(startDate)) return false;
      }
      if (endDate) {
        const tDate = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
        const end = new Date(endDate);
        end.setHours(23, 59, 59);
        if (tDate > end) return false;
      }
      
      // Medication Filter
      if (historyMedicationFilter && t.substanceId !== historyMedicationFilter) return false;
      
      return true;
    });
  }, [transactions, activeSchedule, startDate, endDate, historyMedicationFilter, inventory]);

  const tableHeadClass = "text-sm font-black text-brand-blue tracking-tighter text-center h-10 uppercase";

  return (
    <div className="space-y-4 relative z-10 m-0">
      <div className="flex flex-wrap items-end gap-6 bg-brand-surface p-3 rounded-lg border border-brand-grey/10 shadow-sm relative z-20">
        <div className="flex items-center gap-6 pb-0">
          <div className="grid gap-1 transition-all">
            <Label htmlFor="start-date" className="text-[10px] font-bold text-brand-blue text-left tracking-wider uppercase">Start Date</Label>
            <Input 
              id="start-date"
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 w-36 text-xs border-brand-grey/20 focus:ring-1 focus:ring-brand-blue/20 text-center text-black px-2"
            />
          </div>
          <div className="grid gap-1 transition-all">
            <Label htmlFor="end-date" className="text-[10px] font-bold text-brand-blue text-left tracking-wider uppercase">End Date</Label>
            <Input 
              id="end-date"
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 w-36 text-xs border-brand-grey/20 focus:ring-1 focus:ring-brand-blue/20 text-center text-black px-2"
            />
          </div>
        </div>

        <div className="grid gap-1 flex-1 min-w-[200px] relative transition-all">
          <Label htmlFor="history-med-search" className="text-[10px] font-bold text-brand-blue text-left tracking-wider uppercase">Medication Filter</Label>
          <Input
            id="history-med-search"
            placeholder="Type to search medication..."
            value={historyMedicationSearch}
            onChange={(e) => {
               setHistoryMedicationSearch(e.target.value);
               setHistoryMedicationFilter(""); 
               setIsHistorySearchFocused(true);
            }}
            onFocus={() => setIsHistorySearchFocused(true)}
            onBlur={() => {
              setTimeout(() => setIsHistorySearchFocused(false), 200);
            }}
            className="h-9 text-xs border-brand-grey/20 focus:ring-1 focus:ring-brand-blue/20 bg-brand-surface text-left pl-3 text-black placeholder:text-brand-grey/50"
          />
          {historyMedicationSearch && !historyMedicationFilter && isHistorySearchFocused && (
            <div className="absolute z-50 w-full min-w-[300px] top-full mt-1 bg-brand-surface border border-brand-grey/20 rounded-md shadow-2xl max-h-[400px] overflow-y-auto left-0">
              {inventory
                .filter(s => 
                  s.name.toLowerCase().includes(historyMedicationSearch.toLowerCase()) || 
                  s.ndc.includes(historyMedicationSearch)
                )
                .map(s => (
                  <div
                    key={s.id}
                    className="px-3 py-2 hover:bg-brand-blue/5 cursor-pointer text-sm flex justify-between items-center group"
                    onClick={() => {
                      setHistoryMedicationFilter(s.id);
                      setHistoryMedicationSearch(s.name);
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-brand-blue text-brand-dark-grey">{s.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-brand-dark-grey/60">{s.strength}</span>
                        <span className="text-[10px] text-brand-blue/70 font-bold">{s.ndc}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">{s.schedule}</Badge>
                  </div>
                ))}
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => { 
            setStartDate(""); 
            setEndDate(""); 
            setHistoryMedicationFilter("");
            setHistoryMedicationSearch("");
          }}
          className="h-9 px-4 text-[10px] border-brand-grey/20 hover:bg-brand-blue/5 font-bold uppercase tracking-widest text-brand-blue/60 transition-colors"
        >
          Clear Filter
        </Button>

        <div className="ml-auto text-xs text-brand-dark-grey/60 font-medium">
          Showing {filteredTransactions.length} transactions
        </div>
      </div>

      <Card className="border-brand-grey/10 shadow-sm overflow-hidden bg-brand-surface">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-brand-light-grey/50">
              <TableRow>
                <TableHead className={tableHeadClass}>Timestamp</TableHead>
                <TableHead className={tableHeadClass}>Reference #</TableHead>
                <TableHead className={tableHeadClass}>Medication & Strength</TableHead>
                <TableHead className={tableHeadClass}>NDC</TableHead>
                <TableHead className={tableHeadClass}>Type</TableHead>
                <TableHead className={tableHeadClass}>Quantity</TableHead>
                <TableHead className={tableHeadClass}>Performed by</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-brand-dark-grey/50">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No transactions found.</p>
                  </TableCell>
                </TableRow>
              ) : filteredTransactions.map((t) => (
                <TableRow key={t.id} className="h-14">
                  <TableCell className="text-xs text-brand-dark-grey/70 whitespace-nowrap text-center font-bold">
                    {formatDateTime(t.timestamp)}
                  </TableCell>
                  <TableCell className="text-center">
                    {t.referenceNumber ? (
                      <button 
                        onClick={() => onViewTransaction(t)}
                        className="text-xs font-bold text-brand-blue hover:underline"
                      >
                        {t.referenceNumber}
                      </button>
                    ) : (
                      <span className="text-brand-dark-grey/40 italic">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="text-sm font-bold text-brand-dark-grey">{t.substanceName}&nbsp;{t.strength}</div>
                  </TableCell>
                  <TableCell className="text-xs text-center">
                    <button 
                      onClick={() => onNDCClick(t.ndc)}
                      className="text-brand-blue hover:underline font-bold transition-colors"
                    >
                      {t.ndc}
                    </button>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-center">
                      <TransactionBadge type={t.type} size="sm" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm text-brand-dark-grey font-bold">
                    {t.type === 'VERIFY' ? '-' : (t.type === 'IN' ? '+' : t.type === 'OUT' ? '-' : (t.type === 'ADJUST' && t.quantity > 0 ? '+' : '')) + t.quantity}
                  </TableCell>
                  <TableCell className="text-xs text-brand-dark-grey text-center no-interact">
                    {t.performedByName}
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
