
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Category, TransactionParty, PaymentMethod } from "./types";

interface TransactionFormFieldsProps {
  date: Date;
  setDate: (date: Date) => void;
  categories: Category[];
  parties: TransactionParty[];
  defaultPaymentMethod: PaymentMethod;
  defaultVatRate: number;
  vatRates: number[];
}

export function TransactionFormFields({
  date,
  setDate,
  categories,
  parties,
  defaultPaymentMethod,
  defaultVatRate,
  vatRates,
}: TransactionFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select name="category" required>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name} ({category.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea 
          name="description" 
          placeholder="Add a description (optional)"
          className="resize-none"
        />
      </div>

      <div className="space-y-2">
        <Label>Transaction Party</Label>
        <Select name="party" required>
          <SelectTrigger>
            <SelectValue placeholder="Select a party" />
          </SelectTrigger>
          <SelectContent>
            {parties.map((party) => (
              <SelectItem key={party.id} value={party.id}>
                {party.name}
                {party.company_name && ` (${party.company_name})`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Amount</Label>
        <Input type="number" step="0.01" name="amount" required />
      </div>

      <div className="space-y-2">
        <Label>VAT Rate</Label>
        <Select name="vat" defaultValue={defaultVatRate.toString()}>
          <SelectTrigger>
            <SelectValue placeholder="Select VAT rate" />
          </SelectTrigger>
          <SelectContent>
            {vatRates.map((rate) => (
              <SelectItem key={rate} value={rate.toString()}>
                {(rate * 100).toFixed(0)}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox name="vat_clearable" id="vat_clearable" />
        <Label htmlFor="vat_clearable">VAT clearable with income VAT</Label>
      </div>

      <div className="space-y-2">
        <Label>Date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date ? format(date, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={date}
              onSelect={(date) => date && setDate(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label>Payment Method</Label>
        <Select name="payment_method" defaultValue={defaultPaymentMethod}>
          <SelectTrigger>
            <SelectValue placeholder="Select payment method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="card">Card</SelectItem>
            <SelectItem value="cash">Cash</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
}
