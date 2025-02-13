
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

export const DEFAULT_VAT_RATES = [0.06, 0.13, 0.24];

export const formSchema = z.object({
  default_currency: z.enum(["USD", "EUR", "GBP"]),
  default_payment_method: z.enum(["cash", "card", "online"]),
  fiscal_year_start: z.date(),
  default_vat_rate: z.number().min(0).max(1),
  vat_rates: z.array(z.number()).default([]),
});

export type FormValues = z.infer<typeof formSchema>;

export type OrganizationSettings = {
  user_id: string;
  default_currency: "USD" | "EUR" | "GBP";
  default_payment_method: "cash" | "card" | "online";
  fiscal_year_start: string;
  default_vat_rate: number;
  vat_rates: Json;
};
