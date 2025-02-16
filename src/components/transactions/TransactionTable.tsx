
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, horizontalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface TransactionParty {
  id: string;
  name: string;
  company_name: string | null;
}

interface TransactionCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
}

export interface Transaction {
  id: string;
  date: string;
  party: string | null;
  type: "income" | "expense" | "transfer";
  amount: number;
  status: "completed" | "pending" | "cancelled";
  payment_method: "cash" | "card" | "online";
  category_id?: string;
}

interface TransactionTableProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

interface Column {
  id: string;
  label: string;
  render: (transaction: Transaction) => React.ReactNode;
}

const SortableHeader = ({ column }: { column: Column }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    cursor: 'grab',
    touchAction: 'none',
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <TableHead 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={cn(
        isDragging && "bg-muted/50 backdrop-blur-sm",
        "select-none"
      )}
    >
      {column.label}
    </TableHead>
  );
};

export const TransactionTable = ({
  transactions,
  currencyCode = "USD"
}: TransactionTableProps) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(MouseSensor));
  const [columns, setColumns] = useState<Column[]>([]);

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

  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*");
      
      if (error) throw error;
      return data as TransactionCategory[];
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

  const getCategoryName = (transaction: Transaction) => {
    const category = categories.find(c => c.id === transaction.category_id);
    return category?.name || "-";
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

  const formatAmount = (transaction: Transaction) => {
    const amount = Math.abs(transaction.amount);
    const formattedAmount = formatCurrency(amount, currencyCode);
    const sign = transaction.type === 'income' ? '+' : '-';
    const color = transaction.type === 'income' ? 'text-green-600' : 'text-red-600';
    
    return (
      <span className={color}>
        {sign} {formattedAmount}
      </span>
    );
  };

  // Initialize columns if not yet set
  if (columns.length === 0) {
    setColumns([
      {
        id: 'date',
        label: 'Date',
        render: (transaction) => new Date(transaction.date).toLocaleDateString(),
      },
      {
        id: 'party',
        label: 'Party',
        render: (transaction) => getPartyName(transaction.party),
      },
      {
        id: 'type',
        label: 'Type',
        render: (transaction) => <span className="capitalize">{transaction.type}</span>,
      },
      {
        id: 'category',
        label: 'Category',
        render: (transaction) => <span className="capitalize">{getCategoryName(transaction)}</span>,
      },
      {
        id: 'amount',
        label: 'Amount',
        render: formatAmount,
      },
      {
        id: 'status',
        label: 'Status',
        render: (transaction) => (
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
        ),
      },
      {
        id: 'payment_method',
        label: 'Payment Method',
        render: (transaction) => <span className="capitalize">{transaction.payment_method}</span>,
      },
    ]);
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setColumns((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToHorizontalAxis]}
        >
          <TableHeader>
            <TableRow>
              <SortableContext items={columns} strategy={horizontalListSortingStrategy}>
                {columns.map((column) => (
                  <SortableHeader key={column.id} column={column} />
                ))}
              </SortableContext>
            </TableRow>
          </TableHeader>
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
        </DndContext>
      </Table>
    </div>
  );
};
