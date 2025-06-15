
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionParty, Category, Transaction, TransactionStatus } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useTransactionData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  console.log("useTransactionData: user ID:", user?.id);

  const { data: parties = [], isLoading: partiesLoading, error: partiesError } = useQuery({
    queryKey: ["transaction-parties", user?.id],
    queryFn: async () => {
      console.log("Fetching parties for user:", user?.id);
      if (!user?.id) {
        console.log("No user ID, returning empty parties");
        return [];
      }

      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching parties:", error);
        throw error;
      }
      console.log("Fetched parties:", data?.length || 0);
      return data as TransactionParty[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["transaction-categories", user?.id],
    queryFn: async () => {
      console.log("Fetching categories for user:", user?.id);
      if (!user?.id) {
        console.log("No user ID, returning empty categories");
        return [];
      }

      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Error fetching categories:", error);
        throw error;
      }
      console.log("Fetched categories:", data?.length || 0);
      return data as Category[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
  });

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      console.log("Fetching transactions for user:", user?.id);
      if (!user?.id) {
        console.log("No user ID, returning empty transactions");
        return [];
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) {
        console.error("Error fetching transactions:", error);
        throw error;
      }
      console.log("Fetched transactions:", data?.length || 0);
      return data as Transaction[];
    },
    enabled: !!user?.id,
    staleTime: 30 * 1000, // 30 seconds
    retry: 3,
  });

  // Log all errors
  if (partiesError) console.error("Parties error:", partiesError);
  if (categoriesError) console.error("Categories error:", categoriesError);
  if (transactionsError) console.error("Transactions error:", transactionsError);

  const isLoading = partiesLoading || categoriesLoading || transactionsLoading;
  const hasError = partiesError || categoriesError || transactionsError;

  console.log("useTransactionData summary:", {
    user: !!user,
    userId: user?.id,
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
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["vat-summary"] });
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
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
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
