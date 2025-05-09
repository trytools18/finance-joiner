
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Transaction, Column } from "../types";
import { useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface TableContentProps {
  transactions: Transaction[];
  columns: Column[];
  onRowClick?: (transaction: Transaction, isSelectionMode: boolean) => void;
  selectedTransactions?: Transaction[];
  isSelectionMode?: boolean;
  isLoading?: boolean;
}

export const TableContent = ({ 
  transactions, 
  columns, 
  onRowClick,
  selectedTransactions = [],
  isSelectionMode = false,
  isLoading = false
}: TableContentProps) => {
  const isSelected = (transaction: Transaction) => {
    return selectedTransactions.some(t => t.id === transaction.id);
  };

  // Add debugging to help identify why transactions might not be showing
  useEffect(() => {
    console.log("TableContent received transactions:", transactions);
    console.log("Number of transactions:", transactions?.length || 0);
    if (transactions && transactions.length > 0) {
      console.log("First transaction sample:", transactions[0]);
    }
  }, [transactions]);

  if (isLoading) {
    return (
      <TableBody>
        {[1, 2, 3].map(i => (
          <TableRow key={i}>
            {columns.map((column, colIndex) => (
              <TableCell key={`loading-${i}-${colIndex}`}>
                <Skeleton className="h-4 w-full" />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    );
  }

  return (
    <TableBody>
      {!transactions || transactions.length === 0 ? (
        <TableRow>
          <TableCell colSpan={columns.length} className="text-center py-6 text-muted-foreground">
            No transactions found
          </TableCell>
        </TableRow>
      ) : (
        transactions.map(transaction => (
          <TableRow 
            key={transaction.id}
            onClick={() => onRowClick?.(transaction, isSelectionMode)}
            className={`cursor-pointer ${isSelected(transaction) ? 'bg-muted' : ''}`}
            data-state={isSelected(transaction) ? 'selected' : undefined}
          >
            {columns.map((column, index) => (
              <TableCell key={`${transaction.id}-${column.id}`}>
                {index === 0 && isSelectionMode && (
                  <span 
                    className="mr-2 inline-block align-middle" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick?.(transaction, true);
                    }}
                  >
                    <Checkbox 
                      checked={isSelected(transaction)}
                      className="translate-y-[2px]"
                    />
                  </span>
                )}
                {column.id === 'description' && !transaction.description ? (
                  <span className="text-muted-foreground italic">No description added</span>
                ) : (
                  column.render(transaction)
                )}
              </TableCell>
            ))}
          </TableRow>
        ))
      )}
    </TableBody>
  );
};
