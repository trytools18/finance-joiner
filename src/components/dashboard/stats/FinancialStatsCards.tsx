
import { TrendingUp, BarChart3, Wallet } from "lucide-react";
import { StatCard } from "@/components/stats/StatCard";
import { formatCurrency } from "@/lib/utils";

interface FinancialStatsProps {
  income: number;
  expenses: number;
  balance: number;
  currencyCode: string;
}

export function FinancialStatsCards({
  income,
  expenses,
  balance,
  currencyCode
}: FinancialStatsProps) {
  const formatAmount = (amount: number) => {
    return formatCurrency(amount, currencyCode);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard
        title="Income"
        value={formatAmount(income)}
        icon={TrendingUp}
        description="Total income from completed transactions"
        trend={{ value: 12.5, isPositive: true }}
      />
      <StatCard
        title="Expenses"
        value={formatAmount(expenses)}
        icon={BarChart3}
        description="Total expenses (incl. non-clearable VAT) from completed transactions"
        trend={{ value: 8.2, isPositive: false }}
      />
      <StatCard
        title="Balance"
        value={formatAmount(balance)}
        icon={Wallet}
        description="Current balance (completed transactions)"
      />
    </div>
  );
}
