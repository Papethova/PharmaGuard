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
        if (sub?.schedule !== activeSchedule) return false;
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

  const tableHeadClass = "text-[10px] uppercase font-black text-brand-blue/60 tracking-widest text-center h-10";

  return (
    <div className="space-y-4 relative z-10 m-0">
      <div className="flex flex-wrap items-end gap-10 bg-brand-surface p-4 rounded-lg border border-brand-grey/10 shadow-sm relative z-20">
        <div className="flex items-end gap-10">
          <div className="grid gap-1.5">
            <Label htmlFor="start-date" className="text-xs font-bold text-brand-blue text-center">Start Date</Label>
            <Input 
              id="start-date"
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="h-9 text-sm border-brand-grey/20 focus:border-brand-blue text-center"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="end-date" className="text-xs font-bold text-brand-blue text-center">End Date</Label>
            <Input 
              id="end-date"
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="h-9 text-sm border-brand-grey/20 focus:border-brand-blue text-center"
            />
          </div>
        </div>

        <div className="grid gap-1.5 min-w-[320px] relative">
          <Label htmlFor="history-med-search" className="text-xs font-bold text-brand-blue text-center">Medication Filter</Label>
          <Input
            id="history-med-search"
            placeholder="Search medication..."
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
            className="h-9 text-sm border-brand-grey/20 focus:border-brand-blue bg-brand-surface text-left pl-4"
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
                        <span className="text-[10px] font-mono text-brand-blue/70 font-bold">{s.ndc}</span>
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
          className="h-9 text-xs border-brand-grey/20 hover:bg-brand-blue/5"
        >
          Clear Filter
        </Button>

        <div className="ml-auto text-xs text-brand-dark-grey/60 font-medium">
          Showing {filteredTransactions.length} transactions
        </div>
      </div>

      <Card className="border-brand-grey/10 shadow-sm overflow-hidden bg-brand-surface py-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-brand-blue sticky top-0 z-30">
              <TableRow className="bg-brand-blue">
                <TableHead className="text-[10px] uppercase font-black text-white tracking-widest text-center h-10 bg-brand-blue sticky top-0 z-30">Timestamp</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-white tracking-widest text-center h-10 bg-brand-blue sticky top-0 z-30">Reference #</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-white tracking-widest text-center h-10 bg-brand-blue sticky top-0 z-30">Medication & Strength</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-white tracking-widest text-center h-10 bg-brand-blue sticky top-0 z-30">NDC</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-white tracking-widest text-center h-10 bg-brand-blue sticky top-0 z-30">Type</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-white tracking-widest text-center h-10 bg-brand-blue sticky top-0 z-30">Qty</TableHead>
                <TableHead className="text-[10px] uppercase font-black text-white tracking-widest text-center h-10 bg-brand-blue sticky top-0 z-30">Performed By</TableHead>
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
                  <TableCell className="text-xs font-mono text-brand-dark-grey/70 whitespace-nowrap text-center">
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
                  <TableCell className="text-xs font-bold text-center">
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
                  <TableCell className="text-center font-bold text-sm text-brand-dark-grey">
                    {t.type === 'VERIFY' ? `=${t.quantity}` : (t.type === 'IN' ? '+' : t.type === 'OUT' ? '-' : (t.type === 'ADJUST' && t.quantity > 0 ? '+' : '')) + t.quantity}
                  </TableCell>
                  <TableCell className="text-xs text-brand-dark-grey text-center no-interact">
                    {escapeEmail(t.performedByName)}
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
