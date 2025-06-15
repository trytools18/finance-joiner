
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAuthFunctions() {
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) throw error;
      
      // For existing users signing in, check if they have organization settings
      if (data.user) {
        const { data: orgSettings } = await supabase
          .from("organization_settings")
          .select("id")
          .eq("user_id", data.user.id)
          .maybeSingle();
        
        if (orgSettings) {
          localStorage.setItem("onboardingCompleted", "true");
          setOnboardingCompleted(true);
          setIsNewUser(false);
        } else {
          setIsNewUser(true);
          setOnboardingCompleted(false);
        }
      }
      
      if (onboardingCompleted) {
        toast({
          title: "Sign in successful",
          description: "Welcome back!",
        });
      }
    } catch (error: any) {
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
      const { error, data } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) throw error;
      
      if (data.user && !data.user.email_confirmed_at) {
        localStorage.setItem("new_user", "true");
        setIsNewUser(true);
        setOnboardingCompleted(false);
      }
      
      toast({
        title: "Verification email sent",
        description: "Please check your email to verify your account before signing in.",
      });
    } catch (error: any) {
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
      // Clear localStorage items first
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-') || key === 'new_user') {
          localStorage.removeItem(key);
        }
      });
      
      // Call the Supabase sign-out method with global scope
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Sign out Supabase error:", error);
      }
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out from your account",
      });
      
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message || "There was a problem signing you out",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true");
    localStorage.removeItem("new_user");
    setOnboardingCompleted(true);
    setIsNewUser(false);
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
