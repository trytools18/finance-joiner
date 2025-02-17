
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { arrayMove, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { Transaction, TransactionParty, Category, TransactionStatus, Column } from "./types";
import { SortableHeader } from "./table/SortableHeader";
import { createTableColumns } from "./table/TableColumns";

interface TransactionTableProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

export const TransactionTable = ({
  transactions,
  currencyCode = "USD"
}: TransactionTableProps) => {
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(MouseSensor));
  const [columns, setColumns] = useState<Column[]>([]);

  // Fetch transaction parties, but only the ones we need
  const { data: parties = [] } = useQuery({
    queryKey: ["transaction-parties"],
    queryFn: async () => {
      // Get unique party IDs from transactions
      const partyIds = [...new Set(transactions.map(t => t.party).filter(Boolean))];
      
      if (partyIds.length === 0) return [];

      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*")
        .in("id", partyIds);
      
      if (error) throw error;
      console.log("Fetched parties:", data); // Add this log to debug
      return data as TransactionParty[];
    },
    enabled: transactions.length > 0,
  });

  // Fetch categories for the transactions
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: async () => {
      const categoryIds = [...new Set(transactions.map(t => t.category_id).filter(Boolean))];
      
      if (categoryIds.length === 0) return [];

      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .in("id", categoryIds);
      
      if (error) throw error;
      console.log("Fetched categories:", data); // Add this log to debug
      return data as Category[];
    },
    enabled: transactions.length > 0,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TransactionStatus }) => {
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
    console.log("Looking up party for ID:", partyId); // Add this log to debug
    console.log("Available parties:", parties); // Add this log to debug
    
    if (!partyId) return "-";
    const party = parties.find(p => p.id === partyId);
    if (!party) return partyId; // Return the ID if party not found
    return party.company_name ? `${party.name} (${party.company_name})` : party.name;
  };

  const getCategoryName = (transaction: Transaction) => {
    if (!transaction.category_id) return "-";
    const category = categories.find(c => c.id === transaction.category_id);
    return category?.name || "-";
  };

  const handleStatusChange = (id: string, status: TransactionStatus) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Initialize columns if not yet set
  if (columns.length === 0 || columns.length !== 6) {
    setColumns(createTableColumns(
      getPartyName,
      getCategoryName,
      handleStatusChange,
      currencyCode
    ));
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
