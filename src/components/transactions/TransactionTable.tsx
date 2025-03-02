
import { Table, TableHeader, TableRow } from "@/components/ui/table";
import { DndContext } from "@dnd-kit/core";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Transaction, SelectedTransactionsActions } from "./types";
import { SortableHeader } from "./table/SortableHeader";
import { TableContent } from "./table/TableContent";
import { useTransactionData } from "./hooks/useTransactionData";
import { useTransactionFilters } from "./hooks/useTransactionFilters";
import { DateRangePicker } from "./filters/DateRangePicker";
import { TypeFilter } from "./filters/TypeFilter";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { TransactionDetailsDialog } from "./TransactionDetailsDialog";
import { VATTracker } from "./VATTracker";
import { SelectedTransactionsToolbar } from "./table/SelectedTransactionsToolbar";
import { DragEndEvent, MouseSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { createTableColumns } from "./table/TableColumns";

interface TransactionTableProps {
  transactions: Transaction[];
  currencyCode?: "USD" | "EUR" | "GBP";
}

type SortDirection = "asc" | "desc" | null;
type SortField = "date" | "party" | "category" | "amount" | "description" | "payment_method" | null;

// Local implementation of useColumnDragAndDrop hook
const useColumnDragAndDrop = ({
  getPartyName,
  getCategoryName,
  handleStatusChange,
  currencyCode
}: {
  getPartyName: (partyId: string | null) => string;
  getCategoryName: (transaction: Transaction) => string;
  handleStatusChange: (id: string, status: Transaction['status']) => void;
  currencyCode: "USD" | "EUR" | "GBP";
}) => {
  const sensors = useSensors(useSensor(MouseSensor));
  const [columns, setColumns] = useState(() => 
    createTableColumns(
      getPartyName,
      getCategoryName,
      handleStatusChange,
      () => {}, // Default empty function for vatClearableChange
      currencyCode
    )
  );

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

  return {
    sensors,
    columns,
    handleDragEnd
  };
};

export const TransactionTable = ({
  transactions,
  currencyCode = "USD"
}: TransactionTableProps) => {
  const { parties, categories, updateStatusMutation, deleteTransactionsMutation } = useTransactionData();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [selectedTransactions, setSelectedTransactions] = useState<Transaction[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
      // For dates, we want newest first by default (desc)
      setSortDirection(field === "date" ? "desc" : "asc");
    }
  };

  const sortTransactions = (transactions: Transaction[]) => {
    if (!sortField || !sortDirection) return transactions;

    return [...transactions].sort((a, b) => {
      if (sortField === "date") {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
      }

      let valueA: string | number;
      let valueB: string | number;

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
        return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
      } else {
        return 0;
      }

      // Case-insensitive string comparison
      return sortDirection === "asc" 
        ? valueA < valueB ? -1 : valueA > valueB ? 1 : 0
        : valueB < valueA ? -1 : valueB > valueA ? 1 : 0;
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
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const handleRowClick = (transaction: Transaction, isSelectionMode: boolean) => {
    if (isSelectionMode) {
      handleTransactionSelect(transaction);
    } else {
      setSelectedTransaction(transaction);
    }
  };

  const handleTransactionSelect = (transaction: Transaction) => {
    setSelectedTransactions(prev => {
      const isSelected = prev.some(t => t.id === transaction.id);
      
      if (isSelected) {
        return prev.filter(t => t.id !== transaction.id);
      } else {
        return [...prev, transaction];
      }
    });
  };

  const handleBulkAction = (action: keyof SelectedTransactionsActions) => {
    if (action === "edit" && selectedTransactions.length === 1) {
      setSelectedTransaction(selectedTransactions[0]);
      setSelectedTransactions([]);
    } else if (action === "delete") {
      setShowDeleteDialog(true);
    }
  };

  const handleDeleteConfirm = () => {
    const ids = selectedTransactions.map(t => t.id);
    deleteTransactionsMutation.mutate(ids, {
      onSuccess: () => {
        setSelectedTransactions([]);
        setShowDeleteDialog(false);
      }
    });
  };

  const isSelectionMode = selectedTransactions.length > 0;

  return (
    <div className="space-y-4">
      <TransactionDetailsDialog
        transaction={selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        currencyCode={currencyCode}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedTransactions.length} {selectedTransactions.length === 1 ? 'transaction' : 'transactions'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VATTracker currencyCode={currencyCode} className="mb-6" />

      <SelectedTransactionsToolbar 
        selectedTransactions={selectedTransactions}
        onCancel={() => setSelectedTransactions([])}
        onAction={handleBulkAction}
      />

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
              <TableContent 
                transactions={sortedTransactions} 
                columns={columns}
                onRowClick={handleRowClick}
                selectedTransactions={selectedTransactions}
                isSelectionMode={isSelectionMode}
              />
            </DndContext>
          </Table>
        </div>
      </div>
    </div>
  );
}
