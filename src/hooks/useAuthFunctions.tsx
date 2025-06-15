
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
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      console.log("Sign in successful", data);
      
      // For existing users signing in, check if they have organization settings
      if (data.user) {
        const { data: orgSettings } = await supabase
          .from("organization_settings")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        // If user has organization settings, they've completed onboarding
        if (orgSettings) {
          console.log("User has completed onboarding previously");
          localStorage.setItem("onboardingCompleted", "true");
          setOnboardingCompleted(true);
          setIsNewUser(false);
        } else {
          // User exists but hasn't completed onboarding
          console.log("User exists but hasn't completed onboarding");
          setIsNewUser(true);
          setOnboardingCompleted(false);
        }
      }
      
      // Only show toast if login is successful and there's no onboarding needed
      if (onboardingCompleted) {
        toast({
          title: "Sign in successful",
          description: "Welcome back!",
        });
      }
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
          description: error.message || "An error occurred during sign in",
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
      
      // Mark as new user only for actual signups
      if (data.user && !data.user.email_confirmed_at) {
        console.log("New user signed up, marking for onboarding");
        localStorage.setItem("new_user", "true");
        setIsNewUser(true);
        setOnboardingCompleted(false);
      }
      
      console.log("Sign up successful", data);
      
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account before signing in.",
      });
    } catch (error: any) {
      console.error("Sign up error:", error);
      toast({
        title: "Error signing up",
        description: error.message || "An error occurred during sign up",
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log("useAuthFunctions: Attempting sign out");
      
      // Clear localStorage items first
      localStorage.removeItem("supabase.auth.token");
      localStorage.removeItem("sb-access-token");
      localStorage.removeItem("sb-refresh-token");
      localStorage.removeItem("supabase.auth.expires_at");
      localStorage.removeItem("supabase.auth.data");
      localStorage.removeItem("new_user");
      
      // Clear all supabase auth related items
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      
      // Call the Supabase sign-out method with global scope
      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });
      
      if (error) {
        console.error("Sign out Supabase error:", error);
        // Don't throw error, continue with cleanup
      }
      
      console.log("useAuthFunctions: Sign out successful");
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out from your account",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Error signing out",
        description: error.message || "There was a problem signing you out",
        variant: "destructive",
      });
      // Don't throw error, allow the process to continue
      return { success: false };
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
