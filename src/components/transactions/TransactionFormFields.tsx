
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { useState, useEffect } from "react";
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
  const [selectedType, setSelectedType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState<string>('');
  const [vatRate, setVatRate] = useState<string>(defaultVatRate.toString());
  const [isVatClearable, setIsVatClearable] = useState<boolean>(true);
  const [totalAmount, setTotalAmount] = useState<string>('');

  const filteredCategories = categories.filter(category => category.type === selectedType);

  // Calculate total amount whenever amount, vatRate, or isVatClearable changes
  useEffect(() => {
    if (!amount) {
      setTotalAmount('');
      return;
    }

    const amountValue = parseFloat(amount);
    const vatRateValue = parseFloat(vatRate);
    
    if (isNaN(amountValue) || isNaN(vatRateValue)) {
      setTotalAmount('');
      return;
    }

    const vatAmount = amountValue * vatRateValue;
    
    // For expense transactions with non-clearable VAT, add VAT to the total
    if (selectedType === 'expense' && !isVatClearable) {
      setTotalAmount((amountValue + vatAmount).toFixed(2));
    } else {
      setTotalAmount(amountValue.toFixed(2));
    }
  }, [amount, vatRate, isVatClearable, selectedType]);

  return (
    <>
      <div className="space-y-2">
        <Label>Type</Label>
        <Select 
          name="type" 
          value={selectedType} 
          onValueChange={(value: 'income' | 'expense') => setSelectedType(value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Category</Label>
        <Select name="category" required>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {filteredCategories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
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
        <Label>Amount (net)</Label>
        <Input 
          type="number" 
          step="0.01" 
          name="amount" 
          value={amount}
          onChange={(e) => setAmount(e.target.value)} 
          required 
        />
      </div>

      <div className="space-y-2">
        <Label>VAT Rate</Label>
        <Select 
          name="vat" 
          value={vatRate}
          onValueChange={setVatRate}
          defaultValue={defaultVatRate.toString()}
        >
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

      {selectedType === 'expense' && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            name="vat_clearable" 
            id="vat_clearable"
            checked={isVatClearable}
            onCheckedChange={(checked) => setIsVatClearable(checked as boolean)}
          />
          <Label htmlFor="vat_clearable">VAT clearable with income VAT</Label>
        </div>
      )}

      {amount && vatRate && (
        <div className="p-3 border rounded-md bg-muted/50">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Net Amount:</div>
            <div className="text-right font-medium">{parseFloat(amount).toFixed(2)}</div>
            
            <div>VAT ({(parseFloat(vatRate) * 100).toFixed(0)}%):</div>
            <div className="text-right font-medium">
              {(parseFloat(amount) * parseFloat(vatRate)).toFixed(2)}
            </div>
            
            <div className="font-semibold">Total:</div>
            <div className="text-right font-semibold">{totalAmount}</div>
            
            {selectedType === 'expense' && (
              <div className="col-span-2 text-xs text-muted-foreground pt-1">
                {isVatClearable 
                  ? "VAT will be recorded for tax clearance" 
                  : "VAT is included in the total amount as a cost"}
              </div>
            )}
          </div>
        </div>
      )}

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

      <input 
        type="hidden" 
        name="total_amount" 
        value={totalAmount || amount} 
      />
    </>
  );
}
