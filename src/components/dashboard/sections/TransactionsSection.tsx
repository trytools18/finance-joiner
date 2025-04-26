
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Transaction } from "@/components/transactions/types";
import { useEffect } from "react";

interface TransactionsSectionProps {
  filteredTransactions: Transaction[];
  currencyCode: "USD" | "EUR" | "GBP";
}

export function TransactionsSection({
  filteredTransactions,
  currencyCode
}: TransactionsSectionProps) {
  // Add debugging to track filtered transactions
  useEffect(() => {
    console.log("TransactionsSection received filtered transactions:", filteredTransactions.length);
    if (filteredTransactions.length > 0) {
      console.log("First filtered transaction:", filteredTransactions[0]);
    }
  }, [filteredTransactions]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Transactions</h2>
        <Button variant="outline" size="icon">
          <TrendingUp className="h-4 w-4" />
        </Button>
      </div>
      <TransactionTable 
        transactions={filteredTransactions} 
        currencyCode={currencyCode as "USD" | "EUR" | "GBP"}
      />
    </div>
  );
}
