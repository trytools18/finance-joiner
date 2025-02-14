
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type TransactionCategory = "income" | "expense" | "transfer";
type PaymentMethod = "cash" | "card" | "online";
type TransactionStatus = "completed" | "pending" | "cancelled";

interface TransactionParty {
  id: string;
  name: string;
  type: string;
  company_name: string | null;
}

interface NewTransactionDialogProps {
  defaultPaymentMethod?: PaymentMethod;
  defaultVatRate?: number;
  vatRates?: number[];
  defaultCurrency?: "USD" | "EUR" | "GBP";
}

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    const transaction = {
      date: date.toISOString(),
      category: formData.get("category") as TransactionCategory,
      amount: Number(formData.get("amount")),
      vat: Number(formData.get("vat")?.toString().replace("%", "")) / 100,
      party: formData.get("party")?.toString() || null,
      payment_method: formData.get("payment_method") as PaymentMethod,
      status: "completed" as TransactionStatus,
      user_id: user.id,
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
          <div className="space-y-2">
            <Label>Type</Label>
            <Select name="category" required>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Transaction Party</Label>
            <Select name="party" required>
              <SelectTrigger>
                <SelectValue placeholder="Select a party" />
              </SelectTrigger>
              <SelectContent>
                {parties.map((party) => (
                  <SelectItem key={party.id} value={party.id}>
                    {party.name}
                    {party.company_name && ` (${party.company_name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" step="0.01" name="amount" required />
          </div>

          <div className="space-y-2">
            <Label>VAT Rate</Label>
            <Select name="vat" defaultValue={defaultVatRate.toString()}>
              <SelectTrigger>
                <SelectValue placeholder="Select VAT rate" />
              </SelectTrigger>
              <SelectContent>
                {vatRates.map((rate) => (
                  <SelectItem key={rate} value={rate.toString()}>
                    {(rate * 100).toFixed(0)}%
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox name="vat_clearable" id="vat_clearable" />
            <Label htmlFor="vat_clearable">VAT clearable with income VAT</Label>
          </div>

          <div className="space-y-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select name="payment_method" defaultValue={defaultPaymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
