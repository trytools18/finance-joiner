
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
      const { data: transactions, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ data: transactions }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    if (action === 'create_recurring_transaction') {
      const { data: transaction, error } = await supabase
        .from('recurring_transactions')
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ data: transaction.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }
    
    if (action === 'delete_recurring_transaction') {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', data.recurring_id);

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
