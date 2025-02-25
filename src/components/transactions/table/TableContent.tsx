
import { TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Transaction, Column } from "../types";

interface TableContentProps {
  transactions: Transaction[];
  columns: Column[];
}

export const TableContent = ({ transactions, columns }: TableContentProps) => {
  return (
    <TableBody>
      {transactions.map(transaction => (
        <TableRow key={transaction.id}>
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
