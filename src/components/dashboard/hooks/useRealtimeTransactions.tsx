
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Transaction } from "@/components/transactions/types";

export function useRealtimeTransactions(
  user: any, 
  transactions: Transaction[]
) {
  const [realtimeTransactions, setRealtimeTransactions] = useState<Transaction[]>([]);

  // Set up real-time subscription for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Real-time transaction update:', payload);
          
          // Update local state based on the change
          setRealtimeTransactions(currentTransactions => {
            const updatedTransactions = [...(currentTransactions.length ? currentTransactions : transactions)];
            
            if (payload.eventType === 'INSERT') {
              return [...updatedTransactions, payload.new as Transaction];
            } else if (payload.eventType === 'DELETE') {
              return updatedTransactions.filter(t => t.id !== payload.old.id);
            } else if (payload.eventType === 'UPDATE') {
              return updatedTransactions.map(t => 
                t.id === payload.new.id ? payload.new as Transaction : t
              );
            }
            return updatedTransactions;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, transactions]);

  // Use the real-time transactions if available, otherwise use the query data
  const currentTransactions = realtimeTransactions.length ? realtimeTransactions : transactions;

  return currentTransactions;
}
