
import { useMemo } from "react";
import { Transaction } from "@/components/transactions/types";

export function useTransactionStats(filteredTransactions: Transaction[]) {
  const stats = useMemo(() => {
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');

    const totalIncome = completedTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => {
        // Only use the net amount for income (without VAT)
        return sum + Number(t.amount || 0);
      }, 0);

    const totalExpenses = completedTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => {
        if (t.vat_clearable) {
          // If VAT is clearable, only count the net amount as expense
          return sum + Number(t.amount || 0);
        } else {
          // If VAT is not clearable, count total amount (net + VAT) as expense
          const amount = t.total_amount !== undefined && t.total_amount !== null
            ? t.total_amount
            : t.amount + (t.vat_amount || 0);
          return sum + Number(amount);
        }
      }, 0);

    // Calculate VAT statistics
    const vatReceived = completedTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.vat_amount || 0), 0);

    const vatPaid = completedTransactions
      .filter(t => t.type === "expense" && t.vat_clearable === true)
      .reduce((sum, t) => sum + Number(t.vat_amount || 0), 0);

    return {
      balance: totalIncome - totalExpenses,
      income: totalIncome,
      expenses: totalExpenses,
      vatReceived,
      vatPaid,
      vatBalance: vatReceived - vatPaid
    };
  }, [filteredTransactions]);

  return stats;
}
