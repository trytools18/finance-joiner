
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { ArrowDownCircle, ArrowUpCircle, BarChart3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";

interface VATSummary {
  vatReceived: number;
  vatPaid: number;
  vatBalance: number;
}

interface VATTrackerProps {
  currencyCode: "USD" | "EUR" | "GBP";
  className?: string;
}

export function VATTracker({
  currencyCode,
  className
}: VATTrackerProps) {
  const { user } = useAuth();

  const {
    data: vatSummary,
    isLoading
  } = useQuery({
    queryKey: ["vat-summary", user?.id],
    queryFn: async (): Promise<VATSummary> => {
      console.log("VATTracker: Fetching VAT data for user:", user?.id);
      
      const { data: transactions, error } = await supabase
        .from("transactions")
        .select("type, vat_amount, vat_clearable, status")
        .eq("user_id", user!.id);
      
      if (error) {
        console.error("Error fetching VAT data:", error);
        throw error;
      }

      console.log("VATTracker: Fetched transactions for VAT:", transactions?.length || 0);

      // Filter for completed transactions only
      const completedTransactions = transactions?.filter(t => t.status === 'completed') || [];

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
      
      console.log("VATTracker: Calculated VAT summary:", { vatReceived, vatPaid, vatBalance });
      
      return {
        vatReceived,
        vatPaid,
        vatBalance
      };
    },
    enabled: !!user?.id,
    retry: 1,
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

  if (!vatSummary) {
    return null;
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ""}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VAT Received</CardTitle>
          <ArrowDownCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(vatSummary.vatReceived, currencyCode)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VAT Paid</CardTitle>
          <ArrowUpCircle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(vatSummary.vatPaid, currencyCode)}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">VAT Balance</CardTitle>
          <BarChart3 className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${vatSummary.vatBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(vatSummary.vatBalance, currencyCode)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
