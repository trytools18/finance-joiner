
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
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      setAuthState({
        user,
        loading: false,
      });

      // Check if there's a "new_user" flag in localStorage
      const newUserFlag = localStorage.getItem("new_user") === "true";
      
      // If user exists but onboarding not completed, they should be considered a new user
      if (user && !localStorage.getItem("onboardingCompleted")) {
        console.log("User exists but onboarding not completed, setting as new user");
        setIsNewUser(true);
        // If we're not already on the onboarding page, redirect there
        if (window.location.pathname !== "/onboarding") {
          navigate("/onboarding");
        }
      }
    });

    // Listen for changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ? { id: session.user.id, email: session.user.email ?? undefined } : null;
      setAuthState({
        user,
        loading: false,
      });

      // If this is a sign-up or sign-in event
      if (_event === "SIGNED_IN") {
        console.log("Sign in event detected");
        
        // Check if onboarding has been completed
        const onboardingComplete = localStorage.getItem("onboardingCompleted") === "true";
        
        if (!onboardingComplete) {
          console.log("Onboarding not completed, setting as new user");
          localStorage.setItem("new_user", "true");
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
