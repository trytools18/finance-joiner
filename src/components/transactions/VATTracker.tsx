
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface VATSummary {
  vatReceived: number;
  vatPaid: number;
  vatBalance: number;
}

interface VATTrackerProps {
  currencyCode: "USD" | "EUR" | "GBP";
  className?: string;
}

export function VATTracker({ currencyCode, className }: VATTrackerProps) {
  const { data: vatSummary, isLoading } = useQuery({
    queryKey: ["vat-summary"],
    queryFn: async (): Promise<VATSummary> => {
      // Fetch all transactions with VAT information
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("type, vat_amount, vat_clearable");

      if (error) {
        console.error("Error fetching VAT data:", error);
        throw error;
      }

      // Calculate VAT received (from income transactions)
      const vatReceived = transactions
        .filter(t => t.type === "income" && t.vat_amount)
        .reduce((sum, t) => sum + (t.vat_amount || 0), 0);

      // Calculate VAT paid (from expense transactions marked as clearable)
      const vatPaid = transactions
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

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ""}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VAT Received</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(vatSummary?.vatReceived || 0, currencyCode)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VAT Paid</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className="text-2xl font-bold">
              {formatCurrency(vatSummary?.vatPaid || 0, currencyCode)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VAT Balance</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-8 w-full" />
          ) : (
            <div className={`text-2xl font-bold ${vatSummary?.vatBalance && vatSummary.vatBalance < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {formatCurrency(vatSummary?.vatBalance || 0, currencyCode)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
