
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Transaction, Column } from "../types";

interface TableContentProps {
  transactions: Transaction[];
  columns: Column[];
  onRowClick?: (transaction: Transaction) => void;
}

export const TableContent = ({ transactions, columns, onRowClick }: TableContentProps) => {
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
            onClick={() => onRowClick?.(transaction)}
            className="cursor-pointer"
          >
            {columns.map((column) => (
              <TableCell key={`${transaction.id}-${column.id}`}>
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
