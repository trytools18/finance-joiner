import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const AuthForm = () => {
  const [isSignIn, setIsSignIn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add password validation
    if (!isSignIn && password.length < 6) {
      toast({
        title: "Invalid password",
        description: "Password should be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      if (isSignIn) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
        // For demo purposes, we'll automatically sign in after signup
        // This would normally be handled by email verification
        if (!isSignIn) {
          await signIn(email, password);
        }
      }
    } catch (error) {
      // Error is handled in the auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {!isSignIn && (
          <p className="text-sm text-gray-500 mt-1">
            Password must be at least 6 characters long
          </p>
        )}
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isSignIn ? "Sign In" : "Sign Up"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        className="w-full"
        onClick={() => setIsSignIn(!isSignIn)}
        disabled={loading}
      >
        {isSignIn ? "Need an account? Sign Up" : "Already have an account? Sign In"}
      </Button>
    </form>
  );
};
