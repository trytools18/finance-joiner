
import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Edit, Trash2 } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { RecurringTransactionDialog } from './RecurringTransactionDialog';
import { useToast } from '@/hooks/use-toast';

interface RecurringTransactionsTableProps {
  currencyCode?: string;
}

interface RecurringTransaction {
  id: string;
  name: string;
  amount: number;
  frequency: string;
  next_date: string;
  type: 'income' | 'expense';
  payment_method: string;
  category_id: string | null;
}

export function RecurringTransactionsTable({ currencyCode = 'USD' }: RecurringTransactionsTableProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const { toast } = useToast();

  const { data: recurringTransactions = [], isLoading, refetch } = useQuery({
    queryKey: ['recurring-transactions'],
    queryFn: async () => {
      try {
        // Use a direct function call rather than the edge function that's failing
        const { data, error } = await supabase
          .from('recurring_transactions')
          .select('*')
          .order('next_date', { ascending: true });
          
        if (error) throw error;
        console.log("Recurring transactions:", data);
        return data as RecurringTransaction[];
      } catch (err) {
        console.error("Error fetching recurring transactions:", err);
        // Display friendly error message with fallback for non-existent table
        toast({
          title: "Couldn't load recurring transactions",
          description: "Please make sure you're logged in and try again.",
          variant: "destructive"
        });
        return [];
      }
    }
  });

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', selectedTransaction.id);
        
      if (error) throw error;
      
      toast({
        title: "Recurring transaction deleted",
        description: "The recurring transaction has been deleted successfully."
      });
      
      setDeleteDialogOpen(false);
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete recurring transaction. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEditClick = (transaction: RecurringTransaction) => {
    setSelectedTransaction(transaction);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (transaction: RecurringTransaction) => {
    setSelectedTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center py-8">Loading recurring transactions...</div>;
  }

  return (
    <>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the recurring transaction permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedTransaction && (
        <RecurringTransactionDialog
          isOpen={editDialogOpen}
          setIsOpen={setEditDialogOpen}
          transactionToEdit={selectedTransaction}
          onSuccess={() => {
            setEditDialogOpen(false);
            refetch();
          }}
        />
      )}

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Date</TableHead>
              <TableHead>Payment Method</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recurringTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                  No recurring transactions found
                </TableCell>
              </TableRow>
            ) : (
              recurringTransactions.map(transaction => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.name}</TableCell>
                  <TableCell>
                    <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                      {transaction.type === 'income' ? '+' : '-'} {formatCurrency(Math.abs(transaction.amount), currencyCode)}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{transaction.type}</TableCell>
                  <TableCell className="capitalize">{transaction.frequency}</TableCell>
                  <TableCell>{new Date(transaction.next_date).toLocaleDateString()}</TableCell>
                  <TableCell className="capitalize">{transaction.payment_method}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(transaction)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(transaction)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
