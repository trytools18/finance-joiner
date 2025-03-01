
import { useState, useEffect } from "react";
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
import { useTransactionData } from "./hooks/useTransactionData";
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
  const [description, setDescription] = useState<string>("");
  const [isVatClearable, setIsVatClearable] = useState<boolean>(false);
  const { updateVATSettingsMutation } = useTransactionData();

  // Update state when transaction changes
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description || "");
      setIsVatClearable(transaction.vat_clearable || false);
    }
  }, [transaction]);

  const handleSave = async () => {
    if (!transaction) return;
    
    try {
      await updateVATSettingsMutation.mutateAsync({
        id: transaction.id,
        vat_clearable: isVatClearable,
        description
      });
      
      toast.success("Transaction updated successfully");
      onClose();
    } catch (error) {
      console.error('Error updating transaction:', error);
      toast.error("Failed to update transaction");
    }
  };

  if (!transaction) return null;

  const formatAmount = (amount: number) => formatCurrency(amount, currencyCode);
  const netAmount = transaction.amount;
  const vatAmount = transaction.vat_amount || 0;
  // Fix the calculation: total amount should be the sum of net amount and VAT amount
  const totalAmount = netAmount + vatAmount;

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
              placeholder="No description added"
              className="resize-none"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={updateVATSettingsMutation.isPending}>
            {updateVATSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
