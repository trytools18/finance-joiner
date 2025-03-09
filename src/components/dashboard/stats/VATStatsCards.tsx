
import { CreditCard } from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";
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
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="VAT Received"
        value={formatAmount(vatReceived)}
        icon={CreditCard}
        description="Total VAT collected from completed sales"
      />
      <StatCard
        title="VAT Paid"
        value={formatAmount(vatPaid)}
        icon={CreditCard}
        description="Total clearable VAT paid on completed purchases"
      />
      <StatCard
        title="VAT Balance"
        value={formatAmount(vatBalance)}
        icon={CreditCard}
        description="Difference between VAT received and paid (completed transactions)"
      />
    </div>
  );
}
