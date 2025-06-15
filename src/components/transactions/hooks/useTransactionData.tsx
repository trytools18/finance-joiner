
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TransactionParty, Category, Transaction, TransactionStatus } from "../types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export const useTransactionData = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: parties = [], isLoading: partiesLoading, error: partiesError } = useQuery({
    queryKey: ["transaction-parties", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("transaction_parties")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as TransactionParty[];
    },
    enabled: !!user?.id,
  });

  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useQuery({
    queryKey: ["transaction-categories", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("transaction_categories")
        .select("*")
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data as Category[];
    },
    enabled: !!user?.id,
  });

  const { data: transactions = [], isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user?.id,
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
    isLoading: partiesLoading || categoriesLoading || transactionsLoading,
    partiesError,
    categoriesError,
    transactionsError,
    updateStatusMutation,
    updateVATSettingsMutation,
    deleteTransactionsMutation,
  };
};
