
import { useState } from "react";
import { Helmet } from "react-helmet-async"; // Changed to react-helmet-async
import { Calendar, Plus } from "lucide-react";
import { RecurringTransactionDialog } from "../components/transactions/RecurringTransactionDialog";
import { RecurringTransactionsTable } from "../components/transactions/RecurringTransactionsTable";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";

export default function RecurringTransactions() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("recurring");

  const { data: settings } = useQuery({
    queryKey: ["organization-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return (
    <>
      <Helmet>
        <title>Recurring Transactions</title>
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Recurring Transactions</h1>
          <div className="flex items-center gap-2">
            <RecurringTransactionDialog
              defaultPaymentMethod={settings?.default_payment_method}
              defaultVatRate={settings?.default_vat_rate}
              vatRates={settings?.vat_rates as number[]}
              defaultCurrency={settings?.default_currency}
            />
            <ProfileMenu />
          </div>
        </div>

        <Alert className="bg-blue-50 border-blue-200">
          <InfoIcon className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700">
            Currently showing a preview of recent transactions. Full recurring transaction functionality coming soon.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="recurring">
              <Calendar className="mr-2 h-4 w-4" />
              Recurring Patterns
            </TabsTrigger>
            <TabsTrigger value="generated">
              <Plus className="mr-2 h-4 w-4" />
              Generated Transactions
            </TabsTrigger>
          </TabsList>
          <TabsContent value="recurring" className="mt-6">
            <RecurringTransactionsTable
              currencyCode={settings?.default_currency}
            />
          </TabsContent>
          <TabsContent value="generated" className="mt-6">
            <div className="text-center py-12 text-gray-500">
              Generated pending transactions will appear in your regular transactions list.
              <div className="mt-4">
                <Button variant="outline" onClick={() => window.location.href = "/"}>
                  Go to Transactions
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
