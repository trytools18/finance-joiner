
import { TrendingUp, BarChart3, Wallet } from "lucide-react";
import { StatCardEnhanced } from "./StatCardEnhanced";
import { formatCurrency } from "@/lib/utils";

interface FinancialStatsProps {
  income: number;
  expenses: number;
  balance: number;
  currencyCode: "USD" | "EUR" | "GBP";
}

export function FinancialStatsCards({
  income,
  expenses,
  balance,
  currencyCode
}: FinancialStatsProps) {
  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currencyCode as "USD" | "EUR" | "GBP");
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <StatCardEnhanced
        title="Income"
        value={formatAmount(income)}
        icon={TrendingUp}
        description="Total income from completed transactions"
        trend={{ value: 12.5, isPositive: true }}
        variant="success"
      />
      <StatCardEnhanced
        title="Expenses"
        value={formatAmount(expenses)}
        icon={BarChart3}
        description="Total expenses (incl. non-clearable VAT) from completed transactions"
        trend={{ value: 8.2, isPositive: false }}
        variant="warning"
      />
      <StatCardEnhanced
        title="Balance"
        value={formatAmount(balance)}
        icon={Wallet}
        description="Current balance (completed transactions)"
        variant={balance >= 0 ? "success" : "destructive"}
      />
    </div>
  );
}
