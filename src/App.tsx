
import { BrowserRouter as Router, Route, Routes, Outlet, NavLink } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from "./contexts/AuthContext";
import { Toaster } from "./components/ui/toaster";
import { Dashboard } from "./components/dashboard/Dashboard";
import OrganizationSettings from "./pages/OrganizationSettings";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import RecurringTransactions from "./pages/RecurringTransactions";
import { 
  Sidebar, 
  SidebarProvider, 
  SidebarContent,
  SidebarHeader,
  SidebarFooter
} from "./components/ui/sidebar";
import { Suspense } from "react";
import { Home, CalendarDays, Settings } from "lucide-react";

// Create a layout component that uses Sidebar
const DashboardLayout = () => {
  return (
    <div className="flex min-h-screen w-full">
      <Sidebar>
        <SidebarHeader>
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">Finance App</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <nav className="space-y-1 p-2">
            <NavLink 
              to="/" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
              }
            >
              <Home className="h-5 w-5 mr-2" />
              Dashboard
            </NavLink>
            <NavLink 
              to="/recurring-transactions" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
              }
            >
              <CalendarDays className="h-5 w-5 mr-2" />
              Recurring Transactions
            </NavLink>
            <NavLink 
              to="/organization-settings" 
              className={({ isActive }) => 
                `flex items-center px-3 py-2 rounded-md ${isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`
              }
            >
              <Settings className="h-5 w-5 mr-2" />
              Organization Settings
            </NavLink>
          </nav>
        </SidebarContent>
        <SidebarFooter>
          <div className="p-4 border-t">
            <p className="text-sm text-muted-foreground">© 2025 Finance App</p>
          </div>
        </SidebarFooter>
      </Sidebar>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HelmetProvider>
        <Router>
          <SidebarProvider>
            <AuthProvider>
              <Routes>
                <Route element={<DashboardLayout />}>
                  <Route index element={<Suspense fallback={<div>Loading...</div>}><Dashboard /></Suspense>} />
                  <Route path="/organization-settings" element={<OrganizationSettings />} />
                  <Route path="/recurring-transactions" element={<RecurringTransactions />} />
                </Route>
                <Route path="/index" element={<Index />} />
                <Route path="/onboarding" element={<Onboarding />} />
              </Routes>
              <Toaster />
            </AuthProvider>
          </SidebarProvider>
        </Router>
      </HelmetProvider>
    </QueryClientProvider>
  );
}

export default App;
