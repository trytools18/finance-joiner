
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Transaction, TransactionStatus } from "../types";

interface StatusCellProps {
  transaction: Transaction;
  onStatusChange: (id: string, status: TransactionStatus) => void;
}

export const StatusCell = ({ transaction, onStatusChange }: StatusCellProps) => {
  const getStatusStyle = (status: TransactionStatus) => {
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
    <Select
      defaultValue={transaction.status}
      onValueChange={(value: TransactionStatus) => {
        onStatusChange(transaction.id, value);
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
  );
};
