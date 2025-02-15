
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

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
  const queryClient = useQueryClient();

  const { data: parties = [] } = useQuery({
    queryKey: ["transaction-parties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*");
      
      if (error) throw error;
      return data as TransactionParty[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Transaction['status'] }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const getPartyName = (partyId: string | null) => {
    if (!partyId) return "-";
    const party = parties.find(p => p.id === partyId);
    if (!party) return partyId;
    return party.company_name ? `${party.name} (${party.company_name})` : party.name;
  };

  const getStatusStyle = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    }
  };

  return (
    <div className="rounded-md border">
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
          {transactions.map(transaction => (
            <TableRow key={transaction.id}>
              <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
              <TableCell>{getPartyName(transaction.party)}</TableCell>
              <TableCell className="capitalize">{transaction.category}</TableCell>
              <TableCell>{formatCurrency(transaction.amount, currencyCode)}</TableCell>
              <TableCell>
                <Select
                  defaultValue={transaction.status}
                  onValueChange={(value: Transaction['status']) => {
                    updateStatusMutation.mutate({ 
                      id: transaction.id, 
                      status: value 
                    });
                  }}
                >
                  <SelectTrigger className={cn(
                    "w-[130px]",
                    getStatusStyle(transaction.status)
                  )}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      value="pending"
                      className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                    >
                      Pending
                    </SelectItem>
                    <SelectItem 
                      value="completed"
                      className="bg-green-100 text-green-800 hover:bg-green-200"
                    >
                      Completed
                    </SelectItem>
                    <SelectItem 
                      value="cancelled"
                      className="bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Cancelled
                    </SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className="capitalize">{transaction.payment_method}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
