
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "./DateRangePicker";
import { TypeFilter } from "./TypeFilter";
import { DateRange } from "react-day-picker";
import { TransactionCategory } from "../types";

interface TransactionFiltersProps {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
  transactionType: TransactionCategory | 'all';
  setTransactionType: (type: TransactionCategory | 'all') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

export function TransactionFilters({
  dateRange,
  setDateRange,
  transactionType,
  setTransactionType,
  searchTerm,
  setSearchTerm,
  hasActiveFilters,
  clearFilters,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-col md:flex-row gap-3 items-start md:items-center mb-4">
      <div className="relative w-full md:w-auto">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 w-full md:w-[200px]"
        />
      </div>
      
      <DateRangePicker value={dateRange} onChange={setDateRange} />
      
      <TypeFilter value={transactionType} onChange={setTransactionType} />
      
      {hasActiveFilters && (
        <Button variant="ghost" onClick={clearFilters} className="ml-auto">
          Clear filters
        </Button>
      )}
    </div>
  );
}
