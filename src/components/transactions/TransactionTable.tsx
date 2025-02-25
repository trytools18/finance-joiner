
import { Table, TableHeader, TableRow } from "@/components/ui/table";
import { DndContext } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Transaction } from "./types";
import { SortableHeader } from "./table/SortableHeader";
import { TableContent } from "./table/TableContent";
import { useTransactionData } from "./hooks/useTransactionData";
import { useColumnDragAndDrop } from "./hooks/useColumnDragAndDrop";

interface TransactionTableProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

export const TransactionTable = ({
  transactions,
  currencyCode = "USD"
}: TransactionTableProps) => {
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

  const { sensors, columns, handleDragEnd } = useColumnDragAndDrop({
    getPartyName,
    getCategoryName,
    handleStatusChange,
    currencyCode
  });

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
