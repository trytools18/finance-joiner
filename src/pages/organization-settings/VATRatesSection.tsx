import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { FormValues } from "./types";
export function VATRatesSection() {
  const {
    toast
  } = useToast();
  const [customVatRate, setCustomVatRate] = useState("");
  const form = useFormContext<FormValues>();
  const handleAddCustomVatRate = () => {
    const rate = parseFloat(customVatRate) / 100;
    if (isNaN(rate) || rate < 0 || rate > 1) {
      toast({
        title: "Invalid VAT rate",
        description: "Please enter a valid percentage between 0 and 100",
        variant: "destructive"
      });
      return;
    }
    const currentRates = form.getValues("vat_rates");
    if (!currentRates.includes(rate)) {
      form.setValue("vat_rates", [...currentRates, rate].sort((a, b) => a - b));
      setCustomVatRate("");
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddCustomVatRate();
    }
  };
  return <>
      <FormField control={form.control} name="default_vat_rate" render={({
      field
    }) => <FormItem>
            <FormLabel>Default VAT Rate</FormLabel>
            <Select onValueChange={value => field.onChange(parseFloat(value))} value={field.value.toString()}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Select VAT rate" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Available VAT Rates</SelectLabel>
                  {form.watch("vat_rates").map(rate => <SelectItem key={rate} value={rate.toString()}>
                      {(rate * 100).toFixed(0)}%
                    </SelectItem>)}
                  <SelectSeparator />
                  <div className="flex items-center gap-2 px-2 py-1.5">
                    <Input type="number" placeholder="Add new rate (%)" value={customVatRate} onChange={e => setCustomVatRate(e.target.value)} onKeyPress={handleKeyPress} min="0" max="100" className="h-8" />
                    <Plus className="h-4 w-4 shrink-0 cursor-pointer text-muted-foreground hover:text-foreground" onClick={handleAddCustomVatRate} />
                  </div>
                </SelectGroup>
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>} />

      
    </>;
}
