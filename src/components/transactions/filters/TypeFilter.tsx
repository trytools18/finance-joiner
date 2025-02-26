
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionCategory } from "../types";

interface TypeFilterProps {
  value: TransactionCategory | 'all';
  onChange: (value: TransactionCategory | 'all') => void;
}

export function TypeFilter({ value, onChange }: TypeFilterProps) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Filter by type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Types</SelectItem>
        <SelectItem value="income">Income</SelectItem>
        <SelectItem value="expense">Expense</SelectItem>
      </SelectContent>
    </Select>
  );
}
