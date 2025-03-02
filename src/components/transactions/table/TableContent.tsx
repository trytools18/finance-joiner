
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Transaction, Column } from "../types";

interface TableContentProps {
  transactions: Transaction[];
  columns: Column[];
  onRowClick?: (transaction: Transaction, isSelectionMode: boolean) => void;
  selectedTransactions?: Transaction[];
  isSelectionMode?: boolean;
}

export const TableContent = ({ 
  transactions, 
  columns, 
  onRowClick,
  selectedTransactions = [],
  isSelectionMode = false
}: TableContentProps) => {
  const isSelected = (transaction: Transaction) => {
    return selectedTransactions.some(t => t.id === transaction.id);
  };

  return (
    <TableBody>
      {transactions.length === 0 ? (
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
                  <span className="mr-2 inline-flex" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={isSelected(transaction)}
                      onCheckedChange={() => onRowClick?.(transaction, true)}
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
