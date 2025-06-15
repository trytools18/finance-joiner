import { useState, useEffect } from "react";
import { CalendarPlus, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionFormFields } from "./TransactionFormFields";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TransactionParty, Category, PaymentMethod, Transaction, TransactionStatus, RecurrenceType, RecurringTransactionStatus, RecurringTransactionDialogProps } from "./types";

export function RecurringTransactionDialog({
  defaultPaymentMethod = "online",
  defaultVatRate = 0.24,
  vatRates = [0.24, 0.14, 0.10, 0],
  defaultCurrency = "USD",
  isOpen,
  onOpenChange,
  transactionToEdit = null,
}: RecurringTransactionDialogProps) {
  // Use controlled or uncontrolled state based on props
  const [internalOpen, setInternalOpen] = useState(false);
  const open = isOpen !== undefined ? isOpen : internalOpen;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const [date, setDate] = useState<Date>(new Date());
  const [recurrenceType, setRecurrenceType] = useState<RecurrenceType>("monthly");
  const [intervalValue, setIntervalValue] = useState<string>("1");
  const [occurrences, setOccurrences] = useState<string>("12");
  const [parties, setParties] = useState<TransactionParty[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Fetch parties and categories
  useEffect(() => {
    const fetchData = async () => {
      // Fetch transaction parties
      const { data: partiesData, error: partiesError } = await supabase
        .from("transaction_parties")
        .select("*")
        .order("name");
      
      if (partiesError) {
        toast({
          title: "Error fetching parties",
          description: partiesError.message,
          variant: "destructive",
        });
      } else {
        setParties(partiesData as TransactionParty[]);
      }

      // Fetch transaction categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("transaction_categories")
        .select("*")
        .order("name");
      
      if (categoriesError) {
        toast({
          title: "Error fetching categories",
          description: categoriesError.message,
          variant: "destructive",
        });
      } else {
        setCategories(categoriesData as Category[]);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to create recurring transactions.",
        variant: "destructive",
      });
      return;
    }

    const categoryData = categories.find(c => c.id === formData.get("category"));
    if (!categoryData) {
      toast({
        title: "Error",
        description: "Please select a valid category.",
        variant: "destructive",
      });
      return;
    }

    // Get values from form
    const amount = Number(formData.get("amount"));
    const totalAmount = Number(formData.get("total_amount"));
    const vatRate = Number(formData.get("vat"));
    const vatClearable = categoryData.type === 'expense' ? formData.get("vat_clearable") === 'on' : false;
    const vatAmount = amount * vatRate;
    const intervalNum = parseInt(intervalValue, 10);
    const occurrencesNum = parseInt(occurrences, 10);
    
    // Fix the payment method type issue by ensuring it's a valid PaymentMethod type
    const paymentMethodValue = formData.get("payment_method")?.toString() || "online";
    // Validate that the payment method is one of the allowed values
    const paymentMethod = (["cash", "card", "online"].includes(paymentMethodValue) 
      ? paymentMethodValue 
      : "online") as PaymentMethod;
      
    const transactionDescription = formData.get("description")?.toString() || null;
    const name = formData.get("name")?.toString() || "Recurring Transaction";
    const partyId = formData.get("party")?.toString() || null;

    // Create recurring transaction pattern
    const pattern = {
      name,
      type: categoryData.type,
      category_id: categoryData.id,
      amount: amount,
      vat: vatRate,
      vat_amount: vatAmount,
      vat_clearable: vatClearable,
      total_amount: totalAmount,
      party: partyId,
      payment_method: paymentMethod,
      description: transactionDescription,
      recurrence_type: recurrenceType,
      interval: intervalNum,
      start_date: date.toISOString(),
      user_id: user.id,
      status: 'active' as RecurringTransactionStatus
    };

    try {
      // Generate the transactions based on the pattern
      const transactions = [];
      
      for (let i = 0; i < occurrencesNum; i++) {
        let nextDate = new Date(date);
        
        if (recurrenceType === "daily") {
          nextDate.setDate(nextDate.getDate() + (i * intervalNum));
        } else if (recurrenceType === "weekly") {
          nextDate.setDate(nextDate.getDate() + (i * intervalNum * 7));
        } else if (recurrenceType === "monthly") {
          nextDate.setMonth(nextDate.getMonth() + (i * intervalNum));
        } else if (recurrenceType === "yearly") {
          nextDate.setFullYear(nextDate.getFullYear() + (i * intervalNum));
        }

        const transaction = {
          date: nextDate.toISOString(),
          type: categoryData.type,
          category_id: categoryData.id,
          amount: amount,
          vat: vatRate,
          vat_amount: vatAmount,
          vat_clearable: vatClearable,
          total_amount: totalAmount,
          party: partyId,
          payment_method: paymentMethod,
          status: "pending" as TransactionStatus,
          user_id: user.id,
          description: transactionDescription
        };

        transactions.push(transaction);
      }

      // Use the edge function to create the recurring transaction pattern
      const { data: recurringData, error: recurringError } = await supabase.functions.invoke(
        'recurring_transactions', {
          body: { 
            action: 'create_recurring_transaction',
            data: {
              transactions,
              pattern
            }
          }
        }
      );
      
      if (recurringError) {
        throw recurringError;
      }

      toast({
        title: "Recurring transaction created",
        description: `Successfully created recurring transaction with ${occurrencesNum} occurrences.`,
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      handleOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error generating transactions",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {/* Show trigger only in uncontrolled mode */}
      {onOpenChange === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" className="ml-2">
            <CalendarPlus className="h-4 w-4 mr-2" />
            Recurring Transaction
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recurring Transaction</DialogTitle>
        </DialogHeader>
        
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This will create multiple future transactions that will appear with "pending" status. You can review and approve them later.
          </AlertDescription>
        </Alert>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input 
              name="name" 
              placeholder="Monthly Rent" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label>Recurrence Pattern</Label>
            <Select 
              name="recurrence_type" 
              value={recurrenceType}
              onValueChange={(value) => setRecurrenceType(value as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select recurrence pattern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Interval</Label>
              <Select 
                name="interval" 
                value={intervalValue}
                onValueChange={setIntervalValue}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Occurrences</Label>
              <Select 
                name="occurrences" 
                value={occurrences}
                onValueChange={setOccurrences}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Number of occurrences" />
                </SelectTrigger>
                <SelectContent>
                  {[3, 6, 12, 24, 36].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Use the existing TransactionFormFields component */}
          <TransactionFormFields
            date={date}
            setDate={setDate}
            categories={categories}
            parties={parties}
            defaultPaymentMethod={defaultPaymentMethod as PaymentMethod}
            defaultVatRate={defaultVatRate}
            vatRates={vatRates}
            transaction={null}
          />
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">
              Create Recurring Transactions
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
