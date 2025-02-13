
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { Link } from "react-router-dom";
import { ProfileMenu } from "@/components/profile/ProfileMenu";

const DEFAULT_VAT_RATES = [0.06, 0.13, 0.24];

const formSchema = z.object({
  default_currency: z.enum(["USD", "EUR", "GBP"]),
  default_payment_method: z.enum(["cash", "card", "online"]),
  fiscal_year_start: z.date(),
  default_vat_rate: z.number().min(0).max(1),
  vat_rates: z.array(z.number()).default([]),
});

type FormValues = z.infer<typeof formSchema>;

type OrganizationSettings = {
  user_id: string;
  default_currency: "USD" | "EUR" | "GBP";
  default_payment_method: "cash" | "card" | "online";
  fiscal_year_start: string;
  default_vat_rate: number;
  vat_rates: Json;
};

export default function OrganizationSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [customVatRate, setCustomVatRate] = useState("");

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

  const handleAddCustomVatRate = () => {
    const rate = parseFloat(customVatRate) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast({
        title: "Invalid VAT rate",
        description: "Please enter a valid percentage between 0 and 100",
        variant: "destructive",
      });
      return;
    }
    
    const currentRates = form.getValues("vat_rates");
    if (!currentRates.includes(rate)) {
      form.setValue("vat_rates", [...currentRates, rate].sort((a, b) => a - b));
      setCustomVatRate("");
    }
  };

  useEffect(() => {
    if (settings) {
      form.reset({
        default_currency: settings.default_currency,
        default_payment_method: settings.default_payment_method,
        fiscal_year_start: new Date(settings.fiscal_year_start),
        default_vat_rate: settings.default_vat_rate,
        vat_rates: Array.isArray(settings.vat_rates) 
          ? settings.vat_rates.map(Number)
          : DEFAULT_VAT_RATES,
      });
    }
  }, [settings, form]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      if (!user?.id) throw new Error("No user found");

      const { error } = await supabase
        .from("organization_settings")
        .upsert({
          ...values,
          fiscal_year_start: format(values.fiscal_year_start, "yyyy-MM-dd"),
          user_id: user.id,
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
    onError: () => {
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="default_currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Currency</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="fiscal_year_start"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fiscal Year Start</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="default_vat_rate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default VAT Rate</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseFloat(value))}
                    value={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select VAT rate" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {form.watch("vat_rates").map((rate) => (
                        <SelectItem key={rate} value={rate.toString()}>
                          {(rate * 100).toFixed(0)}%
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <FormLabel>Custom VAT Rates</FormLabel>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Add new VAT rate (%)"
                  value={customVatRate}
                  onChange={(e) => setCustomVatRate(e.target.value)}
                  min="0"
                  max="100"
                />
                <Button type="button" onClick={handleAddCustomVatRate}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {form.watch("vat_rates").map((rate) => (
                  <div
                    key={rate}
                    className="bg-secondary text-secondary-foreground px-3 py-1 rounded-md text-sm"
                  >
                    {(rate * 100).toFixed(0)}%
                  </div>
                ))}
              </div>
            </div>

            <Button type="submit" className="w-full">
              Save Settings
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
