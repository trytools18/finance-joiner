import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const currencyOptions = [
  { label: "USD - US Dollar", value: "USD" },
  { label: "EUR - Euro", value: "EUR" },
  { label: "GBP - British Pound", value: "GBP" },
];

const paymentMethodOptions = [
  { label: "Bank Transfer", value: "bank_transfer" },
  { label: "Credit Card", value: "credit_card" },
  { label: "Cash", value: "cash" },
  { label: "Online", value: "online" },
];

const defaultVatRates = [0, 0.1, 0.24];

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
  const [currency, setCurrency] = useState("USD");
  const [defaultPaymentMethod, setDefaultPaymentMethod] = useState("online");
  const [defaultVatRate, setDefaultVatRate] = useState(0.24);

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
      // Save business info to localStorage for now
      localStorage.setItem("businessName", businessName);
      localStorage.setItem("businessType", businessType);

      // Create organization settings in Supabase
      const { error } = await supabase.from("organization_settings").insert({
        user_id: user.id,
        default_currency: currency,
        default_payment_method: defaultPaymentMethod,
        default_vat_rate: defaultVatRate,
        vat_rates: defaultVatRates,
      });

      if (error) throw error;

      // Mark onboarding as complete
      completeOnboarding();
      
      toast({
        title: "Setup complete!",
        description: "Your business is ready to go.",
      });
      
      // Redirect to dashboard
      navigate("/");
    } catch (error: any) {
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
              onClick={() => setStep(2)}
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
                onValueChange={setCurrency}
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
                onValueChange={setDefaultPaymentMethod}
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
                  <SelectItem value="0.1">10%</SelectItem>
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
