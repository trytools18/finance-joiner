
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import { Dashboard } from "./components/dashboard/Dashboard";
import OrganizationSettings from "./pages/OrganizationSettings";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import RecurringTransactions from "./pages/RecurringTransactions";
import { Sidebar } from "./components/ui/sidebar";
import { Suspense } from "react";

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Router>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Sidebar />}>
                <Route index element={<Suspense fallback={<div>Loading...</div>}><Dashboard /></Suspense>} />
                <Route path="/organization-settings" element={<OrganizationSettings />} />
                <Route path="/recurring-transactions" element={<RecurringTransactions />} />
              </Route>
              <Route path="/index" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding />} />
            </Routes>
            <Toaster />
          </AuthProvider>
        </Router>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
