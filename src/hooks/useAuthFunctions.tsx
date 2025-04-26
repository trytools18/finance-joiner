import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAuthFunctions() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting sign in for:", email);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      console.log("Sign in successful");
      
      toast({
        title: "Sign in successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      console.error("Sign in error:", error);
      
      // Special handling for email not confirmed error
      if (error.message && error.message.includes("Email not confirmed")) {
        toast({
          title: "Email verification required",
          description: "Please check your email and verify your account before signing in.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error signing in",
          description: error.message,
          variant: "destructive",
        });
      }
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      console.log("Attempting sign up for:", email);
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      // Mark as new user
      localStorage.setItem("new_user", "true");
      setIsNewUser(true);
      
      console.log("Sign up successful", data);
      
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account before signing in.",
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Error signing up",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("useAuthFunctions: Attempting sign out");
      
      // First, call the Supabase sign-out method
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any auth-related items from localStorage (belt and suspenders approach)
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
      
      // Keep onboardingCompleted status as it's not authentication-related
      
      console.log("useAuthFunctions: Sign out successful");
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out from your account",
      });
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: error.message || "There was a problem signing you out",
        variant: "destructive",
      });
      throw error;
    }
  };

  const completeOnboarding = () => {
    console.log("Marking onboarding as completed");
    localStorage.setItem("onboardingCompleted", "true");
    localStorage.removeItem("new_user");
    setOnboardingCompleted(true);
    setIsNewUser(false);
    console.log("Onboarding completed, state updated");
  };

  const updateOnboardingState = (completed: boolean) => {
    setOnboardingCompleted(completed);
  };

  const updateNewUserState = (isNew: boolean) => {
    setIsNewUser(isNew);
  };

  return {
    isNewUser,
    onboardingCompleted,
    signIn,
    signUp,
    signOut,
    completeOnboarding,
    updateOnboardingState,
    updateNewUserState
  };
}
