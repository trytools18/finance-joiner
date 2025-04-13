
// This file contains functions for managing recurring transactions

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Create a function to handle recurring transaction operations
serve(async (req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const { action, data } = await req.json();

    if (action === 'get_recurring_transactions') {
      // Fetch recurring transactions from the transactions table with special query
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .not('recurring_transaction_id', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Process and group the transactions to represent recurring transaction patterns
      const groupedTransactions = transactions.reduce((acc, transaction) => {
        const id = transaction.recurring_transaction_id;
        if (!acc[id]) {
          acc[id] = {
            id,
            name: transaction.description || 'Recurring Transaction',
            type: transaction.type,
            category_id: transaction.category_id,
            amount: transaction.amount,
            vat: transaction.vat || 0,
            vat_amount: transaction.vat_amount || 0,
            vat_clearable: transaction.vat_clearable || false,
            total_amount: transaction.total_amount || transaction.amount,
            party: transaction.party,
            payment_method: transaction.payment_method,
            description: transaction.description,
            start_date: transaction.date,
            user_id: transaction.user_id,
            status: 'active',
            created_at: transaction.created_at,
            updated_at: transaction.updated_at,
            instances: []
          };
        }
        
        acc[id].instances.push(transaction);
        return acc;
      }, {});
      
      // Convert to array
      const recurringTransactions = Object.values(groupedTransactions);

      return new Response(JSON.stringify({ data: recurringTransactions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    if (action === 'create_recurring_transaction') {
      const { transactions, pattern } = data;
      
      // Store the recurring transaction pattern as metadata on the first transaction
      const firstTransaction = transactions[0];
      firstTransaction.description = pattern.name || firstTransaction.description;
      firstTransaction.recurring_pattern = JSON.stringify(pattern);
      
      // Insert the first transaction
      const { data: createdTransaction, error: firstError } = await supabase
        .from('transactions')
        .insert(firstTransaction)
        .select()
        .single();
        
      if (firstError) throw firstError;
      
      // Use the first transaction's ID as the recurring_transaction_id for all subsequent transactions
      const recurringId = createdTransaction.id;
      
      // Insert the remaining transactions with recurring_transaction_id pointing to the first one
      if (transactions.length > 1) {
        const remainingTransactions = transactions.slice(1).map(t => ({
          ...t,
          recurring_transaction_id: recurringId
        }));
        
        const { error: batchError } = await supabase
          .from('transactions')
          .insert(remainingTransactions);
          
        if (batchError) throw batchError;
      }
      
      return new Response(JSON.stringify({ data: recurringId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    if (action === 'delete_recurring_transaction') {
      const { recurring_id } = data;
      
      // Delete all transactions with this recurring_transaction_id
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('recurring_transaction_id', recurring_id);
        
      // Also delete the transaction that serves as the pattern
      const { error: patternError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', recurring_id);

      if (error || patternError) throw error || patternError;
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
