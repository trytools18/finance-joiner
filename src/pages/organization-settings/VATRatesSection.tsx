
import { useState } from "react";
import { useForm, useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
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
import { useToast } from "@/components/ui/use-toast";
import type { FormValues } from "./types";

export function VATRatesSection() {
  const { toast } = useToast();
  const [customVatRate, setCustomVatRate] = useState("");
  const form = useFormContext<FormValues>();

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

  return (
    <>
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
    </>
  );
}
