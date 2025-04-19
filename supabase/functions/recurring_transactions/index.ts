
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
      // Here we're getting transactions that have recurrence metadata
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        // In real implementation, we'd filter by a recurring flag or metadata
        .order('date', { ascending: false })
        .limit(5); // Just demo data for now

      if (error) throw error;
      
      // Process these transactions to represent recurring patterns
      const recurringTransactions = transactions.map(transaction => ({
        id: transaction.id,
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
        frequency: 'monthly', // Default for now
        next_date: transaction.date,
        status: 'active',
      }));

      return new Response(JSON.stringify({ data: recurringTransactions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    if (action === 'create_recurring_transaction') {
      // For now, we'll just insert the transactions without special recurrence handling
      const { transactions } = data;
      
      // Insert the transactions
      const { data: createdTransactions, error } = await supabase
        .from('transactions')
        .insert(transactions)
        .select();
        
      if (error) throw error;
      
      return new Response(JSON.stringify({ data: createdTransactions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    if (action === 'delete_recurring_transaction') {
      const { transaction_id } = data;
      
      // Delete the transaction
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction_id);

      if (error) throw error;
      
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
