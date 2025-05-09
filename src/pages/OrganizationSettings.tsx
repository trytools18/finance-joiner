
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ProfileMenu } from "@/components/profile/ProfileMenu";
import { BasicSettingsFields } from "./organization-settings/BasicSettingsFields";
import { VATRatesSection } from "./organization-settings/VATRatesSection";
import { TransactionPartiesSection } from "./organization-settings/TransactionPartiesSection";
import { TransactionCategoriesSection } from "./organization-settings/TransactionCategoriesSection";
import { 
  DEFAULT_VAT_RATES, 
  formSchema, 
  type FormValues,
  type OrganizationSettings 
} from "./organization-settings/types";

export default function OrganizationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["organization-settings", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No user found");

      const { data, error } = await supabase
        .from("organization_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        const defaultSettings: OrganizationSettings = {
          user_id: user.id,
          default_currency: "USD",
          default_payment_method: "online",
          fiscal_year_start: format(new Date(), "yyyy-MM-dd"),
          default_vat_rate: 0.24,
          vat_rates: DEFAULT_VAT_RATES,
        };

        const { data: newData, error: insertError } = await supabase
          .from("organization_settings")
          .insert(defaultSettings)
          .select()
          .single();

        if (insertError) throw insertError;
        return newData;
      }

      return data;
    },
    enabled: !!user?.id,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      default_currency: "USD",
      default_payment_method: "online",
      fiscal_year_start: new Date(),
      default_vat_rate: 0.24,
      vat_rates: DEFAULT_VAT_RATES,
    },
  });

  useEffect(() => {
    if (settings) {
      try {
        // Safely parse the date string into a valid Date object
        let fiscalYearDate: Date;
        
        try {
          fiscalYearDate = settings.fiscal_year_start 
            ? new Date(settings.fiscal_year_start) 
            : new Date();
            
          // Additional validation to ensure it's a valid date
          if (isNaN(fiscalYearDate.getTime())) {
            console.warn("Invalid fiscal_year_start date:", settings.fiscal_year_start);
            fiscalYearDate = new Date(); // Fallback to current date
          }
        } catch (e) {
          console.error("Error parsing fiscal_year_start:", e);
          fiscalYearDate = new Date(); // Fallback to current date
        }

        form.reset({
          default_currency: settings.default_currency,
          default_payment_method: settings.default_payment_method,
          fiscal_year_start: fiscalYearDate,
          default_vat_rate: settings.default_vat_rate,
          vat_rates: Array.isArray(settings.vat_rates) 
            ? settings.vat_rates.map(Number)
            : DEFAULT_VAT_RATES,
        });
      } catch (error) {
        console.error("Error setting form values:", error);
        toast({
          title: "Error",
          description: "Failed to load settings. Using default values.",
          variant: "destructive",
        });
      }
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user?.id) throw new Error("No user found");

      const { error } = await supabase
        .from("organization_settings")
        .upsert({
          user_id: user.id,
          default_currency: values.default_currency,
          default_payment_method: values.default_payment_method,
          fiscal_year_start: format(values.fiscal_year_start, "yyyy-MM-dd"),
          default_vat_rate: values.default_vat_rate,
          vat_rates: values.vat_rates,
        }, {
          onConflict: 'user_id'
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-settings", user?.id] });
      toast({
        title: "Settings saved",
        description: "Your organization settings have been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="border-b">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="hover:opacity-70">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-xl font-semibold">Organization Settings</h1>
          </div>
          <ProfileMenu />
        </div>
      </div>

      <div className="container mx-auto p-6 max-w-2xl">
        <Tabs defaultValue="basic" className="space-y-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="basic">Basic Settings</TabsTrigger>
            <TabsTrigger value="parties">Transaction Parties</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <BasicSettingsFields />
                <VATRatesSection />
                <Button type="submit" className="w-full">
                  Save Settings
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="parties">
            <TransactionPartiesSection />
          </TabsContent>

          <TabsContent value="categories">
            <TransactionCategoriesSection />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
