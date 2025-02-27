
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
      {transactions.map(transaction => (
        <TableRow 
          key={transaction.id}
          onClick={() => onRowClick?.(transaction)}
          className="cursor-pointer"
        >
          {columns.map((column) => (
            <TableCell key={`${transaction.id}-${column.id}`}>
              {column.render(transaction)}
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
};
