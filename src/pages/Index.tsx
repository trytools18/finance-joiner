
import { useAuth } from "@/contexts/AuthContext";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LandingPage } from "@/components/landing/LandingPage";

const Index = () => {
  const { user } = useAuth();

  if (user) {
    return <Dashboard />;
  }

  return <LandingPage />;
};

export default Index;
