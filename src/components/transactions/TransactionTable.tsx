import { Table, TableHeader, TableRow } from "@/components/ui/table";
import { DndContext } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Transaction } from "./types";
import { SortableHeader } from "./table/SortableHeader";
import { TableContent } from "./table/TableContent";
import { useTransactionData } from "./hooks/useTransactionData";
import { useColumnDragAndDrop } from "./hooks/useColumnDragAndDrop";
import { useTransactionFilters } from "./hooks/useTransactionFilters";
import { DateRangePicker } from "./filters/DateRangePicker";
import { TypeFilter } from "./filters/TypeFilter";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";

interface TransactionTableProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

type SortDirection = "asc" | "desc" | null;
type SortField = "date" | "party" | "category" | "amount" | "description" | "payment_method" | null;

export const TransactionTable = ({
  transactions,
  currencyCode = "USD"
}: TransactionTableProps) => {
  const { parties, categories, updateStatusMutation } = useTransactionData();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const getPartyName = (partyId: string | null) => {
    if (!partyId) return "-";
    const party = parties.find(p => p.id === partyId);
    return party ? (party.company_name ? `${party.name} (${party.company_name})` : party.name) : "-";
  };

  const getCategoryName = (transaction: Transaction) => {
    if (!transaction.category_id) return "-";
    const category = categories.find(c => c.id === transaction.category_id);
    return category?.name || "-";
  };

  const {
    filteredTransactions,
    dateRange,
    setDateRange,
    transactionType,
    setTransactionType,
    searchTerm,
    setSearchTerm,
    clearFilters,
    hasActiveFilters
  } = useTransactionFilters(transactions, getPartyName, getCategoryName);

  const handleStatusChange = (id: string, status: Transaction['status']) => {
    updateStatusMutation.mutate({ id, status });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") setSortDirection("desc");
      else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortTransactions = (transactions: Transaction[]) => {
    if (!sortField || !sortDirection) return transactions;

    return [...transactions].sort((a, b) => {
      let valueA: string | number;
      let valueB: string | number;

      if (sortField === "date") {
        return sortDirection === "asc" 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      }

      // For text-based fields, normalize strings by converting to lowercase
      if (sortField === "party") {
        valueA = getPartyName(a.party).toLowerCase();
        valueB = getPartyName(b.party).toLowerCase();
      } else if (sortField === "category") {
        valueA = getCategoryName(a).toLowerCase();
        valueB = getCategoryName(b).toLowerCase();
      } else if (sortField === "description") {
        valueA = (a.description || '').toLowerCase();
        valueB = (b.description || '').toLowerCase();
      } else if (sortField === "payment_method") {
        valueA = a.payment_method.toLowerCase();
        valueB = b.payment_method.toLowerCase();
      } else if (sortField === "amount") {
        return sortDirection === "asc"
          ? a.amount - b.amount
          : b.amount - a.amount;
      } else {
        return 0;
      }

      // Case-insensitive string comparison
      if (sortDirection === "asc") {
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      } else {
        return valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
      }
    });
  };

  const { sensors, columns: unsortedColumns, handleDragEnd } = useColumnDragAndDrop({
    getPartyName,
    getCategoryName,
    handleStatusChange,
    currencyCode
  });

  const columns = unsortedColumns.map(column => ({
    ...column,
    sortable: ["date", "party", "category", "amount", "description", "payment_method"].includes(column.id),
    sortDirection: sortField === column.id ? sortDirection : null,
    onSort: () => handleSort(column.id as SortField)
  }));

  const sortedTransactions = sortTransactions(filteredTransactions);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {isFilterOpen ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isFilterOpen && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="flex flex-col gap-4">
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-4">
              <DateRangePicker value={dateRange} onChange={setDateRange} />
              <TypeFilter value={transactionType} onChange={setTransactionType} />
            </div>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters} size="sm">
              Clear Filters
            </Button>
          )}
        </div>
      )}
      
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
                      <SortableHeader 
                        key={column.id} 
                        column={column}
                      />
                    ))}
                  </SortableContext>
                </TableRow>
              </TableHeader>
              <TableContent transactions={sortedTransactions} columns={columns} />
            </DndContext>
          </Table>
        </div>
      </div>
    </div>
  );
};
