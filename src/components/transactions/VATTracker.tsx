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
export function VATTracker({
  currencyCode,
  className
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
      } = await supabase.from("transactions").select("type, vat_amount, vat_clearable");
      if (error) {
        console.error("Error fetching VAT data:", error);
        throw error;
      }

      // Calculate VAT received (from income transactions)
      const vatReceived = transactions.filter(t => t.type === "income" && t.vat_amount).reduce((sum, t) => sum + (t.vat_amount || 0), 0);

      // Calculate VAT paid (from expense transactions marked as clearable)
      const vatPaid = transactions.filter(t => t.type === "expense" && t.vat_clearable && t.vat_amount).reduce((sum, t) => sum + (t.vat_amount || 0), 0);

      // Calculate VAT balance
      const vatBalance = vatReceived - vatPaid;
      return {
        vatReceived,
        vatPaid,
        vatBalance
      };
    }
  });
  return <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 ${className || ""}`}>
      

      

      <Card>
        
        
      </Card>
    </div>;
}