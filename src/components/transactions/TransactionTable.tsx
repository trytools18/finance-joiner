import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
export interface Transaction {
  id: string;
  date: string;
  party: string | null;
  category: "income" | "expense" | "transfer";
  amount: number;
  status: "completed" | "pending" | "cancelled";
  payment_method: "cash" | "card" | "online";
}
interface TransactionTableProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}
export const TransactionTable = ({
  transactions,
  currencyCode = "USD"
}: TransactionTableProps) => {
  return <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(transaction => <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell className="take the party data from back end">{transaction.party}</TableCell>
              <TableCell className="capitalize">{transaction.category}</TableCell>
              <TableCell>{formatCurrency(transaction.amount, currencyCode)}</TableCell>
              <TableCell className="capitalize">{transaction.status}</TableCell>
              <TableCell className="capitalize">{transaction.payment_method}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};