
import { useMemo, useState } from "react";
import { TransactionTrends } from "../graphs/TransactionTrends";
import { ExpenseCategories } from "../graphs/ExpenseCategories";
import { IncomeCategories } from "../graphs/IncomeCategories";
import { Transaction } from "@/components/transactions/types";
import { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface ChartsSectionProps {
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  dateRange: DateRange | undefined;
  currencyCode: string;
}

export function ChartsSection({
  transactions,
  filteredTransactions,
  dateRange,
  currencyCode
}: ChartsSectionProps) {
  const [showCharts, setShowCharts] = useState(false);
  const { toast } = useToast();

  const chartDateRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return { start: dateRange.from, end: dateRange.to };
    }
    
    // Default to last 30 days if no date range is selected
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return { start, end };
  }, [dateRange]);

  const toggleCharts = () => {
    setShowCharts(!showCharts);
    toast({
      title: showCharts ? "Charts hidden" : "Charts visible",
      description: showCharts 
        ? "Dashboard charts are now hidden." 
        : "Dashboard charts are now visible.",
    });
  };

  return (
    <>
      <div className="flex items-center justify-between mt-6">
        <h2 className="text-2xl font-bold">Data Visualization</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleCharts}
          title={showCharts ? "Hide charts" : "Show charts"}
        >
          {showCharts ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </Button>
      </div>

      {showCharts && (
        <>
          {/* Transaction Trend Graph */}
          <div className="grid gap-4 md:grid-cols-3">
            <TransactionTrends 
              transactions={transactions} 
              dateRange={chartDateRange}
              currencyCode={currencyCode}
            />
          </div>

          {/* Category Distribution Graphs */}
          <div className="grid gap-4 md:grid-cols-2">
            <ExpenseCategories 
              transactions={filteredTransactions} 
              currencyCode={currencyCode}
            />
            <IncomeCategories 
              transactions={filteredTransactions} 
              currencyCode={currencyCode}
            />
          </div>
        </>
      )}
    </>
  );
}
