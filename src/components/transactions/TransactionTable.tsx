
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

  // Fetch transaction parties with error handling
  const { data: parties = [], error: partiesError } = useQuery({
    queryKey: ["transaction-parties"],
    queryFn: async () => {
      console.log("Fetching transaction parties..."); // Debug log
      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*");
      
      if (error) {
        console.error("Error fetching parties:", error); // Debug log
        throw error;
      }
      
      console.log("Successfully fetched parties:", data); // Debug log
      return data as TransactionParty[];
    },
  });

  // Log any parties error
  if (partiesError) {
    console.error("Error in parties query:", partiesError);
  }

  // Fetch all categories
  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*");
      
      if (error) throw error;
      return data as Category[];
    },
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
    console.log("Looking for party:", partyId);
    console.log("Available parties:", parties);
    
    if (!partyId) return "-";
    
    // Try to find the party
    const party = parties.find(p => p.id === partyId);
    
    // Add more detailed logging
    if (!party) {
      console.log("No party found for ID:", partyId);
      return "-";
    }
    
    console.log("Found party:", party);
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

