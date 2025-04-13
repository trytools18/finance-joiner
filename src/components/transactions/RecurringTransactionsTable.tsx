
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Edit, Trash2, RefreshCw, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RecurringTransaction, TransactionStatus, PaymentMethod } from "./types";

export function RecurringTransactionsTable({ 
  currencyCode = "USD"
}: {
  currencyCode?: "USD" | "EUR" | "GBP";
}) {
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: recurringTransactions = [], isLoading } = useQuery({
    queryKey: ["recurring-transactions"],
    queryFn: async () => {
      // Use the edge function to get recurring transactions
      const { data, error } = await supabase.functions.invoke('recurring_transactions', {
        body: { action: 'get_recurring_transactions' }
      });

      if (error) throw error;
      return (data?.data || []) as RecurringTransaction[];
    },
  });

  const handleDelete = async () => {
    if (!selectedRecurring) return;

    try {
      // Use the edge function to delete the recurring transaction and its instances
      const { error } = await supabase.functions.invoke('recurring_transactions', {
        body: { 
          action: 'delete_recurring_transaction',
          data: { recurring_id: selectedRecurring.id }
        }
      });

      if (error) throw error;

      toast({
        title: "Recurring transaction deleted",
        description: "The recurring transaction and all future occurrences have been deleted."
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      setConfirmDeleteOpen(false);
    } catch (error: any) {
      toast({
        title: "Error deleting recurring transaction",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleRegenerate = async () => {
    if (!selectedRecurring) return;

    try {
      // First, delete all future instances
      const { error: deleteError } = await supabase.functions.invoke('recurring_transactions', {
        body: { 
          action: 'delete_recurring_transaction',
          data: { recurring_id: selectedRecurring.id }
        }
      });

      if (deleteError) throw deleteError;

      // Generate new transactions based on the pattern
      const { interval, recurrence_type } = selectedRecurring;
      const startDate = new Date(); // Use current date as the new start
      const occurrences = 12; // Default to 12 occurrences
      const transactions = [];

      for (let i = 0; i < occurrences; i++) {
        let nextDate = new Date(startDate);
        
        if (recurrence_type === "daily") {
          nextDate.setDate(startDate.getDate() + (i * interval));
        } else if (recurrence_type === "weekly") {
          nextDate.setDate(startDate.getDate() + (i * interval * 7));
        } else if (recurrence_type === "monthly") {
          nextDate.setMonth(startDate.getMonth() + (i * interval));
        } else if (recurrence_type === "yearly") {
          nextDate.setFullYear(startDate.getFullYear() + (i * interval));
        }

        const transaction = {
          date: nextDate.toISOString(),
          type: selectedRecurring.type,
          category_id: selectedRecurring.category_id,
          amount: selectedRecurring.amount,
          vat: selectedRecurring.vat,
          vat_amount: selectedRecurring.vat_amount,
          vat_clearable: selectedRecurring.vat_clearable,
          total_amount: selectedRecurring.total_amount,
          party: selectedRecurring.party,
          payment_method: selectedRecurring.payment_method,
          status: "pending" as TransactionStatus,
          user_id: selectedRecurring.user_id,
          description: selectedRecurring.description
        };

        transactions.push(transaction);
      }

      // Create new recurring pattern with transactions
      await supabase.functions.invoke('recurring_transactions', {
        body: { 
          action: 'create_recurring_transaction',
          data: {
            transactions,
            pattern: selectedRecurring
          }
        }
      });

      toast({
        title: "Recurring transactions regenerated",
        description: `Successfully generated ${occurrences} new occurrences.`,
      });

      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["recurring-transactions"] });
      setConfirmRegenerateOpen(false);
    } catch (error: any) {
      toast({
        title: "Error regenerating transactions",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return <div>Loading recurring transactions...</div>;
  }

  return (
    <div className="space-y-4">
      {recurringTransactions.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No recurring transactions found. Create a recurring transaction to automatically generate future transactions.
          </AlertDescription>
        </Alert>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Pattern</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurringTransactions.map((recurring) => (
              <TableRow key={recurring.id}>
                <TableCell className="font-medium">{recurring.name}</TableCell>
                <TableCell>
                  {recurring.interval} {recurring.recurrence_type}
                  {recurring.interval > 1 ? '(s)' : ''}
                </TableCell>
                <TableCell>
                  <span className={recurring.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                    {recurring.type === 'income' ? '+' : '-'} {formatCurrency(recurring.total_amount || recurring.amount, currencyCode)}
                  </span>
                </TableCell>
                <TableCell>{format(new Date(recurring.start_date), 'PP')}</TableCell>
                <TableCell>
                  <Badge variant={recurring.status === 'active' ? 'default' : 'secondary'}>
                    {recurring.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedRecurring(recurring);
                        setConfirmRegenerateOpen(true);
                      }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => {
                        setSelectedRecurring(recurring);
                        setConfirmDeleteOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recurring Transaction</DialogTitle>
            <DialogDescription>
              This will delete the recurring transaction pattern and all future transactions that haven't occurred yet. Past transactions will not be affected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate Confirmation Dialog */}
      <Dialog open={confirmRegenerateOpen} onOpenChange={setConfirmRegenerateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Regenerate Transactions</DialogTitle>
            <DialogDescription>
              This will delete all future pending transactions and generate a new set of 12 transactions from today. Are you sure you want to continue?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRegenerateOpen(false)}>Cancel</Button>
            <Button onClick={handleRegenerate}>Regenerate</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
