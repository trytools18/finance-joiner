
import { createContext, useContext, useEffect, useState } from "react";
import { AuthState, User } from "@/lib/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useAuthFunctions } from "@/hooks/useAuthFunctions";

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
    if (onboardingStatus === "true") {
      updateOnboardingState(true);
    }
  }, [updateOnboardingState]);

  // Wrapper for sign out that ensures navigation happens after sign out is complete
  const signOut = async () => {
    try {
      await authFunctionSignOut();
      setAuthState({ user: null, loading: false });
      navigate("/index");
    } catch (error) {
      console.error("AuthContext: Error during sign out:", error);
      navigate("/index");
    }
  };

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      
      if (user) {
        try {
          const { data: orgSettings } = await supabase
            .from("organization_settings")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (orgSettings) {
            localStorage.setItem("onboardingCompleted", "true");
            updateOnboardingState(true);
            updateNewUserState(false);
          } else {
            const newUserFlag = localStorage.getItem("new_user") === "true";
            updateNewUserState(true);
            updateOnboardingState(false);
          }
        } catch (error) {
          console.error("Error checking organization settings:", error);
        }
      }
      
      setAuthState({ user, loading: false });
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      
      setAuthState({ user, loading: false });

      // Handle different auth events
      if (event === "SIGNED_IN" && user) {
        try {
          const { data: orgSettings } = await supabase
            .from("organization_settings")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();
          
          if (orgSettings) {
            localStorage.setItem("onboardingCompleted", "true");
            localStorage.removeItem("new_user");
            updateOnboardingState(true);
            updateNewUserState(false);
            navigate("/");
          } else {
            const newUserFlag = localStorage.getItem("new_user") === "true";
            updateNewUserState(true);
            updateOnboardingState(false);
            navigate("/onboarding");
          }
        } catch (error) {
          console.error("Error checking organization settings:", error);
        }
      }
      
      if (event === "SIGNED_OUT") {
        updateNewUserState(false);
        updateOnboardingState(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, updateNewUserState, updateOnboardingState]);

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
