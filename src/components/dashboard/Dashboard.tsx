
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewTransactionDialog } from "@/components/transactions/NewTransactionDialog";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { DashboardLoading } from "./DashboardLoading";
import { useTransactionFilters } from "../transactions/hooks/useTransactionFilters";
import { useTransactionData } from "../transactions/hooks/useTransactionData";
import { TransactionFilters } from "../transactions/filters/TransactionFilters";
import { FinancialStatsCards } from "./stats/FinancialStatsCards";
import { ChartsSection } from "./sections/ChartsSection";
import { TransactionsSection } from "./sections/TransactionsSection";
import { useTransactionStats } from "./hooks/useTransactionStats";
import { useRealtimeTransactions } from "./hooks/useRealtimeTransactions";
import { RecurringTransactionDialog } from "../transactions/RecurringTransactionDialog";
import { CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { OrganizationSettings } from "../../pages/organization-settings/types";
import type { Transaction } from "../transactions/types";

export const Dashboard = () => {
  const { user } = useAuth();
  const { parties, categories } = useTransactionData();
  const navigate = useNavigate();

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["organization-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as OrganizationSettings;
    },
    enabled: !!user,
  });

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  // Use our real-time hook to get updated transactions
  const currentTransactions = useRealtimeTransactions(user, transactions);

  // Helper functions for filtering
  const getPartyName = (partyId: string | null): string => {
    if (!partyId) return 'Unknown';
    const party = parties.find(p => p.id === partyId);
    return party ? party.name : 'Unknown';
  };

  const getCategoryName = (transaction: Transaction): string => {
    if (!transaction.category_id) return 'Uncategorized';
    const category = categories.find(c => c.id === transaction.category_id);
    return category ? category.name : 'Uncategorized';
  };

  // Use transaction filters hook
  const {
    filteredTransactions,
    dateRange,
    setDateRange,
    transactionType,
    setTransactionType,
    searchTerm,
    setSearchTerm,
    clearFilters,
    hasActiveFilters
  } = useTransactionFilters(currentTransactions, getPartyName, getCategoryName);

  // Use our stats calculation hook
  const stats = useTransactionStats(filteredTransactions);

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, settings?.default_currency || 'USD');
  };

  const isLoading = isSettingsLoading || isTransactionsLoading;

  if (isLoading) {
    return <DashboardLoading />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <NewTransactionDialog 
            defaultPaymentMethod={settings?.default_payment_method}
            defaultVatRate={settings?.default_vat_rate}
            vatRates={settings?.vat_rates as number[]}
            defaultCurrency={settings?.default_currency}
          />
          <RecurringTransactionDialog 
            defaultPaymentMethod={settings?.default_payment_method}
            defaultVatRate={settings?.default_vat_rate}
            vatRates={settings?.vat_rates as number[]}
            defaultCurrency={settings?.default_currency}
          />
          <Button 
            variant="outline" 
            onClick={() => navigate('/recurring-transactions')}
            className="ml-2"
          >
            <CalendarDays className="h-4 w-4 mr-2" />
            Manage Recurring
          </Button>
          <ProfileMenu />
        </div>
      </div>
      
      {/* Transaction Filters */}
      <TransactionFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        transactionType={transactionType}
        setTransactionType={setTransactionType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        hasActiveFilters={hasActiveFilters}
        clearFilters={clearFilters}
      />
      
      {/* Financial Stats */}
      <FinancialStatsCards
        income={stats.income}
        expenses={stats.expenses}
        balance={stats.balance}
        currencyCode={settings?.default_currency || 'USD'}
      />

      {/* Charts Section */}
      <ChartsSection 
        transactions={currentTransactions}
        filteredTransactions={filteredTransactions}
        dateRange={dateRange}
        currencyCode={settings?.default_currency || 'USD'}
      />

      {/* Transactions Section */}
      <TransactionsSection 
        filteredTransactions={filteredTransactions}
        currencyCode={settings?.default_currency || 'USD'}
      />
    </div>
  );
};
