import { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { FormValues } from "./types";

export function TransactionPartiesSection() {
  const { toast } = useToast();
  const form = useFormContext<FormValues>();
  const [newParty, setNewParty] = useState({ name: "", type: "customer", company_name: "" });
  const [partyList, setPartyList] = useState<Array<{ name: string; type: string; company_name: string }>>([]);

  // Load existing parties from form context on mount
  useEffect(() => {
    const existingParties = form.getValues("transaction_parties") || [];
    setPartyList(existingParties);
  }, [form]);

  // Update form context when partyList changes
  useEffect(() => {
    form.setValue("transaction_parties", partyList);
  }, [partyList, form]);

  const addParty = () => {
    if (newParty.name.trim()) {
      setPartyList([...partyList, { ...newParty }]);
      setNewParty({ name: "", type: "customer", company_name: "" });
    } else {
      toast({
        title: "Party name required",
        description: "Please enter a name for the transaction party",
        variant: "destructive",
      });
    }
  };

  const removeParty = (index: number) => {
    const updatedList = [...partyList];
    updatedList.splice(index, 1);
    setPartyList(updatedList);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Transaction Parties</h3>

      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2">
            <Input
              placeholder="Party name"
              value={newParty.name}
              onChange={(e) => setNewParty({ ...newParty, name: e.target.value })}
            />
          </div>
          <Select
            value={newParty.type}
            onValueChange={(value) => setNewParty({ ...newParty, type: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="vendor">Vendor</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Input
          placeholder="Company name (optional)"
          value={newParty.company_name}
          onChange={(e) => setNewParty({ ...newParty, company_name: e.target.value })}
        />

        <Button
          className="w-full"
          variant="outline"
          onClick={addParty}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Party
        </Button>
      </div>

      {partyList.length > 0 && (
        <div className="space-y-2 mt-2">
          <h4 className="text-sm font-medium">Added Parties:</h4>
          <div className="max-h-32 overflow-y-auto space-y-2">
            {partyList.map((party, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                <div>
                  <p className="font-medium">{party.name}</p>
                  {party.company_name && (
                    <p className="text-xs text-gray-500">{party.company_name}</p>
                  )}
                  <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                    {party.type}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParty(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
