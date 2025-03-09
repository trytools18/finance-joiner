
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Transaction } from "@/components/transactions/types";

interface TransactionsSectionProps {
  filteredTransactions: Transaction[];
  currencyCode: string;
}

export function TransactionsSection({
  filteredTransactions,
  currencyCode
}: TransactionsSectionProps) {
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
        currencyCode={currencyCode}
      />
    </div>
  );
}
