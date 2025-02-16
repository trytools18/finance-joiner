
import { useState } from "react";
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
  defaultCurrency = "USD"
}: NewTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date>(new Date());
  const queryClient = useQueryClient();

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

    const transaction = {
      date: date.toISOString(),
      type: categoryData.type as TransactionCategory,
      category_id: categoryData.id,
      amount: Number(formData.get("amount")),
      vat: Number(formData.get("vat")?.toString().replace("%", "")) / 100,
      party: formData.get("party")?.toString() || null,
      payment_method: formData.get("payment_method") as PaymentMethod,
      status: "completed" as TransactionStatus,
      user_id: user.id,
      description: formData.get("description")?.toString() || null,
    };

    const { error } = await supabase
      .from("transactions")
      .insert(transaction);

    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
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
          />
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">Add Transaction</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
