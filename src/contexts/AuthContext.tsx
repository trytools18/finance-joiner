import { createContext, useContext, useEffect, useState } from "react";
import { AuthState, User } from "@/lib/types/auth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";

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
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Check if onboarding is completed in localStorage
  useEffect(() => {
    const onboardingStatus = localStorage.getItem("onboardingCompleted");
    if (onboardingStatus === "true") {
      setOnboardingCompleted(true);
    }
  }, []);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuthState({
        user: session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null,
        loading: false,
      });

      // Check if there's a "new_user" flag in localStorage
      const newUserFlag = localStorage.getItem("new_user") === "true";
      if (newUserFlag && session?.user) {
        setIsNewUser(true);
        // We'll remove the flag when onboarding is completed
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthState({
        user: session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null,
        loading: false,
      });

      // If this is a sign-up event, mark as new user
      if (_event === "SIGNED_IN" && !localStorage.getItem("onboardingCompleted")) {
        const isFirstLogin = !localStorage.getItem("has_logged_in_before");
        if (isFirstLogin) {
          localStorage.setItem("new_user", "true");
          localStorage.setItem("has_logged_in_before", "true");
          setIsNewUser(true);
          
          // Redirect to onboarding
          navigate("/onboarding");
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error signing in",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      // Mark as new user
      localStorage.setItem("new_user", "true");
      setIsNewUser(true);
      
      toast({
        title: "Success!",
        description: "Account created! Complete the onboarding process.",
      });
    } catch (error: any) {
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Error signing out",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const completeOnboarding = () => {
    localStorage.setItem("onboardingCompleted", "true");
    localStorage.removeItem("new_user");
    setOnboardingCompleted(true);
    setIsNewUser(false);
  };

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
