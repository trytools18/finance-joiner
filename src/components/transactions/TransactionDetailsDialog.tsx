
import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Transaction } from "./types";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface TransactionDetailsDialogProps {
  transaction: Transaction | null;
  onClose: () => void;
  currencyCode: "USD" | "EUR" | "GBP";
}

export function TransactionDetailsDialog({ 
  transaction, 
  onClose,
  currencyCode
}: TransactionDetailsDialogProps) {
  const [description, setDescription] = useState(transaction?.description || "");
  const [isVatClearable, setIsVatClearable] = useState(transaction?.vat_clearable || false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    if (!transaction) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ 
          description,
          vat_clearable: isVatClearable
        })
        .eq('id', transaction.id);

      if (error) throw error;

      toast.success("Transaction updated successfully");
      // No need to invalidate the query as we're using real-time updates
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error("Failed to update transaction");
    } finally {
      setIsSaving(false);
    }
  };

  if (!transaction) return null;

  const formatAmount = (amount: number) => formatCurrency(amount, currencyCode);
  const netAmount = transaction.amount;
  const vatAmount = transaction.vat_amount || 0;
  const totalAmount = transaction.total_amount || netAmount;

  return (
    <Dialog open={!!transaction} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Net Amount</Label>
              <div className="mt-1 font-semibold">
                {formatAmount(netAmount)}
              </div>
            </div>
            <div>
              <Label>VAT Amount</Label>
              <div className="mt-1 font-semibold">
                {formatAmount(vatAmount)}
              </div>
            </div>
            <div className="col-span-2">
              <Label>Total Amount</Label>
              <div className="mt-1 font-semibold">
                {formatAmount(totalAmount)}
              </div>
            </div>
          </div>

          {transaction.type === 'expense' && (
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="vat-clearable"
                checked={isVatClearable}
                onCheckedChange={(checked) => setIsVatClearable(checked as boolean)}
              />
              <Label htmlFor="vat-clearable">VAT clearable with income VAT</Label>
            </div>
          )}

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

