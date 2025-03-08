
import { useAuth } from "@/contexts/AuthContext";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LandingPage } from "@/components/landing/LandingPage";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, isNewUser, onboardingCompleted, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect new users to onboarding if they haven't completed it
  useEffect(() => {
    if (user && isNewUser && !onboardingCompleted) {
      console.log("Index: User is new and hasn't completed onboarding, redirecting");
      navigate("/onboarding");
    }
  }, [user, isNewUser, onboardingCompleted, navigate]);

  // Show landing page if no user is logged in
  if (loading) {
    return <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>;
  }

  if (!user) {
    return <LandingPage />;
  }

  if (isNewUser && !onboardingCompleted) {
    navigate("/onboarding");
    return null;
  }

  return <Dashboard />;
};

export default Index;
