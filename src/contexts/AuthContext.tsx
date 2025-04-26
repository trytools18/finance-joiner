
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
    signOut, 
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

  useEffect(() => {
    console.log("AuthProvider: Setting up auth state check and listener");
    
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      console.log("Auth session check - User found:", !!user);
      
      if (user) {
        console.log("Authenticated user:", user.email);
        toast({
          title: "Authenticated",
          description: `Logged in as ${user.email}`,
        });
      }
      
      setAuthState({
        user,
        loading: false,
      });

      // Check if there's a "new_user" flag in localStorage
      const newUserFlag = localStorage.getItem("new_user") === "true";
      console.log("New user flag in localStorage:", newUserFlag);
      
      // If user exists but onboarding not completed, they should be considered a new user
      if (user && !localStorage.getItem("onboardingCompleted")) {
        console.log("User exists but onboarding not completed, setting as new user");
        updateNewUserState(true);
        // If we're not already on the onboarding page, redirect there
        if (window.location.pathname !== "/onboarding") {
          console.log("Redirecting to onboarding from session check");
          navigate("/onboarding");
        }
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state change event:", event);
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      
      if (user) {
        console.log("User authenticated:", user.email);
      } else {
        console.log("No authenticated user");
        // Explicitly redirect to index when signed out
        if (event === "SIGNED_OUT") {
          console.log("User signed out, redirecting to index");
          navigate("/index");
        }
      }
      
      setAuthState({
        user,
        loading: false,
      });

      // If this is a sign-up or sign-in event
      if (event === "SIGNED_IN") {
        console.log("Sign in event detected");
        
        // Check if onboarding has been completed
        const onboardingComplete = localStorage.getItem("onboardingCompleted") === "true";
        console.log("Onboarding completed status:", onboardingComplete);
        
        if (!onboardingComplete) {
          console.log("Onboarding not completed, setting as new user");
          localStorage.setItem("new_user", "true");
          updateNewUserState(true);
          
          // Redirect to onboarding
          console.log("Redirecting to onboarding from auth change");
          navigate("/onboarding");
        }
      }
      
      // Handle SIGNED_OUT events
      if (event === "SIGNED_OUT") {
        console.log("User signed out, cleaning up state");
        // Keep the onboardingCompleted value in localStorage
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
