
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionParty, Category, Transaction, TransactionStatus } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useTransactionData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: parties = [], error: partiesError } = useQuery({
    queryKey: ["transaction-parties"],
    queryFn: async () => {
      console.log("Fetching transaction parties...");
      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*");
      
      if (error) {
        console.error("Error fetching parties:", error);
        toast({
          title: "Error fetching parties",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log("No transaction parties found");
      } else {
        console.log("Successfully fetched parties:", data);
      }
      
      return data as TransactionParty[];
    },
  });

  const { data: categories = [], error: categoriesError } = useQuery({
    queryKey: ["transaction-categories"],
    queryFn: async () => {
      console.log("Fetching transaction categories...");
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*");
      
      if (error) {
        console.error("Error fetching categories:", error);
        toast({
          title: "Error fetching categories",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No transaction categories found");
      } else {
        console.log("Successfully fetched categories:", data);
      }
      
      return data as Category[];
    },
  });

  // Let's add a direct transaction fetcher for debugging purposes
  const fetchTransactions = async () => {
    console.log("Directly fetching transactions for debugging...");
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });
      
      if (error) {
        console.error("Debug fetch error:", error);
        return [];
      }
      
      console.log("Debug fetch found transactions:", data?.length || 0);
      if (data && data.length > 0) {
        console.log("Sample transaction:", data[0]);
      }
      
      return data;
    } catch (err) {
      console.error("Exception in debug fetch:", err);
      return [];
    }
  };

  // Call it immediately for debugging
  fetchTransactions();

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TransactionStatus }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status })
        .eq("id", id);

      if (error) {
        toast({
          title: "Error updating status",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Status updated",
        description: "Transaction status has been updated successfully.",
      });
    },
  });

  const updateVATSettingsMutation = useMutation({
    mutationFn: async ({ 
      id, 
      vat_clearable, 
      description 
    }: { 
      id: string; 
      vat_clearable: boolean;
      description?: string | null;
    }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ 
          vat_clearable, 
          description 
        })
        .eq("id", id);

      if (error) {
        toast({
          title: "Error updating VAT settings",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["vat-summary"] });
      toast({
        title: "VAT settings updated",
        description: "Transaction VAT settings have been updated successfully.",
      });
    },
  });

  const deleteTransactionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", ids);

      if (error) {
        toast({
          title: "Error deleting transactions",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      toast({
        title: "Transactions deleted",
        description: "Selected transactions have been deleted successfully.",
      });
    },
  });

  return {
    parties,
    categories,
    partiesError,
    categoriesError,
    updateStatusMutation,
    updateVATSettingsMutation,
    deleteTransactionsMutation,
  };
};
