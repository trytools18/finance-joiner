
import { CreditCard, Receipt, FileText } from "lucide-react";
import { StatCardEnhanced } from "./StatCardEnhanced";
import { formatCurrency } from "@/lib/utils";

interface VATStatsProps {
  vatReceived: number;
  vatPaid: number;
  vatBalance: number;
  currencyCode: "USD" | "EUR" | "GBP";
}

export function VATStatsCards({ 
  vatReceived, 
  vatPaid, 
  vatBalance, 
  currencyCode 
}: VATStatsProps) {
  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currencyCode as "USD" | "EUR" | "GBP");
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCardEnhanced
        title="VAT Received"
        value={formatAmount(vatReceived)}
        icon={Receipt}
        description="Total VAT collected from completed sales"
        variant="success"
      />
      <StatCardEnhanced
        title="VAT Paid"
        value={formatAmount(vatPaid)}
        icon={CreditCard}
        description="Total clearable VAT paid on completed purchases"
        variant="warning"
      />
      <StatCardEnhanced
        title="VAT Balance"
        value={formatAmount(vatBalance)}
        icon={FileText}
        description="Difference between VAT received and paid (completed transactions)"
        variant={vatBalance >= 0 ? "success" : "destructive"}
      />
    </div>
  );
}
