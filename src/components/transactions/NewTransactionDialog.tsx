
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { TransactionFormFields } from "./TransactionFormFields";
import { NewTransactionDialogProps, TransactionParty, Category, TransactionCategory, TransactionStatus, PaymentMethod } from "./types";

export function NewTransactionDialog({ 
  defaultPaymentMethod = "online",
  defaultVatRate = 0.24,
  vatRates = [0.24, 0.14, 0.10, 0],
  defaultCurrency = "USD",
  isOpen,
  setIsOpen,
  transactionToEdit = null,
  onClose
}: NewTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();
  
  // Use the controlled open state if provided, otherwise use internal state
  const dialogOpen = isOpen !== undefined ? isOpen : open;
  const setDialogOpen = setIsOpen || setOpen;

  // Set date if we're editing a transaction
  useEffect(() => {
    if (transactionToEdit && transactionToEdit.date) {
      setDate(new Date(transactionToEdit.date));
    } else {
      setDate(new Date());
    }
  }, [transactionToEdit]);

  const { data: parties = [] } = useQuery({
    queryKey: ["transaction-parties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as TransactionParty[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Category[];
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const categoryData = categories.find(c => c.id === formData.get("category"));
    if (!categoryData) return;

    const transactionType = categoryData.type as TransactionCategory;
    // Get net amount from hidden field
    const amount = Number(formData.get("amount"));
    const totalAmount = Number(formData.get("total_amount"));
    const vatRate = Number(formData.get("vat"));
    const vatClearable = transactionType === 'expense' ? formData.get("vat_clearable") === 'on' : false;
    
    // Calculate VAT amount based on net amount
    const vatAmount = amount * vatRate;

    const transaction = {
      date: date.toISOString(),
      type: transactionType,
      category_id: categoryData.id,
      amount: amount, // Net amount
      vat: vatRate,
      vat_amount: vatAmount,
      vat_clearable: vatClearable,
      party: formData.get("party")?.toString() || null,
      payment_method: formData.get("payment_method") as PaymentMethod,
      status: "completed" as TransactionStatus,
      user_id: user.id,
      description: formData.get("description")?.toString() || null,
      // Use the total amount from the form
      total_amount: totalAmount
    };

    if (transactionToEdit) {
      // Update existing transaction
      const { error } = await supabase
        .from("transactions")
        .update(transaction)
        .eq("id", transactionToEdit.id);

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        setDialogOpen(false);
        if (onClose) onClose();
      }
    } else {
      // Create new transaction
      const { error } = await supabase
        .from("transactions")
        .insert(transaction);

      if (!error) {
        queryClient.invalidateQueries({ queryKey: ["transactions"] });
        setDialogOpen(false);
        if (onClose) onClose();
      }
    }
  };

  // Only render the trigger when we're not in edit mode
  const dialogTrigger = !transactionToEdit ? (
    <DialogTrigger asChild>
      <Button>
        <Plus className="h-4 w-4 mr-2" />
        New Transaction
      </Button>
    </DialogTrigger>
  ) : null;

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      {dialogTrigger}
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{transactionToEdit ? "Edit Transaction" : "New Transaction"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TransactionFormFields
            date={date}
            setDate={setDate}
            categories={categories}
            parties={parties}
            defaultPaymentMethod={defaultPaymentMethod}
            defaultVatRate={defaultVatRate}
            vatRates={vatRates}
            transaction={transactionToEdit}
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              type="button" 
              onClick={() => {
                setDialogOpen(false);
                if (onClose) onClose();
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {transactionToEdit ? "Update" : "Add"} Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
