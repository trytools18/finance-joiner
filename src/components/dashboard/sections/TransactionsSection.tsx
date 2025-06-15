
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { Transaction } from "@/components/transactions/types";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TransactionsSectionProps {
  filteredTransactions: Transaction[];
  currencyCode: "USD" | "EUR" | "GBP";
  isLoading?: boolean;
}

export function TransactionsSection({
  filteredTransactions,
  currencyCode,
  isLoading = false
}: TransactionsSectionProps) {
  // Add debugging to track filtered transactions
  useEffect(() => {
    console.log("TransactionsSection: Received transactions:", {
      count: filteredTransactions?.length || 0,
      isLoading,
      sampleTransaction: filteredTransactions?.[0]?.id || 'none'
    });
  }, [filteredTransactions, isLoading]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Recent Transactions</h2>
        <Button variant="outline" size="icon">
          <TrendingUp className="h-4 w-4" />
        </Button>
      </div>
      
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <TransactionTable 
          transactions={filteredTransactions || []} 
          currencyCode={currencyCode as "USD" | "EUR" | "GBP"}
        />
      )}
    </div>
  );
}
