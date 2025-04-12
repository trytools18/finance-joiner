
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { HelmetProvider } from "react-helmet-async"; // Add this import
import Index from "@/pages/Index";
import OrganizationSettings from "@/pages/OrganizationSettings";
import Onboarding from "@/pages/Onboarding";
import RecurringTransactions from "@/pages/RecurringTransactions";
import { AuthProvider } from "@/contexts/AuthContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <HelmetProvider> {/* Wrap with HelmetProvider */}
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/organization-settings" element={<OrganizationSettings />} />
              <Route path="/recurring-transactions" element={<RecurringTransactions />} />
            </Routes>
          </Router>
          <Toaster />
        </HelmetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
