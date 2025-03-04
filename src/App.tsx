import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import OrganizationSettings from "./pages/OrganizationSettings";
import Onboarding from "./pages/Onboarding";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isNewUser, onboardingCompleted } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  
  if (!user) {
    return <Navigate to="/" />;
  }
  
  // If user is new and hasn't completed onboarding, redirect to onboarding
  if (isNewUser && !onboardingCompleted) {
    return <Navigate to="/onboarding" />;
  }
  
  return <>{children}</>;
};

// Routes component to use auth context
const AppRoutes = () => {
  const { user, isNewUser, onboardingCompleted } = useAuth();
  
  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route 
        path="/organization-settings" 
        element={
          <ProtectedRoute>
            <OrganizationSettings />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/onboarding" 
        element={
          user ? (
            isNewUser || !onboardingCompleted ? (
              <Onboarding />
            ) : (
              <Navigate to="/" />
            )
          ) : (
            <Navigate to="/" />
          )
        } 
      />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
