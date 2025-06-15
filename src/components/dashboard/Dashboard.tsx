
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
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
import { RecurringTransactionDialog } from "../transactions/RecurringTransactionDialog";
import { CalendarDays, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { OrganizationSettings } from "../../pages/organization-settings/types";

export const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  console.log("Dashboard: Rendering with user:", user?.id);

  // Fetch organization settings
  const { data: settings, isLoading: isSettingsLoading, error: settingsError } = useQuery({
    queryKey: ["organization-settings", user?.id],
    queryFn: async () => {
      console.log("Dashboard: Fetching settings...");
      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("Settings fetch error:", error);
        throw error;
      }
      
      console.log("Dashboard: Settings fetched:", !!data);
      
      return data as OrganizationSettings || {
        default_currency: 'USD',
        default_payment_method: 'online',
        default_vat_rate: 0.24,
        vat_rates: [0, 10, 24]
      } as OrganizationSettings;
    },
    enabled: !!user?.id,
    retry: 1,
  });

  // Fetch transaction data
  const { 
    parties, 
    categories, 
    transactions, 
    isLoading: isDataLoading, 
    hasError: dataError
  } = useTransactionData();

  // Helper functions for filtering
  const getPartyName = (partyId: string | null): string => {
    if (!partyId) return 'Unknown';
    const party = parties.find(p => p.id === partyId);
    return party ? party.name : 'Unknown';
  };

  const getCategoryName = (transaction: any): string => {
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
  } = useTransactionFilters(transactions || [], getPartyName, getCategoryName);

  // Use stats calculation hook
  const stats = useTransactionStats(filteredTransactions || []);

  const isLoading = isSettingsLoading || isDataLoading;

  console.log("Dashboard: Final loading state:", {
    isSettingsLoading,
    isDataLoading,
    totalLoading: isLoading,
    settingsError: !!settingsError,
    dataError: !!dataError,
    transactionsCount: transactions?.length || 0
  });

  // Show loading screen
  if (isLoading) {
    console.log("Dashboard: Showing loading screen");
    return <DashboardLoading />;
  }

  // Show error if there are data errors
  if (dataError || settingsError) {
    console.error("Dashboard: Showing error state");
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Error loading data. Please try refreshing the page.
            {settingsError && <div>Settings: {settingsError.message}</div>}
            {dataError && <div>Data: Error loading transaction data</div>}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  console.log("Dashboard: Rendering main content");

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
        transactions={transactions || []}
        filteredTransactions={filteredTransactions || []}
        dateRange={dateRange}
        currencyCode={settings?.default_currency || 'USD'}
      />

      {/* Transactions Section */}
      <TransactionsSection 
        filteredTransactions={filteredTransactions || []}
        currencyCode={settings?.default_currency || 'USD'}
        isLoading={false}
      />
    </div>
  );
};
