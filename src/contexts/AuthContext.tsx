
import { createContext, useContext, useEffect, useState } from "react";
import { AuthState, User } from "@/lib/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthFunctions } from "@/hooks/useAuthFunctions";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  onboardingCompleted: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  completeOnboarding: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isNewUser: false,
  onboardingCompleted: false,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  completeOnboarding: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    isNewUser, 
    onboardingCompleted, 
    signIn, 
    signUp, 
    signOut: authFunctionSignOut, 
    completeOnboarding,
    updateOnboardingState,
    updateNewUserState
  } = useAuthFunctions();

  // Check if onboarding is completed in localStorage
  useEffect(() => {
    const onboardingStatus = localStorage.getItem("onboardingCompleted");
    console.log("Initial onboardingStatus from localStorage:", onboardingStatus);
    if (onboardingStatus === "true") {
      updateOnboardingState(true);
    }
  }, [updateOnboardingState]);

  // Wrapper for sign out that ensures navigation happens after sign out is complete
  const signOut = async () => {
    console.log("AuthContext: Signing out...");
    try {
      await authFunctionSignOut();
      console.log("AuthContext: Sign out complete, updating auth state");
      // Explicitly set user to null to ensure UI updates immediately
      setAuthState({
        user: null,
        loading: false
      });
      console.log("AuthContext: Navigating to index page after sign out");
      navigate("/index");
      return;
    } catch (error) {
      console.error("AuthContext: Error during sign out:", error);
      // Even if there's an error, we should still try to navigate to index
      navigate("/index");
    }
  };

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state check and listener");
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      console.log("Auth session check - User found:", !!user);
      
      if (user) {
        console.log("Authenticated user:", user.email);
        
        // Check if user has completed onboarding by looking at organization_settings
        try {
          const { data: orgSettings } = await supabase
            .from("organization_settings")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (orgSettings) {
            console.log("User has organization settings, onboarding completed");
            localStorage.setItem("onboardingCompleted", "true");
            updateOnboardingState(true);
            updateNewUserState(false);
          } else {
            console.log("User has no organization settings");
            // Only set as new user if there's a new_user flag
            const newUserFlag = localStorage.getItem("new_user") === "true";
            if (newUserFlag) {
              console.log("New user flag found, setting as new user");
              updateNewUserState(true);
              updateOnboardingState(false);
            } else {
              console.log("No new user flag, assuming existing user who hasn't completed onboarding");
              updateNewUserState(true);
              updateOnboardingState(false);
            }
          }
        } catch (error) {
          console.error("Error checking organization settings:", error);
        }
      }
      
      setAuthState({
        user,
        loading: false,
      });
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change event:", event);
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      
      if (user) {
        console.log("User authenticated:", user.email);
      } else {
        console.log("No authenticated user");
      }
      
      setAuthState({
        user,
        loading: false,
      });

      // Handle different auth events
      if (event === "SIGNED_IN") {
        console.log("Sign in event detected");
        
        if (user) {
          // Check if user has organization settings to determine onboarding status
          try {
            const { data: orgSettings } = await supabase
              .from("organization_settings")
              .select("id")
              .eq("user_id", user.id)
              .maybeSingle();
            
            if (orgSettings) {
              console.log("User has completed onboarding, redirecting to dashboard");
              localStorage.setItem("onboardingCompleted", "true");
              localStorage.removeItem("new_user");
              updateOnboardingState(true);
              updateNewUserState(false);
              navigate("/");
            } else {
              // Check if this is a new signup or existing user
              const newUserFlag = localStorage.getItem("new_user") === "true";
              if (newUserFlag) {
                console.log("New user needs onboarding");
                updateNewUserState(true);
                updateOnboardingState(false);
                navigate("/onboarding");
              } else {
                console.log("Existing user without organization settings, needs onboarding");
                updateNewUserState(true);
                updateOnboardingState(false);
                navigate("/onboarding");
              }
            }
          } catch (error) {
            console.error("Error checking organization settings:", error);
          }
        }
      }
      
      // Handle SIGNED_OUT events
      if (event === "SIGNED_OUT") {
        console.log("User signed out, cleaning up state");
        updateNewUserState(false);
        updateOnboardingState(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, updateNewUserState, toast, updateOnboardingState]);

  return (
    <AuthContext.Provider value={{ 
      ...authState, 
      isNewUser, 
      onboardingCompleted,
      signIn, 
      signUp, 
      signOut,
      completeOnboarding
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
