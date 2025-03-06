
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/utils";
import { Transaction } from "@/components/transactions/types";
import { TrendingUp, BarChart3, Wallet, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/stats/StatCard";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { NewTransactionDialog } from "@/components/transactions/NewTransactionDialog";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { VATTracker } from "@/components/transactions/VATTracker";
import { DashboardLoading } from "./DashboardLoading";
import { useTransactionFilters } from "../transactions/hooks/useTransactionFilters";
import { useTransactionData } from "../transactions/hooks/useTransactionData";
import { TransactionFilters } from "../transactions/filters/TransactionFilters";
import { TransactionTrends } from "./graphs/TransactionTrends";
import { ExpenseCategories } from "./graphs/ExpenseCategories";
import { IncomeCategories } from "./graphs/IncomeCategories";
import type { OrganizationSettings } from "../../pages/organization-settings/types";

export const Dashboard = () => {
  const { user } = useAuth();
  const { parties, categories } = useTransactionData();
  const [realtimeTransactions, setRealtimeTransactions] = useState<Transaction[]>([]);

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

  // Set up real-time subscription for transactions
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('transaction-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          console.log('Real-time transaction update:', payload);
          
          // Update local state based on the change
          setRealtimeTransactions(currentTransactions => {
            const updatedTransactions = [...(currentTransactions.length ? currentTransactions : transactions)];
            
            if (payload.eventType === 'INSERT') {
              return [...updatedTransactions, payload.new as Transaction];
            } else if (payload.eventType === 'DELETE') {
              return updatedTransactions.filter(t => t.id !== payload.old.id);
            } else if (payload.eventType === 'UPDATE') {
              return updatedTransactions.map(t => 
                t.id === payload.new.id ? payload.new as Transaction : t
              );
            }
            return updatedTransactions;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, transactions]);

  // Use the real-time transactions if available, otherwise use the query data
  const currentTransactions = realtimeTransactions.length ? realtimeTransactions : transactions;

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

  // Memoized statistics calculations
  const stats = useMemo(() => {
    const completedTransactions = filteredTransactions.filter(t => t.status === 'completed');

    const totalIncome = completedTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => {
        // Only use the net amount for income (without VAT)
        return sum + Number(t.amount || 0);
      }, 0);

    const totalExpenses = completedTransactions
      .filter(t => t.type === "expense")
      .reduce((sum, t) => {
        if (t.vat_clearable) {
          // If VAT is clearable, only count the net amount as expense
          return sum + Number(t.amount || 0);
        } else {
          // If VAT is not clearable, count total amount (net + VAT) as expense
          const amount = t.total_amount !== undefined && t.total_amount !== null
            ? t.total_amount
            : t.amount + (t.vat_amount || 0);
          return sum + Number(amount);
        }
      }, 0);

    // Calculate VAT statistics
    const vatReceived = completedTransactions
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + Number(t.vat_amount || 0), 0);

    const vatPaid = completedTransactions
      .filter(t => t.type === "expense" && t.vat_clearable === true)
      .reduce((sum, t) => sum + Number(t.vat_amount || 0), 0);

    return {
      balance: totalIncome - totalExpenses,
      income: totalIncome,
      expenses: totalExpenses,
      vatReceived,
      vatPaid,
      vatBalance: vatReceived - vatPaid
    };
  }, [filteredTransactions]);

  const formatAmount = (amount: number) => {
    return formatCurrency(amount, settings?.default_currency || 'USD');
  };

  const chartDateRange = useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return { start: dateRange.from, end: dateRange.to };
    }
    
    // Default to last 30 days if no date range is selected
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    
    return { start, end };
  }, [dateRange]);

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
      
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="Income"
          value={formatAmount(stats.income)}
          icon={TrendingUp}
          description="Total income from completed transactions"
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          title="Expenses"
          value={formatAmount(stats.expenses)}
          icon={BarChart3}
          description="Total expenses (incl. non-clearable VAT) from completed transactions"
          trend={{ value: 8.2, isPositive: false }}
        />
        <StatCard
          title="Balance"
          value={formatAmount(stats.balance)}
          icon={Wallet}
          description="Current balance (completed transactions)"
        />
      </div>

      {/* Transaction Trend Graph */}
      <div className="grid gap-4 md:grid-cols-3">
        <TransactionTrends 
          transactions={currentTransactions} 
          dateRange={chartDateRange}
          currencyCode={settings?.default_currency}
        />
      </div>

      {/* Category Distribution Graphs */}
      <div className="grid gap-4 md:grid-cols-2">
        <ExpenseCategories 
          transactions={filteredTransactions} 
          currencyCode={settings?.default_currency}
        />
        <IncomeCategories 
          transactions={filteredTransactions} 
          currencyCode={settings?.default_currency}
        />
      </div>

      {/* VAT Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
       <StatCard
          title="VAT Received"
          value={formatAmount(stats.vatReceived)}
          icon={CreditCard}
          description="Total VAT collected from completed sales"
        />
        <StatCard
          title="VAT Paid"
          value={formatAmount(stats.vatPaid)}
          icon={CreditCard}
          description="Total clearable VAT paid on completed purchases"
        />
        <StatCard
          title="VAT Balance"
          value={formatAmount(stats.vatBalance)}
          icon={CreditCard}
          description="Difference between VAT received and paid (completed transactions)"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recent Transactions</h2>
          <Button variant="outline" size="icon">
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
        <TransactionTable 
          transactions={filteredTransactions} 
          currencyCode={settings?.default_currency}
        />
      </div>
    </div>
  );
};
