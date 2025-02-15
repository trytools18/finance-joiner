import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
interface TransactionParty {
  id: string;
  name: string;
  company_name: string | null;
}
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
  const {
    data: parties = []
  } = useQuery({
    queryKey: ["transaction-parties"],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from("transaction_parties").select("*");
      if (error) throw error;
      return data as TransactionParty[];
    }
  });
  const getPartyName = (partyId: string | null) => {
    if (!partyId) return "-";
    const party = parties.find(p => p.id === partyId);
    if (!party) return partyId;
    return party.company_name ? `${party.name} (${party.company_name})` : party.name;
  };
  return <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Party</TableHead>
            <TableHead>Type
          </TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Method</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map(transaction => <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell>{getPartyName(transaction.party)}</TableCell>
              <TableCell className="capitalize">{transaction.category}</TableCell>
              <TableCell>{formatCurrency(transaction.amount, currencyCode)}</TableCell>
              <TableCell className="Make this colum drop down menu with 3 option default will be pending and the other to option will be complete and canceled. give it good fit background color at each option">{transaction.status}</TableCell>
              <TableCell className="capitalize">{transaction.payment_method}</TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </div>;
};