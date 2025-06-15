
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionParty, Category, Transaction, TransactionStatus } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useTransactionData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  console.log("useTransactionData: Starting with user:", user?.id);

  const { data: parties = [], isLoading: partiesLoading, error: partiesError } = useQuery({
    queryKey: ["transaction-parties", user?.id],
    queryFn: async () => {
      console.log("Fetching parties for user:", user?.id);
      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      
      if (error) {
        console.error("Parties fetch error:", error);
        throw error;
      }
      console.log("Parties fetched successfully:", data?.length || 0);
      return data as TransactionParty[];
    },
    enabled: !!user?.id,
    retry: 1,
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["transaction-categories", user?.id],
    queryFn: async () => {
      console.log("Fetching categories for user:", user?.id);
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .eq("user_id", user!.id)
        .order("name");
      
      if (error) {
        console.error("Categories fetch error:", error);
        throw error;
      }
      console.log("Categories fetched successfully:", data?.length || 0);
      return data as Category[];
    },
    enabled: !!user?.id,
    retry: 1,
  });

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      console.log("Fetching transactions for user:", user?.id);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user!.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Transactions fetch error:", error);
        throw error;
      }
      console.log("Transactions fetched successfully:", data?.length || 0);
      return data as Transaction[];
    },
    enabled: !!user?.id,
    retry: 1,
  });

  const isLoading = partiesLoading || categoriesLoading || transactionsLoading;
  const hasError = partiesError || categoriesError || transactionsError;

  console.log("useTransactionData: Final state:", {
    isLoading,
    hasError: !!hasError,
    partiesCount: parties.length,
    categoriesCount: categories.length,
    transactionsCount: transactions.length
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TransactionStatus }) => {
      const { error } = await supabase
        .from("transactions")
        .update({ status })
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      toast({
        title: "Status updated",
        description: "Transaction status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive",
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
        .eq("id", id)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["vat-summary", user?.id] });
      toast({
        title: "VAT settings updated",
        description: "Transaction VAT settings have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error updating VAT settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransactionsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("transactions")
        .delete()
        .in("id", ids)
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      toast({
        title: "Transactions deleted",
        description: "Selected transactions have been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting transactions",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    parties,
    categories,
    transactions,
    isLoading,
    hasError,
    partiesError,
    categoriesError,
    transactionsError,
    updateStatusMutation,
    updateVATSettingsMutation,
    deleteTransactionsMutation,
  };
};
