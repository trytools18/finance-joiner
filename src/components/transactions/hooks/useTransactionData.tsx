
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionParty, Category, Transaction, TransactionStatus } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useAuthReady } from "@/hooks/useAuthReady";

export const useTransactionData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { userId, isReady } = useAuthReady();

  console.log("useTransactionData: Starting with user:", userId);

  const { data: parties = [], isLoading: partiesLoading, error: partiesError } = useQuery({
    queryKey: ["transaction-parties", userId],
    enabled: isReady && !!userId,
    retry: 1,
    queryFn: async () => {
      console.log("Parties Query - Running for:", userId);
      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*")
        .eq("user_id", userId as string)
        .order("name");
      if (error) throw error;
      return data as TransactionParty[];
    },
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["transaction-categories", userId],
    enabled: isReady && !!userId,
    retry: 1,
    queryFn: async () => {
      console.log("Categories Query - Running for:", userId);
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .eq("user_id", userId as string)
        .order("name");
      if (error) throw error;
      return data as Category[];
    },
  });

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["transactions", userId],
    enabled: isReady && !!userId,
    retry: 1,
    queryFn: async () => {
      console.log("Transactions Query - Running for:", userId);
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId as string)
        .order("date", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
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
         .eq("user_id", userId as string);

      if (error) throw error;
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
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
         .eq("user_id", userId as string);

      if (error) throw error;
    },
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
       queryClient.invalidateQueries({ queryKey: ["vat-summary", userId] });
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
        .eq("user_id", userId as string);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
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
