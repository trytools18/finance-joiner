
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/types";
import { Plus, X } from "lucide-react";

const currencyOptions = [
  { label: "USD - US Dollar", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - British Pound", value: "GBP" },
];

const paymentMethodOptions = [
  { label: "Card", value: "card" },
  { label: "Cash", value: "cash" },
  { label: "Online", value: "online" },
];

const defaultVatRates = [0, 0.13, 0.24];

export default function Onboarding() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, completeOnboarding } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Business information
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("freelancer");
  
  // Settings
  const [currency, setCurrency] = useState<"USD" | "EUR" | "GBP">("USD");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState<"cash" | "card" | "online">("online");
  const [defaultVatRate, setDefaultVatRate] = useState(0.24);
  
  // Parties and Categories
  const [newParty, setNewParty] = useState({ name: "", type: "customer", company_name: "" });
  const [partyList, setPartyList] = useState<Array<{ name: string; type: string; company_name: string }>>([]);
  
  const [newCategory, setNewCategory] = useState({ name: "", type: "expense" });
  const [categoryList, setCategoryList] = useState<Array<{ name: string; type: string }>>([]);

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

  const addCategory = () => {
    if (newCategory.name.trim()) {
      setCategoryList([...categoryList, { ...newCategory }]);
      setNewCategory({ name: "", type: "expense" });
    } else {
      toast({
        title: "Category name required",
        description: "Please enter a name for the transaction category",
        variant: "destructive",
      });
    }
  };

  const removeCategory = (index: number) => {
    const updatedList = [...categoryList];
    updatedList.splice(index, 1);
    setCategoryList(updatedList);
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log("Starting onboarding submission for user:", user.id);
      
      // Check if user already has organization settings
      const { data: existingSettings, error: fetchError } = await supabase
        .from("organization_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing settings:", fetchError);
        throw fetchError;
      }

      console.log("Existing settings check:", existingSettings);

      // Cast the vat_rates array to Json type for Supabase
      const vatRatesJson = defaultVatRates as unknown as Json;
      
      if (existingSettings) {
        console.log("Updating existing settings with ID:", existingSettings.id);
        // Update existing settings
        const { error: updateError } = await supabase
          .from("organization_settings")
          .update({
            default_currency: currency,
            default_payment_method: defaultPaymentMethod,
            default_vat_rate: defaultVatRate,
            vat_rates: vatRatesJson,
          })
          .eq("id", existingSettings.id);

        if (updateError) {
          console.error("Error updating settings:", updateError);
          throw updateError;
        }
      } else {
        console.log("Inserting new settings for user:", user.id);
        // Insert new settings
        const { error: insertError } = await supabase
          .from("organization_settings")
          .insert({
            user_id: user.id,
            default_currency: currency,
            default_payment_method: defaultPaymentMethod,
            default_vat_rate: defaultVatRate,
            vat_rates: vatRatesJson,
          });

        if (insertError) {
          console.error("Error inserting settings:", insertError);
          throw insertError;
        }
      }

      // Insert transaction parties if any
      if (partyList.length > 0) {
        console.log("Inserting parties:", partyList.length);
        const partyData = partyList.map(party => ({
          user_id: user.id,
          name: party.name,
          type: party.type,
          company_name: party.company_name || null
        }));
        
        const { error: partiesError } = await supabase
          .from("transaction_parties")
          .insert(partyData);
          
        if (partiesError) {
          console.error("Error adding parties:", partiesError);
          throw partiesError;
        }
      }

      // Insert transaction categories if any
      if (categoryList.length > 0) {
        console.log("Inserting categories:", categoryList.length);
        const categoryData = categoryList.map(category => ({
          user_id: user.id,
          name: category.name,
          type: category.type
        }));
        
        const { error: categoriesError } = await supabase
          .from("transaction_categories")
          .insert(categoryData);
          
        if (categoriesError) {
          console.error("Error adding categories:", categoriesError);
          throw categoriesError;
        }
      }

      console.log("Onboarding data saved successfully, now completing onboarding");
      
      // Mark onboarding as complete BEFORE showing the toast
      completeOnboarding();
      
      toast({
        title: "Setup complete!",
        description: "Your business is ready to go.",
      });
      
      // Add a small delay before navigation to ensure state updates properly
      setTimeout(() => {
        navigate("/");
      }, 500);
      
    } catch (error: any) {
      console.error("Onboarding error:", error);
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Welcome to Financial Tracker</h1>
          <p className="text-gray-600">Let's set up your business</p>
          
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              <div className={`h-2 w-8 rounded ${step >= 1 ? "bg-primary" : "bg-gray-200"}`} />
              <div className={`h-2 w-8 rounded ${step >= 2 ? "bg-primary" : "bg-gray-200"}`} />
              <div className={`h-2 w-8 rounded ${step >= 3 ? "bg-primary" : "bg-gray-200"}`} />
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Business Information</h2>
            
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                placeholder="Enter your business name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Select
                value={businessType}
                onValueChange={setBusinessType}
              >
                <SelectTrigger id="businessType">
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freelancer</SelectItem>
                  <SelectItem value="small_business">Small Business</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full mt-6" 
              onClick={() => {
                if (!businessName.trim()) {
                  toast({
                    title: "Business name required",
                    description: "Please enter your business name",
                    variant: "destructive",
                  });
                  return;
                }
                setStep(2);
              }}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Financial Settings</h2>
            
            <div className="space-y-2">
              <Label htmlFor="currency">Default Currency</Label>
              <Select
                value={currency}
                onValueChange={(value: "USD" | "EUR" | "GBP") => setCurrency(value)}
              >
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {currencyOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="paymentMethod">Default Payment Method</Label>
              <Select
                value={defaultPaymentMethod}
                onValueChange={(value: "cash" | "card" | "online") => setDefaultPaymentMethod(value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="vatRate">Default VAT Rate</Label>
              <Select
                value={defaultVatRate.toString()}
                onValueChange={(value) => setDefaultVatRate(Number(value))}
              >
                <SelectTrigger id="vatRate">
                  <SelectValue placeholder="Select VAT rate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0% (No VAT)</SelectItem>
                  <SelectItem value="0.13">13%</SelectItem>
                  <SelectItem value="0.24">24%</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={() => setStep(3)}
              >
                Continue
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Transaction Data (Optional)</h2>
            <p className="text-sm text-gray-500">You can add transaction parties and categories now or later in settings.</p>
            
            <div className="space-y-3">
              <h3 className="text-lg font-medium">Transaction Parties</h3>
              
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="Party name"
                      value={newParty.name}
                      onChange={(e) => setNewParty({...newParty, name: e.target.value})}
                    />
                  </div>
                  <Select
                    value={newParty.type}
                    onValueChange={(value) => setNewParty({...newParty, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
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
                  onChange={(e) => setNewParty({...newParty, company_name: e.target.value})}
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
            
            <div className="space-y-3 pt-2">
              <h3 className="text-lg font-medium">Transaction Categories</h3>
              
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                    />
                  </div>
                  <Select
                    value={newCategory.type}
                    onValueChange={(value) => setNewCategory({...newCategory, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={addCategory}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Category
                </Button>
              </div>
              
              {categoryList.length > 0 && (
                <div className="space-y-2 mt-2">
                  <h4 className="text-sm font-medium">Added Categories:</h4>
                  <div className="max-h-32 overflow-y-auto space-y-2">
                    {categoryList.map((category, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded border">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            category.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {category.type}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeCategory(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? "Saving..." : "Complete Setup"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
