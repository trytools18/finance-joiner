
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, BarChart3, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface VATSummary {
  vatReceived: number;
  vatPaid: number;
  vatBalance: number;
}

interface VATTrackerProps {
  currencyCode: "USD" | "EUR" | "GBP";
  className?: string;
  onToggleGraphs?: () => void;
  showGraphs?: boolean;
}

export function VATTracker({
  currencyCode,
  className,
  onToggleGraphs,
  showGraphs = false
}: VATTrackerProps) {
  const {
    data: vatSummary,
    isLoading
  } = useQuery({
    queryKey: ["vat-summary"],
    queryFn: async (): Promise<VATSummary> => {
      // Fetch all transactions with VAT information
      const {
        data: transactions,
        error
      } = await supabase.from("transactions").select("type, vat_amount, vat_clearable, status");
      
      if (error) {
        console.error("Error fetching VAT data:", error);
        throw error;
      }

      // Filter for completed transactions only
      const completedTransactions = transactions.filter(t => t.status === 'completed');

      // Calculate VAT received (from income transactions)
      const vatReceived = completedTransactions
        .filter(t => t.type === "income" && t.vat_amount)
        .reduce((sum, t) => sum + (t.vat_amount || 0), 0);

      // Calculate VAT paid (from expense transactions marked as clearable)
      const vatPaid = completedTransactions
        .filter(t => t.type === "expense" && t.vat_clearable && t.vat_amount)
        .reduce((sum, t) => sum + (t.vat_amount || 0), 0);

      // Calculate VAT balance
      const vatBalance = vatReceived - vatPaid;
      
      return {
        vatReceived,
        vatPaid,
        vatBalance
      };
    }
  });

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ""}`}>
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">VAT Tracking</h2>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={onToggleGraphs}
          title={showGraphs ? "Hide charts" : "Show charts"}
        >
          {showGraphs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ""}`}>
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <ArrowUpCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">VAT Received</p>
                <h3 className="text-2xl font-bold">{formatCurrency(vatSummary?.vatReceived || 0, currencyCode)}</h3>
                <p className="text-sm text-muted-foreground">Total VAT collected from sales</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <ArrowDownCircle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">VAT Paid (Clearable)</p>
                <h3 className="text-2xl font-bold">{formatCurrency(vatSummary?.vatPaid || 0, currencyCode)}</h3>
                <p className="text-sm text-muted-foreground">Total clearable VAT paid on purchases</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">VAT Balance</p>
                <h3 className="text-2xl font-bold">{formatCurrency(vatSummary?.vatBalance || 0, currencyCode)}</h3>
                <p className="text-sm text-muted-foreground">Difference between VAT received and paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
