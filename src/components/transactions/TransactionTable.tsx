
import { Table, TableHeader, TableRow } from "@/components/ui/table";
import { DndContext, DragEndEvent, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableContext, horizontalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { useState } from "react";
import { Transaction, Column } from "./types";
import { SortableHeader } from "./table/SortableHeader";
import { TableContent } from "./table/TableContent";
import { createTableColumns } from "./table/TableColumns";
import { useTransactionData } from "./hooks/useTransactionData";

interface TransactionTableProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

export const TransactionTable = ({
  transactions,
  currencyCode = "USD"
}: TransactionTableProps) => {
  const sensors = useSensors(useSensor(MouseSensor));
  const [columns, setColumns] = useState<Column[]>([]);
  const { parties, categories, updateStatusMutation } = useTransactionData();

  const getPartyName = (partyId: string | null) => {
    console.log("Looking for party:", partyId);
    console.log("Available parties:", parties);
    
    if (!partyId) return "-";
    
    const party = parties.find(p => p.id === partyId);
    
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

  const handleStatusChange = (id: string, status: Transaction['status']) => {
    updateStatusMutation.mutate({ id, status });
  };

  // Initialize columns if not yet set
  if (columns.length === 0 || columns.length !== 7) {
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
    <div className="rounded-md border overflow-x-auto">
      <div className="min-w-[800px]">
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
            <TableContent transactions={transactions} columns={columns} />
          </DndContext>
        </Table>
      </div>
    </div>
  );
};
