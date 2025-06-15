
import { useAuth } from "@/contexts/AuthContext";
import { Dashboard } from "@/components/dashboard/Dashboard";
import { LandingPage } from "@/components/landing/LandingPage";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading, isNewUser, onboardingCompleted } = useAuth();
  const navigate = useNavigate();

  console.log("Index: Auth state:", { 
    user: !!user, 
    userId: user?.id, 
    loading, 
    isNewUser, 
    onboardingCompleted 
  });

  // Redirect new users to onboarding if they haven't completed it
  useEffect(() => {
    if (user && isNewUser && !onboardingCompleted) {
      console.log("Index: User is new and hasn't completed onboarding, redirecting");
      navigate("/onboarding");
    }
  }, [user, isNewUser, onboardingCompleted, navigate]);

  // Show loading screen while authentication is being determined
  if (loading) {
    console.log("Index: Auth loading, showing loading screen");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show dashboard for authenticated users who have completed onboarding
  if (user && onboardingCompleted) {
    console.log("Index: Showing dashboard for authenticated user");
    return <Dashboard />;
  }

  // Show landing page for unauthenticated users
  if (!user) {
    console.log("Index: Showing landing page for unauthenticated user");
    return <LandingPage />;
  }

  // For authenticated users who haven't completed onboarding, 
  // the useEffect above will handle the redirect
  console.log("Index: User authenticated but onboarding not completed, redirecting");
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Setting up your account...</p>
      </div>
    </div>
  );
};

export default Index;
