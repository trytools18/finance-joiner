
import { Button } from "@/components/ui/button";
import { Trash2, Edit, X } from "lucide-react";
import { Transaction, SelectedTransactionsActions } from "../types";

interface SelectedTransactionsToolbarProps {
  selectedTransactions: Transaction[];
  onCancel: () => void;
  onAction: (action: keyof SelectedTransactionsActions) => void;
}

export const SelectedTransactionsToolbar = ({
  selectedTransactions,
  onCancel,
  onAction,
}: SelectedTransactionsToolbarProps) => {
  const count = selectedTransactions.length;
  
  if (count === 0) return null;

  return (
    <div className="bg-primary/5 rounded-md p-2 mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onCancel}
          title="Cancel selection"
        >
          <X className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{count} {count === 1 ? 'transaction' : 'transactions'} selected</span>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => onAction("edit")}
          disabled={count !== 1}
        >
          <Edit className="h-4 w-4" />
          Edit
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => onAction("delete")}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
};
